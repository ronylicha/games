import {
  DominoMove,
  DominoPlayer,
  DominoState,
  DominoTile,
  dominoOpponent,
} from './types';

export function createDominoState(random = Math.random): DominoState {
  const deck = shuffle(createDeck(), random);
  const ivory = deck.slice(0, 7);
  const red = deck.slice(7, 14);

  return {
    hands: {
      ivory,
      red,
    },
    boneyard: deck.slice(14),
    chain: [],
    turn: starter(ivory, red),
    status: 'playing',
    consecutivePasses: 0,
    lastMove: null,
    lastMovePlayer: null,
  };
}

export function getDominoLegalMoves(state: DominoState, player = state.turn): DominoMove[] {
  if (state.status !== 'playing') {
    return [];
  }

  const moves: DominoMove[] = [];
  for (const tile of state.hands[player]) {
    if (state.chain.length === 0) {
      moves.push({ tileId: tile.id, side: 'left', tile, placed: tile });
      continue;
    }

    const leftEnd = state.chain[0].left;
    const rightEnd = state.chain[state.chain.length - 1].right;

    if (tile.left === leftEnd) {
      moves.push({ tileId: tile.id, side: 'left', tile, placed: flip(tile) });
    }
    if (tile.right === leftEnd) {
      moves.push({ tileId: tile.id, side: 'left', tile, placed: tile });
    }
    if (tile.left === rightEnd) {
      moves.push({ tileId: tile.id, side: 'right', tile, placed: tile });
    }
    if (tile.right === rightEnd) {
      moves.push({ tileId: tile.id, side: 'right', tile, placed: flip(tile) });
    }
  }

  return uniqueMoves(moves);
}

export function applyDominoMove(state: DominoState, move: DominoMove): DominoState {
  const player = state.turn;
  const hand = state.hands[player].filter((tile) => tile.id !== move.tileId);
  const chain =
    move.side === 'left' ? [move.placed, ...state.chain] : [...state.chain, move.placed];
  const status = hand.length === 0 ? (`${player}-won` as const) : 'playing';

  return {
    ...state,
    hands: {
      ...state.hands,
      [player]: hand,
    },
    chain,
    turn: dominoOpponent(player),
    status,
    consecutivePasses: 0,
    lastMove: move,
    lastMovePlayer: player,
  };
}

export function drawDominoTile(state: DominoState): DominoState {
  if (state.boneyard.length === 0) {
    return passDominoTurn(state);
  }

  const [drawn, ...boneyard] = state.boneyard;
  return {
    ...state,
    boneyard,
    hands: {
      ...state.hands,
      [state.turn]: [...state.hands[state.turn], drawn],
    },
    consecutivePasses: 0,
  };
}

export function passDominoTurn(state: DominoState): DominoState {
  const consecutivePasses = state.consecutivePasses + 1;
  const blocked = consecutivePasses >= 2 && getDominoLegalMoves(state).length === 0;

  return {
    ...state,
    turn: dominoOpponent(state.turn),
    consecutivePasses,
    status: blocked ? blockedWinner(state) : state.status,
  };
}

export function playDominoAiTurn(state: DominoState): DominoState {
  let current = state;

  while (current.status === 'playing') {
    const moves = getDominoLegalMoves(current);
    if (moves.length > 0) {
      return applyDominoMove(current, chooseDominoAiMove(current, moves));
    }
    if (current.boneyard.length === 0) {
      return passDominoTurn(current);
    }
    current = drawDominoTile(current);
  }

  return current;
}

export function chooseDominoAiMove(state: DominoState, moves = getDominoLegalMoves(state)): DominoMove {
  return [...moves].sort((a, b) => scoreDominoMove(state, b) - scoreDominoMove(state, a))[0];
}

function scoreDominoMove(state: DominoState, move: DominoMove): number {
  const tileScore = move.tile.left + move.tile.right;
  const doubleScore = move.tile.left === move.tile.right ? 20 : 0;
  const opens =
    move.side === 'left'
      ? [move.placed.left, state.chain[state.chain.length - 1]?.right ?? move.placed.right]
      : [state.chain[0]?.left ?? move.placed.left, move.placed.right];
  const hand = state.hands[state.turn].filter((tile) => tile.id !== move.tileId);
  const futureMatches = hand.filter((tile) => opens.includes(tile.left) || opens.includes(tile.right)).length;
  return tileScore * 3 + doubleScore + futureMatches * 4;
}

function blockedWinner(state: DominoState): DominoState['status'] {
  const ivory = pipCount(state.hands.ivory);
  const red = pipCount(state.hands.red);
  if (ivory === red) {
    return 'draw';
  }
  return ivory < red ? 'ivory-won' : 'red-won';
}

function pipCount(hand: DominoTile[]): number {
  return hand.reduce((total, tile) => total + tile.left + tile.right, 0);
}

function createDeck(): DominoTile[] {
  const deck: DominoTile[] = [];
  for (let left = 0; left <= 6; left += 1) {
    for (let right = left; right <= 6; right += 1) {
      deck.push({ id: `${left}-${right}`, left, right });
    }
  }
  return deck;
}

function starter(ivory: DominoTile[], red: DominoTile[]): DominoPlayer {
  const ivoryBest = highestDouble(ivory);
  const redBest = highestDouble(red);
  if (ivoryBest !== redBest) {
    return ivoryBest > redBest ? 'ivory' : 'red';
  }
  return pipCount(ivory) >= pipCount(red) ? 'ivory' : 'red';
}

function highestDouble(hand: DominoTile[]): number {
  return Math.max(-1, ...hand.filter((tile) => tile.left === tile.right).map((tile) => tile.left));
}

function flip(tile: DominoTile): DominoTile {
  return { ...tile, left: tile.right, right: tile.left };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function uniqueMoves(moves: DominoMove[]): DominoMove[] {
  const seen = new Set<string>();
  return moves.filter((move) => {
    const key = `${move.tileId}:${move.side}:${move.placed.left}-${move.placed.right}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
