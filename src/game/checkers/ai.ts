import { applyMove, countPieces, getLegalMoves, isPlayableSquare } from './engine';
import { BOARD_SIZE, Board, GameState, Move, Player, opponent } from './types';

const MAX_SCORE = 100_000;

export function chooseComputerMove(state: GameState, player: Player, depth = 4): Move | null {
  const moves = getLegalMoves(state.board, player);
  if (moves.length === 0) {
    return null;
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: Move[] = [];

  for (const move of orderMoves(moves)) {
    const nextState = applyMove({ ...state, turn: player }, move);
    const score = minimax(nextState, depth - 1, player, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(
  state: GameState,
  depth: number,
  maximizingPlayer: Player,
  alpha: number,
  beta: number,
): number {
  if (state.status !== 'playing' || depth === 0) {
    return evaluateState(state, maximizingPlayer);
  }

  const moves = orderMoves(getLegalMoves(state.board, state.turn));
  if (moves.length === 0) {
    return state.turn === maximizingPlayer ? -MAX_SCORE : MAX_SCORE;
  }

  if (state.turn === maximizingPlayer) {
    let value = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      value = Math.max(value, minimax(applyMove(state, move), depth - 1, maximizingPlayer, alpha, beta));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) {
        break;
      }
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    value = Math.min(value, minimax(applyMove(state, move), depth - 1, maximizingPlayer, alpha, beta));
    beta = Math.min(beta, value);
    if (alpha >= beta) {
      break;
    }
  }
  return value;
}

function evaluateState(state: GameState, player: Player): number {
  if (state.status === `${player}-won`) {
    return MAX_SCORE;
  }
  if (state.status === `${opponent(player)}-won`) {
    return -MAX_SCORE;
  }
  if (state.status === 'draw') {
    return 0;
  }

  return evaluateBoard(state.board, player) - evaluateBoard(state.board, opponent(player));
}

function evaluateBoard(board: Board, player: Player): number {
  let score = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (piece?.player !== player) {
        continue;
      }

      const advancement = player === 'ivory' ? BOARD_SIZE - 1 - row : row;
      const centerDistance = Math.abs(row - 4.5) + Math.abs(col - 4.5);
      score += piece.kind === 'king' ? 175 : 100 + advancement * 4;
      score += Math.max(0, 12 - centerDistance * 2);
      score += isProtected(board, player, row, col) ? 8 : 0;
    }
  }

  score += getLegalMoves(board, player).length * 2;
  score += countPieces(board, player) * 4;
  return score;
}

function isProtected(board: Board, player: Player, row: number, col: number): boolean {
  const backDirection = player === 'ivory' ? 1 : -1;
  return [-1, 1].some((colDelta) => {
    const square = { row: row + backDirection, col: col + colDelta };
    return isPlayableSquare(square) && board[square.row][square.col]?.player === player;
  });
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => b.captures.length - a.captures.length);
}
