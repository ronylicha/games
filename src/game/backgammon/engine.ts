import {
  BackgammonMove,
  BackgammonPlayer,
  BackgammonState,
  MoveFrom,
  MoveTo,
  Point,
  backgammonOpponent,
} from './types';

const POINTS = 24;
const CHECKERS_PER_PLAYER = 15;

export function createBackgammonState(): BackgammonState {
  const points = emptyPoints();
  setPoint(points, 23, 'ivory', 2);
  setPoint(points, 12, 'ivory', 5);
  setPoint(points, 7, 'ivory', 3);
  setPoint(points, 5, 'ivory', 5);

  setPoint(points, 0, 'red', 2);
  setPoint(points, 11, 'red', 5);
  setPoint(points, 16, 'red', 3);
  setPoint(points, 18, 'red', 5);

  return {
    points,
    bar: { ivory: 0, red: 0 },
    off: { ivory: 0, red: 0 },
    turn: 'ivory',
    dice: [],
    rolled: false,
    status: 'playing',
    lastMove: null,
    lastMovePlayer: null,
  };
}

export function rollBackgammonDice(random = Math.random): number[] {
  const first = Math.floor(random() * 6) + 1;
  const second = Math.floor(random() * 6) + 1;
  return first === second ? [first, first, first, first] : [first, second];
}

export function startBackgammonTurn(state: BackgammonState, dice = rollBackgammonDice()): BackgammonState {
  return {
    ...state,
    dice,
    rolled: true,
  };
}

export function getBackgammonLegalMoves(state: BackgammonState): BackgammonMove[] {
  if (state.status !== 'playing' || !state.rolled) {
    return [];
  }

  const moves = new Map<string, BackgammonMove>();
  for (const die of state.dice) {
    for (const move of getMovesForDie(state, die)) {
      moves.set(moveKey(move), move);
    }
  }
  return [...moves.values()];
}

export function getBackgammonMovesFrom(state: BackgammonState, from: MoveFrom): BackgammonMove[] {
  return getBackgammonLegalMoves(state).filter((move) => move.from === from);
}

export function applyBackgammonMove(state: BackgammonState, move: BackgammonMove): BackgammonState {
  const points = clonePoints(state.points);
  const bar = { ...state.bar };
  const off = { ...state.off };
  const player = state.turn;
  const opponent = backgammonOpponent(player);

  if (move.from === 'bar') {
    bar[player] -= 1;
  } else {
    removeChecker(points, move.from);
  }

  if (move.to === 'off') {
    off[player] += 1;
  } else {
    const destination = points[move.to];
    if (destination.owner === opponent && destination.count === 1) {
      destination.owner = null;
      destination.count = 0;
      bar[opponent] += 1;
    }
    addChecker(points, move.to, player);
  }

  const dice = removeDie(state.dice, move.die);
  const nextStatus =
    off[player] >= CHECKERS_PER_PLAYER ? (`${player}-won` as const) : state.status;

  const nextState: BackgammonState = {
    ...state,
    points,
    bar,
    off,
    dice,
    status: nextStatus,
    lastMove: move,
    lastMovePlayer: player,
  };

  if (nextStatus !== 'playing') {
    return nextState;
  }

  if (dice.length === 0 || getBackgammonLegalMoves(nextState).length === 0) {
    return endBackgammonTurn(nextState);
  }

  return nextState;
}

export function endBackgammonTurn(state: BackgammonState): BackgammonState {
  return {
    ...state,
    turn: backgammonOpponent(state.turn),
    dice: [],
    rolled: false,
  };
}

export function chooseBackgammonAiMove(state: BackgammonState): BackgammonMove | null {
  const moves = getBackgammonLegalMoves(state);
  if (moves.length === 0) {
    return null;
  }

  return moves
    .map((move) => ({ move, score: scoreMove(state, move) }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function getMovesForDie(state: BackgammonState, die: number): BackgammonMove[] {
  const player = state.turn;

  if (state.bar[player] > 0) {
    const to = entryPoint(player, die);
    return canLand(state.points, player, to)
      ? [createMove('bar', to, die, state)]
      : [];
  }

  const moves: BackgammonMove[] = [];
  for (let from = 0; from < POINTS; from += 1) {
    const point = state.points[from];
    if (point.owner !== player || point.count === 0) {
      continue;
    }

    const to = from + direction(player) * die;
    if (to >= 0 && to < POINTS) {
      if (canLand(state.points, player, to)) {
        moves.push(createMove(from, to, die, state));
      }
    } else if (canBearOff(state, player, from, die)) {
      moves.push(createMove(from, 'off', die, state));
    }
  }
  return moves;
}

function canLand(points: Point[], player: BackgammonPlayer, to: number): boolean {
  const point = points[to];
  return point.owner !== backgammonOpponent(player) || point.count <= 1;
}

function canBearOff(state: BackgammonState, player: BackgammonPlayer, from: number, die: number): boolean {
  if (state.bar[player] > 0 || !allInHome(state, player)) {
    return false;
  }

  const exactDestination = from + direction(player) * die;
  if (player === 'red') {
    if (exactDestination === POINTS) {
      return true;
    }
    return exactDestination > POINTS - 1 && !hasCheckerBehind(state.points, player, from);
  }

  if (exactDestination === -1) {
    return true;
  }
  return exactDestination < 0 && !hasCheckerBehind(state.points, player, from);
}

function allInHome(state: BackgammonState, player: BackgammonPlayer): boolean {
  const homeStart = player === 'red' ? 18 : 0;
  const homeEnd = player === 'red' ? 23 : 5;

  for (let index = 0; index < POINTS; index += 1) {
    const point = state.points[index];
    if (point.owner === player && (index < homeStart || index > homeEnd)) {
      return false;
    }
  }
  return true;
}

function hasCheckerBehind(points: Point[], player: BackgammonPlayer, from: number): boolean {
  if (player === 'red') {
    for (let index = 18; index < from; index += 1) {
      if (points[index].owner === player) {
        return true;
      }
    }
    return false;
  }

  for (let index = 5; index > from; index -= 1) {
    if (points[index].owner === player) {
      return true;
    }
  }
  return false;
}

function scoreMove(state: BackgammonState, move: BackgammonMove): number {
  const player = state.turn;
  let score = 0;
  score += move.bearOff ? 500 : 0;
  score += move.hit ? 180 : 0;
  score += move.die * 6;

  if (typeof move.to === 'number') {
    const destination = state.points[move.to];
    score += destination.owner === player && destination.count >= 1 ? 30 : -10;
    score += player === 'red' ? move.to : 23 - move.to;
  }

  if (typeof move.from === 'number') {
    const source = state.points[move.from];
    score += source.count === 1 ? -20 : 0;
  }

  return score;
}

function createMove(from: MoveFrom, to: MoveTo, die: number, state: BackgammonState): BackgammonMove {
  const opponent = backgammonOpponent(state.turn);
  return {
    from,
    to,
    die,
    hit: typeof to === 'number' && state.points[to].owner === opponent && state.points[to].count === 1,
    bearOff: to === 'off',
  };
}

function emptyPoints(): Point[] {
  return Array.from({ length: POINTS }, () => ({ owner: null, count: 0 }));
}

function clonePoints(points: Point[]): Point[] {
  return points.map((point) => ({ ...point }));
}

function setPoint(points: Point[], index: number, owner: BackgammonPlayer, count: number): void {
  points[index] = { owner, count };
}

function addChecker(points: Point[], index: number, player: BackgammonPlayer): void {
  points[index].owner = player;
  points[index].count += 1;
}

function removeChecker(points: Point[], index: number): void {
  points[index].count -= 1;
  if (points[index].count === 0) {
    points[index].owner = null;
  }
}

function direction(player: BackgammonPlayer): number {
  return player === 'red' ? 1 : -1;
}

function entryPoint(player: BackgammonPlayer, die: number): number {
  return player === 'red' ? die - 1 : POINTS - die;
}

function removeDie(dice: number[], die: number): number[] {
  const index = dice.indexOf(die);
  return index === -1 ? dice : [...dice.slice(0, index), ...dice.slice(index + 1)];
}

function moveKey(move: BackgammonMove): string {
  return `${move.from}:${move.to}:${move.die}`;
}
