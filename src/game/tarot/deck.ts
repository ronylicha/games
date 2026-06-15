// Jeu de 78 cartes du Tarot français : création, mélange et distribution.

import {
  TarotCard,
  TarotDeal,
  TarotDealConfig,
  TarotPlayerCount,
  TarotSuit,
  TarotSuitRank,
  TarotTrumpRank,
} from './types';

/** Taille totale du jeu de Tarot. */
export const TAROT_DECK_SIZE = 78;

/** Les quatre couleurs, dans l'ordre de génération du jeu. */
export const TAROT_SUITS: readonly TarotSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/** Nombre de rangs par couleur (1..14). */
const SUIT_RANKS = 14;

/** Nombre d'atouts (1..21). */
const TRUMP_RANKS = 21;

/**
 * Configurations de distribution officielles selon le nombre de joueurs.
 *  - 3 joueurs : 24 cartes chacun + chien de 6 (24×3 + 6 = 78) ;
 *  - 4 joueurs : 18 cartes chacun + chien de 6 (18×4 + 6 = 78) ;
 *  - 5 joueurs : 15 cartes chacun + chien de 3 (15×5 + 3 = 78).
 */
export const TAROT_DEAL_CONFIGS: Record<TarotPlayerCount, TarotDealConfig> = {
  3: { players: 3, handSize: 24, chienSize: 6 },
  4: { players: 4, handSize: 18, chienSize: 6 },
  5: { players: 5, handSize: 15, chienSize: 3 },
};

/**
 * Construit un jeu complet de 78 cartes, non mélangé.
 * L'ordre est déterministe : couleurs (rangs 1..14) puis atouts (1..21) puis
 * l'Excuse.
 */
export function createTarotDeck(): TarotCard[] {
  const cards: TarotCard[] = [];

  for (const suit of TAROT_SUITS) {
    for (let rank = 1; rank <= SUIT_RANKS; rank += 1) {
      cards.push({ id: `suit-${suit}-${rank}`, kind: 'suit', suit, rank: rank as TarotSuitRank });
    }
  }

  for (let rank = 1; rank <= TRUMP_RANKS; rank += 1) {
    cards.push({ id: `trump-${rank}`, kind: 'trump', rank: rank as TarotTrumpRank });
  }

  cards.push({ id: 'excuse', kind: 'excuse' });

  return cards;
}

/** Mélange (Fisher-Yates) une copie du tableau de cartes fourni. */
export function shuffleTarotDeck(cards: TarotCard[]): TarotCard[] {
  const deck = [...cards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

/**
 * Détermine les positions (avant un paquet de 3) où une carte est posée dans le
 * chien. Les cartes du chien sont réparties uniformément sur la donne, jamais en
 * tête (la première carte distribuée ne va jamais au chien) ni en queue (la
 * dernière carte distribuée va toujours à un joueur), conformément aux règles.
 */
function chienPacketPositions(totalPackets: number, chienSize: number): Set<number> {
  const positions = new Set<number>();

  for (let i = 0; i < chienSize; i += 1) {
    // Répartition uniforme dans l'intervalle ]0, totalPackets[.
    positions.add(Math.floor(((i + 1) * totalPackets) / (chienSize + 1)));
  }

  return positions;
}

/**
 * Distribue un jeu de 78 cartes selon les règles du Tarot français.
 *
 * Les cartes sont données par paquets de 3 à chaque joueur à tour de rôle. Une
 * carte est posée au chien une par une au cours de la donne (jamais la première,
 * jamais la dernière). Le jeu fourni doit contenir exactement 78 cartes ; il
 * n'est pas mélangé par cette fonction (utiliser `shuffleTarotDeck` au préalable
 * ou `dealTarot` qui combine les deux).
 */
export function distributeTarot(deck: TarotCard[], players: TarotPlayerCount = 4): TarotDeal {
  if (deck.length !== TAROT_DECK_SIZE) {
    throw new Error(`Le jeu de Tarot doit contenir ${TAROT_DECK_SIZE} cartes (reçu ${deck.length}).`);
  }

  const config = TAROT_DEAL_CONFIGS[players];
  const packetsPerPlayer = config.handSize / 3;
  const totalPackets = packetsPerPlayer * players;
  const chienPositions = chienPacketPositions(totalPackets, config.chienSize);

  const hands: TarotCard[][] = Array.from({ length: players }, () => []);
  const chien: TarotCard[] = [];
  let cursor = 0;

  for (let packet = 0; packet < totalPackets; packet += 1) {
    if (chienPositions.has(packet)) {
      chien.push(deck[cursor]);
      cursor += 1;
    }

    const player = packet % players;
    for (let i = 0; i < 3; i += 1) {
      hands[player].push(deck[cursor]);
      cursor += 1;
    }
  }

  return { hands, chien };
}

/** Crée, mélange puis distribue un jeu neuf de 78 cartes. */
export function dealTarot(players: TarotPlayerCount = 4): TarotDeal {
  return distributeTarot(shuffleTarotDeck(createTarotDeck()), players);
}

/** L'Excuse est-elle cette carte ? */
export function isExcuse(card: TarotCard): boolean {
  return card.kind === 'excuse';
}

/** La carte est-elle un atout (1..21) ? */
export function isTrump(card: TarotCard): boolean {
  return card.kind === 'trump';
}

/**
 * La carte est-elle un « bout » (oudler) ? Les trois bouts sont le Petit
 * (atout 1), le 21 d'atout et l'Excuse. Ils sont déterminants pour le score.
 */
export function isBout(card: TarotCard): boolean {
  if (card.kind === 'excuse') {
    return true;
  }
  return card.kind === 'trump' && (card.rank === 1 || card.rank === 21);
}
