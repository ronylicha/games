import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  DominoMove,
  DominoTile,
  applyDominoMove,
  createDominoState,
  drawDominoTile,
  getDominoLegalMoves,
  passDominoTurn,
  playDominoAiTurn,
} from '@/game/dominoes';

export function DominoesGame() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState(() => createDominoState());
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  const legalMoves = useMemo(() => getDominoLegalMoves(state), [state]);
  const selectedMoves = useMemo(
    () => legalMoves.filter((move) => move.tileId === selectedTileId),
    [legalMoves, selectedTileId],
  );
  const aiThinking = state.turn === 'red' && state.status === 'playing';
  const visibleHand = state.hands.ivory;
  const chainColumns = width < 430 ? 5 : 6;
  const chainRows = useMemo(() => chunkDominoChain(state.chain, chainColumns), [chainColumns, state.chain]);

  useEffect(() => {
    if (!aiThinking) {
      return;
    }

    const timeout = setTimeout(() => {
      setState((current) => playDominoAiTurn(current));
      setSelectedTileId(null);
    }, 520);

    return () => clearTimeout(timeout);
  }, [aiThinking, state]);

  function reset() {
    setState(createDominoState());
    setSelectedTileId(null);
  }

  function selectTile(tile: DominoTile) {
    if (aiThinking || state.status !== 'playing') {
      return;
    }

    const moves = legalMoves.filter((move) => move.tileId === tile.id);
    if (moves.length === 0) {
      setSelectedTileId(null);
      return;
    }
    if (moves.length === 1) {
      playMove(moves[0]);
      return;
    }
    setSelectedTileId(tile.id);
  }

  function playMove(move: DominoMove) {
    setState((current) => applyDominoMove(current, move));
    setSelectedTileId(null);
  }

  function drawOrPass() {
    if (aiThinking || legalMoves.length > 0 || state.status !== 'playing') {
      return;
    }
    setState((current) => (current.boneyard.length > 0 ? drawDominoTile(current) : passDominoTurn(current)));
  }

  const aiLastTileId = state.lastMovePlayer === 'red' ? state.lastMove?.tileId : null;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>1 vs IA</Text>
        </View>
        <Pressable style={styles.resetButton} onPress={() => reset()}>
          <Text style={styles.resetText}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{statusText(state.status, state.turn, aiThinking)}</Text>
        <Text style={styles.stockText}>Pioche {state.boneyard.length}</Text>
      </View>

      <View style={styles.scoreRow}>
        <Pill label="Main ivoire" value={state.hands.ivory.length} />
        <Pill label="Main rouge" value={state.hands.red.length} />
      </View>

      <View style={styles.table}>
        <View style={styles.opponentRack}>
          {state.hands.red.map((tile) => (
            <View key={tile.id} style={styles.hiddenTile} />
          ))}
        </View>

        <View style={styles.chain}>
          {state.chain.length === 0 ? (
            <Text style={styles.emptyChain}>Pose un domino pour ouvrir la table</Text>
          ) : (
            <View style={styles.chainSnake}>
              {chainRows.map((row, rowIndex) => (
                <View
                  key={row.map((tile) => tile.id).join('-')}
                  style={[
                    styles.chainRow,
                    styles.chainRowStart,
                    rowIndex % 2 === 1 && styles.chainRowReverse,
                  ]}>
                  {row.map((tile, tileIndex) => {
                    const connector = rowIndex < chainRows.length - 1 && tileIndex === row.length - 1;
                    return (
                      <View key={`${tile.id}-${rowIndex}-${tileIndex}`} style={styles.chainTileWrap}>
                        <DominoTileView
                          tile={tile}
                          board
                          vertical={connector}
                          visualSwap={rowIndex % 2 === 1 && !connector}
                          highlighted={tile.id === aiLastTileId}
                        />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.hand}>
          {visibleHand.map((tile) => {
            const playable = legalMoves.some((move) => move.tileId === tile.id);
            return (
              <Pressable
                key={tile.id}
                style={[styles.handTile, selectedTileId === tile.id && styles.selectedHandTile, !playable && styles.unplayable]}
                hitSlop={8}
                onPress={() => selectTile(tile)}>
                <DominoTileView tile={tile} hand />
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedMoves.length > 1 && (
        <View style={styles.sideChooser}>
          <Text style={styles.sideText}>Choisir le côté</Text>
          {selectedMoves.map((move) => (
            <Pressable key={`${move.tileId}-${move.side}-${move.placed.left}`} style={styles.sideButton} onPress={() => playMove(move)}>
              <Text style={styles.sideButtonText}>{move.side === 'left' ? 'Gauche' : 'Droite'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.drawButton, (legalMoves.length > 0 || aiThinking || state.status !== 'playing') && styles.disabled]}
        onPress={drawOrPass}>
        <Text style={styles.drawText}>{state.boneyard.length > 0 ? 'Piocher' : 'Passer'}</Text>
      </Pressable>
    </View>
  );
}

function DominoTileView({
  tile,
  board = false,
  hand = false,
  vertical = false,
  visualSwap = false,
  highlighted = false,
}: {
  tile: DominoTile;
  board?: boolean;
  hand?: boolean;
  vertical?: boolean;
  visualSwap?: boolean;
  highlighted?: boolean;
}) {
  const first = visualSwap ? tile.right : tile.left;
  const second = visualSwap ? tile.left : tile.right;

  return (
    <View
      style={[
        styles.domino,
        board && styles.boardDomino,
        board && vertical && styles.boardVerticalDomino,
        hand && styles.handDomino,
        highlighted && styles.aiHighlight,
      ]}>
      <Half value={first} board={board} hand={hand} vertical={vertical} />
      <View style={[styles.divider, board && styles.boardDivider, board && vertical && styles.boardVerticalDivider, hand && styles.handDivider]} />
      <Half value={second} board={board} hand={hand} vertical={vertical} />
    </View>
  );
}

function Half({ value, board, hand, vertical }: { value: number; board?: boolean; hand?: boolean; vertical?: boolean }) {
  return (
    <View style={[styles.half, board && styles.boardHalf, board && vertical && styles.boardVerticalHalf, hand && styles.handHalf]}>
      {dominoPips(value).map((pip) => (
        <View
          key={`${pip.x}-${pip.y}`}
          style={[
            styles.pip,
            board && styles.boardPip,
            hand && styles.handPip,
            {
              left: `${pip.x}%`,
              top: `${pip.y}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

function dominoPips(value: number): { x: number; y: number }[] {
  switch (value) {
    case 1:
      return [{ x: 50, y: 50 }];
    case 2:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 72 },
      ];
    case 3:
      return [
        { x: 28, y: 28 },
        { x: 50, y: 50 },
        { x: 72, y: 72 },
      ];
    case 4:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 28 },
        { x: 28, y: 72 },
        { x: 72, y: 72 },
      ];
    case 5:
      return [
        { x: 28, y: 28 },
        { x: 72, y: 28 },
        { x: 50, y: 50 },
        { x: 28, y: 72 },
        { x: 72, y: 72 },
      ];
    case 6:
      return [
        { x: 28, y: 24 },
        { x: 72, y: 24 },
        { x: 28, y: 50 },
        { x: 72, y: 50 },
        { x: 28, y: 76 },
        { x: 72, y: 76 },
      ];
    default:
      return [];
  }
}

function chunkDominoChain(chain: DominoTile[], columns: number): DominoTile[][] {
  const rows: DominoTile[][] = [];
  for (let index = 0; index < chain.length; index += columns) {
    rows.push(chain.slice(index, index + columns));
  }
  return rows;
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function statusText(status: string, turn: string, thinking: boolean): string {
  if (thinking) {
    return 'L IA choisit un domino';
  }
  if (status === 'draw') {
    return 'Partie nulle';
  }
  if (status === 'ivory-won') {
    return 'Ivoire gagne';
  }
  if (status === 'red-won') {
    return 'Rouge gagne';
  }
  return `Au tour de ${turn === 'ivory' ? 'Ivoire' : 'Rouge'}`;
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBadge: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22342F',
    borderColor: '#22342F',
  },
  modeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AA2E35',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statusRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  statusText: {
    flex: 1,
    color: '#222B28',
    fontSize: 15,
    fontWeight: '900',
  },
  stockText: {
    color: '#53635D',
    fontWeight: '900',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  pillText: {
    flex: 1,
    color: '#53635D',
    fontWeight: '800',
  },
  pillValue: {
    color: '#191A1F',
    fontWeight: '900',
  },
  table: {
    minHeight: 560,
    borderRadius: 8,
    backgroundColor: '#47645B',
    borderWidth: 6,
    borderColor: '#22342F',
    justifyContent: 'space-between',
    padding: 8,
    gap: 8,
  },
  opponentRack: {
    minHeight: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 3,
  },
  hiddenTile: {
    width: 22,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#15171C',
    borderWidth: 2,
    borderColor: '#F3EADA',
  },
  chain: {
    flex: 1,
    minHeight: 280,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chainSnake: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  chainRow: {
    width: '100%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  chainRowStart: {
    justifyContent: 'flex-start',
  },
  chainRowReverse: {
    flexDirection: 'row-reverse',
  },
  chainTileWrap: {
    marginHorizontal: -1,
  },
  emptyChain: {
    color: '#F8EFE1',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  hand: {
    minHeight: 62,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  handTile: {
    borderRadius: 6,
  },
  selectedHandTile: {
    borderWidth: 2,
    borderColor: '#F6C85F',
  },
  unplayable: {
    opacity: 0.42,
  },
  domino: {
    width: 54,
    height: 104,
    borderRadius: 8,
    backgroundColor: '#F7F0E2',
    borderWidth: 2,
    borderColor: '#14161A',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  boardDomino: {
    width: 64,
    height: 32,
    borderRadius: 7,
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 0,
  },
  boardVerticalDomino: {
    width: 32,
    height: 64,
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingVertical: 5,
  },
  handDomino: {
    width: 27,
    height: 52,
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 4,
  },
  aiHighlight: {
    borderColor: '#E85D52',
    borderWidth: 4,
    backgroundColor: '#FFE6DF',
  },
  half: {
    width: 42,
    height: 40,
    position: 'relative',
  },
  boardHalf: {
    width: 24,
    height: 24,
  },
  boardVerticalHalf: {
    width: 24,
    height: 24,
  },
  handHalf: {
    width: 21,
    height: 19,
  },
  divider: {
    width: '78%',
    height: 2,
    backgroundColor: '#14161A',
  },
  boardDivider: {
    width: 2,
    height: '76%',
    alignSelf: 'center',
  },
  boardVerticalDivider: {
    width: '76%',
    height: 2,
  },
  handDivider: {
    width: '76%',
    height: 1,
  },
  pip: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: -3.5,
    marginTop: -3.5,
    backgroundColor: '#14161A',
  },
  boardPip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -2,
  },
  handPip: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginLeft: -1.5,
    marginTop: -1.5,
  },
  sideChooser: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  sideText: {
    flex: 1,
    color: '#53635D',
    fontWeight: '900',
  },
  sideButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#22342F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  drawButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#47645B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.38,
  },
  drawText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
