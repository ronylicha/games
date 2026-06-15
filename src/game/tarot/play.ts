// Le jeu de la carte du Tarot français : coups légaux et résolution des plis.
//
// Une fois l'écart constitué, les joueurs jouent une carte à tour de rôle pour
// former un pli (`TarotTrick`). Deux règles structurent cette phase :
//
//  1. Les coups légaux (l'obligation de jeu). La première carte non-Excuse du
//     pli fixe la « couleur demandée ». Chaque joueur doit, par ordre de
//     priorité décroissante :
//       - fournir la couleur demandée s'il la possède ;
//       - sinon couper à l'atout (et surcouper l'atout maître déjà posé s'il le
//         peut, sinon défausser un atout plus faible) ;
//       - sinon se défausser de n'importe quelle carte.
//     L'Excuse échappe à toute obligation : elle est jouable en toute
//     circonstance (mais n'est jamais obligatoire).
//
//  2. La résolution du pli (qui l'emporte) : le plus fort atout s'il y a eu
//     coupe, sinon la plus haute carte de la couleur demandée. L'Excuse ne
//     remporte jamais un pli.
//
// Toutes les fonctions sont pures (aucune mutation des entrées).

import { isExcuse } from './deck';
import { TarotCard, TarotPlay, TarotSuit, TarotTrick } from './types';

/** Rang du Roi parmi les rangs de couleur (la plus forte carte d'une couleur). */
const KING_RANK = 14;

/**
 * Couleur demandée d'un pli : une enseigne (couleur), ou `'trump'` si le pli a
 * été entamé à l'atout. La valeur ne dépend que des cartes déjà posées.
 */
export type TarotLedSuit = TarotSuit | 'trump';

/**
 * Détermine la couleur demandée à partir des cartes déjà jouées : c'est le type
 * de la première carte non-Excuse. Renvoie `null` tant qu'aucune carte (ou
 * seulement l'Excuse) n'a été posée — auquel cas le prochain joueur est libre.
 */
export function ledSuit(plays: TarotPlay[]): TarotLedSuit | null {
  for (const play of plays) {
    if (play.card.kind === 'suit') {
      return play.card.suit;
    }
    if (play.card.kind === 'trump') {
      return 'trump';
    }
    // L'Excuse ne fixe pas la couleur : on passe à la carte suivante.
  }
  return null;
}

/**
 * Rang du plus fort atout déjà posé dans le pli, ou `null` si aucun atout n'a
 * encore été joué. Sert à imposer la surcoupe (« monter à l'atout »).
 */
export function highestTrumpRank(plays: TarotPlay[]): number | null {
  let max: number | null = null;
  for (const play of plays) {
    if (play.card.kind === 'trump' && (max === null || play.card.rank > max)) {
      max = play.card.rank;
    }
  }
  return max;
}

/** Toutes les cartes atout de la main. */
function handTrumps(hand: TarotCard[]): TarotCard[] {
  return hand.filter((card) => card.kind === 'trump');
}

/** Toutes les cartes d'une couleur donnée dans la main. */
function handOfSuit(hand: TarotCard[], suit: TarotSuit): TarotCard[] {
  return hand.filter((card) => card.kind === 'suit' && card.suit === suit);
}

/**
 * Parmi les atouts fournis, ceux qui battent le plus fort atout déjà posé. Si
 * aucun atout n'a encore été joué (`highest === null`), tous conviennent.
 */
function overTrumps(trumps: TarotCard[], highest: number | null): TarotCard[] {
  if (highest === null) {
    return trumps;
  }
  return trumps.filter((card) => card.kind === 'trump' && card.rank > highest);
}

/**
 * Ensemble des cartes que le joueur peut légalement poser, compte tenu des
 * cartes déjà jouées dans le pli (`plays`, dans l'ordre de jeu) et de sa main.
 *
 * Le meneur (pli vide) peut jouer n'importe quelle carte. Sinon l'obligation
 * (fournir / couper / surcouper) est calculée à partir de la couleur demandée,
 * et l'Excuse est toujours ajoutée comme échappatoire légale.
 */
export function legalPlays(hand: TarotCard[], plays: TarotPlay[]): TarotCard[] {
  // Meneur, ou pli n'ayant vu que l'Excuse : aucune contrainte.
  const led = ledSuit(plays);
  if (plays.length === 0 || led === null) {
    return [...hand];
  }

  const trumps = handTrumps(hand);
  let obligated: TarotCard[];

  if (led === 'trump') {
    // Atout demandé : monter à l'atout si possible, sinon défausse libre.
    obligated = trumps.length > 0 ? requireOverTrump(trumps, plays) : [...hand];
  } else {
    const sameSuit = handOfSuit(hand, led);
    if (sameSuit.length > 0) {
      // On possède la couleur : on doit la fournir (battre l'atout n'est pas
      // requis — fournir prime sur couper).
      obligated = sameSuit;
    } else if (trumps.length > 0) {
      // Couleur absente : on doit couper, en surcoupant si on le peut.
      obligated = requireOverTrump(trumps, plays);
    } else {
      // Ni la couleur, ni d'atout : défausse libre.
      obligated = [...hand];
    }
  }

  return withExcuse(obligated, hand);
}

/**
 * Cartes jouables lorsqu'une coupe à l'atout est imposée : on doit surcouper
 * (jouer plus fort que l'atout maître) si possible ; à défaut on peut sous-couper
 * avec n'importe quel atout (« pisser à l'atout »).
 */
function requireOverTrump(trumps: TarotCard[], plays: TarotPlay[]): TarotCard[] {
  const higher = overTrumps(trumps, highestTrumpRank(plays));
  return higher.length > 0 ? higher : trumps;
}

/**
 * Ajoute l'Excuse à l'ensemble obligé si le joueur la détient et qu'elle n'y
 * figure pas déjà (l'Excuse est toujours un coup légal).
 */
function withExcuse(obligated: TarotCard[], hand: TarotCard[]): TarotCard[] {
  const excuse = hand.find(isExcuse);
  if (excuse && !obligated.some((card) => card.id === excuse.id)) {
    return [...obligated, excuse];
  }
  return obligated;
}

/**
 * La carte est-elle un coup légal dans l'état courant du pli ? Une carte absente
 * de la main est toujours illégale.
 */
export function isLegalPlay(card: TarotCard, hand: TarotCard[], plays: TarotPlay[]): boolean {
  return legalPlays(hand, plays).some((legal) => legal.id === card.id);
}

/** Crée un pli vide entamé par le joueur `leader`. */
export function createTrick(leader: number): TarotTrick {
  return { leader, plays: [], winner: null };
}

/**
 * Ajoute une carte au pli (sans muter l'original). Ne valide pas la légalité du
 * coup — l'appelant doit l'avoir vérifiée via `isLegalPlay` au préalable, à
 * l'image de la séparation `validateEcart` / `applyEcart` de l'écart.
 */
export function playInTrick(trick: TarotTrick, play: TarotPlay): TarotTrick {
  return { ...trick, plays: [...trick.plays, play], winner: null };
}

/** Le pli est-il complet (chaque joueur a posé une carte) ? */
export function isTrickComplete(trick: TarotTrick, playerCount: number): boolean {
  return trick.plays.length === playerCount;
}

/**
 * Index du joueur remportant le pli d'après les cartes posées : le plus fort
 * atout en cas de coupe, sinon la plus haute carte de la couleur demandée.
 * L'Excuse ne peut jamais l'emporter. Lève une erreur si le pli est vide.
 */
export function trickWinner(plays: TarotPlay[]): number {
  if (plays.length === 0) {
    throw new Error('Impossible de résoudre un pli vide.');
  }

  // Coupe : le plus fort atout l'emporte.
  const trumpPlays = plays.filter((play) => play.card.kind === 'trump');
  if (trumpPlays.length > 0) {
    return strongest(trumpPlays).player;
  }

  // Sinon : la plus haute carte de la couleur demandée.
  const led = ledSuit(plays);
  const followers = plays.filter(
    (play) => play.card.kind === 'suit' && play.card.suit === led,
  );
  return strongest(followers).player;
}

/**
 * Coup le plus fort d'un ensemble homogène (tous atouts, ou tous d'une même
 * couleur), comparé par rang. Le rang du Roi (14) reste le sommet d'une couleur.
 */
function strongest(plays: TarotPlay[]): TarotPlay {
  return plays.reduce((best, play) => (cardRank(play.card) > cardRank(best.card) ? play : best));
}

/** Rang comparable d'une carte atout ou de couleur (le Roi vaut KING_RANK). */
function cardRank(card: TarotCard): number {
  if (card.kind === 'trump') {
    return card.rank;
  }
  if (card.kind === 'suit') {
    return card.rank;
  }
  // L'Excuse n'entre jamais dans une comparaison gagnante.
  return -1;
}

/**
 * Résout un pli complet : renvoie une copie du pli avec `winner` renseigné. À
 * appeler une fois toutes les cartes posées (`isTrickComplete`).
 */
export function resolveTrick(trick: TarotTrick): TarotTrick {
  return { ...trick, winner: trickWinner(trick.plays) };
}

/**
 * Le pli a-t-il été remporté à l'atout (coupe) plutôt qu'à la couleur demandée ?
 * Utile à l'IA et à l'affichage. Faux pour un pli sans aucune carte.
 */
export function trickWonByTrump(plays: TarotPlay[]): boolean {
  return plays.some((play) => play.card.kind === 'trump');
}
