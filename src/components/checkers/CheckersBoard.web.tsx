import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOARD_SIZE, Board, Move, Piece, Square, squareKey, squaresEqual } from '@/game/checkers';

type CheckersBoardProps = {
  board: Board;
  aiLastMove: Move | null;
  legalMoves: Move[];
  selected: Square | null;
  lastMove: Move | null;
  disabled?: boolean;
  onSquarePress: (square: Square) => void;
};

const palette = {
  frame: '#191A1F',
  light: '#E9D6B7',
  dark: '#47645B',
  darkAlt: '#3E584F',
  selected: '#F6C85F',
  target: '#58B7A9',
  capture: '#E85D52',
};

export function CheckersBoard({
  board,
  aiLastMove,
  legalMoves,
  selected,
  lastMove,
  disabled,
  onSquarePress,
}: CheckersBoardProps) {
  const targets = useMemo(() => {
    const map = new Map<string, Move>();
    for (const move of legalMoves) {
      map.set(squareKey(move.to), move);
    }
    return map;
  }, [legalMoves]);

  const captureTargets = useMemo(() => {
    const keys = new Set<string>();
    for (const move of legalMoves) {
      if (move.captures.length > 0) {
        keys.add(squareKey(move.to));
      }
    }
    return keys;
  }, [legalMoves]);

  const lastMoveKeys = useMemo(() => {
    return new Set(lastMove?.path.map(squareKey) ?? []);
  }, [lastMove]);

  const aiMoveKeys = useMemo(() => {
    return new Set(aiLastMove ? [aiLastMove.from, ...aiLastMove.path].map(squareKey) : []);
  }, [aiLastMove]);

  return (
    <View style={styles.boardWrap}>
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const square = { row: rowIndex, col: colIndex };
          const key = squareKey(square);
          const isDark = (rowIndex + colIndex) % 2 === 1;
          const isSelected = selected && squaresEqual(selected, square);
          const isTarget = targets.has(key);
          const isCaptureTarget = captureTargets.has(key);
          const isLastMove = lastMoveKeys.has(key);
          const isAiMove = aiMoveKeys.has(key);
          const isAiOrigin = aiLastMove && squaresEqual(aiLastMove.from, square);

          return (
            <Pressable
              key={key}
              disabled={disabled}
              style={[
                styles.tile,
                isDark ? (rowIndex % 2 ? styles.darkTile : styles.darkAltTile) : styles.lightTile,
              ]}
              onPress={() => onSquarePress(square)}>
              {isLastMove && <View style={styles.lastMove} />}
              {isAiMove && <View style={[styles.aiLastMove, isAiOrigin && styles.aiOrigin]} />}
              {isSelected && <View style={styles.selected} />}
              {isTarget && (
                <View style={[styles.target, isCaptureTarget ? styles.captureTarget : styles.quietTarget]} />
              )}
              {piece && <PieceView piece={piece} selected={Boolean(isSelected)} />}
            </Pressable>
          );
        }),
      )}
    </View>
  );
}

function PieceView({ piece, selected }: { piece: Piece; selected: boolean }) {
  return (
    <View style={[styles.pieceWrap, selected && styles.pieceSelected]}>
      <Image source={getPieceAsset(piece)} style={styles.pieceImage} contentFit="contain" />
    </View>
  );
}

function getPieceAsset(piece: Piece): number {
  if (piece.player === 'ivory') {
    return piece.kind === 'king'
      ? require('@/assets/game/checkers/ivory-king.png')
      : require('@/assets/game/checkers/ivory-man.png');
  }

  return piece.kind === 'king'
    ? require('@/assets/game/checkers/red-king.png')
    : require('@/assets/game/checkers/red-man.png');
}

const styles = StyleSheet.create({
  boardWrap: {
    width: '100%',
    maxWidth: 560,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.frame,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 4,
    borderColor: palette.frame,
  },
  tile: {
    width: `${100 / BOARD_SIZE}%`,
    height: `${100 / BOARD_SIZE}%`,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightTile: {
    backgroundColor: palette.light,
  },
  darkTile: {
    backgroundColor: palette.dark,
  },
  darkAltTile: {
    backgroundColor: palette.darkAlt,
  },
  selected: {
    position: 'absolute',
    inset: '8%',
    borderWidth: 3,
    borderColor: palette.selected,
    borderRadius: 6,
  },
  lastMove: {
    position: 'absolute',
    inset: '8%',
    backgroundColor: 'rgba(246, 200, 95, 0.2)',
    borderRadius: 6,
  },
  aiLastMove: {
    position: 'absolute',
    inset: '14%',
    backgroundColor: 'rgba(232, 93, 82, 0.28)',
    borderRadius: 6,
  },
  aiOrigin: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'rgba(232, 93, 82, 0.88)',
  },
  target: {
    position: 'absolute',
    width: '32%',
    aspectRatio: 1,
    borderRadius: 999,
    zIndex: 2,
  },
  quietTarget: {
    backgroundColor: 'rgba(88, 183, 169, 0.78)',
  },
  captureTarget: {
    width: '42%',
    backgroundColor: 'rgba(232, 93, 82, 0.82)',
  },
  pieceWrap: {
    width: '88%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  pieceSelected: {
    borderWidth: 2,
    borderColor: palette.selected,
    borderRadius: 999,
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
});
