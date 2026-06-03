import AsyncStorage from '@react-native-async-storage/async-storage';
import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  chooseConnectFourMove,
  CONNECT_FOUR_COLS,
  CONNECT_FOUR_ROWS,
  createConnectFourScore,
  createConnectFourState,
  dropConnectFourDisc,
  getConnectFourOpponent,
  getConnectFourRoundStarter,
  scoreConnectFourRound,
  slotKey,
} from '@/game/connect-four';
import {
  ConnectFourBoard,
  ConnectFourDisc,
  ConnectFourMode,
  ConnectFourSavedState,
  ConnectFourScore,
  ConnectFourState,
} from '@/game/connect-four/types';

const STORAGE_KEY = 'games:connect-four:v1';
const aiDelayMs = 460;

const assets = {
  background: require('@/assets/game/connect-four/bg-arena.png'),
  logo: require('@/assets/game/connect-four/logo.png'),
};

export function ConnectFourGame() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - 48, 620);
  const boardHeight = boardWidth * 0.82;
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<ConnectFourMode>('ai');
  const [playerDisc, setPlayerDisc] = useState<ConnectFourDisc>('red');
  const [score, setScore] = useState<ConnectFourScore>(() => createConnectFourScore());
  const [game, setGame] = useState<ConnectFourState>(() => createConnectFourState('red'));
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);

  const aiDisc = getConnectFourOpponent(playerDisc);
  const isAiTurn = mode === 'ai' && game.status === 'playing' && game.turn === aiDisc;
  const aiThinking = isAiTurn;
  const labels = useMemo(() => getLabels(mode, playerDisc), [mode, playerDisc]);
  const winningSlots = useMemo(() => new Set((game.winningLine ?? []).map(slotKey)), [game.winningLine]);
  const playerScore = mode === 'ai' ? score[playerDisc] : score.red;
  const opponentScore = mode === 'ai' ? score[aiDisc] : score.yellow;

  const persistState = useCallback(
    async (nextMode: ConnectFourMode, nextPlayerDisc: ConnectFourDisc, nextScore: ConnectFourScore, nextRound: number) => {
      const saved: ConnectFourSavedState = {
        mode: nextMode,
        playerDisc: nextPlayerDisc,
        score: nextScore,
        round: nextRound,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || !mounted) {
          return;
        }

        const saved = JSON.parse(raw) as Partial<ConnectFourSavedState>;
        const savedMode = saved.mode === 'duel' || saved.mode === 'ai' ? saved.mode : 'ai';
        const savedPlayerDisc = saved.playerDisc === 'yellow' ? 'yellow' : 'red';
        const savedScore = isValidScore(saved.score) ? saved.score : createConnectFourScore();
        const savedRound = Number.isInteger(saved.round) && saved.round && saved.round > 0 ? saved.round : 1;

        setMode(savedMode);
        setPlayerDisc(savedPlayerDisc);
        setScore(savedScore);
        setGame(createConnectFourState(getConnectFourRoundStarter(savedRound), savedRound));
      })
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

    persistState(mode, playerDisc, score, game.round).catch(() => undefined);
  }, [game.round, hydrated, mode, persistState, playerDisc, score]);

  const applyMove = useCallback(
    (col: number, fromAi = false) => {
      if (!fromAi && isAiTurn) {
        return;
      }

      setGame((current) => {
        const next = dropConnectFourDisc(current, col);

        if (next !== current && current.status === 'playing') {
          impact(next.status === 'playing' ? 'light' : 'heavy');

          if (next.status !== 'playing') {
            setScore((currentScore) => scoreConnectFourRound(currentScore, next.winner));
          }
        }

        return next;
      });
    },
    [isAiTurn],
  );

  useEffect(() => {
    if (!isAiTurn) {
      return;
    }

    const timeout = setTimeout(() => {
      const move = chooseConnectFourMove(game.board, aiDisc);
      if (move !== null) {
        applyMove(move, true);
      }
    }, aiDelayMs);

    return () => clearTimeout(timeout);
  }, [aiDisc, applyMove, game.board, isAiTurn]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const col = Number(event.key) - 1;
      if (col >= 0 && col < CONNECT_FOUR_COLS) {
        applyMove(col);
      }

      if (event.key.toLowerCase() === 'r') {
        resetMatch();
      }
    };

    globalThis.addEventListener?.('keydown', onKeyDown as EventListener);
    return () => globalThis.removeEventListener?.('keydown', onKeyDown as EventListener);
  });

  function nextRound() {
    const round = game.round + 1;
    setHoverColumn(null);
    setGame(createConnectFourState(getConnectFourRoundStarter(round), round));
  }

  function resetMatch() {
    const freshScore = createConnectFourScore();
    setScore(freshScore);
    setHoverColumn(null);
    setGame(createConnectFourState('red', 1));
    persistState(mode, playerDisc, freshScore, 1).catch(() => undefined);
  }

  function switchMode(nextMode: ConnectFourMode) {
    if (nextMode === mode) {
      return;
    }

    const freshScore = createConnectFourScore();
    setMode(nextMode);
    setScore(freshScore);
    setHoverColumn(null);
    setGame(createConnectFourState('red', 1));
    persistState(nextMode, playerDisc, freshScore, 1).catch(() => undefined);
  }

  function switchPlayerDisc(disc: ConnectFourDisc) {
    if (disc === playerDisc) {
      return;
    }

    const freshScore = createConnectFourScore();
    setPlayerDisc(disc);
    setScore(freshScore);
    setHoverColumn(null);
    setGame(createConnectFourState('red', 1));
    persistState(mode, disc, freshScore, 1).catch(() => undefined);
  }

  const statusText = getStatusText(game, labels, aiThinking);
  const currentLabel = game.turn === 'red' ? labels.red.short : labels.yellow.short;
  const endTone = getEndTone(game.winner, mode, playerDisc);

  return (
    <View style={styles.root}>
      <Image source={assets.background} style={styles.background} contentFit="cover" />
      <View style={styles.glassLayer} />

      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <Image source={assets.logo} style={styles.logo} contentFit="contain" />
          <View style={styles.brandCopy}>
            <Text style={styles.kicker}>Connect Arena</Text>
            <Text style={styles.gameTitle}>Puissance 4</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={resetMatch} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <SegmentedControl
          label="Mode"
          options={[
            { label: '1 vs IA', value: 'ai' },
            { label: '1 vs 1', value: 'duel' },
          ]}
          value={mode}
          onChange={switchMode}
        />
        <SegmentedControl
          label="Couleur"
          options={[
            { label: 'Rouge', value: 'red' },
            { label: 'Jaune', value: 'yellow' },
          ]}
          value={playerDisc}
          disabled={mode === 'duel'}
          onChange={switchPlayerDisc}
        />
      </View>

      <View style={styles.scoreRow}>
        <ScorePanel
          active={game.status === 'playing' && (mode === 'ai' ? game.turn === playerDisc : game.turn === 'red')}
          color={mode === 'ai' ? playerDisc : 'red'}
          label={mode === 'ai' ? 'Joueur' : labels.red.name}
          disc={mode === 'ai' ? playerDisc : 'red'}
          score={playerScore}
        />
        <View style={styles.roundPanel}>
          <Text style={styles.roundLabel}>Round</Text>
          <Text style={styles.roundValue}>{game.round}</Text>
          <Text style={styles.drawsValue}>{score.draws} nuls</Text>
        </View>
        <ScorePanel
          active={game.status === 'playing' && (mode === 'ai' ? game.turn === aiDisc : game.turn === 'yellow')}
          color={mode === 'ai' ? aiDisc : 'yellow'}
          label={mode === 'ai' ? 'IA Nova' : labels.yellow.name}
          disc={mode === 'ai' ? aiDisc : 'yellow'}
          score={opponentScore}
        />
      </View>

      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.statusSubText}>{game.status === 'playing' ? `${currentLabel} place un jeton` : 'Progression sauvegardee'}</Text>
      </View>

      {game.status !== 'playing' ? (
        <View style={[styles.endEffect, endTone === 'win' ? styles.endWin : endTone === 'lose' ? styles.endLose : styles.endDraw]}>
          <View style={styles.endBeamRow}>
            {Array.from({ length: 9 }, (_, index) => (
              <View key={index} style={[styles.endBeam, { transform: [{ rotate: `${index * 18 - 70}deg` }] }]} />
            ))}
          </View>
          <Text style={styles.endEffectText}>{endTone === 'win' ? 'Victoire' : endTone === 'lose' ? 'Defaite' : 'Egalite'}</Text>
        </View>
      ) : null}

      <ConnectFourBoardView
        board={game.board}
        boardHeight={boardHeight}
        boardWidth={boardWidth}
        disabled={game.status !== 'playing' || isAiTurn}
        hoverColumn={hoverColumn}
        lastMove={game.lastMove}
        turn={game.turn}
        winningSlots={winningSlots}
        onColumnHover={setHoverColumn}
        onColumnPress={applyMove}
      />

      {game.status !== 'playing' ? (
        <View style={styles.resultBar}>
          <Text style={styles.resultText}>{game.status === 'draw' ? 'Plateau plein' : 'Connexion reussie'}</Text>
          <Pressable accessibilityRole="button" onPress={nextRound} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Round suivant</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ConnectFourBoardView({
  ...props
}: BoardViewProps) {
  return <ConnectFourBoardNativeView {...props} />;
}

type BoardViewProps = {
  board: ConnectFourBoard;
  boardHeight: number;
  boardWidth: number;
  disabled: boolean;
  hoverColumn: number | null;
  lastMove: { row: number; col: number } | null;
  turn: ConnectFourDisc;
  winningSlots: Set<string>;
  onColumnHover: (col: number | null) => void;
  onColumnPress: (col: number) => void;
};

function ConnectFourBoardNativeView({
  board,
  boardHeight,
  boardWidth,
  disabled,
  hoverColumn,
  lastMove,
  turn,
  winningSlots,
  onColumnHover,
  onColumnPress,
}: {
  board: ConnectFourBoard;
  boardHeight: number;
  boardWidth: number;
  disabled: boolean;
  hoverColumn: number | null;
  lastMove: { row: number; col: number } | null;
  turn: ConnectFourDisc;
  winningSlots: Set<string>;
  onColumnHover: (col: number | null) => void;
  onColumnPress: (col: number) => void;
}) {
  const geometry = getBoardGeometry(boardWidth, boardHeight);

  return (
    <View style={[styles.boardWrap, { width: boardWidth, height: boardHeight }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ConnectFourBoardCanvas
          board={board}
          height={boardHeight}
          hoverColumn={disabled ? null : hoverColumn}
          lastMove={lastMove}
          turn={turn}
          width={boardWidth}
          winningSlots={winningSlots}
        />
      </Canvas>
      <View
        style={[
          styles.columnHitboxRow,
          {
            left: geometry.boardX,
            top: geometry.boardY,
            width: geometry.boardW,
            height: geometry.boardH,
          },
        ]}>
        {Array.from({ length: CONNECT_FOUR_COLS }, (_, col) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Colonne ${col + 1}`}
            disabled={disabled}
            key={`column-hitbox-${col}`}
            onHoverIn={() => onColumnHover(disabled ? null : col)}
            onHoverOut={() => onColumnHover(null)}
            onPress={() => onColumnPress(col)}
            onPressIn={() => onColumnHover(disabled ? null : col)}
            style={styles.columnHitbox}
          />
        ))}
      </View>
    </View>
  );
}

function ConnectFourBoardCanvas({
  board,
  height,
  hoverColumn,
  lastMove,
  turn,
  width,
  winningSlots,
}: {
  board: ConnectFourBoard;
  height: number;
  hoverColumn: number | null;
  lastMove: { row: number; col: number } | null;
  turn: ConnectFourDisc;
  width: number;
  winningSlots: Set<string>;
}) {
  const geometry = getBoardGeometry(width, height);
  const discRadius = geometry.cell * 0.36;
  const holeRadius = geometry.cell * 0.39;
  const face = '#2456F2';
  const faceLight = '#44B6FF';
  const faceDark = '#122782';

  return (
    <Group>
      <Rect x={width * 0.12} y={height * 0.86} width={width * 0.76} height={height * 0.08} color="rgba(3, 9, 24, 0.46)" />
      <Rect x={geometry.boardX + geometry.cell * 0.2} y={geometry.boardY + geometry.cell * 0.42} width={geometry.boardW} height={geometry.boardH} color="#071026" />
      <Rect x={geometry.boardX + geometry.boardW} y={geometry.boardY + geometry.cell * 0.24} width={geometry.depth} height={geometry.boardH} color={faceDark} />
      <Rect x={geometry.boardX + geometry.depth * 0.58} y={geometry.boardY + geometry.boardH} width={geometry.boardW} height={geometry.depth} color="#0E1E64" />
      <Rect x={geometry.boardX} y={geometry.boardY} width={geometry.boardW} height={geometry.boardH} color={face} />
      <Rect x={geometry.boardX} y={geometry.boardY} width={geometry.boardW} height={geometry.cell * 0.32} color={faceLight} />
      <Rect x={geometry.boardX + geometry.cell * 0.14} y={geometry.boardY + geometry.cell * 0.14} width={geometry.boardW * 0.94} height={geometry.cell * 0.06} color="rgba(255, 255, 255, 0.38)" />

      {hoverColumn !== null ? (
        <Group>
          <Rect
            x={geometry.boardX + hoverColumn * geometry.cell + geometry.cell * 0.08}
            y={geometry.boardY - geometry.cell * 0.1}
            width={geometry.cell * 0.84}
            height={geometry.boardH + geometry.cell * 0.2}
            color="rgba(255, 255, 255, 0.12)"
          />
          <Disc cx={geometry.boardX + (hoverColumn + 0.5) * geometry.cell} cy={geometry.boardY - geometry.cell * 0.55} radius={discRadius} disc={turn} />
        </Group>
      ) : null}

      {board.map((row, rowIndex) =>
        row.map((disc, colIndex) => {
          const cx = geometry.boardX + (colIndex + 0.5) * geometry.cell;
          const cy = geometry.boardY + (rowIndex + 0.5) * geometry.cell;
          const key = slotKey({ row: rowIndex, col: colIndex });
          const won = winningSlots.has(key);
          const active = lastMove?.row === rowIndex && lastMove.col === colIndex;

          return (
            <Group key={`slot-${rowIndex}-${colIndex}`}>
              <Circle cx={cx + geometry.cell * 0.035} cy={cy + geometry.cell * 0.06} r={holeRadius} color="#09112A" />
              <Circle cx={cx} cy={cy} r={holeRadius} color="#111B3E" />
              <Circle cx={cx - geometry.cell * 0.04} cy={cy - geometry.cell * 0.04} r={holeRadius * 0.62} color="#071022" />
              {disc ? <Disc cx={cx} cy={cy} radius={discRadius} disc={disc} active={active || won} /> : null}
              {won ? (
                <Circle cx={cx} cy={cy} r={holeRadius * 0.94} color="#F8F7FF" style="stroke" strokeWidth={Math.max(3, geometry.cell * 0.055)} />
              ) : null}
            </Group>
          );
        }),
      )}

      <Rect x={geometry.boardX - geometry.cell * 0.08} y={geometry.boardY + geometry.boardH} width={geometry.cell * 0.42} height={geometry.cell * 0.9} color="#0B1D5C" />
      <Rect x={geometry.boardX + geometry.boardW - geometry.cell * 0.34} y={geometry.boardY + geometry.boardH} width={geometry.cell * 0.42} height={geometry.cell * 0.9} color="#0B1D5C" />
    </Group>
  );
}

function Disc({
  active,
  cx,
  cy,
  disc,
  radius,
}: {
  active?: boolean;
  cx: number;
  cy: number;
  disc: ConnectFourDisc;
  radius: number;
}) {
  const fill = disc === 'red' ? '#FF3E57' : '#FFD84A';
  const shadow = disc === 'red' ? '#8F1730' : '#9A6A00';
  const light = disc === 'red' ? '#FF9CAA' : '#FFF2A8';
  const inner = disc === 'red' ? '#D51E44' : '#F3B718';

  return (
    <Group>
      <Circle cx={cx + radius * 0.12} cy={cy + radius * 0.2} r={radius * 1.04} color="rgba(3, 7, 18, 0.46)" />
      <Circle cx={cx} cy={cy + radius * 0.08} r={radius} color={shadow} />
      <Circle cx={cx} cy={cy} r={radius} color={fill} />
      <Circle cx={cx - radius * 0.08} cy={cy - radius * 0.08} r={radius * 0.62} color={inner} />
      <Circle cx={cx - radius * 0.32} cy={cy - radius * 0.36} r={radius * 0.18} color={light} />
      {active ? <Circle cx={cx} cy={cy} r={radius * 1.16} color="#F8F7FF" style="stroke" strokeWidth={Math.max(3, radius * 0.12)} /> : null}
    </Group>
  );
}

function SegmentedControl<TValue extends string>({
  disabled,
  label,
  options,
  value,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  options: { label: string; value: TValue }[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <View style={[styles.segmentGroup, disabled && styles.disabled]}>
      <Text style={styles.segmentLabel}>{label}</Text>
      <View style={styles.segmentTrack}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentButton, option.value === value && styles.segmentActive]}>
            <Text style={[styles.segmentText, option.value === value && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ScorePanel({
  active,
  color,
  disc,
  label,
  score,
}: {
  active: boolean;
  color: ConnectFourDisc;
  disc: ConnectFourDisc;
  label: string;
  score: number;
}) {
  return (
    <View style={[styles.scorePanel, active && styles.scorePanelActive]}>
      <View style={[styles.scoreDisc, color === 'red' ? styles.redDisc : styles.yellowDisc]} />
      <View style={styles.scoreCopy}>
        <Text numberOfLines={1} style={styles.scoreLabel}>
          {label}
        </Text>
        <Text style={styles.scoreDiscLabel}>{disc === 'red' ? 'Rouge' : 'Jaune'}</Text>
      </View>
      <Text style={styles.scoreValue}>{score}</Text>
    </View>
  );
}

function getBoardGeometry(width: number, height: number) {
  const boardX = width * 0.055;
  const boardY = height * 0.16;
  const boardW = width * 0.84;
  const cell = boardW / CONNECT_FOUR_COLS;
  const boardH = cell * CONNECT_FOUR_ROWS;
  return {
    boardX,
    boardY,
    boardW,
    boardH,
    cell,
    depth: Math.max(14, width * 0.045),
  };
}

function getLabels(mode: ConnectFourMode, playerDisc: ConnectFourDisc) {
  if (mode === 'duel') {
    return {
      red: { name: 'Joueur 1', short: 'Joueur 1' },
      yellow: { name: 'Joueur 2', short: 'Joueur 2' },
    };
  }

  return playerDisc === 'red'
    ? {
        red: { name: 'Joueur', short: 'A toi' },
        yellow: { name: 'IA Nova', short: 'IA Nova' },
      }
    : {
        red: { name: 'IA Nova', short: 'IA Nova' },
        yellow: { name: 'Joueur', short: 'A toi' },
      };
}

function getStatusText(game: ConnectFourState, labels: ReturnType<typeof getLabels>, aiThinking: boolean): string {
  if (aiThinking) {
    return 'IA Nova calcule';
  }

  if (game.status === 'draw') {
    return 'Egalite';
  }

  if (game.status === 'won' && game.winner) {
    return `${game.winner === 'red' ? labels.red.name : labels.yellow.name} gagne`;
  }

  return `${game.turn === 'red' ? labels.red.short : labels.yellow.short} vise`;
}

function getEndTone(winner: ConnectFourDisc | null, mode: ConnectFourMode, playerDisc: ConnectFourDisc): 'win' | 'lose' | 'draw' {
  if (!winner || mode === 'duel') {
    return winner ? 'win' : 'draw';
  }

  return winner === playerDisc ? 'win' : 'lose';
}

function isValidScore(score: unknown): score is ConnectFourScore {
  if (!score || typeof score !== 'object') {
    return false;
  }

  const candidate = score as Partial<ConnectFourScore>;
  return Number.isInteger(candidate.red) && Number.isInteger(candidate.yellow) && Number.isInteger(candidate.draws);
}

function impact(style: 'light' | 'heavy') {
  if (Platform.OS === 'web') {
    return;
  }

  const impactStyle = style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(impactStyle).catch(() => undefined);
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#09111F',
    backgroundColor: '#09111F',
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  glassLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 12, 26, 0.28)',
  },
  topBar: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 58,
    height: 58,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#65D7FF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gameTitle: {
    color: '#F8F7FF',
    fontSize: 28,
    fontWeight: '900',
  },
  resetButton: {
    minWidth: 86,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F8F7FF',
    backgroundColor: '#FF3E57',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  resetText: {
    color: '#F8F7FF',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentGroup: {
    flexGrow: 1,
    minWidth: 160,
    gap: 5,
  },
  disabled: {
    opacity: 0.45,
  },
  segmentLabel: {
    color: '#BBD9FF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  segmentTrack: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#5D88FF',
    backgroundColor: 'rgba(248, 247, 255, 0.14)',
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  segmentButton: {
    flex: 1,
    minHeight: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: '#65D7FF',
  },
  segmentText: {
    color: '#F8F7FF',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  segmentTextActive: {
    color: '#09111F',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  scorePanel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(248, 247, 255, 0.28)',
    backgroundColor: 'rgba(248, 247, 255, 0.12)',
    padding: 9,
    gap: 8,
  },
  scorePanelActive: {
    borderColor: '#65D7FF',
    backgroundColor: 'rgba(101, 215, 255, 0.18)',
  },
  scoreDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  redDisc: {
    backgroundColor: '#FF3E57',
  },
  yellowDisc: {
    backgroundColor: '#FFD84A',
  },
  scoreCopy: {
    minWidth: 0,
  },
  scoreLabel: {
    color: '#F8F7FF',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreDiscLabel: {
    color: '#BBD9FF',
    fontSize: 12,
    fontWeight: '800',
  },
  scoreValue: {
    color: '#F8F7FF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  roundPanel: {
    width: 92,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#65D7FF',
    backgroundColor: '#0E1E46',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  roundLabel: {
    color: '#BBD9FF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  roundValue: {
    color: '#F8F7FF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  drawsValue: {
    color: '#FFD84A',
    fontSize: 11,
    fontWeight: '900',
  },
  statusPanel: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(248, 247, 255, 0.28)',
    backgroundColor: 'rgba(9, 17, 31, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#F8F7FF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusSubText: {
    color: '#BBD9FF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  endEffect: {
    minHeight: 82,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F8F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  endWin: {
    backgroundColor: '#FFD84A',
  },
  endLose: {
    backgroundColor: '#FF3E57',
  },
  endDraw: {
    backgroundColor: '#65D7FF',
  },
  endBeamRow: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBeam: {
    position: 'absolute',
    width: 16,
    height: 220,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 247, 255, 0.22)',
  },
  endEffectText: {
    color: '#09111F',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  boardWrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  columnHitboxRow: {
    position: 'absolute',
    flexDirection: 'row',
    zIndex: 4,
  },
  columnHitbox: {
    flex: 1,
    minWidth: 0,
  },
  resultBar: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#65D7FF',
    backgroundColor: 'rgba(248, 247, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  resultText: {
    flex: 1,
    color: '#F8F7FF',
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nextButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#FFD84A',
    borderWidth: 2,
    borderColor: '#F8F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  nextText: {
    color: '#09111F',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
