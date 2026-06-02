import { BOARD_SIZE, Board, GameState, Move, Piece, Player, Square, opponent } from './types';

const DIAGONALS = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const MAN_MOVE_DIRECTION: Record<Player, number> = {
  ivory: -1,
  red: 1,
};

export function createInitialBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col): Piece | null => {
      if (!isPlayableSquare({ row, col })) {
        return null;
      }
      if (row < 4) {
        return { player: 'red', kind: 'man' };
      }
      if (row > 5) {
        return { player: 'ivory', kind: 'man' };
      }
      return null;
    }),
  );
}

export function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'ivory',
    status: 'playing',
    movesWithoutCapture: 0,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function isPlayableSquare(square: Square): boolean {
  return isInside(square) && (square.row + square.col) % 2 === 1;
}

export function isInside(square: Square): boolean {
  return square.row >= 0 && square.row < BOARD_SIZE && square.col >= 0 && square.col < BOARD_SIZE;
}

export function squareKey(square: Square): string {
  return `${square.row}:${square.col}`;
}

export function squaresEqual(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col;
}

export function getLegalMoves(board: Board, player: Player): Move[] {
  const captures: Move[] = [];
  const quietMoves: Move[] = [];

  forEachPiece(board, player, (piece, from) => {
    captures.push(...getCaptureMoves(board, piece, from));
    quietMoves.push(...getQuietMoves(board, piece, from));
  });

  if (captures.length === 0) {
    return quietMoves;
  }

  const maxCaptures = Math.max(...captures.map((move) => move.captures.length));
  return captures.filter((move) => move.captures.length === maxCaptures);
}

export function applyMove(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board);
  const piece = board[move.from.row][move.from.col];

  if (!piece) {
    return state;
  }

  board[move.from.row][move.from.col] = null;
  for (const capture of move.captures) {
    board[capture.row][capture.col] = null;
  }

  const promoted = shouldPromote(piece, move.to);
  board[move.to.row][move.to.col] = promoted ? { ...piece, kind: 'king' } : piece;

  const nextTurn = opponent(state.turn);
  const nextMoves = getLegalMoves(board, nextTurn);
  const status =
    nextMoves.length === 0
      ? state.turn === 'ivory'
        ? 'ivory-won'
        : 'red-won'
      : state.movesWithoutCapture >= 79 && move.captures.length === 0
        ? 'draw'
        : 'playing';

  return {
    board,
    turn: nextTurn,
    status,
    movesWithoutCapture: move.captures.length > 0 ? 0 : state.movesWithoutCapture + 1,
  };
}

export function countPieces(board: Board, player: Player): number {
  let count = 0;
  forEachPiece(board, player, () => {
    count += 1;
  });
  return count;
}

export function getPieceMoves(board: Board, square: Square, turn: Player): Move[] {
  const piece = board[square.row]?.[square.col];
  if (!piece || piece.player !== turn) {
    return [];
  }
  return getLegalMoves(board, turn).filter((move) => squaresEqual(move.from, square));
}

function getQuietMoves(board: Board, piece: Piece, from: Square): Move[] {
  if (piece.kind === 'man') {
    const direction = MAN_MOVE_DIRECTION[piece.player];
    return [
      { row: from.row + direction, col: from.col - 1 },
      { row: from.row + direction, col: from.col + 1 },
    ]
      .filter((to) => isPlayableSquare(to) && board[to.row][to.col] === null)
      .map((to) => ({ from, to, path: [to], captures: [] }));
  }

  const moves: Move[] = [];
  for (const diagonal of DIAGONALS) {
    let to = { row: from.row + diagonal.row, col: from.col + diagonal.col };
    while (isPlayableSquare(to) && board[to.row][to.col] === null) {
      moves.push({ from, to, path: [to], captures: [] });
      to = { row: to.row + diagonal.row, col: to.col + diagonal.col };
    }
  }
  return moves;
}

function getCaptureMoves(board: Board, piece: Piece, from: Square): Move[] {
  const results = collectCaptures(board, piece, from, from, [], [], new Set<string>());
  return results.filter((move) => move.captures.length > 0);
}

function collectCaptures(
  board: Board,
  piece: Piece,
  origin: Square,
  current: Square,
  path: Square[],
  captures: Square[],
  capturedKeys: Set<string>,
): Move[] {
  const nextCaptures =
    piece.kind === 'king'
      ? findKingCaptureSteps(board, piece.player, current, capturedKeys)
      : findManCaptureSteps(board, piece.player, current, capturedKeys);

  if (nextCaptures.length === 0) {
    return captures.length > 0 ? [{ from: origin, to: current, path, captures }] : [];
  }

  const moves: Move[] = [];
  for (const step of nextCaptures) {
    const nextBoard = cloneBoard(board);
    nextBoard[current.row][current.col] = null;
    nextBoard[step.capture.row][step.capture.col] = null;
    nextBoard[step.to.row][step.to.col] = piece;

    const nextCapturedKeys = new Set(capturedKeys);
    nextCapturedKeys.add(squareKey(step.capture));
    moves.push(
      ...collectCaptures(
        nextBoard,
        piece,
        origin,
        step.to,
        [...path, step.to],
        [...captures, step.capture],
        nextCapturedKeys,
      ),
    );
  }
  return moves;
}

function findManCaptureSteps(
  board: Board,
  player: Player,
  from: Square,
  capturedKeys: Set<string>,
): { to: Square; capture: Square }[] {
  const steps: { to: Square; capture: Square }[] = [];
  for (const diagonal of DIAGONALS) {
    const capture = { row: from.row + diagonal.row, col: from.col + diagonal.col };
    const to = { row: from.row + diagonal.row * 2, col: from.col + diagonal.col * 2 };
    const capturedPiece = board[capture.row]?.[capture.col];
    if (
      isPlayableSquare(to) &&
      capturedPiece?.player === opponent(player) &&
      !capturedKeys.has(squareKey(capture)) &&
      board[to.row][to.col] === null
    ) {
      steps.push({ to, capture });
    }
  }
  return steps;
}

function findKingCaptureSteps(
  board: Board,
  player: Player,
  from: Square,
  capturedKeys: Set<string>,
): { to: Square; capture: Square }[] {
  const steps: { to: Square; capture: Square }[] = [];

  for (const diagonal of DIAGONALS) {
    let scan = { row: from.row + diagonal.row, col: from.col + diagonal.col };
    let capture: Square | null = null;

    while (isPlayableSquare(scan)) {
      const piece = board[scan.row][scan.col];
      if (!piece) {
        if (capture) {
          steps.push({ to: scan, capture });
        }
      } else if (piece.player === player || capture || capturedKeys.has(squareKey(scan))) {
        break;
      } else {
        capture = scan;
      }
      scan = { row: scan.row + diagonal.row, col: scan.col + diagonal.col };
    }
  }

  return steps;
}

function shouldPromote(piece: Piece, to: Square): boolean {
  if (piece.kind === 'king') {
    return false;
  }
  return (piece.player === 'ivory' && to.row === 0) || (piece.player === 'red' && to.row === 9);
}

function forEachPiece(
  board: Board,
  player: Player,
  callback: (piece: Piece, square: Square) => void,
): void {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col];
      if (piece?.player === player) {
        callback(piece, { row, col });
      }
    }
  }
}
