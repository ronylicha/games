import {
  cloneConnectFourBoard,
  CONNECT_FOUR_COLS,
  CONNECT_FOUR_ROWS,
  evaluateConnectFourBoard,
  getAvailableConnectFourColumns,
  getConnectFourOpponent,
  getDropRow,
} from './engine';
import { ConnectFourBoard, ConnectFourDisc } from './types';

const columnPriority = [3, 2, 4, 1, 5, 0, 6];

export function chooseConnectFourMove(board: ConnectFourBoard, aiDisc: ConnectFourDisc): number | null {
  const available = orderedColumns(getAvailableConnectFourColumns(board));

  if (!available.length) {
    return null;
  }

  const winningMove = findImmediateWinningMove(board, aiDisc);
  if (winningMove !== null) {
    return winningMove;
  }

  const blockingMove = findImmediateWinningMove(board, getConnectFourOpponent(aiDisc));
  if (blockingMove !== null) {
    return blockingMove;
  }

  let bestColumn = available[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  const depth = available.length > 5 ? 4 : 5;

  for (const col of available) {
    const nextBoard = dropDiscOnBoard(board, col, aiDisc);
    if (!nextBoard) {
      continue;
    }

    const score = minimax(nextBoard, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false, aiDisc);
    if (score > bestScore) {
      bestScore = score;
      bestColumn = col;
    }
  }

  return bestColumn;
}

function minimax(
  board: ConnectFourBoard,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiDisc: ConnectFourDisc,
): number {
  const result = evaluateConnectFourBoard(board);
  const opponent = getConnectFourOpponent(aiDisc);

  if (result.status === 'won') {
    return result.winner === aiDisc ? 1_000_000 + depth : -1_000_000 - depth;
  }

  if (result.status === 'draw') {
    return 0;
  }

  if (depth === 0) {
    return evaluatePosition(board, aiDisc);
  }

  const columns = orderedColumns(getAvailableConnectFourColumns(board));

  if (maximizing) {
    let value = Number.NEGATIVE_INFINITY;
    for (const col of columns) {
      const nextBoard = dropDiscOnBoard(board, col, aiDisc);
      if (!nextBoard) {
        continue;
      }
      value = Math.max(value, minimax(nextBoard, depth - 1, alpha, beta, false, aiDisc));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) {
        break;
      }
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  for (const col of columns) {
    const nextBoard = dropDiscOnBoard(board, col, opponent);
    if (!nextBoard) {
      continue;
    }
    value = Math.min(value, minimax(nextBoard, depth - 1, alpha, beta, true, aiDisc));
    beta = Math.min(beta, value);
    if (alpha >= beta) {
      break;
    }
  }
  return value;
}

function findImmediateWinningMove(board: ConnectFourBoard, disc: ConnectFourDisc): number | null {
  for (const col of orderedColumns(getAvailableConnectFourColumns(board))) {
    const nextBoard = dropDiscOnBoard(board, col, disc);
    if (nextBoard && evaluateConnectFourBoard(nextBoard).winner === disc) {
      return col;
    }
  }

  return null;
}

function evaluatePosition(board: ConnectFourBoard, aiDisc: ConnectFourDisc): number {
  const opponent = getConnectFourOpponent(aiDisc);
  let score = 0;

  for (let row = 0; row < CONNECT_FOUR_ROWS; row += 1) {
    if (board[row][3] === aiDisc) {
      score += 6;
    }
  }

  const windows = collectWindows(board);
  for (const window of windows) {
    score += scoreWindow(window, aiDisc);
    score -= scoreWindow(window, opponent) * 1.08;
  }

  return score;
}

function scoreWindow(window: (ConnectFourDisc | null)[], disc: ConnectFourDisc): number {
  const discCount = window.filter((cell) => cell === disc).length;
  const emptyCount = window.filter((cell) => cell === null).length;

  if (discCount === 4) {
    return 100_000;
  }

  if (discCount === 3 && emptyCount === 1) {
    return 120;
  }

  if (discCount === 2 && emptyCount === 2) {
    return 18;
  }

  if (discCount === 1 && emptyCount === 3) {
    return 2;
  }

  return 0;
}

function collectWindows(board: ConnectFourBoard): (ConnectFourDisc | null)[][] {
  const windows: (ConnectFourDisc | null)[][] = [];

  for (let row = 0; row < CONNECT_FOUR_ROWS; row += 1) {
    for (let col = 0; col <= CONNECT_FOUR_COLS - 4; col += 1) {
      windows.push([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
    }
  }

  for (let col = 0; col < CONNECT_FOUR_COLS; col += 1) {
    for (let row = 0; row <= CONNECT_FOUR_ROWS - 4; row += 1) {
      windows.push([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
    }
  }

  for (let row = 0; row <= CONNECT_FOUR_ROWS - 4; row += 1) {
    for (let col = 0; col <= CONNECT_FOUR_COLS - 4; col += 1) {
      windows.push([board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]);
    }
  }

  for (let row = 0; row <= CONNECT_FOUR_ROWS - 4; row += 1) {
    for (let col = 3; col < CONNECT_FOUR_COLS; col += 1) {
      windows.push([board[row][col], board[row + 1][col - 1], board[row + 2][col - 2], board[row + 3][col - 3]]);
    }
  }

  return windows;
}

function dropDiscOnBoard(board: ConnectFourBoard, col: number, disc: ConnectFourDisc): ConnectFourBoard | null {
  const row = getDropRow(board, col);
  if (row === null) {
    return null;
  }

  const nextBoard = cloneConnectFourBoard(board);
  nextBoard[row][col] = disc;
  return nextBoard;
}

function orderedColumns(columns: number[]): number[] {
  return columnPriority.filter((col) => columns.includes(col));
}
