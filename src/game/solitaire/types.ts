export type SolitaireSuit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

export type SolitaireColor = 'black' | 'red';

export type DrawMode = 'infinite' | 'three';

export type SolitaireStatus = 'playing' | 'won';

export type SolitaireCard = {
  id: string;
  suit: SolitaireSuit;
  rank: number;
  faceUp: boolean;
};

export type TableauSource = {
  type: 'tableau';
  column: number;
  index: number;
};

export type WasteSource = {
  type: 'waste';
};

export type FoundationSource = {
  type: 'foundation';
  suit: SolitaireSuit;
};

export type SolitaireSource = TableauSource | WasteSource | FoundationSource;

export type SolitaireMove =
  | {
      type: 'foundation';
      source: SolitaireSource;
      suit: SolitaireSuit;
    }
  | {
      type: 'tableau';
      source: SolitaireSource;
      column: number;
    };

export type SolitaireState = {
  drawMode: DrawMode;
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  foundations: Record<SolitaireSuit, SolitaireCard[]>;
  tableau: SolitaireCard[][];
  recyclesUsed: number;
  status: SolitaireStatus;
};
