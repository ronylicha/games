import { evaluateTicTacToeBoard, getOpponentMark } from './engine';
import { TicTacToeBoard, TicTacToeMark } from './types';

const movePriority = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export function chooseUnbeatableMove(board: TicTacToeBoard, aiMark: TicTacToeMark): number | null {
  const emptyMoves = getEmptyMoves(board);

  if (!emptyMoves.length) {
    return null;
  }

  let bestMove = emptyMoves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of orderedMoves(emptyMoves)) {
    const nextBoard = board.slice();
    nextBoard[move] = aiMark;
    const score = minimax(nextBoard, getOpponentMark(aiMark), aiMark, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(board: TicTacToeBoard, turn: TicTacToeMark, aiMark: TicTacToeMark, depth: number): number {
  const result = evaluateTicTacToeBoard(board);

  if (result.status === 'won') {
    return result.winner === aiMark ? 10 - depth : depth - 10;
  }

  if (result.status === 'draw') {
    return 0;
  }

  const emptyMoves = orderedMoves(getEmptyMoves(board));
  const isAiTurn = turn === aiMark;
  let bestScore = isAiTurn ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of emptyMoves) {
    const nextBoard = board.slice();
    nextBoard[move] = turn;
    const score = minimax(nextBoard, getOpponentMark(turn), aiMark, depth + 1);

    bestScore = isAiTurn ? Math.max(bestScore, score) : Math.min(bestScore, score);
  }

  return bestScore;
}

function getEmptyMoves(board: TicTacToeBoard): number[] {
  return board.flatMap((cell, index) => (cell ? [] : [index]));
}

function orderedMoves(moves: number[]): number[] {
  return movePriority.filter((move) => moves.includes(move));
}
