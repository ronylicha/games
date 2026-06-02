import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { BOARD_SIZE, Board, Move, Square, squareKey, squaresEqual } from '@/game/checkers';

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
  ivory: '#F8EFE1',
  ivoryShadow: '#BFAE95',
  red: '#AA2E35',
  redShadow: '#5D141B',
  crown: '#F6C85F',
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
  const [boardSize, setBoardSize] = useState(0);
  const tileSize = boardSize / BOARD_SIZE;

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

  function handleLayout(event: LayoutChangeEvent) {
    setBoardSize(event.nativeEvent.layout.width);
  }

  function handlePress(event: { nativeEvent: { locationX: number; locationY: number } }) {
    if (disabled || boardSize === 0) {
      return;
    }
    const col = Math.floor(event.nativeEvent.locationX / tileSize);
    const row = Math.floor(event.nativeEvent.locationY / tileSize);
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      onSquarePress({ row, col });
    }
  }

  return (
    <View style={styles.boardWrap} onLayout={handleLayout}>
      {boardSize > 0 && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handlePress}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={boardSize} height={boardSize} color={palette.frame} />

            {board.map((row, rowIndex) =>
              row.map((_, colIndex) => {
                const isDark = (rowIndex + colIndex) % 2 === 1;
                return (
                  <Rect
                    key={`tile-${rowIndex}-${colIndex}`}
                    x={colIndex * tileSize}
                    y={rowIndex * tileSize}
                    width={tileSize}
                    height={tileSize}
                    color={isDark ? (rowIndex % 2 ? palette.dark : palette.darkAlt) : palette.light}
                  />
                );
              }),
            )}

            {lastMove?.path.map((square) => (
              <Rect
                key={`last-${squareKey(square)}`}
                x={square.col * tileSize + tileSize * 0.08}
                y={square.row * tileSize + tileSize * 0.08}
                width={tileSize * 0.84}
                height={tileSize * 0.84}
                color="rgba(246, 200, 95, 0.2)"
              />
            ))}

            {aiLastMove && (
              <Rect
                x={aiLastMove.from.col * tileSize + tileSize * 0.1}
                y={aiLastMove.from.row * tileSize + tileSize * 0.1}
                width={tileSize * 0.8}
                height={tileSize * 0.8}
                color="rgba(232, 93, 82, 0.88)"
                style="stroke"
                strokeWidth={Math.max(3, tileSize * 0.055)}
              />
            )}

            {aiLastMove?.path.map((square, index) => (
              <Rect
                key={`ai-last-${index}-${squareKey(square)}`}
                x={square.col * tileSize + tileSize * 0.14}
                y={square.row * tileSize + tileSize * 0.14}
                width={tileSize * 0.72}
                height={tileSize * 0.72}
                color="rgba(232, 93, 82, 0.28)"
              />
            ))}

            {selected && (
              <Rect
                x={selected.col * tileSize + tileSize * 0.08}
                y={selected.row * tileSize + tileSize * 0.08}
                width={tileSize * 0.84}
                height={tileSize * 0.84}
                color={palette.selected}
                style="stroke"
                strokeWidth={Math.max(3, tileSize * 0.06)}
              />
            )}

            {[...targets.keys()].map((key) => {
              const [row, col] = key.split(':').map(Number);
              const isCapture = captureTargets.has(key);
              return (
                <Circle
                  key={`target-${key}`}
                  cx={(col + 0.5) * tileSize}
                  cy={(row + 0.5) * tileSize}
                  r={tileSize * (isCapture ? 0.21 : 0.14)}
                  color={isCapture ? 'rgba(232, 93, 82, 0.82)' : 'rgba(88, 183, 169, 0.78)'}
                />
              );
            })}

            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                if (!piece) {
                  return null;
                }

                const cx = (colIndex + 0.5) * tileSize;
                const cy = (rowIndex + 0.5) * tileSize;
                const isSelected = selected && squaresEqual(selected, { row: rowIndex, col: colIndex });
                const fill = piece.player === 'ivory' ? palette.ivory : palette.red;
                const shadow = piece.player === 'ivory' ? palette.ivoryShadow : palette.redShadow;

                return (
                  <Group key={`piece-${rowIndex}-${colIndex}`}>
                    <Circle cx={cx} cy={cy + tileSize * 0.04} r={tileSize * 0.38} color={shadow} />
                    <Circle cx={cx} cy={cy} r={tileSize * 0.38} color={fill} />
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={tileSize * 0.25}
                      color={piece.player === 'ivory' ? '#FFF8EA' : '#C8464D'}
                      style="stroke"
                      strokeWidth={Math.max(2, tileSize * 0.045)}
                    />
                    {piece.kind === 'king' && (
                      <Group>
                        <Circle cx={cx - tileSize * 0.13} cy={cy - tileSize * 0.02} r={tileSize * 0.055} color={palette.crown} />
                        <Circle cx={cx} cy={cy - tileSize * 0.1} r={tileSize * 0.06} color={palette.crown} />
                        <Circle cx={cx + tileSize * 0.13} cy={cy - tileSize * 0.02} r={tileSize * 0.055} color={palette.crown} />
                        <Rect
                          x={cx - tileSize * 0.18}
                          y={cy + tileSize * 0.06}
                          width={tileSize * 0.36}
                          height={tileSize * 0.065}
                          color={palette.crown}
                        />
                      </Group>
                    )}
                    {isSelected && (
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={tileSize * 0.43}
                        color={palette.selected}
                        style="stroke"
                        strokeWidth={Math.max(2, tileSize * 0.045)}
                      />
                    )}
                  </Group>
                );
              }),
            )}
          </Canvas>
        </Pressable>
      )}
    </View>
  );
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
  },
});
