export type ConnectFourDisc = 'red' | 'yellow';
export type ConnectFourCell = ConnectFourDisc | null;
export type ConnectFourBoard = ConnectFourCell[][];
export type ConnectFourMode = 'duel' | 'ai';
export type ConnectFourStatus = 'playing' | 'won' | 'draw';
export type ConnectFourSlot = { row: number; col: number };
export type ConnectFourLine = [ConnectFourSlot, ConnectFourSlot, ConnectFourSlot, ConnectFourSlot];

export type ConnectFourState = {
  board: ConnectFourBoard;
  turn: ConnectFourDisc;
  status: ConnectFourStatus;
  winner: ConnectFourDisc | null;
  winningLine: ConnectFourLine | null;
  round: number;
  lastMove: ConnectFourSlot | null;
};

export type ConnectFourScore = {
  red: number;
  yellow: number;
  draws: number;
};

export type ConnectFourSavedState = {
  mode: ConnectFourMode;
  playerDisc: ConnectFourDisc;
  score: ConnectFourScore;
  round: number;
};
