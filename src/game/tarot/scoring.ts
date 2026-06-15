// Décompte des points et calcul du score d'un contrat de Tarot français.
//
// Le scoring se décompose en deux couches indépendantes :
//
//  1. Comptage des cartes (système demi-points) : chaque carte vaut une valeur
//     fixe (cf. `TAROT_CARD_POINTS`) et la somme du paquet vaut 91 points. Le
//     camp du preneur compte les points des cartes qu'il a gagnées (plis +
//     écart selon le contrat) ; ces fonctions sont agnostiques de la phase de
//     jeu et ne reçoivent que des cartes.
//
//  2. Formule du contrat : le preneur doit atteindre un seuil de points qui
//     dépend du nombre de bouts qu'il possède (cf. `TAROT_TARGET_BY_BOUTS`). Le
//     score de base vaut `(25 + écart) × multiplicateur`, auquel s'ajoutent les
//     primes (petit au bout, poignée, chelem). En 4 joueurs, chaque défenseur
//     règle le même montant : le preneur encaisse (ou paie) 3 fois ce montant.
//
// Toutes les fonctions sont pures : elles ne mutent aucune entrée.

import {
  TAROT_BASE_SCORE,
  TAROT_CARD_POINTS,
  TAROT_CHELEM,
  TAROT_CONTRACTS,
  TAROT_PETIT_AU_BOUT_BONUS,
  TAROT_PLAYER_COUNT,
  TAROT_POIGNEE,
  TAROT_TARGET_BY_BOUTS,
} from './constants';
import { isBout } from './deck';
import { TarotAnnounceableContract } from './bidding';
import { TarotCard } from './types';

// ---------------------------------------------------------------------------
// 1. Comptage des cartes (système demi-points)
// ---------------------------------------------------------------------------

/**
 * Valeur en points d'une carte (système demi-points) :
 *  - bout (Petit, 21, Excuse) et Roi : 4,5 ;
 *  - Dame : 3,5 ; Cavalier : 2,5 ; Valet : 1,5 ;
 *  - toute autre carte (atout simple ou basse carte de couleur) : 0,5.
 */
export function cardPointValue(card: TarotCard): number {
  if (isBout(card)) {
    return TAROT_CARD_POINTS.bout;
  }
  if (card.kind === 'trump') {
    return TAROT_CARD_POINTS.plain;
  }
  // L'Excuse est déjà couverte par `isBout` ; ce garde reste défensif.
  if (card.kind === 'excuse') {
    return TAROT_CARD_POINTS.bout;
  }

  switch (card.rank) {
    case 14:
      return TAROT_CARD_POINTS.king;
    case 13:
      return TAROT_CARD_POINTS.queen;
    case 12:
      return TAROT_CARD_POINTS.knight;
    case 11:
      return TAROT_CARD_POINTS.jack;
    default:
      return TAROT_CARD_POINTS.plain;
  }
}

/** Somme des points d'un ensemble de cartes (système demi-points). */
export function countCardPoints(cards: TarotCard[]): number {
  return cards.reduce((sum, card) => sum + cardPointValue(card), 0);
}

/** Nombre de bouts (oudlers) présents dans un ensemble de cartes (0..3). */
export function countBouts(cards: TarotCard[]): number {
  return cards.reduce((count, card) => count + (isBout(card) ? 1 : 0), 0);
}

/**
 * Seuil de points que le preneur doit atteindre selon le nombre de bouts qu'il
 * possède : 0 bout → 56, 1 → 51, 2 → 41, 3 → 36. Le nombre de bouts est borné
 * à l'intervalle [0, 3].
 */
export function targetPoints(boutCount: number): number {
  const clamped = Math.max(0, Math.min(3, Math.trunc(boutCount))) as 0 | 1 | 2 | 3;
  return TAROT_TARGET_BY_BOUTS[clamped];
}

// ---------------------------------------------------------------------------
// 2. Formule du contrat
// ---------------------------------------------------------------------------

/** Camp ayant réalisé le petit au bout (dernier pli remporté avec le Petit). */
export type TarotPetitAuBoutSide = 'taker' | 'defense' | null;

/** Type de poignée annoncée (atouts montrés avant le jeu). */
export type TarotPoigneeType = keyof typeof TAROT_POIGNEE;

/**
 * Issue d'un chelem (grand chelem) du point de vue du preneur :
 *  - annoncé et réussi : +400 ;
 *  - réussi sans annonce : +200 ;
 *  - annoncé mais échoué : -200.
 */
export type TarotChelemOutcome =
  | 'announced-success'
  | 'unannounced-success'
  | 'announced-fail';

/** Données nécessaires pour calculer le score d'une donne. */
export type TarotScoreInput = {
  /** Contrat retenu à l'issue des enchères. */
  contract: TarotAnnounceableContract;
  /** Points de cartes comptés pour le camp du preneur (système demi-points). */
  takerCardPoints: number;
  /** Nombre de bouts détenus par le preneur (0..3), fixe le seuil à atteindre. */
  takerBouts: number;
  /** Nombre de joueurs à la table (défaut : 4). */
  playerCount?: number;
  /** Camp ayant réalisé le petit au bout, ou `null` si non réalisé. */
  petitAuBout?: TarotPetitAuBoutSide;
  /** Poignée annoncée, ou `null` si aucune. */
  poignee?: TarotPoigneeType | null;
  /** Issue du chelem, ou `null` si aucun chelem n'est en jeu. */
  chelem?: TarotChelemOutcome | null;
};

/** Détail complet du score d'une donne, du point de vue du preneur. */
export type TarotScoreResult = {
  /** Contrat joué. */
  contract: TarotAnnounceableContract;
  /** Multiplicateur du contrat (1, 2, 4 ou 6). */
  multiplier: number;
  /** Nombre de joueurs pris en compte pour la répartition. */
  playerCount: number;
  /** Seuil de points requis selon les bouts du preneur. */
  target: number;
  /** Points de cartes du preneur (rappel de l'entrée). */
  takerCardPoints: number;
  /** Nombre de bouts du preneur (rappel de l'entrée). */
  takerBouts: number;
  /** Écart signé (points réalisés − seuil) ; positif si le contrat est gagné. */
  diff: number;
  /** Valeur absolue de l'écart, utilisée dans la formule. */
  ecart: number;
  /** Vrai si le preneur a atteint son seuil (contrat réussi). */
  contractWon: boolean;
  /** Valeur de base signée : ±(25 + écart) × multiplicateur. */
  baseValue: number;
  /** Contribution signée du petit au bout (multipliée par le contrat). */
  petitAuBoutValue: number;
  /** Contribution signée de la poignée (prime forfaitaire, non multipliée). */
  poigneeValue: number;
  /** Contribution signée du chelem (prime forfaitaire, non multipliée). */
  chelemValue: number;
  /** Montant réglé par chaque défenseur (positif = en faveur du preneur). */
  perDefender: number;
  /** Score total du preneur : `perDefender × (playerCount − 1)`. */
  takerScore: number;
  /** Score de chaque défenseur : `−perDefender`. */
  defenderScore: number;
};

/** Prime forfaitaire d'une poignée selon son type (0 si aucune). */
function poigneeBonus(poignee: TarotPoigneeType | null): number {
  return poignee ? TAROT_POIGNEE[poignee].bonus : 0;
}

/** Prime signée du chelem du point de vue du preneur (0 si aucun). */
function resolveChelemValue(chelem: TarotChelemOutcome | null): number {
  switch (chelem) {
    case 'announced-success':
      return TAROT_CHELEM.announcedSuccess;
    case 'unannounced-success':
      return TAROT_CHELEM.unannouncedSuccess;
    case 'announced-fail':
      return TAROT_CHELEM.announcedFail;
    default:
      return 0;
  }
}

/**
 * Calcule le score d'une donne à partir des points comptés pour le preneur.
 *
 * Formule (par défenseur, du point de vue du preneur) :
 *
 *   perDefender = signe × (25 + écart) × multiplicateur   // socle du contrat
 *               + petit au bout (±10 × multiplicateur)     // au camp réalisateur
 *               + signe × poignée                          // au vainqueur de la donne
 *               + chelem                                   // forfaitaire
 *
 * où `signe` vaut +1 si le contrat est réussi, −1 sinon. Le petit au bout est
 * indépendant du résultat du contrat (le camp qui le réalise l'encaisse, que le
 * contrat soit gagné ou perdu).
 */
export function scoreContract(input: TarotScoreInput): TarotScoreResult {
  const { contract, takerCardPoints, takerBouts } = input;
  const playerCount = input.playerCount ?? TAROT_PLAYER_COUNT;
  const petitAuBout = input.petitAuBout ?? null;
  const poignee = input.poignee ?? null;
  const chelem = input.chelem ?? null;

  const multiplier = TAROT_CONTRACTS[contract].multiplier;
  const target = targetPoints(takerBouts);
  const diff = takerCardPoints - target;
  const contractWon = diff >= 0;
  const ecart = Math.abs(diff);
  const sign = contractWon ? 1 : -1;

  const baseValue = sign * (TAROT_BASE_SCORE + ecart) * multiplier;

  let petitAuBoutValue = 0;
  if (petitAuBout === 'taker') {
    petitAuBoutValue = TAROT_PETIT_AU_BOUT_BONUS * multiplier;
  } else if (petitAuBout === 'defense') {
    petitAuBoutValue = -TAROT_PETIT_AU_BOUT_BONUS * multiplier;
  }

  // La poignée est acquise au camp qui remporte la donne (sens de `sign`).
  const poigneeValue = sign * poigneeBonus(poignee);
  const chelemValue = resolveChelemValue(chelem);

  const perDefender = baseValue + petitAuBoutValue + poigneeValue + chelemValue;
  const takerScore = perDefender * (playerCount - 1);
  const defenderScore = -perDefender;

  return {
    contract,
    multiplier,
    playerCount,
    target,
    takerCardPoints,
    takerBouts,
    diff,
    ecart,
    contractWon,
    baseValue,
    petitAuBoutValue,
    poigneeValue,
    chelemValue,
    perDefender,
    takerScore,
    defenderScore,
  };
}

/**
 * Variante pratique : calcule le score directement à partir des cartes gagnées
 * par le preneur (plis + écart selon le contrat). Compte les points et les
 * bouts puis délègue à `scoreContract`.
 */
export function scoreContractFromCards(
  takerCards: TarotCard[],
  options: Omit<TarotScoreInput, 'takerCardPoints' | 'takerBouts'>,
): TarotScoreResult {
  return scoreContract({
    ...options,
    takerCardPoints: countCardPoints(takerCards),
    takerBouts: countBouts(takerCards),
  });
}
