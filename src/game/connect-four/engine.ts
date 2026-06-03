import {
  ConnectFourBoard,
  ConnectFourDisc,
  ConnectFourLine,
  ConnectFourScore,
  ConnectFourSlot,
  ConnectFourState,
} from './types';

export const CONNECT_FOUR_ROWS = 6;
export const CONNECT_FOUR_COLS = 7;

export function createConnectFourBoard(): ConnectFourBoard {
  return Array.from({ length: CONNECT_FOUR_ROWS }, () => Array.from({ length: CONNECT_FOUR_COLS }, () => null));
}

export function createConnectFourScore(): ConnectFourScore {
  return {
    red: 0,
    yellow: 0,
    draws: 0,
  };
}

export function createConnectFourState(startingDisc: ConnectFourDisc = 'red', round = 1): ConnectFourState {
  return {
    board: createConnectFourBoard(),
    turn: startingDisc,
    status: 'playing',
    winner: null,
    winningLine: null,
    round,
    lastMove: null,
  };
}

export function getConnectFourOpponent(disc: ConnectFourDisc): ConnectFourDisc {
  return disc === 'red' ? 'yellow' : 'red';
}

export function getConnectFourRoundStarter(round: number): ConnectFourDisc {
  return round % 2 ? 'red' : 'yellow';
}

export function getAvailableConnectFourColumns(board: ConnectFourBoard): number[] {
  return Array.from({ length: CONNECT_FOUR_COLS }, (_, col) => col).filter((col) => !board[0][col]);
}

export function getDropRow(board: ConnectFourBoard, col: number): number | null {
  if (col < 0 || col >= CONNECT_FOUR_COLS || board[0][col]) {
    return null;
  }

  for (let row = CONNECT_FOUR_ROWS - 1; row >= 0; row -= 1) {
    if (!board[row][col]) {
      return row;
    }
  }

  return null;
}

export function dropConnectFourDisc(state: ConnectFourState, col: number): ConnectFourState {
  if (state.status !== 'playing') {
    return state;
  }

  const row = getDropRow(state.board, col);
  if (row === null) {
    return state;
  }

  const board = cloneConnectFourBoard(state.board);
  board[row][col] = state.turn;
  const result = evaluateConnectFourBoard(board);

  return {
    ...state,
    board,
    lastMove: { row, col },
    status: result.status,
    winner: result.winner,
    winningLine: result.winningLine,
    turn: result.status === 'playing' ? getConnectFourOpponent(state.turn) : state.turn,
  };
}

export function evaluateConnectFourBoard(
  board: ConnectFourBoard,
): Pick<ConnectFourState, 'status' | 'winner' | 'winningLine'> {
  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
  ];

  for (let row = 0; row < CONNECT_FOUR_ROWS; row += 1) {
    for (let col = 0; col < CONNECT_FOUR_COLS; col += 1) {
      const disc = board[row][col];
      if (!disc) {
        continue;
      }

      for (const direction of directions) {
        const line = collectLine(row, col, direction.row, direction.col);
        if (line.every((slot) => board[slot.row]?.[slot.col] === disc)) {
          return {
            status: 'won',
            winner: disc,
            winningLine: line,
          };
        }
      }
    }
  }

  if (getAvailableConnectFourColumns(board).length === 0) {
    return {
      status: 'draw',
      winner: null,
      winningLine: null,
    };
  }

  return {
    status: 'playing',
    winner: null,
    winningLine: null,
  };
}

export function scoreConnectFourRound(score: ConnectFourScore, winner: ConnectFourDisc | null): ConnectFourScore {
  if (winner === 'red') {
    return { ...score, red: score.red + 1 };
  }

  if (winner === 'yellow') {
    return { ...score, yellow: score.yellow + 1 };
  }

  return { ...score, draws: score.draws + 1 };
}

export function cloneConnectFourBoard(board: ConnectFourBoard): ConnectFourBoard {
  return board.map((row) => row.slice());
}

function collectLine(row: number, col: number, rowStep: number, colStep: number): ConnectFourLine {
  return [0, 1, 2, 3].map((offset) => ({
    row: row + rowStep * offset,
    col: col + colStep * offset,
  })) as ConnectFourLine;
}

export function slotKey(slot: ConnectFourSlot): string {
  return `${slot.row}:${slot.col}`;
}
