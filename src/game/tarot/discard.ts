// L'écart du Tarot français : prise du chien et constitution de l'écart.
//
// Une fois le preneur désigné par les enchères, le sort du chien dépend du
// contrat :
//  - Petite / Garde : le preneur ramasse le chien dans sa main puis écarte le
//    même nombre de cartes face cachée (l'écart, qui comptera dans ses levées) ;
//  - Garde Sans (le chien) : le chien va directement dans les levées du preneur
//    sans être regardé, aucun écart ;
//  - Garde Contre (le chien) : le chien va dans les levées de la défense, aucun
//    écart.
//
// Règles de l'écart :
//  - il doit contenir exactement autant de cartes que le chien ;
//  - on ne peut écarter ni Roi, ni Excuse, ni bout ;
//  - les atouts sont interdits, SAUF si le preneur n'a pas assez de cartes
//    basses ; ils doivent alors être montrés aux autres joueurs.

import { isBout, isExcuse, isTrump } from './deck';
import { TarotAnnounceableContract } from './bidding';
import { TarotCard } from './types';

/** Rang du Roi parmi les rangs de couleur. */
const KING_RANK = 14;

/** Le contrat fait-il ramasser le chien en main (Petite / Garde) avec écart ? */
export function contractRequiresEcart(contract: TarotAnnounceableContract): boolean {
  return contract === 'petite' || contract === 'garde';
}

/** À qui revient le chien au comptage selon le contrat. */
export type TarotChienOwner = 'ecart' | 'taker' | 'defense';

/** Résultat de la prise du chien, dépendant du contrat. */
export type TarotChienResolution =
  | {
      /** Petite / Garde : main combinée à écarter. */
      contract: 'petite' | 'garde';
      requiresEcart: true;
      /** Main du preneur + chien, à partir de laquelle constituer l'écart. */
      combinedHand: TarotCard[];
      chienOwner: 'ecart';
    }
  | {
      /** Garde Sans : le chien va aux levées du preneur, non vu. */
      contract: 'garde-sans';
      requiresEcart: false;
      /** Main inchangée du preneur. */
      combinedHand: TarotCard[];
      /** Cartes du chien attribuées au preneur. */
      chien: TarotCard[];
      chienOwner: 'taker';
    }
  | {
      /** Garde Contre : le chien va aux levées de la défense. */
      contract: 'garde-contre';
      requiresEcart: false;
      /** Main inchangée du preneur. */
      combinedHand: TarotCard[];
      /** Cartes du chien attribuées à la défense. */
      chien: TarotCard[];
      chienOwner: 'defense';
    };

/**
 * Détermine le sort du chien selon le contrat retenu. Pour Petite/Garde, la
 * main combinée (main + chien) est renvoyée afin d'y constituer l'écart ; pour
 * Garde Sans/Contre, le chien est attribué directement sans toucher à la main.
 */
export function resolveChien(
  contract: TarotAnnounceableContract,
  takerHand: TarotCard[],
  chien: TarotCard[],
): TarotChienResolution {
  switch (contract) {
    case 'petite':
    case 'garde':
      return {
        contract,
        requiresEcart: true,
        combinedHand: [...takerHand, ...chien],
        chienOwner: 'ecart',
      };
    case 'garde-sans':
      return {
        contract,
        requiresEcart: false,
        combinedHand: [...takerHand],
        chien: [...chien],
        chienOwner: 'taker',
      };
    case 'garde-contre':
      return {
        contract,
        requiresEcart: false,
        combinedHand: [...takerHand],
        chien: [...chien],
        chienOwner: 'defense',
      };
  }
}

/**
 * Une carte est-elle librement écartable ? Seules les cartes de couleur autres
 * que les Rois le sont (les atouts, l'Excuse et les Rois sont en principe
 * interdits à l'écart).
 */
export function isFreelyDiscardable(card: TarotCard): boolean {
  return card.kind === 'suit' && card.rank !== KING_RANK;
}

/**
 * Un atout peut-il être placé à l'écart (par contrainte) ? Oui pour tout atout
 * qui n'est pas un bout (ni le Petit, ni le 21).
 */
export function isDiscardableTrump(card: TarotCard): boolean {
  return isTrump(card) && !isBout(card);
}

/**
 * Nombre maximal d'atouts autorisés à l'écart : la différence entre la taille
 * du chien et le nombre de cartes librement écartables disponibles (0 si le
 * preneur a assez de cartes basses).
 */
export function maxTrumpsInEcart(hand: TarotCard[], chienSize: number): number {
  const freelyDiscardable = hand.filter(isFreelyDiscardable).length;
  return Math.max(0, chienSize - freelyDiscardable);
}

/** Résultat de la validation d'un écart. */
export type TarotEcartValidation = {
  /** L'écart est-il légal ? */
  valid: boolean;
  /** Messages d'erreur (vide si valide). */
  errors: string[];
  /** L'écart contient-il des atouts à montrer aux autres joueurs ? */
  revealsTrumps: boolean;
};

/**
 * Valide un écart proposé à partir de la main combinée (main + chien). Vérifie
 * le nombre de cartes, l'appartenance à la main, l'absence de doublon et le
 * respect des cartes interdites (Roi, Excuse, bout) ainsi que la limite d'atouts.
 */
export function validateEcart(
  selection: TarotCard[],
  combinedHand: TarotCard[],
  chienSize: number,
): TarotEcartValidation {
  const errors: string[] = [];
  const handIds = new Set(combinedHand.map((card) => card.id));
  const seen = new Set<string>();

  if (selection.length !== chienSize) {
    errors.push(`L'écart doit contenir exactement ${chienSize} cartes (reçu ${selection.length}).`);
  }

  let trumpCount = 0;

  for (const card of selection) {
    if (!handIds.has(card.id)) {
      errors.push(`La carte « ${card.id} » n'est pas dans la main du preneur.`);
      continue;
    }
    if (seen.has(card.id)) {
      errors.push(`La carte « ${card.id} » est présente en double dans l'écart.`);
      continue;
    }
    seen.add(card.id);

    if (isExcuse(card)) {
      errors.push("L'Excuse ne peut pas être écartée.");
    } else if (card.kind === 'suit' && card.rank === KING_RANK) {
      errors.push(`Un Roi (${card.suit}) ne peut pas être écarté.`);
    } else if (card.kind === 'trump') {
      if (isBout(card)) {
        errors.push(`Un bout (atout ${card.rank}) ne peut pas être écarté.`);
      } else {
        trumpCount += 1;
      }
    }
  }

  const allowedTrumps = maxTrumpsInEcart(combinedHand, chienSize);
  if (trumpCount > allowedTrumps) {
    errors.push(
      `Trop d'atouts à l'écart (${trumpCount}) : au plus ${allowedTrumps} autorisé(s) ` +
        'lorsque le preneur manque de cartes basses.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    revealsTrumps: trumpCount > 0,
  };
}

/** Résultat de l'application d'un écart valide. */
export type TarotEcartResult = {
  /** Main du preneur après écart (les cartes conservées). */
  hand: TarotCard[];
  /** Cartes mises à l'écart (comptent dans les levées du preneur au score). */
  ecart: TarotCard[];
  /** Les atouts de l'écart doivent-ils être montrés aux autres joueurs ? */
  revealsTrumps: boolean;
};

/**
 * Constitue l'écart à partir de la main combinée. Valide d'abord la sélection
 * et lève une erreur si elle est illégale (un écart invalide ne doit jamais
 * produire un état de jeu corrompu).
 */
export function applyEcart(
  selection: TarotCard[],
  combinedHand: TarotCard[],
  chienSize: number,
): TarotEcartResult {
  const validation = validateEcart(selection, combinedHand, chienSize);
  if (!validation.valid) {
    throw new Error(`Écart invalide : ${validation.errors.join(' ')}`);
  }

  const discardIds = new Set(selection.map((card) => card.id));
  const hand = combinedHand.filter((card) => !discardIds.has(card.id));
  const ecart = combinedHand.filter((card) => discardIds.has(card.id));

  return { hand, ecart, revealsTrumps: validation.revealsTrumps };
}
