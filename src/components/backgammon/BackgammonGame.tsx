import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  BackgammonMode,
  BackgammonMove,
  BackgammonPlayer,
  MoveFrom,
  Point,
  applyBackgammonMove,
  chooseBackgammonAiMove,
  createBackgammonState,
  endBackgammonTurn,
  getBackgammonLegalMoves,
  getBackgammonMovesFrom,
  startBackgammonTurn,
} from '@/game/backgammon';

type SavedBackgammonGame = {
  state: ReturnType<typeof createBackgammonState>;
  mode: BackgammonMode;
};

const backgammonStorageKey = 'games:backgammon:state';

const topLeftPoints = Array.from({ length: 6 }, (_, index) => 12 + index);
const topRightPoints = Array.from({ length: 6 }, (_, index) => 18 + index);
const bottomLeftPoints = Array.from({ length: 6 }, (_, index) => 11 - index);
const bottomRightPoints = Array.from({ length: 6 }, (_, index) => 5 - index);
const centerBarWidth = 0;

export function BackgammonGame() {
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState(() => createBackgammonState());
  const [mode, setMode] = useState<BackgammonMode>('computer');
  const [selected, setSelected] = useState<MoveFrom | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const legalMoves = useMemo(() => getBackgammonLegalMoves(state), [state]);
  const selectedMoves = useMemo(
    () => (selected !== null ? getBackgammonMovesFrom(state, selected) : []),
    [selected, state],
  );
  const aiThinking = mode === 'computer' && state.turn === 'red' && state.status === 'playing';
  const aiLastMove = mode === 'computer' && state.lastMovePlayer === 'red' ? state.lastMove : null;
  const availableWidth = Math.max(320, width - 20);
  const availableHeight = Math.max(360, height - 230);
  const rotatedFrameWidth = Math.min(availableWidth, availableHeight / 1.78);
  const rotatedFrameHeight = rotatedFrameWidth * 1.78;
  const boardWidth = rotatedFrameHeight;
  const boardHeight = rotatedFrameWidth;
  const pointMetrics = useMemo(() => {
    const usableWidth = boardWidth - 64 - 16;
    const pointWidth = usableWidth / 12;
    const checkerSize = Math.max(15, Math.min(24, pointWidth * 0.57));

    return {
      checkerSize,
      checkerStep: checkerSize * 0.46,
      markerSize: Math.max(12, Math.min(18, pointWidth * 0.42)),
      pointHalfWidth: Math.max(11, Math.min(45, pointWidth * 0.34)),
      pointHeight: Math.max(78, Math.min(boardHeight * 0.43, boardHeight / 2 - 18)),
    };
  }, [boardHeight, boardWidth]);

  useEffect(() => {
    let mounted = true;

    async function loadSavedGame() {
      const stored = await AsyncStorage.getItem(backgammonStorageKey);
      if (!stored) {
        return;
      }

      const saved = JSON.parse(stored) as SavedBackgammonGame;
      if (!mounted) {
        return;
      }

      setState(saved.state ?? createBackgammonState());
      setMode(saved.mode === 'human' ? 'human' : 'computer');
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

    const payload: SavedBackgammonGame = { state, mode };
    AsyncStorage.setItem(backgammonStorageKey, JSON.stringify(payload)).catch(() => undefined);
  }, [hydrated, mode, state]);

  useEffect(() => {
    if (!aiThinking) {
      return;
    }

    const timeout = setTimeout(() => {
      setState((current) => {
        if (!current.rolled) {
          return startBackgammonTurn(current);
        }
        const move = chooseBackgammonAiMove(current);
        return move ? applyBackgammonMove(current, move) : endBackgammonTurn(current);
      });
      setSelected(null);
    }, 520);

    return () => clearTimeout(timeout);
  }, [aiThinking, state]);

  function reset(nextMode = mode) {
    AsyncStorage.removeItem(backgammonStorageKey).catch(() => undefined);
    setMode(nextMode);
    setState(createBackgammonState());
    setSelected(null);
  }

  function roll() {
    if (state.rolled || state.status !== 'playing' || aiThinking) {
      return;
    }
    setState((current) => startBackgammonTurn(current));
    setSelected(null);
  }

  function pass() {
    if (!state.rolled || legalMoves.length > 0 || aiThinking) {
      return;
    }
    setState((current) => endBackgammonTurn(current));
    setSelected(null);
  }

  function pressBar() {
    if (state.bar[state.turn] > 0) {
      setSelected('bar');
    }
  }

  function pressPoint(index: number) {
    if (!state.rolled || aiThinking || state.status !== 'playing') {
      return;
    }

    const targetMove = selectedMoves.find((move) => move.to === index);
    if (targetMove) {
      setState((current) => applyBackgammonMove(current, targetMove));
      setSelected(null);
      return;
    }

    const point = state.points[index];
    if (state.bar[state.turn] === 0 && point.owner === state.turn && point.count > 0) {
      const moves = legalMoves.filter((move) => move.from === index);
      setSelected(moves.length > 0 ? index : null);
    }
  }

  function bearOff() {
    const move = selectedMoves.find((candidate) => candidate.to === 'off');
    if (move) {
      setState((current) => applyBackgammonMove(current, move));
      setSelected(null);
    }
  }

  const canBearOff = selectedMoves.some((move) => move.to === 'off');

  return (
    <View style={styles.container}>
      <View style={[styles.controls, { width: Math.min(availableWidth, 720) }]}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{statusText(state.turn, state.status, aiThinking)}</Text>
          <View style={styles.diceRow}>
            {state.dice.length === 0 ? <Text style={styles.diceEmpty}>Dés</Text> : state.dice.map((die, index) => <Die key={`${die}-${index}`} value={die} />)}
          </View>
        </View>

        <View style={styles.toolbar}>
          <Segment active={mode === 'computer'} label="1 vs IA" onPress={() => reset('computer')} />
          <Segment active={mode === 'human'} label="1 vs 1" onPress={() => reset('human')} />
          <Pressable style={styles.resetButton} onPress={() => reset()}>
            <Text style={styles.resetText}>Nouvelle</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, (state.rolled || aiThinking) && styles.disabled]} onPress={roll}>
            <Text style={styles.actionText}>Lancer</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, (!state.rolled || legalMoves.length > 0 || aiThinking) && styles.disabled]} onPress={pass}>
            <Text style={styles.actionText}>Passer</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, !canBearOff && styles.disabled]} onPress={bearOff}>
            <Text style={styles.actionText}>Sortir</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.rotatedBoardFrame, { width: rotatedFrameWidth, height: rotatedFrameHeight }]}>
        <View
          style={[
            styles.board,
            {
              width: boardWidth,
              height: boardHeight,
              transform: [{ rotate: '90deg' }],
            },
          ]}>
          <View style={styles.bearOffRail}>
            <BearOffTray player="red" value={state.off.red} aiMarked={aiLastMove?.to === 'off'} />
            <BearOffTray player="ivory" value={state.off.ivory} aiMarked={false} />
          </View>

          <View pointerEvents="none" style={styles.centerDivider} />

          <Pressable
            style={[styles.floatingBar, selected === 'bar' && styles.selectedBar, aiLastMove?.from === 'bar' && styles.aiBar]}
            onPress={pressBar}>
            <View style={styles.floatingBarLane}>
              <CapturedStack player="red" count={state.bar.red} top />
            </View>
            <View style={styles.floatingBarLane}>
              <CapturedStack player="ivory" count={state.bar.ivory} />
            </View>
          </Pressable>

          <View style={styles.tableRow}>
            <PointGroup
              points={topLeftPoints}
              statePoints={state.points}
              selected={selected}
              selectedMoves={selectedMoves}
              aiLastMove={aiLastMove}
              metrics={pointMetrics}
              top
              onPressPoint={pressPoint}
            />

            <PointGroup
              points={topRightPoints}
              statePoints={state.points}
              selected={selected}
              selectedMoves={selectedMoves}
              aiLastMove={aiLastMove}
              metrics={pointMetrics}
              top
              onPressPoint={pressPoint}
            />
          </View>

          <View style={[styles.tableRow, styles.bottomRow]}>
            <PointGroup
              points={bottomLeftPoints}
              statePoints={state.points}
              selected={selected}
              selectedMoves={selectedMoves}
              aiLastMove={aiLastMove}
              metrics={pointMetrics}
              onPressPoint={pressPoint}
            />

            <PointGroup
              points={bottomRightPoints}
              statePoints={state.points}
              selected={selected}
              selectedMoves={selectedMoves}
              aiLastMove={aiLastMove}
              metrics={pointMetrics}
              onPressPoint={pressPoint}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function PointGroup({
  points,
  statePoints,
  selected,
  selectedMoves,
  aiLastMove,
  metrics,
  top = false,
  onPressPoint,
}: {
  points: number[];
  statePoints: Point[];
  selected: MoveFrom | null;
  selectedMoves: BackgammonMove[];
  aiLastMove: BackgammonMove | null;
  metrics: BackgammonPointMetrics;
  top?: boolean;
  onPressPoint: (index: number) => void;
}) {
  return (
    <View style={styles.pointGroup}>
      {points.map((index) => (
        <PointView
          key={index}
          index={index}
          point={statePoints[index]}
          selected={selected === index}
          legal={selectedMoves.some((move) => move.to === index)}
          aiMarked={isMovePoint(aiLastMove, index)}
          metrics={metrics}
          top={top}
          onPress={() => onPressPoint(index)}
        />
      ))}
    </View>
  );
}

function CapturedStack({ player, count, top = false }: { player: BackgammonPlayer; count: number; top?: boolean }) {
  return (
    <View style={[styles.capturedStack, top && styles.capturedStackTop]}>
      {Array.from({ length: Math.min(count, 5) }, (_, index) => (
        <View
          key={index}
          style={[
            styles.capturedChecker,
            player === 'red' ? styles.redChecker : styles.ivoryChecker,
            top ? styles.capturedCheckerTop : styles.capturedCheckerBottom,
            { transform: [{ translateY: top ? index * 11 : -index * 11 }] },
          ]}>
          {index === 4 && count > 5 && <Text style={styles.checkerCount}>{count}</Text>}
        </View>
      ))}
    </View>
  );
}

function BearOffTray({ player, value, aiMarked }: { player: BackgammonPlayer; value: number; aiMarked: boolean }) {
  return (
    <View style={[styles.bearOffTray, aiMarked && styles.aiCounter]}>
      <Text style={styles.bearOffLabel}>{player === 'red' ? 'Rouge' : 'Ivoire'}</Text>
      <View style={styles.bearOffStack}>
        {Array.from({ length: Math.min(value, 8) }, (_, index) => (
          <View
            key={index}
            style={[
              styles.bearOffChecker,
              player === 'red' ? styles.redChecker : styles.ivoryChecker,
              { transform: [{ translateY: -index * 7 }] },
            ]}
          />
        ))}
      </View>
      <Text style={styles.bearOffCount}>{value}/15</Text>
    </View>
  );
}

function PointView({
  index,
  point,
  top = false,
  selected,
  legal,
  aiMarked,
  metrics,
  onPress,
}: {
  index: number;
  point: Point;
  top?: boolean;
  selected: boolean;
  legal: boolean;
  aiMarked: boolean;
  metrics: BackgammonPointMetrics;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.pointSlot} onPress={onPress}>
      <View
        style={[
          styles.point,
          {
            borderLeftWidth: metrics.pointHalfWidth,
            borderRightWidth: metrics.pointHalfWidth,
            borderTopWidth: metrics.pointHeight,
          },
          index % 2 ? styles.redPoint : styles.tealPoint,
          top ? styles.bottomPoint : styles.topPoint,
        ]}
      />
      {legal && <View style={[styles.legalMarker, { width: metrics.markerSize, height: metrics.markerSize, borderRadius: metrics.markerSize / 2 }]} />}
      {aiMarked && <View style={styles.aiMarker} />}
      {selected && <View style={styles.selectedPoint} />}
      <View style={[styles.checkerStack, top ? styles.topStack : styles.bottomStack]}>
        {Array.from({ length: Math.min(point.count, 5) }, (_, checkerIndex) => (
          <View
            key={checkerIndex}
            style={[
              styles.checker,
              {
                width: metrics.checkerSize,
                height: metrics.checkerSize,
                borderRadius: metrics.checkerSize / 2,
              },
              point.owner === 'red' ? styles.redChecker : styles.ivoryChecker,
              { transform: [{ translateY: top ? checkerIndex * metrics.checkerStep : -checkerIndex * metrics.checkerStep }] },
            ]}>
            {checkerIndex === 4 && point.count > 5 && <Text style={styles.checkerCount}>{point.count}</Text>}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

type BackgammonPointMetrics = {
  checkerSize: number;
  checkerStep: number;
  markerSize: number;
  pointHalfWidth: number;
  pointHeight: number;
};

function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Die({ value }: { value: number }) {
  return (
    <View style={styles.die}>
      <Text style={styles.dieText}>{value}</Text>
    </View>
  );
}

function statusText(turn: BackgammonPlayer, status: string, thinking: boolean): string {
  if (thinking) {
    return 'L IA joue son lancer';
  }
  if (status === 'ivory-won') {
    return 'Ivoire gagne';
  }
  if (status === 'red-won') {
    return 'Rouge gagne';
  }
  return `Au tour de ${turn === 'ivory' ? 'Ivoire' : 'Rouge'}`;
}

function isMovePoint(move: BackgammonMove | null, index: number): boolean {
  return Boolean(move && (move.from === index || move.to === index));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingTop: 54,
  },
  controls: {
    gap: 8,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  segment: {
    minWidth: 78,
    minHeight: 36,
    borderRadius: 8,
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
    minHeight: 36,
    paddingHorizontal: 12,
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
    minHeight: 44,
    minWidth: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E5D2B6',
  },
  statusText: {
    flex: 1,
    color: '#222B28',
    fontSize: 15,
    fontWeight: '900',
  },
  diceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  diceEmpty: {
    color: '#53635D',
    fontWeight: '800',
  },
  die: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8EFE1',
    borderWidth: 2,
    borderColor: '#191A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: {
    color: '#191A1F',
    fontSize: 16,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 88,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#47645B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.38,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  counters: {
    flexDirection: 'row',
    gap: 8,
  },
  counter: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  counterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#191A1F',
  },
  counterText: {
    flex: 1,
    color: '#53635D',
    fontWeight: '800',
  },
  counterValue: {
    color: '#191A1F',
    fontWeight: '900',
  },
  aiCounter: {
    borderColor: '#E85D52',
    borderWidth: 3,
    backgroundColor: '#FFE6DF',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EEF3F0',
    borderWidth: 1,
    borderColor: '#CFDAD4',
    gap: 4,
  },
  infoTitle: {
    color: '#22342F',
    fontSize: 14,
    fontWeight: '900',
  },
  infoText: {
    color: '#53635D',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  board: {
    borderRadius: 8,
    borderWidth: 8,
    borderColor: '#4C2F25',
    backgroundColor: '#D8B77C',
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingRight: 64,
  },
  rotatedBoardFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bearOffRail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#4C2F25',
    zIndex: 5,
    padding: 5,
    justifyContent: 'space-between',
    gap: 5,
  },
  bearOffTray: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#2B1B16',
    borderWidth: 1,
    borderColor: '#D8B77C',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    overflow: 'hidden',
  },
  bearOffLabel: {
    color: '#F8EFE1',
    fontSize: 9,
    fontWeight: '900',
  },
  bearOffStack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bearOffChecker: {
    width: 25,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#191A1F',
    position: 'absolute',
    bottom: 4,
  },
  bearOffCount: {
    color: '#F8EFE1',
    fontSize: 10,
    fontWeight: '900',
  },
  bar: {
    width: centerBarWidth,
    height: '100%',
    backgroundColor: '#4C2F25',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 3,
  },
  selectedBar: {
    borderWidth: 2,
    borderColor: '#F6C85F',
  },
  centerDivider: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(76, 47, 37, 0.72)',
    zIndex: 3,
  },
  floatingBar: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 34,
    marginLeft: -17,
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    pointerEvents: 'auto',
  },
  floatingBarLane: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    justifyContent: 'flex-end',
  },
  aiBar: {
    borderWidth: 3,
    borderColor: '#E85D52',
  },
  barText: {
    color: '#F8EFE1',
    fontSize: 8,
    fontWeight: '900',
  },
  barTitle: {
    color: '#F8EFE1',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  barLane: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  capturedStack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  capturedStackTop: {
    justifyContent: 'flex-start',
  },
  capturedChecker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#191A1F',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedCheckerTop: {
    top: 0,
  },
  capturedCheckerBottom: {
    bottom: 0,
  },
  tableRow: {
    height: '49%',
    flexDirection: 'row',
  },
  bottomRow: {
    alignItems: 'flex-end',
  },
  pointGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  pointSlot: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minWidth: 40,
    overflow: 'hidden',
  },
  point: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 142,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  topPoint: {
    transform: [{ rotate: '180deg' }],
  },
  bottomPoint: {
    transform: [{ rotate: '0deg' }],
  },
  tealPoint: {
    borderTopColor: '#47645B',
  },
  redPoint: {
    borderTopColor: '#AA2E35',
  },
  checkerStack: {
    position: 'absolute',
    alignItems: 'center',
  },
  topStack: {
    top: 24,
  },
  bottomStack: {
    bottom: 24,
  },
  checker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#191A1F',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ivoryChecker: {
    backgroundColor: '#F8EFE1',
  },
  redChecker: {
    backgroundColor: '#AA2E35',
  },
  checkerCount: {
    color: '#191A1F',
    fontSize: 11,
    fontWeight: '900',
  },
  selectedPoint: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 2,
    right: 2,
    borderWidth: 3,
    borderColor: '#F6C85F',
    borderRadius: 8,
  },
  legalMarker: {
    position: 'absolute',
    top: '44%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(88, 183, 169, 0.88)',
    zIndex: 3,
  },
  aiMarker: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 3,
    right: 3,
    borderWidth: 3,
    borderColor: 'rgba(232, 93, 82, 0.92)',
    backgroundColor: 'rgba(232, 93, 82, 0.18)',
    borderRadius: 8,
    zIndex: 2,
  },
});
