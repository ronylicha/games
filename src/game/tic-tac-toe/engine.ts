import { TicTacToeBoard, TicTacToeLine, TicTacToeMark, TicTacToeScore, TicTacToeState } from './types';

export const ticTacToeLines: TicTacToeLine[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createTicTacToeBoard(): TicTacToeBoard {
  return Array.from({ length: 9 }, () => null);
}

export function createTicTacToeScore(): TicTacToeScore {
  return {
    x: 0,
    o: 0,
    draws: 0,
  };
}

export function createTicTacToeState(startingMark: TicTacToeMark = 'X', round = 1): TicTacToeState {
  return {
    board: createTicTacToeBoard(),
    turn: startingMark,
    status: 'playing',
    winner: null,
    winningLine: null,
    round,
    lastMove: null,
  };
}

export function getOpponentMark(mark: TicTacToeMark): TicTacToeMark {
  return mark === 'X' ? 'O' : 'X';
}

export function evaluateTicTacToeBoard(board: TicTacToeBoard): Pick<TicTacToeState, 'status' | 'winner' | 'winningLine'> {
  for (const line of ticTacToeLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        status: 'won',
        winner: board[a],
        winningLine: line,
      };
    }
  }

  if (board.every(Boolean)) {
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

export function playTicTacToeMove(state: TicTacToeState, index: number): TicTacToeState {
  if (state.status !== 'playing' || state.board[index] || index < 0 || index > 8) {
    return state;
  }

  const board = state.board.slice();
  board[index] = state.turn;
  const result = evaluateTicTacToeBoard(board);

  return {
    ...state,
    board,
    lastMove: index,
    status: result.status,
    winner: result.winner,
    winningLine: result.winningLine,
    turn: result.status === 'playing' ? getOpponentMark(state.turn) : state.turn,
  };
}

export function scoreTicTacToeRound(score: TicTacToeScore, winner: TicTacToeMark | null): TicTacToeScore {
  if (winner === 'X') {
    return { ...score, x: score.x + 1 };
  }

  if (winner === 'O') {
    return { ...score, o: score.o + 1 };
  }

  return { ...score, draws: score.draws + 1 };
}

export function getRoundStarter(round: number): TicTacToeMark {
  return round % 2 ? 'X' : 'O';
}
