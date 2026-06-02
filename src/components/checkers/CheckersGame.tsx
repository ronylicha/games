import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckersBoard } from './CheckersBoard';

import {
  GameMode,
  GameState,
  Move,
  Player,
  Square,
  applyMove,
  chooseComputerMove,
  countPieces,
  createInitialState,
  getLegalMoves,
  getPieceMoves,
  squaresEqual,
} from '@/game/checkers';

type CheckersGameProps = {
  compact?: boolean;
};

const playerLabels: Record<Player, string> = {
  ivory: 'Ivoire',
  red: 'Rouge',
};

type SavedCheckersGame = {
  state: GameState;
  mode: GameMode;
  playerColor: Player;
  lastMove: Move | null;
  lastMovePlayer: Player | null;
};

const checkersStorageKey = 'games:checkers:state';

export function CheckersGame({ compact = false }: CheckersGameProps) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [mode, setMode] = useState<GameMode>('computer');
  const [playerColor, setPlayerColor] = useState<Player>('ivory');
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [lastMovePlayer, setLastMovePlayer] = useState<Player | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const allMoves = useMemo(() => getLegalMoves(state.board, state.turn), [state.board, state.turn]);
  const selectedMoves = useMemo(
    () => (selected ? getPieceMoves(state.board, selected, state.turn) : []),
    [selected, state.board, state.turn],
  );
  const aiPlayer: Player = playerColor === 'ivory' ? 'red' : 'ivory';
  const isComputerTurn = mode === 'computer' && state.turn === aiPlayer && state.status === 'playing';

  useEffect(() => {
    let mounted = true;

    async function loadSavedGame() {
      const stored = await AsyncStorage.getItem(checkersStorageKey);
      if (!stored) {
        return;
      }

      const saved = JSON.parse(stored) as SavedCheckersGame;
      if (!mounted) {
        return;
      }

      setState(saved.state ?? createInitialState());
      setMode(saved.mode === 'human' ? 'human' : 'computer');
      setPlayerColor(saved.playerColor === 'red' ? 'red' : 'ivory');
      setLastMove(saved.lastMove ?? null);
      setLastMovePlayer(saved.lastMovePlayer === 'red' ? 'red' : saved.lastMovePlayer === 'ivory' ? 'ivory' : null);
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

    const payload: SavedCheckersGame = {
      state,
      mode,
      playerColor,
      lastMove,
      lastMovePlayer,
    };

    AsyncStorage.setItem(checkersStorageKey, JSON.stringify(payload)).catch(() => undefined);
  }, [hydrated, lastMove, lastMovePlayer, mode, playerColor, state]);

  useEffect(() => {
    if (!isComputerTurn) {
      return;
    }

    const timeout = setTimeout(() => {
      const move = chooseComputerMove(state, aiPlayer, 4);
      if (move) {
        setState((current) => applyMove(current, move));
        setLastMove(move);
        setLastMovePlayer(aiPlayer);
      }
      setSelected(null);
    }, 420);

    return () => clearTimeout(timeout);
  }, [aiPlayer, isComputerTurn, state]);

  function reset(nextMode = mode, nextColor = playerColor) {
    AsyncStorage.removeItem(checkersStorageKey).catch(() => undefined);
    setMode(nextMode);
    setPlayerColor(nextColor);
    setState(createInitialState());
    setSelected(null);
    setLastMove(null);
    setLastMovePlayer(null);
  }

  function choosePlayerColor(color: Player) {
    reset(mode, color);
  }

  function handleSquarePress(square: Square) {
    if (state.status !== 'playing' || isComputerTurn) {
      return;
    }

    const tappedMove = selectedMoves.find((move) => squaresEqual(move.to, square));
    if (tappedMove) {
      setState((current) => applyMove(current, tappedMove));
      setLastMove(tappedMove);
      setLastMovePlayer(state.turn);
      setSelected(null);
      return;
    }

    const piece = state.board[square.row]?.[square.col];
    if (piece?.player === state.turn) {
      const pieceMoves = allMoves.filter((move) => squaresEqual(move.from, square));
      setSelected(pieceMoves.length > 0 ? square : null);
      return;
    }

    setSelected(null);
  }

  const statusText = getStatusText(state, mode, isComputerTurn, aiPlayer);
  const captureRequired = allMoves.some((move) => move.captures.length > 0);
  const aiLastMove = mode === 'computer' && lastMovePlayer === aiPlayer ? lastMove : null;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Image
            source={require('@/assets/game/checkers/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.eyebrow}>Collection de jeux</Text>
            <Text style={styles.title}>Dames</Text>
          </View>
        </View>

        <View style={styles.scorePills}>
          <ScorePill asset={require('@/assets/game/checkers/ivory-man.png')} label="Ivoire" value={countPieces(state.board, 'ivory')} />
          <ScorePill asset={require('@/assets/game/checkers/red-man.png')} label="Rouge" value={countPieces(state.board, 'red')} />
        </View>
      </View>

      <View style={styles.modeRow}>
        <SegmentButton active={mode === 'computer'} label="1 vs IA" onPress={() => reset('computer')} />
        <SegmentButton active={mode === 'human'} label="1 vs 1" onPress={() => reset('human')} />
        <Pressable style={styles.resetButton} onPress={() => reset()}>
          <Text style={styles.resetText}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.colorRow}>
        <SegmentButton active={playerColor === 'ivory'} label="Jouer ivoire" onPress={() => choosePlayerColor('ivory')} />
        <SegmentButton active={playerColor === 'red'} label="Jouer rouge" onPress={() => choosePlayerColor('red')} />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.turnDot, state.turn === 'ivory' ? styles.ivoryDot : styles.redDot]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <CheckersBoard
        board={state.board}
        aiLastMove={aiLastMove}
        disabled={isComputerTurn}
        lastMove={lastMove}
        legalMoves={selectedMoves}
        selected={selected}
        onSquarePress={handleSquarePress}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {captureRequired ? 'Prise obligatoire : choisis une destination rouge.' : 'Sélectionne un pion, puis une destination verte.'}
        </Text>
        <Text style={styles.footerText}>
          Règles 10x10 avec dames longues, promotions et séquences de prises maximales.
        </Text>
      </View>
    </View>
  );
}

function ScorePill({
  asset,
  label,
  value,
}: {
  asset: number;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.scorePill}>
      <Image source={asset} style={styles.scoreAsset} contentFit="contain" />
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function getStatusText(state: GameState, mode: GameMode, thinking: boolean, aiPlayer: Player): string {
  if (thinking) {
    return `L IA (${playerLabels[aiPlayer]}) calcule son coup`;
  }
  if (state.status === 'draw') {
    return 'Partie nulle';
  }
  if (state.status === 'ivory-won') {
    return 'Ivoire gagne';
  }
  if (state.status === 'red-won') {
    return mode === 'computer' ? 'L IA gagne' : 'Rouge gagne';
  }
  const opponentLabel = mode === 'computer' && state.turn === aiPlayer ? 'IA' : playerLabels[state.turn];
  return `Au tour de ${opponentLabel}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  compactContainer: {
    maxWidth: 680,
    alignSelf: 'center',
  },
  header: {
    gap: 14,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 56,
    height: 56,
  },
  eyebrow: {
    color: '#5D6D66',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#191A1F',
    fontSize: 34,
    fontWeight: '900',
  },
  scorePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scorePill: {
    minWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5EBDD',
    borderWidth: 1,
    borderColor: '#E5D2B6',
  },
  scoreAsset: {
    width: 28,
    height: 28,
  },
  scoreLabel: {
    flex: 1,
    color: '#3E4743',
    fontSize: 13,
    fontWeight: '700',
  },
  scoreValue: {
    color: '#191A1F',
    fontSize: 16,
    fontWeight: '900',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F0',
    borderWidth: 1,
    borderColor: '#CFDAD4',
  },
  segmentButtonActive: {
    backgroundColor: '#22342F',
    borderColor: '#22342F',
  },
  segmentText: {
    color: '#34413D',
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D52',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statusRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  turnDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#191A1F',
  },
  ivoryDot: {
    backgroundColor: '#F8EFE1',
  },
  redDot: {
    backgroundColor: '#AA2E35',
  },
  statusText: {
    flex: 1,
    color: '#222B28',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    gap: 4,
  },
  footerText: {
    color: '#53635D',
    fontSize: 13,
    lineHeight: 18,
  },
});
