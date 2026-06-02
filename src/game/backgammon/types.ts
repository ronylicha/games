export type BackgammonPlayer = 'ivory' | 'red';
export type PointIndex = number;
export type MoveFrom = PointIndex | 'bar';
export type MoveTo = PointIndex | 'off';

export type Point = {
  owner: BackgammonPlayer | null;
  count: number;
};

export type BackgammonMove = {
  from: MoveFrom;
  to: MoveTo;
  die: number;
  hit: boolean;
  bearOff: boolean;
};

export type BackgammonStatus = 'playing' | 'ivory-won' | 'red-won';

export type BackgammonState = {
  points: Point[];
  bar: Record<BackgammonPlayer, number>;
  off: Record<BackgammonPlayer, number>;
  turn: BackgammonPlayer;
  dice: number[];
  rolled: boolean;
  status: BackgammonStatus;
  lastMove: BackgammonMove | null;
  lastMovePlayer: BackgammonPlayer | null;
};

export type BackgammonMode = 'human' | 'computer';

export function backgammonOpponent(player: BackgammonPlayer): BackgammonPlayer {
  return player === 'ivory' ? 'red' : 'ivory';
}
