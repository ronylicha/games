import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  chooseUnbeatableMove,
  createTicTacToeScore,
  createTicTacToeState,
  getOpponentMark,
  getRoundStarter,
  playTicTacToeMove,
  scoreTicTacToeRound,
} from '@/game/tic-tac-toe';
import { TicTacToeMark, TicTacToeMode, TicTacToeSavedState, TicTacToeScore, TicTacToeState } from '@/game/tic-tac-toe/types';

const STORAGE_KEY = 'games:tic-tac-toe:v1';
const aiDelayMs = 380;

const assets = {
  background: require('@/assets/game/tic-tac-toe/bg-arcade.png'),
  board: require('@/assets/game/tic-tac-toe/board.png'),
  cellIdle: require('@/assets/game/tic-tac-toe/cell-idle.png'),
  cellActive: require('@/assets/game/tic-tac-toe/cell-active.png'),
  cellWin: require('@/assets/game/tic-tac-toe/cell-win.png'),
  markX: require('@/assets/game/tic-tac-toe/mark-x.png'),
  markO: require('@/assets/game/tic-tac-toe/mark-o.png'),
  avatarOne: require('@/assets/game/tic-tac-toe/avatar-player-one.png'),
  avatarTwo: require('@/assets/game/tic-tac-toe/avatar-player-two.png'),
  avatarAi: require('@/assets/game/tic-tac-toe/avatar-ai.png'),
  badgeDraw: require('@/assets/game/tic-tac-toe/badge-draw.png'),
  badgeWin: require('@/assets/game/tic-tac-toe/badge-win.png'),
  spark: require('@/assets/game/tic-tac-toe/spark.png'),
};

export function TicTacToeGame() {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 48, 390);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<TicTacToeMode>('ai');
  const [playerMark, setPlayerMark] = useState<TicTacToeMark>('X');
  const [score, setScore] = useState<TicTacToeScore>(() => createTicTacToeScore());
  const [game, setGame] = useState<TicTacToeState>(() => createTicTacToeState('X'));

  const aiMark = getOpponentMark(playerMark);
  const isAiTurn = mode === 'ai' && game.status === 'playing' && game.turn === aiMark;
  const aiThinking = isAiTurn;
  const winningCells = useMemo(() => new Set(game.winningLine ?? []), [game.winningLine]);

  const labels = useMemo(() => getLabels(mode, playerMark), [mode, playerMark]);
  const currentLabel = game.turn === 'X' ? labels.x.short : labels.o.short;
  const playerScore = mode === 'ai' ? score[playerMark.toLowerCase() as 'x' | 'o'] : score.x;
  const opponentScore = mode === 'ai' ? score[aiMark.toLowerCase() as 'x' | 'o'] : score.o;

  const persistState = useCallback(
    async (nextMode: TicTacToeMode, nextPlayerMark: TicTacToeMark, nextScore: TicTacToeScore, nextRound: number) => {
      const state: TicTacToeSavedState = {
        mode: nextMode,
        playerMark: nextPlayerMark,
        score: nextScore,
        round: nextRound,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

        const saved = JSON.parse(raw) as Partial<TicTacToeSavedState>;
        const savedMode = saved.mode === 'duel' || saved.mode === 'ai' ? saved.mode : 'ai';
        const savedPlayerMark = saved.playerMark === 'O' ? 'O' : 'X';
        const savedScore = isValidScore(saved.score) ? saved.score : createTicTacToeScore();
        const savedRound = Number.isInteger(saved.round) && saved.round && saved.round > 0 ? saved.round : 1;

        setMode(savedMode);
        setPlayerMark(savedPlayerMark);
        setScore(savedScore);
        setGame(createTicTacToeState(getRoundStarter(savedRound), savedRound));
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

    persistState(mode, playerMark, score, game.round).catch(() => undefined);
  }, [game.round, hydrated, mode, persistState, playerMark, score]);

  const applyMove = useCallback(
    (index: number, fromAi = false) => {
      if (!fromAi && isAiTurn) {
        return;
      }

      setGame((current) => {
        const next = playTicTacToeMove(current, index);

        if (next !== current && current.status === 'playing') {
          impact(next.status === 'playing' ? 'light' : 'heavy');

          if (next.status !== 'playing') {
            setScore((currentScore) => scoreTicTacToeRound(currentScore, next.winner));
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
      const move = chooseUnbeatableMove(game.board, aiMark);

      if (move !== null) {
        applyMove(move, true);
      }
    }, aiDelayMs);

    return () => clearTimeout(timeout);
  }, [aiMark, applyMove, game.board, isAiTurn]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const keyIndex = Number(event.key) - 1;
      if (keyIndex >= 0 && keyIndex <= 8) {
        applyMove(keyIndex);
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
    setGame(createTicTacToeState(getRoundStarter(round), round));
  }

  function resetMatch() {
    const freshScore = createTicTacToeScore();
    setScore(freshScore);
    setGame(createTicTacToeState('X', 1));
    persistState(mode, playerMark, freshScore, 1).catch(() => undefined);
  }

  function switchMode(nextMode: TicTacToeMode) {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);
    const freshScore = createTicTacToeScore();
    setScore(freshScore);
    setGame(createTicTacToeState('X', 1));
    persistState(nextMode, playerMark, freshScore, 1).catch(() => undefined);
  }

  function switchPlayerMark(mark: TicTacToeMark) {
    if (mark === playerMark) {
      return;
    }

    setPlayerMark(mark);
    const freshScore = createTicTacToeScore();
    setScore(freshScore);
    setGame(createTicTacToeState('X', 1));
    persistState(mode, mark, freshScore, 1).catch(() => undefined);
  }

  const statusText = getStatusText(game, labels, aiThinking);
  const resultAsset = game.status === 'draw' ? assets.badgeDraw : assets.badgeWin;
  const endTone = getEndTone(game.winner, mode, playerMark);

  return (
    <View style={styles.root}>
      <Image source={assets.background} style={styles.backdrop} contentFit="cover" />
      <View style={styles.scanlines} />

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
          label="Marque"
          options={[
            { label: 'X', value: 'X' },
            { label: 'O', value: 'O' },
          ]}
          value={playerMark}
          disabled={mode === 'duel'}
          onChange={switchPlayerMark}
        />
        <Pressable accessibilityRole="button" onPress={resetMatch} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <AvatarScore
          avatar={mode === 'ai' && playerMark === 'O' ? assets.avatarTwo : assets.avatarOne}
          label={mode === 'ai' ? 'Joueur' : labels.x.name}
          mark={mode === 'ai' ? playerMark : 'X'}
          score={playerScore}
          active={game.status === 'playing' && (mode === 'ai' ? game.turn === playerMark : game.turn === 'X')}
        />
        <View style={styles.roundPanel}>
          <Text style={styles.roundLabel}>Round</Text>
          <Text style={styles.roundValue}>{game.round}</Text>
          <View style={styles.drawsBadge}>
            <Text style={styles.drawsText}>{score.draws} nuls</Text>
          </View>
        </View>
        <AvatarScore
          avatar={mode === 'ai' ? assets.avatarAi : assets.avatarTwo}
          label={mode === 'ai' ? 'IA Max' : labels.o.name}
          mark={mode === 'ai' ? aiMark : 'O'}
          score={opponentScore}
          active={game.status === 'playing' && (mode === 'ai' ? game.turn === aiMark : game.turn === 'O')}
        />
      </View>

      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.statusSubText}>{game.status === 'playing' ? `${currentLabel} joue ${game.turn}` : 'Score sauvegarde automatiquement'}</Text>
      </View>

      {game.status !== 'playing' ? (
        <View style={[styles.endEffect, endTone === 'win' ? styles.endWin : endTone === 'lose' ? styles.endLose : styles.endDraw]}>
          <View style={styles.endBurstRow}>
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} style={[styles.endBurst, { transform: [{ rotate: `${index * 22 - 64}deg` }] }]} />
            ))}
          </View>
          <Text style={styles.endEffectText}>{endTone === 'win' ? 'Victoire' : endTone === 'lose' ? 'Defaite' : 'Egalite'}</Text>
        </View>
      ) : null}

      <View style={[styles.boardShell, { width: boardSize, height: boardSize }]}>
        <Image source={assets.board} style={styles.boardImage} contentFit="contain" />
        <View style={styles.boardGrid}>
          {game.board.map((cell, index) => {
            const won = winningCells.has(index);
            const active = game.lastMove === index;
            const image = won ? assets.cellWin : active ? assets.cellActive : assets.cellIdle;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Case ${index + 1}`}
                key={index}
                disabled={Boolean(cell) || game.status !== 'playing' || isAiTurn}
                onPress={() => applyMove(index)}
                style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}>
                <Image source={image} style={styles.cellImage} contentFit="contain" />
                {cell ? <Image source={cell === 'X' ? assets.markX : assets.markO} style={styles.markImage} contentFit="contain" /> : null}
                {won ? <Image source={assets.spark} style={styles.sparkImage} contentFit="contain" /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {game.status !== 'playing' ? (
        <View style={styles.resultBar}>
          <Image source={resultAsset} style={styles.resultBadge} contentFit="contain" />
          <Pressable accessibilityRole="button" onPress={nextRound} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Round suivant</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
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

function AvatarScore({
  active,
  avatar,
  label,
  mark,
  score,
}: {
  active: boolean;
  avatar: number;
  label: string;
  mark: TicTacToeMark;
  score: number;
}) {
  return (
    <View style={[styles.avatarPanel, active && styles.avatarActive]}>
      <Image source={avatar} style={styles.avatar} contentFit="contain" />
      <View style={styles.avatarCopy}>
        <Text style={styles.avatarName} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.avatarMark}>{mark}</Text>
      </View>
      <Text style={styles.avatarScore}>{score}</Text>
    </View>
  );
}

function getLabels(mode: TicTacToeMode, playerMark: TicTacToeMark) {
  if (mode === 'duel') {
    return {
      x: { name: 'Joueur 1', short: 'Joueur 1' },
      o: { name: 'Joueur 2', short: 'Joueur 2' },
    };
  }

  return playerMark === 'X'
    ? {
        x: { name: 'Joueur', short: 'A toi' },
        o: { name: 'IA Max', short: 'IA Max' },
      }
    : {
        x: { name: 'IA Max', short: 'IA Max' },
        o: { name: 'Joueur', short: 'A toi' },
      };
}

function getStatusText(game: TicTacToeState, labels: ReturnType<typeof getLabels>, aiThinking: boolean): string {
  if (aiThinking) {
    return 'IA calcule';
  }

  if (game.status === 'draw') {
    return 'Egalite';
  }

  if (game.status === 'won' && game.winner) {
    const label = game.winner === 'X' ? labels.x.name : labels.o.name;
    return `${label} gagne`;
  }

  const label = game.turn === 'X' ? labels.x.short : labels.o.short;
  return `${label} attaque`;
}

function getEndTone(winner: TicTacToeMark | null, mode: TicTacToeMode, playerMark: TicTacToeMark): 'win' | 'lose' | 'draw' {
  if (!winner || mode === 'duel') {
    return winner ? 'win' : 'draw';
  }

  return winner === playerMark ? 'win' : 'lose';
}

function isValidScore(score: unknown): score is TicTacToeScore {
  if (!score || typeof score !== 'object') {
    return false;
  }

  const candidate = score as Partial<TicTacToeScore>;
  return Number.isInteger(candidate.x) && Number.isInteger(candidate.o) && Number.isInteger(candidate.draws);
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
    borderColor: '#101820',
    backgroundColor: '#101820',
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scanlines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  segmentGroup: {
    flexGrow: 1,
    minWidth: 142,
    gap: 5,
  },
  disabled: {
    opacity: 0.46,
  },
  segmentLabel: {
    color: '#FFE8A3',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  segmentTrack: {
    minHeight: 42,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  segmentButton: {
    flex: 1,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: '#26C4A6',
  },
  segmentText: {
    color: '#101820',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  segmentTextActive: {
    color: '#101820',
  },
  resetButton: {
    minWidth: 88,
    minHeight: 42,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#F95F62',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  resetText: {
    color: '#101820',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  avatarPanel: {
    flex: 1,
    minWidth: 0,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    padding: 8,
    gap: 7,
  },
  avatarActive: {
    backgroundColor: '#FFE8A3',
    borderColor: '#F95F62',
  },
  avatar: {
    width: '100%',
    height: 72,
  },
  avatarCopy: {
    minWidth: 0,
  },
  avatarName: {
    color: '#101820',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  avatarMark: {
    color: '#F95F62',
    fontSize: 20,
    fontWeight: '900',
  },
  avatarScore: {
    color: '#101820',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  roundPanel: {
    width: 92,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#26C4A6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  roundLabel: {
    color: '#101820',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  roundValue: {
    color: '#101820',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  drawsBadge: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E4',
    borderWidth: 2,
    borderColor: '#101820',
    paddingHorizontal: 6,
  },
  drawsText: {
    color: '#101820',
    fontSize: 11,
    fontWeight: '900',
  },
  statusPanel: {
    minHeight: 58,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#101820',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusSubText: {
    color: '#4E5C58',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  endEffect: {
    minHeight: 76,
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  endWin: {
    backgroundColor: '#F6D74A',
  },
  endLose: {
    backgroundColor: '#F95F62',
  },
  endDraw: {
    backgroundColor: '#26C4A6',
  },
  endBurstRow: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBurst: {
    position: 'absolute',
    width: 14,
    height: 168,
    backgroundColor: 'rgba(255, 248, 228, 0.28)',
  },
  endEffectText: {
    color: '#101820',
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  boardShell: {
    alignSelf: 'center',
    position: 'relative',
    padding: '7%',
  },
  boardImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  boardGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cell: {
    width: '31.8%',
    height: '31.8%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPressed: {
    transform: [{ scale: 0.96 }],
  },
  cellImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  markImage: {
    width: '78%',
    height: '78%',
  },
  sparkImage: {
    position: 'absolute',
    width: '62%',
    height: '62%',
    right: '-12%',
    top: '-10%',
  },
  resultBar: {
    minHeight: 80,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 10,
  },
  resultBadge: {
    width: 78,
    height: 58,
  },
  nextButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#F6D74A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  nextText: {
    color: '#101820',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
