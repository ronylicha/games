import { Chess, type Move, type Piece, type Square } from 'chess.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ChessMode = 'human' | 'computer';
type ChessLevel = 'facile' | 'normal' | 'difficile';

type SavedChessGame = {
  fen: string;
  mode: ChessMode;
  level: ChessLevel;
  playerColor: Piece['color'];
  lastMove: Move | null;
  lastMoveColor: Piece['color'] | null;
};

const chessStorageKey = 'games:chess:state';

const levelDepth: Record<ChessLevel, number> = {
  facile: 1,
  normal: 2,
  difficile: 3,
};

const pieceValues: Record<Piece['type'], number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

export function ChessGame() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [mode, setMode] = useState<ChessMode>('computer');
  const [level, setLevel] = useState<ChessLevel>('normal');
  const [playerColor, setPlayerColor] = useState<Piece['color']>('w');
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [lastMoveColor, setLastMoveColor] = useState<'w' | 'b' | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = chess.board();
  const aiColor = playerColor === 'w' ? 'b' : 'w';
  const aiThinking = mode === 'computer' && chess.turn() === aiColor && !chess.isGameOver();
  const displayRows = playerColor === 'b' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = playerColor === 'b' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const selectedMoves = useMemo(() => {
    if (!selected) {
      return [];
    }
    return chess.moves({ verbose: true, square: selected });
  }, [chess, selected]);

  useEffect(() => {
    let mounted = true;

    async function loadSavedGame() {
      const stored = await AsyncStorage.getItem(chessStorageKey);
      if (!stored) {
        return;
      }

      const saved = JSON.parse(stored) as SavedChessGame;
      new Chess(saved.fen);
      if (!mounted) {
        return;
      }

      setFen(saved.fen);
      setMode(saved.mode === 'human' ? 'human' : 'computer');
      setLevel(['facile', 'normal', 'difficile'].includes(saved.level) ? saved.level : 'normal');
      setPlayerColor(saved.playerColor === 'b' ? 'b' : 'w');
      setLastMove(saved.lastMove ?? null);
      setLastMoveColor(saved.lastMoveColor === 'b' ? 'b' : saved.lastMoveColor === 'w' ? 'w' : null);
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

    const payload: SavedChessGame = {
      fen,
      mode,
      level,
      playerColor,
      lastMove,
      lastMoveColor,
    };

    AsyncStorage.setItem(chessStorageKey, JSON.stringify(payload)).catch(() => undefined);
  }, [fen, hydrated, lastMove, lastMoveColor, level, mode, playerColor]);

  useEffect(() => {
    if (!aiThinking) {
      return;
    }

    const timeout = setTimeout(() => {
      const current = new Chess(fen);
      const move = chooseChessAiMove(current, level, aiColor);
      if (move) {
        const played = current.move({ from: move.from, to: move.to, promotion: 'q' });
        setFen(current.fen());
        setLastMove(played);
        setLastMoveColor(aiColor);
        setSelected(null);
      }
    }, 420);

    return () => clearTimeout(timeout);
  }, [aiColor, aiThinking, fen, level]);

  function reset(nextMode = mode, nextColor = playerColor) {
    AsyncStorage.removeItem(chessStorageKey).catch(() => undefined);
    const next = new Chess();
    setFen(next.fen());
    setMode(nextMode);
    setPlayerColor(nextColor);
    setSelected(null);
    setLastMove(null);
    setLastMoveColor(null);
  }

  function choosePlayerColor(color: Piece['color']) {
    reset(mode, color);
  }

  function pressSquare(square: Square) {
    if (aiThinking || chess.isGameOver()) {
      return;
    }

    const targetMove = selectedMoves.find((move) => move.to === square);
    if (targetMove) {
      const next = new Chess(fen);
      const played = next.move({ from: targetMove.from, to: targetMove.to, promotion: 'q' });
      setFen(next.fen());
      setLastMove(played);
      setLastMoveColor(played.color);
      setSelected(null);
      return;
    }

    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      setSelected(null);
      return;
    }

    if (mode === 'computer' && piece.color !== playerColor) {
      return;
    }

    const moves = chess.moves({ verbose: true, square });
    setSelected(moves.length > 0 ? square : null);
  }

  const aiLastMove = mode === 'computer' && lastMoveColor === aiColor ? lastMove : null;
  const legalTargets = new Set(selectedMoves.map((move) => move.to));
  const lastSquares = new Set(lastMove ? [lastMove.from, lastMove.to] : []);
  const aiSquares = new Set(aiLastMove ? [aiLastMove.from, aiLastMove.to] : []);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Segment active={mode === 'computer'} label="1 vs IA" onPress={() => reset('computer')} />
        <Segment active={mode === 'human'} label="1 vs 1" onPress={() => reset('human')} />
        <Pressable style={styles.resetButton} onPress={() => reset()}>
          <Text style={styles.resetText}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.levelRow}>
        {(['facile', 'normal', 'difficile'] as ChessLevel[]).map((candidate) => (
          <Pressable
            key={candidate}
            style={[styles.levelButton, level === candidate && styles.levelButtonActive]}
            onPress={() => setLevel(candidate)}>
            <Text style={[styles.levelText, level === candidate && styles.levelTextActive]}>
              {candidate}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.colorRow}>
        <ColorButton active={playerColor === 'w'} label="Jouer blanc" onPress={() => choosePlayerColor('w')} />
        <ColorButton active={playerColor === 'b'} label="Jouer noir" onPress={() => choosePlayerColor('b')} />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{statusText(chess, aiThinking, level, aiColor)}</Text>
      </View>

      <View style={styles.board}>
        {displayRows.map((rowIndex) =>
          displayCols.map((colIndex) => {
            const piece = board[rowIndex][colIndex];
            const square = toSquare(rowIndex, colIndex);
            const isDark = (rowIndex + colIndex) % 2 === 1;
            return (
              <Pressable
                key={square}
                style={[styles.square, isDark ? styles.darkSquare : styles.lightSquare]}
                onPress={() => pressSquare(square)}>
                {lastSquares.has(square) && <View style={styles.lastMove} />}
                {aiSquares.has(square) && <View style={styles.aiMove} />}
                {selected === square && <View style={styles.selected} />}
                {legalTargets.has(square) && <View style={styles.legalMove} />}
                {piece && <PieceView piece={piece} />}
              </Pressable>
            );
          }),
        )}
      </View>
    </View>
  );
}

function PieceView({ piece }: { piece: Piece }) {
  return (
    <Image source={getPieceAsset(piece)} style={styles.pieceImage} contentFit="contain" />
  );
}

function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ColorButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.colorButton, active && styles.colorButtonActive]} onPress={onPress}>
      <Text style={[styles.colorText, active && styles.colorTextActive]}>{label}</Text>
    </Pressable>
  );
}

function chooseChessAiMove(chess: Chess, level: ChessLevel, aiColor: Piece['color']): Move | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return null;
  }

  const depth = levelDepth[level];
  const noise = level === 'facile' ? 80 : level === 'normal' ? 15 : 0;
  return moves
    .map((move) => {
      chess.move({ from: move.from, to: move.to, promotion: 'q' });
      const score = minimax(chess, depth - 1, aiColor, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
      chess.undo();
      return { move, score: score + Math.random() * noise };
    })
    .sort((a, b) => b.score - a.score)[0].move;
}

function minimax(chess: Chess, depth: number, aiColor: Piece['color'], alpha: number, beta: number): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateChess(chess, aiColor);
  }

  const moves = chess.moves({ verbose: true });
  if (chess.turn() === aiColor) {
    let value = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: 'q' });
      value = Math.max(value, minimax(chess, depth - 1, aiColor, alpha, beta));
      chess.undo();
      alpha = Math.max(alpha, value);
      if (alpha >= beta) {
        break;
      }
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: 'q' });
    value = Math.min(value, minimax(chess, depth - 1, aiColor, alpha, beta));
    chess.undo();
    beta = Math.min(beta, value);
    if (alpha >= beta) {
      break;
    }
  }
  return value;
}

function evaluateChess(chess: Chess, aiColor: Piece['color']): number {
  if (chess.isCheckmate()) {
    return chess.turn() === aiColor ? -100_000 : 100_000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) {
        continue;
      }
      const value = pieceValues[piece.type];
      score += piece.color === aiColor ? value : -value;
    }
  }

  const mobility = chess.moves({ verbose: true }).length;
  score += chess.turn() === aiColor ? mobility : -mobility;
  return score;
}

function statusText(chess: Chess, thinking: boolean, level: ChessLevel, aiColor: Piece['color']): string {
  if (thinking) {
    return `L IA ${level} (${aiColor === 'w' ? 'blanc' : 'noir'}) calcule son coup`;
  }
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? 'Noir gagne par mat' : 'Blanc gagne par mat';
  }
  if (chess.isDraw()) {
    return 'Partie nulle';
  }
  if (chess.isCheck()) {
    return `Échec au ${chess.turn() === 'w' ? 'blanc' : 'noir'}`;
  }
  return `Au tour des ${chess.turn() === 'w' ? 'blancs' : 'noirs'}`;
}

function getPieceAsset(piece: Piece): number {
  const color = piece.color === 'w' ? 'white' : 'black';
  const name = pieceName(piece.type);
  if (color === 'white') {
    if (name === 'pawn') return require('@/assets/game/chess/white-pawn.png');
    if (name === 'knight') return require('@/assets/game/chess/white-knight.png');
    if (name === 'bishop') return require('@/assets/game/chess/white-bishop.png');
    if (name === 'rook') return require('@/assets/game/chess/white-rook.png');
    if (name === 'queen') return require('@/assets/game/chess/white-queen.png');
    return require('@/assets/game/chess/white-king.png');
  }

  if (name === 'pawn') return require('@/assets/game/chess/black-pawn.png');
  if (name === 'knight') return require('@/assets/game/chess/black-knight.png');
  if (name === 'bishop') return require('@/assets/game/chess/black-bishop.png');
  if (name === 'rook') return require('@/assets/game/chess/black-rook.png');
  if (name === 'queen') return require('@/assets/game/chess/black-queen.png');
  return require('@/assets/game/chess/black-king.png');
}

function pieceName(type: Piece['type']): 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king' {
  if (type === 'p') return 'pawn';
  if (type === 'n') return 'knight';
  if (type === 'b') return 'bishop';
  if (type === 'r') return 'rook';
  if (type === 'q') return 'queen';
  return 'king';
}

function toSquare(row: number, col: number): Square {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return `${file}${rank}` as Square;
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
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
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  levelButtonActive: {
    backgroundColor: '#47645B',
    borderColor: '#47645B',
  },
  levelText: {
    color: '#34413D',
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  levelTextActive: {
    color: '#FFFFFF',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  colorButtonActive: {
    backgroundColor: '#191A1F',
    borderColor: '#191A1F',
  },
  colorText: {
    color: '#34413D',
    fontWeight: '900',
  },
  colorTextActive: {
    color: '#FFFFFF',
  },
  statusRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2DE',
  },
  statusText: {
    color: '#222B28',
    fontSize: 15,
    fontWeight: '900',
  },
  board: {
    width: '100%',
    maxWidth: 620,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 4,
    borderColor: '#191A1F',
  },
  square: {
    width: '12.5%',
    height: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightSquare: {
    backgroundColor: '#F1D6B1',
  },
  darkSquare: {
    backgroundColor: '#5A5E6C',
  },
  piece: {
    width: '72%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 3,
  },
  whitePiece: {
    backgroundColor: '#F8EFE1',
    borderColor: '#BFAE95',
  },
  blackPiece: {
    backgroundColor: '#191A1F',
    borderColor: '#F8EFE1',
  },
  pieceText: {
    fontSize: 18,
    fontWeight: '900',
  },
  whitePieceText: {
    color: '#191A1F',
  },
  blackPieceText: {
    color: '#F8EFE1',
  },
  pieceImage: {
    width: '96%',
    height: '96%',
    zIndex: 3,
  },
  selected: {
    position: 'absolute',
    inset: '8%',
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#F6C85F',
  },
  lastMove: {
    position: 'absolute',
    inset: '8%',
    borderRadius: 7,
    backgroundColor: 'rgba(246, 200, 95, 0.25)',
  },
  aiMove: {
    position: 'absolute',
    inset: '12%',
    borderRadius: 7,
    borderWidth: 3,
    borderColor: 'rgba(232, 93, 82, 0.95)',
    backgroundColor: 'rgba(232, 93, 82, 0.18)',
  },
  legalMove: {
    position: 'absolute',
    width: '28%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(88, 183, 169, 0.82)',
    zIndex: 2,
  },
});
