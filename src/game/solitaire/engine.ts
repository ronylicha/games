import { DrawMode, SolitaireCard, SolitaireColor, SolitaireMove, SolitaireSource, SolitaireState, SolitaireSuit } from './types';

const suits: SolitaireSuit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const maxLimitedRecycles = 3;

export function createSolitaireState(drawMode: DrawMode = 'infinite'): SolitaireState {
  const deck = shuffle(createDeck());
  const tableau: SolitaireCard[][] = Array.from({ length: 7 }, () => []);
  let cursor = 0;

  for (let column = 0; column < 7; column += 1) {
    for (let row = 0; row <= column; row += 1) {
      const card = deck[cursor];
      tableau[column].push({ ...card, faceUp: row === column });
      cursor += 1;
    }
  }

  return {
    drawMode,
    stock: deck.slice(cursor).map((card) => ({ ...card, faceUp: false })),
    waste: [],
    foundations: {
      clubs: [],
      diamonds: [],
      hearts: [],
      spades: [],
    },
    tableau,
    recyclesUsed: 0,
    status: 'playing',
  };
}

export function changeSolitaireDrawMode(state: SolitaireState, drawMode: DrawMode): SolitaireState {
  return createSolitaireState(drawMode);
}

export function drawSolitaireCard(state: SolitaireState): SolitaireState {
  if (state.status !== 'playing') {
    return state;
  }

  if (state.stock.length > 0) {
    const stock = [...state.stock];
    const card = stock.pop();

    if (!card) {
      return state;
    }

    return {
      ...state,
      stock,
      waste: [...state.waste, { ...card, faceUp: true }],
    };
  }

  if (state.waste.length === 0 || !canRecycleStock(state)) {
    return state;
  }

  return {
    ...state,
    stock: state.waste
      .slice()
      .reverse()
      .map((card) => ({ ...card, faceUp: false })),
    waste: [],
    recyclesUsed: state.recyclesUsed + 1,
  };
}

export function canRecycleStock(state: SolitaireState): boolean {
  return state.drawMode === 'infinite' || state.recyclesUsed < maxLimitedRecycles;
}

export function getSolitaireLegalMoves(state: SolitaireState, source: SolitaireSource): SolitaireMove[] {
  const moves: SolitaireMove[] = [];
  const movingCards = getSourceCards(state, source);

  if (movingCards.length === 0) {
    return moves;
  }

  if (movingCards.length === 1) {
    foundationSuits().forEach((suit) => {
      if (canMoveSolitaireSourceToFoundation(state, source, suit)) {
        moves.push({ type: 'foundation', source, suit });
      }
    });
  }

  state.tableau.forEach((_, column) => {
    if (canMoveSolitaireSourceToTableau(state, source, column)) {
      moves.push({ type: 'tableau', source, column });
    }
  });

  return moves;
}

export function canMoveSolitaireSourceToFoundation(state: SolitaireState, source: SolitaireSource, suit: SolitaireSuit): boolean {
  const movingCards = getSourceCards(state, source);
  return movingCards.length === 1 && movingCards[0].suit === suit && canPlaceOnFoundation(movingCards[0], state.foundations[suit]);
}

export function canMoveSolitaireSourceToTableau(state: SolitaireState, source: SolitaireSource, targetColumn: number): boolean {
  const movingCards = getSourceCards(state, source);
  return movingCards.length > 0 && canPlaceOnTableau(movingCards[0], state.tableau[targetColumn]);
}

export function moveSolitaireToFoundation(state: SolitaireState, source: SolitaireSource, suit: SolitaireSuit): SolitaireState {
  const movingCards = getSourceCards(state, source);

  if (movingCards.length !== 1 || movingCards[0].suit !== suit || !canPlaceOnFoundation(movingCards[0], state.foundations[suit])) {
    return state;
  }

  const next = removeSourceCards(state, source);
  next.foundations[suit] = [...next.foundations[suit], movingCards[0]];
  return finishMove(next);
}

export function moveSolitaireToTableau(state: SolitaireState, source: SolitaireSource, targetColumn: number): SolitaireState {
  const movingCards = getSourceCards(state, source);

  if (movingCards.length === 0 || !canPlaceOnTableau(movingCards[0], state.tableau[targetColumn])) {
    return state;
  }

  const next = removeSourceCards(state, source);
  next.tableau[targetColumn] = [...next.tableau[targetColumn], ...movingCards];
  return finishMove(next);
}

export function getSourceCards(state: SolitaireState, source: SolitaireSource): SolitaireCard[] {
  if (source.type === 'waste') {
    const card = state.waste[state.waste.length - 1];
    return card ? [card] : [];
  }

  if (source.type === 'foundation') {
    const foundation = state.foundations[source.suit];
    const card = foundation[foundation.length - 1];
    return card ? [card] : [];
  }

  const column = state.tableau[source.column];
  const cards = column.slice(source.index);
  return isValidTableauSequence(cards) ? cards : [];
}

export function canSelectTableauCards(cards: SolitaireCard[]): boolean {
  return cards.length > 0 && cards[0].faceUp && isValidTableauSequence(cards);
}

export function getCardColor(card: Pick<SolitaireCard, 'suit'>): SolitaireColor {
  return card.suit === 'diamonds' || card.suit === 'hearts' ? 'red' : 'black';
}

export function rankLabel(rank: number): string {
  if (rank === 1) {
    return 'A';
  }
  if (rank === 11) {
    return 'J';
  }
  if (rank === 12) {
    return 'Q';
  }
  if (rank === 13) {
    return 'K';
  }
  return String(rank);
}

export function suitLabel(suit: SolitaireSuit): string {
  if (suit === 'clubs') {
    return '♣';
  }
  if (suit === 'diamonds') {
    return '♦';
  }
  if (suit === 'hearts') {
    return '♥';
  }
  return '♠';
}

function createDeck(): SolitaireCard[] {
  return foundationSuits().flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
      faceUp: false,
    })),
  );
}

function shuffle(cards: SolitaireCard[]): SolitaireCard[] {
  const deck = [...cards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function canPlaceOnFoundation(card: SolitaireCard, foundation: SolitaireCard[]): boolean {
  const top = foundation[foundation.length - 1];
  return top ? top.suit === card.suit && top.rank + 1 === card.rank : card.rank === 1;
}

function canPlaceOnTableau(card: SolitaireCard, column: SolitaireCard[]): boolean {
  const top = column[column.length - 1];
  return top ? top.faceUp && top.rank === card.rank + 1 && getCardColor(top) !== getCardColor(card) : card.rank === 13;
}

function isValidTableauSequence(cards: SolitaireCard[]): boolean {
  return cards.every((card, index) => {
    if (!card.faceUp) {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const previous = cards[index - 1];
    return previous.rank === card.rank + 1 && getCardColor(previous) !== getCardColor(card);
  });
}

function removeSourceCards(state: SolitaireState, source: SolitaireSource): SolitaireState {
  if (source.type === 'waste') {
    return {
      ...state,
      waste: state.waste.slice(0, -1),
      foundations: cloneFoundations(state),
      tableau: state.tableau.map((column) => [...column]),
    };
  }

  if (source.type === 'foundation') {
    const foundations = cloneFoundations(state);
    foundations[source.suit] = foundations[source.suit].slice(0, -1);

    return {
      ...state,
      foundations,
      tableau: state.tableau.map((column) => [...column]),
    };
  }

  const tableau = state.tableau.map((column) => [...column]);
  tableau[source.column] = tableau[source.column].slice(0, source.index);

  return {
    ...state,
    foundations: cloneFoundations(state),
    tableau,
  };
}

function finishMove(state: SolitaireState): SolitaireState {
  const tableau = state.tableau.map((column) => {
    if (column.length === 0) {
      return column;
    }

    const nextColumn = [...column];
    const top = nextColumn[nextColumn.length - 1];
    if (!top.faceUp) {
      nextColumn[nextColumn.length - 1] = { ...top, faceUp: true };
    }
    return nextColumn;
  });

  const foundations = cloneFoundations(state);
  const foundationCards = foundationSuits().reduce((total, suit) => total + foundations[suit].length, 0);

  return {
    ...state,
    foundations,
    tableau,
    status: foundationCards === 52 ? 'won' : 'playing',
  };
}

function foundationSuits(): SolitaireSuit[] {
  return suits;
}

function cloneFoundations(state: SolitaireState): SolitaireState['foundations'] {
  return {
    clubs: [...state.foundations.clubs],
    diamonds: [...state.foundations.diamonds],
    hearts: [...state.foundations.hearts],
    spades: [...state.foundations.spades],
  };
}
