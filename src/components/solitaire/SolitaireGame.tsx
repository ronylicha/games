import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  DrawMode,
  SolitaireCard,
  SolitaireSource,
  SolitaireState,
  SolitaireSuit,
  canRecycleStock,
  canSelectTableauCards,
  changeSolitaireDrawMode,
  createSolitaireState,
  drawSolitaireCard,
  getCardColor,
  moveSolitaireToFoundation,
  moveSolitaireToTableau,
  rankLabel,
  suitLabel,
} from '@/game/solitaire';

const foundationSuits: SolitaireSuit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const solitaireStorageKey = 'games:solitaire:state';

export function SolitaireGame() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState(() => createSolitaireState('infinite'));
  const [selected, setSelected] = useState<SolitaireSource | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const lastCardPress = useRef<{ key: string; time: number } | null>(null);

  const contentWidth = Math.max(280, Math.min(width - 48, 760));
  const tableauGap = width < 420 ? 3 : 5;
  const topGap = width < 420 ? 5 : 8;
  const tableauChromeWidth = 28;
  const topCardLimit = (contentWidth - topGap * 5) / 6;
  const tableauCardLimit = (contentWidth - tableauChromeWidth - tableauGap * 6) / 7;
  const cardWidth = Math.max(32, Math.min(68, topCardLimit, tableauCardLimit));
  const cardHeight = cardWidth * 1.38;
  const tableauWidth = cardWidth * 7 + tableauGap * 6 + tableauChromeWidth;
  const tableauHeight = Math.max(430, cardHeight + cardHeight * 0.27 * 6 + 36);
  const visibleWaste = state.waste[state.waste.length - 1];
  const stockLocked = state.stock.length === 0 && state.waste.length > 0 && !canRecycleStock(state);
  const allTableauFaceUp = state.tableau.every((column) => column.every((card) => card.faceUp));
  const canAutoFinish = state.status === 'playing' && allTableauFaceUp && state.stock.length === 0;

  useEffect(() => {
    let mounted = true;

    async function loadSavedGame() {
      const stored = await AsyncStorage.getItem(solitaireStorageKey);
      if (!stored) {
        return;
      }

      const saved = JSON.parse(stored) as SolitaireState;
      if (!mounted) {
        return;
      }

      setState(saved ?? createSolitaireState('infinite'));
      setSelected(null);
    }

    loadSavedGame()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(solitaireStorageKey, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const status = useMemo(() => {
    if (state.status === 'won') {
      return 'Partie gagnée';
    }
    if (stockLocked) {
      return 'Pioche épuisée';
    }
    return `Fondations ${foundationSuits.reduce((total, suit) => total + state.foundations[suit].length, 0)}/52`;
  }, [state, stockLocked]);

  function reset(drawMode = state.drawMode) {
    AsyncStorage.removeItem(solitaireStorageKey).catch(() => undefined);
    setState(createSolitaireState(drawMode));
    setSelected(null);
  }

  function setDrawMode(drawMode: DrawMode) {
    setState((current) => changeSolitaireDrawMode(current, drawMode));
    setSelected(null);
  }

  function draw() {
    setState((current) => drawSolitaireCard(current));
    setSelected(null);
  }

  function selectWaste() {
    if (visibleWaste) {
      setSelected({ type: 'waste' });
    }
  }

  function moveSourceToFoundation(source: SolitaireSource) {
    setState((current) => {
      for (const suit of foundationSuits) {
        const next = moveSolitaireToFoundation(current, source, suit);
        if (next !== current) {
          return next;
        }
      }

      return current;
    });
    setSelected(null);
  }

  function pressCard(sourceKey: string, source: SolitaireSource, fallback: () => void) {
    const now = Date.now();
    const previous = lastCardPress.current;

    if (previous?.key === sourceKey && now - previous.time < 340) {
      lastCardPress.current = null;
      moveSourceToFoundation(source);
      return;
    }

    lastCardPress.current = { key: sourceKey, time: now };
    fallback();
  }

  function pressFoundation(suit: SolitaireSuit) {
    if (!selected) {
      if (state.foundations[suit].length > 0) {
        setSelected({ type: 'foundation', suit });
      }
      return;
    }

    setState((current) => moveSolitaireToFoundation(current, selected, suit));
    setSelected(null);
  }

  function pressTableau(columnIndex: number, cardIndex?: number) {
    if (selected) {
      setState((current) => moveSolitaireToTableau(current, selected, columnIndex));
      setSelected(null);
      return;
    }

    if (cardIndex === undefined) {
      return;
    }

    const cards = state.tableau[columnIndex].slice(cardIndex);
    if (canSelectTableauCards(cards)) {
      setSelected({ type: 'tableau', column: columnIndex, index: cardIndex });
    }
  }

  function autoFinish() {
    setState((current) => {
      let next = current;
      let moved = true;
      let guard = 0;

      while (moved && guard < 220) {
        moved = false;
        guard += 1;

        const sources: SolitaireSource[] = [];
        if (next.waste.length > 0) {
          sources.push({ type: 'waste' });
        }
        next.tableau.forEach((column, columnIndex) => {
          if (column.length > 0) {
            sources.push({ type: 'tableau', column: columnIndex, index: column.length - 1 });
          }
        });

        for (const source of sources) {
          let foundMove = false;
          for (const suit of foundationSuits) {
            const candidate = moveSolitaireToFoundation(next, source, suit);
            if (candidate !== next) {
              next = candidate;
              moved = true;
              foundMove = true;
              break;
            }
          }

          if (foundMove) {
            break;
          }
        }
      }

      return next;
    });
    setSelected(null);
  }

  const cardSize = { width: cardWidth, height: cardHeight };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Segment active={state.drawMode === 'infinite'} label="Pioche infinie" onPress={() => setDrawMode('infinite')} />
        <Segment active={state.drawMode === 'three'} label="Pioche 3 fois" onPress={() => setDrawMode('three')} />
        <Pressable style={styles.resetButton} onPress={() => reset()}>
          <Text style={styles.resetText}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.stockText}>{state.drawMode === 'three' ? `${state.recyclesUsed}/3 reprises` : 'Reprises libres'}</Text>
      </View>

      {state.status === 'won' || stockLocked ? (
        <View style={[styles.endEffect, state.status === 'won' ? styles.endWin : styles.endBlocked]}>
          <View style={styles.endFan}>
            {foundationSuits.map((suit, index) => (
              <View key={suit} style={[styles.endMiniCard, { transform: [{ rotate: `${index * 11 - 16}deg` }] }]}>
                <Text style={styles.endMiniSuit}>{suitLabel(suit)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.endEffectText}>{state.status === 'won' ? 'Victoire' : 'Partie bloquee'}</Text>
        </View>
      ) : null}

      {canAutoFinish ? (
        <Pressable style={styles.autoFinishButton} onPress={autoFinish}>
          <Text style={styles.autoFinishText}>Finir automatiquement</Text>
        </Pressable>
      ) : null}

      <View style={[styles.topRow, { gap: topGap, width: tableauWidth }]}>
        <Pressable style={[styles.slot, cardSize, styles.stockSlot, stockLocked && styles.lockedSlot]} onPress={draw}>
          <Text style={styles.stockCount}>{state.stock.length}</Text>
          <Text style={styles.slotLabel}>{state.stock.length > 0 ? 'Pioche' : state.waste.length > 0 ? 'Reprendre' : 'Vide'}</Text>
        </Pressable>

        <Pressable style={[styles.slot, cardSize]} onPress={() => pressCard('waste', { type: 'waste' }, selectWaste)}>
          {visibleWaste ? (
            <CardView card={visibleWaste} selected={selected?.type === 'waste'} width={cardWidth} height={cardHeight} />
          ) : (
            <Text style={styles.slotLabel}>Défausse</Text>
          )}
        </Pressable>

        <View style={[styles.foundationRow, { gap: topGap }]}>
          {foundationSuits.map((suit) => {
            const top = state.foundations[suit][state.foundations[suit].length - 1];
            return (
              <Pressable key={suit} style={[styles.slot, cardSize]} onPress={() => pressFoundation(suit)}>
                {top ? (
                  <CardView card={top} selected={selected?.type === 'foundation' && selected.suit === suit} width={cardWidth} height={cardHeight} />
                ) : (
                  <Text style={styles.foundationLabel}>{suitLabel(suit)}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.tableau, { width: tableauWidth, minHeight: tableauHeight, gap: tableauGap }]}>
        {state.tableau.map((column, columnIndex) => (
          <Pressable key={columnIndex} style={[styles.column, { width: cardWidth, minHeight: tableauHeight - 28 }]} onPress={() => pressTableau(columnIndex)}>
            {column.length === 0 ? (
              <View style={[styles.emptyColumn, cardSize]}>
                <Text style={styles.slotLabel}>K</Text>
              </View>
            ) : (
              column.map((card, cardIndex) => (
                <Pressable
                  key={card.id}
                  style={[
                    styles.tableauCard,
                    {
                      top: cardIndex * (card.faceUp ? cardHeight * 0.27 : cardHeight * 0.16),
                    },
                  ]}
                  onPress={() =>
                    pressCard(`tableau-${columnIndex}-${card.id}`, { type: 'tableau', column: columnIndex, index: cardIndex }, () =>
                      pressTableau(columnIndex, cardIndex),
                    )
                  }>
                  <CardView
                    card={card}
                    selected={selected?.type === 'tableau' && selected.column === columnIndex && cardIndex >= selected.index}
                    width={cardWidth}
                    height={cardHeight}
                  />
                </Pressable>
              ))
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CardView({ card, selected = false, width, height }: { card: SolitaireCard; selected?: boolean; width: number; height: number }) {
  if (!card.faceUp) {
    return (
      <View style={[styles.card, styles.cardBack, selected && styles.selectedCard, { width, height }]}>
        <View style={styles.backPattern} />
      </View>
    );
  }

  const red = getCardColor(card) === 'red';

  return (
    <View style={[styles.card, selected && styles.selectedCard, { width, height }]}>
      <Text style={[styles.cardRank, red && styles.redCardText]}>{rankLabel(card.rank)}</Text>
      <Text style={[styles.cardSuit, red && styles.redCardText]}>{suitLabel(card.suit)}</Text>
    </View>
  );
}

function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F0',
    borderWidth: 1,
    borderColor: '#CFDAD4',
  },
  segmentActive: {
    backgroundColor: '#22342F',
    borderColor: '#22342F',
  },
  segmentText: {
    color: '#34413D',
    fontSize: 14,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AA2E35',
  },
  resetText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  statusRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  statusText: {
    flex: 1,
    color: '#22342F',
    fontSize: 15,
    fontWeight: '900',
  },
  stockText: {
    color: '#53635D',
    fontWeight: '800',
  },
  endEffect: {
    minHeight: 84,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#22342F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  endWin: {
    backgroundColor: '#F6C85F',
  },
  endBlocked: {
    backgroundColor: '#AA2E35',
  },
  endFan: {
    position: 'absolute',
    width: 180,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMiniCard: {
    position: 'absolute',
    width: 42,
    height: 58,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#191A1F',
    backgroundColor: '#F8EFE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMiniSuit: {
    color: '#191A1F',
    fontSize: 24,
    fontWeight: '900',
  },
  endEffectText: {
    color: '#191A1F',
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  autoFinishButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22342F',
    backgroundColor: '#F6C85F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  autoFinishText: {
    color: '#22342F',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  foundationRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  slot: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CFDAD4',
    backgroundColor: '#E7EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stockSlot: {
    backgroundColor: '#22342F',
    borderColor: '#22342F',
  },
  lockedSlot: {
    opacity: 0.42,
  },
  stockCount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  slotLabel: {
    color: '#53635D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  foundationLabel: {
    color: '#5D6D66',
    fontSize: 22,
    fontWeight: '900',
  },
  tableau: {
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#47645B',
    borderWidth: 6,
    borderColor: '#22342F',
  },
  column: {
    position: 'relative',
  },
  emptyColumn: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(248, 239, 225, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableauCard: {
    position: 'absolute',
    left: 0,
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#F8EFE1',
    borderWidth: 2,
    borderColor: '#191A1F',
    padding: 5,
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#F6C85F',
    borderWidth: 4,
  },
  cardBack: {
    backgroundColor: '#AA2E35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPattern: {
    width: '62%',
    height: '62%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F8EFE1',
  },
  cardRank: {
    color: '#191A1F',
    fontSize: 16,
    fontWeight: '900',
  },
  cardSuit: {
    alignSelf: 'flex-end',
    color: '#191A1F',
    fontSize: 20,
    fontWeight: '900',
  },
  redCardText: {
    color: '#AA2E35',
  },
});
