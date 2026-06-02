export type DominoPlayer = 'ivory' | 'red';

export type DominoTile = {
  id: string;
  left: number;
  right: number;
};

export type DominoSide = 'left' | 'right';

export type DominoMove = {
  tileId: string;
  side: DominoSide;
  tile: DominoTile;
  placed: DominoTile;
};

export type DominoStatus = 'playing' | 'ivory-won' | 'red-won' | 'draw';

export type DominoState = {
  hands: Record<DominoPlayer, DominoTile[]>;
  boneyard: DominoTile[];
  chain: DominoTile[];
  turn: DominoPlayer;
  status: DominoStatus;
  consecutivePasses: number;
  lastMove: DominoMove | null;
  lastMovePlayer: DominoPlayer | null;
};

export type DominoMode = 'human' | 'computer';

export function dominoOpponent(player: DominoPlayer): DominoPlayer {
  return player === 'ivory' ? 'red' : 'ivory';
}
