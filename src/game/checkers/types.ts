export const BOARD_SIZE = 10;

export type Player = 'ivory' | 'red';
export type PieceKind = 'man' | 'king';

export type Piece = {
  player: Player;
  kind: PieceKind;
};

export type Square = {
  row: number;
  col: number;
};

export type Board = (Piece | null)[][];

export type Move = {
  from: Square;
  to: Square;
  path: Square[];
  captures: Square[];
};

export type GameStatus = 'playing' | 'ivory-won' | 'red-won' | 'draw';

export type GameState = {
  board: Board;
  turn: Player;
  status: GameStatus;
  movesWithoutCapture: number;
};

export type GameMode = 'human' | 'computer';

export const PLAYERS: Player[] = ['ivory', 'red'];

export function opponent(player: Player): Player {
  return player === 'ivory' ? 'red' : 'ivory';
}
