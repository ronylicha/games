// Phase d'enchères du Tarot français.
//
// Les enchères se déroulent en un unique tour de table : chaque joueur, à son
// tour (en commençant par le joueur à gauche du donneur), annonce un contrat
// strictement supérieur au meilleur contrat courant ou passe. À la fin du tour,
// le plus offrant devient le preneur ; si tous passent, la donne est rejouée.
//
// Ce module est une machine à états pure : chaque action retourne un nouvel état
// sans muter l'entrée, conformément aux règles d'immutabilité du projet.

import { TAROT_CONTRACT_ORDER, TAROT_CONTRACTS } from './constants';
import { TarotPlayerCount } from './types';

/** Tous les contrats possibles, y compris « passe ». */
export type TarotContract = keyof typeof TAROT_CONTRACTS;

/** Contrats réellement annonçables (sans le passe). */
export type TarotAnnounceableContract = (typeof TAROT_CONTRACT_ORDER)[number];

/** Une annonce faite par un joueur pendant les enchères. */
export type TarotBid = {
  /** Index du joueur (0..playerCount-1). */
  player: number;
  /** Contrat annoncé (`pass` si le joueur a passé). */
  contract: TarotContract;
};

/** État complet de la phase d'enchères. */
export type TarotBiddingState = {
  /** Nombre de joueurs à la table. */
  playerCount: TarotPlayerCount;
  /** Index du premier joueur à parler (gauche du donneur). */
  firstBidder: number;
  /** Historique chronologique des annonces. */
  bids: TarotBid[];
  /** Joueur dont c'est le tour de parler ; `null` quand les enchères sont closes. */
  currentPlayer: number | null;
  /** Meilleure annonce courante (hors passe), ou `null` si personne n'a encore pris. */
  highestBid: TarotBid | null;
  /** Les enchères sont-elles terminées ? */
  finished: boolean;
  /** Index du preneur une fois les enchères closes (`null` si tout le monde a passé). */
  taker: number | null;
  /** Contrat retenu (`null` si tout le monde a passé). */
  contract: TarotAnnounceableContract | null;
};

/**
 * Force d'un contrat pour comparer les annonces. `pass` vaut 0 ; les contrats
 * annonçables valent leur position dans l'ordre croissant (petite=1 … garde-contre=4).
 */
export function contractRank(contract: TarotContract): number {
  if (contract === 'pass') {
    return 0;
  }
  return TAROT_CONTRACT_ORDER.indexOf(contract) + 1;
}

/**
 * Crée l'état initial des enchères. `firstBidder` est l'index du joueur qui
 * parle en premier (à gauche du donneur).
 */
export function createBiddingState(
  playerCount: TarotPlayerCount,
  firstBidder = 0,
): TarotBiddingState {
  return {
    playerCount,
    firstBidder: ((firstBidder % playerCount) + playerCount) % playerCount,
    bids: [],
    currentPlayer: ((firstBidder % playerCount) + playerCount) % playerCount,
    highestBid: null,
    finished: false,
    taker: null,
    contract: null,
  };
}

/**
 * Liste des contrats que le joueur courant peut légalement annoncer (hors
 * passe, toujours possible). Vide si les enchères sont terminées.
 */
export function availableContracts(state: TarotBiddingState): TarotAnnounceableContract[] {
  if (state.finished || state.currentPlayer === null) {
    return [];
  }

  const minRank = state.highestBid ? contractRank(state.highestBid.contract) : 0;
  return TAROT_CONTRACT_ORDER.filter((contract) => contractRank(contract) > minRank);
}

/** Le joueur courant peut-il légalement annoncer ce contrat ? */
export function canBid(state: TarotBiddingState, contract: TarotContract): boolean {
  if (state.finished || state.currentPlayer === null) {
    return false;
  }
  if (contract === 'pass') {
    return true;
  }
  return availableContracts(state).includes(contract);
}

/**
 * Applique une annonce du joueur courant et retourne le nouvel état. Lève une
 * erreur si l'annonce est illégale (enchère trop basse ou enchères closes).
 */
export function applyBid(state: TarotBiddingState, contract: TarotContract): TarotBiddingState {
  if (state.finished || state.currentPlayer === null) {
    throw new Error('Les enchères sont terminées : aucune annonce possible.');
  }
  if (!canBid(state, contract)) {
    throw new Error(
      `Annonce illégale « ${contract} » : elle doit être supérieure au contrat courant.`,
    );
  }

  const bid: TarotBid = { player: state.currentPlayer, contract };
  const bids = [...state.bids, bid];
  const highestBid = contract === 'pass' ? state.highestBid : bid;

  // Tour de table unique : les enchères se closent une fois que chaque joueur a parlé.
  const spoken = bids.length;
  const finished = spoken >= state.playerCount;

  return {
    ...state,
    bids,
    highestBid,
    finished,
    currentPlayer: finished ? null : (state.firstBidder + spoken) % state.playerCount,
    taker: finished ? (highestBid ? highestBid.player : null) : null,
    contract: finished ? ((highestBid?.contract as TarotAnnounceableContract) ?? null) : null,
  };
}

/**
 * Résultat des enchères une fois closes. Retourne `null` tant qu'elles ne sont
 * pas terminées. `taker`/`contract` valent `null` si tout le monde a passé
 * (la donne doit alors être rejouée).
 */
export function biddingResult(
  state: TarotBiddingState,
): { taker: number | null; contract: TarotAnnounceableContract | null } | null {
  if (!state.finished) {
    return null;
  }
  return { taker: state.taker, contract: state.contract };
}

/** Tout le monde a-t-il passé (aucun preneur) ? Vrai seulement si les enchères sont closes. */
export function everyonePassed(state: TarotBiddingState): boolean {
  return state.finished && state.highestBid === null;
}
