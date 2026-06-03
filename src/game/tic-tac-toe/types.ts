export type TicTacToeMark = 'X' | 'O';
export type TicTacToeCell = TicTacToeMark | null;
export type TicTacToeBoard = TicTacToeCell[];
export type TicTacToeMode = 'duel' | 'ai';
export type TicTacToeStatus = 'playing' | 'won' | 'draw';
export type TicTacToeLine = [number, number, number];

export type TicTacToeState = {
  board: TicTacToeBoard;
  turn: TicTacToeMark;
  status: TicTacToeStatus;
  winner: TicTacToeMark | null;
  winningLine: TicTacToeLine | null;
  round: number;
  lastMove: number | null;
};

export type TicTacToeScore = {
  x: number;
  o: number;
  draws: number;
};

export type TicTacToeSavedState = {
  mode: TicTacToeMode;
  playerMark: TicTacToeMark;
  score: TicTacToeScore;
  round: number;
};
