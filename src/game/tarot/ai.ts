// IA du Tarot français : décisions d'enchère, d'écart et de jeu de la carte.
//
// Ce module regroupe trois adversaires artificiels, chacun sous forme de
// fonctions pures (aucune mutation des entrées, aucun effet de bord) :
//
//  1. Enchères   : `chooseBid` évalue la force de la main et annonce le contrat
//                  le plus ambitieux raisonnable, ou passe.
//  2. Écart      : `chooseEcart` constitue un écart légal en privilégiant les
//                  basses cartes et la création de chicanes (coupes futures).
//  3. Jeu        : `chooseCardToPlay` choisit la carte à poser parmi les coups
//                  légaux fournis par le moteur de plis.
//
// Choix d'architecture : l'IA de jeu reçoit les coups légaux (`legalCards`) en
// entrée plutôt que de recalculer les règles de fourniture/coupe. Ces règles
// appartiennent au moteur de plis (`trick.ts`) ; l'orchestrateur les calcule
// puis les transmet ici. L'IA reste ainsi découplée, sans duplication, et son
// évaluation de la force d'une carte (`trickStrength`) lui est propre — tout
// comme une fonction d'évaluation est propre à un moteur d'IA.

import { TAROT_PLAYER_COUNT } from './constants';
import { TAROT_SUITS, isBout, isExcuse, isTrump } from './deck';
import {
  isDiscardableTrump,
  isFreelyDiscardable,
  maxTrumpsInEcart,
  validateEcart,
} from './discard';
import { TarotContract, TarotBiddingState, canBid } from './bidding';
import { cardPointValue, countCardPoints } from './scoring';
import { TarotLedSuit, ledSuit, trickWinner } from './play';
import { TarotCard, TarotPlayerCount, TarotTrick } from './types';

// ---------------------------------------------------------------------------
// 1. IA d'enchères
// ---------------------------------------------------------------------------

/** Rang d'une figure « Roi » parmi les rangs de couleur. */
const KING_RANK = 14;
/** Rang d'une figure « Dame » parmi les rangs de couleur. */
const QUEEN_RANK = 13;
/** Seuil à partir duquel un atout est considéré comme « maître ». */
const MASTER_TRUMP_RANK = 15;

/**
 * Seuils de force (cf. `evaluateBiddingStrength`) déclenchant chaque contrat.
 * En dessous du seuil « petite » l'IA passe ; au-delà du dernier seuil elle
 * tente la Garde Contre. Valeurs calibrées sur une main de 18 cartes (4 j.).
 */
const BID_THRESHOLDS = {
  petite: 18,
  garde: 28,
  'garde-sans': 40,
  'garde-contre': 52,
} as const;

/**
 * Évalue la force d'une main pour les enchères via une heuristique de points
 * (inspirée du comptage usuel) :
 *  - bouts : le 21 et l'Excuse sont des prises quasi acquises ; le Petit ne
 *    vaut sa pleine valeur que s'il est protégé par assez d'atouts ;
 *  - longueur d'atout : socle proportionnel + bonus pour les atouts maîtres ;
 *  - figures : Rois (très utiles), Dames (utiles) ;
 *  - distribution : chicanes et singletons (potentiel de coupe).
 */
export function evaluateBiddingStrength(hand: TarotCard[]): number {
  const trumps = hand.filter(isTrump);
  const trumpCount = trumps.length;
  let score = 0;

  // --- Bouts ---
  const hasPetit = trumps.some((card) => card.kind === 'trump' && card.rank === 1);
  const has21 = trumps.some((card) => card.kind === 'trump' && card.rank === 21);
  const hasExcuse = hand.some(isExcuse);

  if (has21) {
    score += 9; // le 21 ne peut jamais être capturé : bout garanti.
  }
  if (hasExcuse) {
    score += 7; // l'Excuse reste toujours à son propriétaire.
  }
  if (hasPetit) {
    // Le Petit doit être escorté par des atouts pour ne pas être pris.
    if (trumpCount >= 8) {
      score += 8;
    } else if (trumpCount >= 6) {
      score += 5;
    } else {
      score += 2;
    }
  }

  // --- Longueur et qualité d'atout ---
  score += trumpCount * 2;
  score += trumps.filter((card) => card.kind === 'trump' && card.rank >= MASTER_TRUMP_RANK).length * 1.5;

  // --- Figures de couleur ---
  const suitCards = hand.filter((card): card is Extract<TarotCard, { kind: 'suit' }> => card.kind === 'suit');
  score += suitCards.filter((card) => card.rank === KING_RANK).length * 3;
  score += suitCards.filter((card) => card.rank === QUEEN_RANK).length * 1;

  // --- Distribution : potentiel de coupe ---
  for (const suit of TAROT_SUITS) {
    const length = suitCards.filter((card) => card.suit === suit).length;
    if (length === 0) {
      score += 4; // chicane : on coupe dès le premier tour.
    } else if (length === 1) {
      score += 2; // singleton.
    } else if (length === 2) {
      score += 1;
    }
  }

  return score;
}

/**
 * Contrat le plus ambitieux que l'IA souhaite jouer compte tenu de sa main,
 * indépendamment des annonces déjà faites. Renvoie `pass` si la main est trop
 * faible pour prendre.
 */
export function suggestContract(hand: TarotCard[]): TarotContract {
  const strength = evaluateBiddingStrength(hand);

  if (strength >= BID_THRESHOLDS['garde-contre']) {
    return 'garde-contre';
  }
  if (strength >= BID_THRESHOLDS['garde-sans']) {
    return 'garde-sans';
  }
  if (strength >= BID_THRESHOLDS.garde) {
    return 'garde';
  }
  if (strength >= BID_THRESHOLDS.petite) {
    return 'petite';
  }
  return 'pass';
}

/**
 * Décide de l'annonce de l'IA pour le joueur courant des enchères. Elle vise le
 * contrat suggéré par sa main mais ne l'annonce que s'il surpasse la meilleure
 * enchère en cours (sinon elle passe).
 */
export function chooseBid(hand: TarotCard[], state: TarotBiddingState): TarotContract {
  const desired = suggestContract(hand);
  if (desired === 'pass') {
    return 'pass';
  }
  // `canBid` n'accepte le contrat que s'il est strictement supérieur au contrat
  // courant : si la main ne « bat » pas l'enchère en place, on passe.
  return canBid(state, desired) ? desired : 'pass';
}

// ---------------------------------------------------------------------------
// 2. IA d'écart
// ---------------------------------------------------------------------------

/**
 * Constitue un écart légal à partir de la main combinée (main du preneur +
 * chien) pour les contrats Petite/Garde. Stratégie :
 *  - n'écarter que des cartes de couleur autres que Rois (jamais Roi, Excuse
 *    ni bout) ;
 *  - privilégier les plus basses cartes, puis celles des couleurs courtes
 *    dépourvues de Roi (création de chicanes pour couper ensuite) ;
 *  - en dernier recours, écarter de bas atouts (non-bouts), dans la limite
 *    légale, lorsque les basses cartes manquent.
 *
 * Le résultat est toujours validé : l'écart renvoyé est garanti légal.
 */
export function chooseEcart(combinedHand: TarotCard[], chienSize: number): TarotCard[] {
  // Couleurs possédant un Roi : on ne pourra jamais les rendre chicane (le Roi
  // n'est pas écartable), donc vider une telle couleur n'apporte rien.
  const suitsWithKing = new Set(
    combinedHand
      .filter((card) => card.kind === 'suit' && card.rank === KING_RANK)
      .map((card) => (card.kind === 'suit' ? card.suit : '')),
  );

  const freelyDiscardable = combinedHand.filter(isFreelyDiscardable);

  /** Bonus de « vidage » : plus une couleur sans Roi est courte, plus la vider est aisé. */
  const voidBonus = (card: TarotCard): number => {
    if (card.kind !== 'suit' || suitsWithKing.has(card.suit)) {
      return 0;
    }
    const suitLength = freelyDiscardable.filter(
      (other) => other.kind === 'suit' && other.suit === card.suit,
    ).length;
    return Math.max(0, 6 - suitLength);
  };

  const ranked = [...freelyDiscardable].sort((a, b) => {
    // 1. Sécuriser d'abord les cartes de plus faible valeur.
    const valueDiff = cardPointValue(a) - cardPointValue(b);
    if (valueDiff !== 0) {
      return valueDiff;
    }
    // 2. À valeur égale, favoriser la création de chicanes.
    const bonusDiff = voidBonus(b) - voidBonus(a);
    if (bonusDiff !== 0) {
      return bonusDiff;
    }
    // 3. À défaut, la carte de plus bas rang.
    return suitRank(a) - suitRank(b);
  });

  let selection = ranked.slice(0, chienSize);

  // Pas assez de basses cartes de couleur : compléter par de bas atouts, dans
  // la limite autorisée (atouts montrés aux adversaires).
  if (selection.length < chienSize) {
    const allowedTrumps = maxTrumpsInEcart(combinedHand, chienSize);
    const lowTrumps = combinedHand
      .filter(isDiscardableTrump)
      .sort((a, b) => trumpRank(a) - trumpRank(b))
      .slice(0, allowedTrumps);
    selection = [...selection, ...lowTrumps].slice(0, chienSize);
  }

  // Garde-fou : un écart corrompu ne doit jamais sortir de l'IA. En cas
  // d'imprévu, on retombe sur une sélection sûre (basses cartes + atouts permis).
  if (!validateEcart(selection, combinedHand, chienSize).valid) {
    selection = safeFallbackEcart(combinedHand, chienSize);
  }

  return selection;
}

/**
 * Écart de repli purement mécanique : prend les premières cartes librement
 * écartables, puis complète avec les atouts autorisés. Utilisé uniquement si
 * l'heuristique produit (théoriquement) une sélection invalide.
 */
function safeFallbackEcart(combinedHand: TarotCard[], chienSize: number): TarotCard[] {
  const freely = combinedHand.filter(isFreelyDiscardable).slice(0, chienSize);
  if (freely.length >= chienSize) {
    return freely;
  }
  const allowedTrumps = maxTrumpsInEcart(combinedHand, chienSize);
  const trumps = combinedHand
    .filter(isDiscardableTrump)
    .sort((a, b) => trumpRank(a) - trumpRank(b))
    .slice(0, allowedTrumps);
  return [...freely, ...trumps].slice(0, chienSize);
}

// ---------------------------------------------------------------------------
// 3. IA de jeu de la carte
// ---------------------------------------------------------------------------

/**
 * Contexte fourni à l'IA pour choisir sa carte. Les coups légaux sont calculés
 * en amont par le moteur de plis (`trick.ts`) puis transmis ici : l'IA ne
 * recalcule jamais les règles de fourniture/coupe.
 */
export type TarotPlayContext = {
  /** Cartes que l'IA peut légalement jouer (non vide quand c'est son tour). */
  legalCards: TarotCard[];
  /** Pli en cours (cartes déjà posées, dans l'ordre de jeu). */
  trick: TarotTrick;
  /** Index du joueur IA appelé à jouer. */
  player: number;
  /** Index du preneur (détermine les camps : seul vs défense). */
  taker: number;
  /** Nombre de joueurs à la table (défaut : 4). */
  playerCount?: TarotPlayerCount;
};

/**
 * Choisit la carte à jouer parmi les coups légaux. Heuristique :
 *  - à l'entame : sonder avec une basse carte de sa couleur la plus longue,
 *    en conservant les atouts pour couper (jamais entamer par un bout) ;
 *  - si le partenaire tient le pli : charger les points en dernier, sinon
 *    jouer petit (des adversaires restent à passer) ;
 *  - si un adversaire tient le pli : le coiffer au moindre coût quand cela en
 *    vaut la peine, sinon se défausser (en lâchant l'Excuse si possible, ce
 *    qui préserve ce bout).
 */
export function chooseCardToPlay(context: TarotPlayContext): TarotCard {
  const { legalCards, trick } = context;
  if (legalCards.length === 0) {
    throw new Error("Aucun coup légal fourni à l'IA de jeu.");
  }
  if (legalCards.length === 1) {
    return legalCards[0];
  }

  const playerCount = context.playerCount ?? (TAROT_PLAYER_COUNT as TarotPlayerCount);
  const led = ledSuit(trick.plays);

  // Entame (pli vide ou ne contenant encore que l'Excuse, qui ne fixe pas la couleur).
  if (led === null) {
    return chooseLead(legalCards);
  }

  // Résolution autoritaire du gagnant courant déléguée au moteur de plis.
  const winnerPlayer = trickWinner(trick.plays);
  const winnerPlay = trick.plays.find((play) => play.player === winnerPlayer);
  if (winnerPlay === undefined) {
    return chooseLead(legalCards);
  }

  const aiTeam = team(context.player, context.taker);
  const winnerTeam = team(winnerPlayer, context.taker);
  const playersAfter = playerCount - 1 - trick.plays.length;
  const isLast = playersAfter <= 0;

  if (winnerTeam === aiTeam) {
    // Le partenaire tient le pli.
    return isLast ? highestValueToDump(legalCards) : lowestValueToKeep(legalCards);
  }

  // Un adversaire tient le pli : peut-on / veut-on le coiffer ?
  const winnerStrength = trickStrength(winnerPlay.card, led);
  const beating = legalCards.filter((card) => trickStrength(card, led) > winnerStrength);

  if (beating.length > 0) {
    const pointsOnTable = countCardPoints(trick.plays.map((play) => play.card));
    // On coiffe si l'on est le dernier à parler, si le pli vaut des points, ou
    // si l'on est le preneur (qui doit batailler pour atteindre son seuil).
    const worthWinning = isLast || pointsOnTable >= 4.5 || aiTeam === 'taker';
    if (worthWinning) {
      return cheapestWinner(beating, led);
    }
  }

  // Ne peut pas (ou ne souhaite pas) gagner : se défausser au moindre coût.
  return discardLow(legalCards, led);
}

// ---------------------------------------------------------------------------
// Helpers de jeu de la carte
// ---------------------------------------------------------------------------

/**
 * Force d'une carte au sein du pli courant (plus haut = plus fort), cohérente
 * avec la résolution de `trickWinner` (play.ts) : l'Excuse ne remporte jamais
 * le pli ; les atouts dominent toutes les couleurs ; une carte de couleur ne
 * compte que si elle suit la couleur demandée.
 */
function trickStrength(card: TarotCard, led: TarotLedSuit): number {
  if (card.kind === 'excuse') {
    return -1;
  }
  if (card.kind === 'trump') {
    return 1000 + card.rank;
  }
  if (led !== 'trump' && card.suit === led) {
    return card.rank;
  }
  return -1; // couleur hors entame ou défausse : ne peut pas gagner.
}

/** Camp d'un joueur : le preneur joue seul, tous les autres défendent. */
function team(player: number, taker: number): 'taker' | 'defense' {
  return player === taker ? 'taker' : 'defense';
}

/**
 * Carte de plus forte valeur à offrir au pli déjà gagné par le camp (le
 * partenaire encaisse les points). L'Excuse est exclue : elle reste toujours à
 * son propriétaire et ne donnerait aucun point au partenaire.
 */
function highestValueToDump(cards: TarotCard[]): TarotCard {
  const givable = cards.filter((card) => !isExcuse(card));
  const pool = givable.length > 0 ? givable : cards;
  return [...pool].sort((a, b) => {
    const valueDiff = cardPointValue(b) - cardPointValue(a);
    if (valueDiff !== 0) {
      return valueDiff;
    }
    // À valeur égale, conserver ses atouts (lâcher la couleur en priorité).
    return trumpPreference(a) - trumpPreference(b);
  })[0];
}

/**
 * Carte de plus faible valeur à conserver (des adversaires restent à jouer) :
 * on se sépare de la carte la moins utile sans gaspiller un atout.
 */
function lowestValueToKeep(cards: TarotCard[]): TarotCard {
  return [...cards].sort((a, b) => {
    const valueDiff = cardPointValue(a) - cardPointValue(b);
    if (valueDiff !== 0) {
      return valueDiff;
    }
    // À valeur égale, lâcher une couleur plutôt qu'un atout.
    return trumpPreference(a) - trumpPreference(b);
  })[0];
}

/** Parmi des cartes gagnantes, la moins chère à jouer (juste assez pour coiffer). */
function cheapestWinner(beating: TarotCard[], led: TarotLedSuit): TarotCard {
  return [...beating].sort((a, b) => {
    const strengthDiff = trickStrength(a, led) - trickStrength(b, led);
    if (strengthDiff !== 0) {
      return strengthDiff;
    }
    return cardPointValue(a) - cardPointValue(b);
  })[0];
}

/**
 * Défausse au moindre coût sur un pli perdu. Jouer l'Excuse est idéal : on la
 * lâche en cédant une basse carte plus tard, préservant ainsi ce bout. À défaut,
 * on se sépare de la carte la moins précieuse (en conservant les atouts).
 */
function discardLow(cards: TarotCard[], led: TarotLedSuit): TarotCard {
  const excuse = cards.find(isExcuse);
  if (excuse) {
    return excuse;
  }
  return [...cards].sort((a, b) => {
    const valueDiff = cardPointValue(a) - cardPointValue(b);
    if (valueDiff !== 0) {
      return valueDiff;
    }
    // À valeur égale, conserver les atouts (qui servent à couper).
    const prefDiff = trumpPreference(a) - trumpPreference(b);
    if (prefDiff !== 0) {
      return prefDiff;
    }
    return trickStrength(a, led) - trickStrength(b, led);
  })[0];
}

/**
 * Choix de l'entame : sonder par une basse carte de la couleur la plus longue
 * (en gardant les atouts pour couper), sans jamais entamer par un bout.
 */
function chooseLead(cards: TarotCard[]): TarotCard {
  const nonBout = cards.filter((card) => !isBout(card));
  const pool = nonBout.length > 0 ? nonBout : cards;

  const suitCards = pool.filter(
    (card): card is Extract<TarotCard, { kind: 'suit' }> => card.kind === 'suit',
  );
  if (suitCards.length > 0) {
    return lowestOfLongestSuit(suitCards);
  }

  // Plus que des atouts (et/ou l'Excuse) : mener le plus bas atout disponible.
  const trumps = pool.filter(isTrump);
  if (trumps.length > 0) {
    return [...trumps].sort((a, b) => trumpRank(a) - trumpRank(b))[0];
  }
  return pool[0];
}

/** Plus basse carte de la couleur la mieux fournie (favorise les coupes futures). */
function lowestOfLongestSuit(suitCards: Extract<TarotCard, { kind: 'suit' }>[]): TarotCard {
  const lengthBySuit = new Map<string, number>();
  for (const card of suitCards) {
    lengthBySuit.set(card.suit, (lengthBySuit.get(card.suit) ?? 0) + 1);
  }

  return [...suitCards].sort((a, b) => {
    const lengthDiff = (lengthBySuit.get(b.suit) ?? 0) - (lengthBySuit.get(a.suit) ?? 0);
    if (lengthDiff !== 0) {
      return lengthDiff; // couleur la plus longue d'abord.
    }
    return a.rank - b.rank; // puis la plus basse carte.
  })[0];
}

// ---------------------------------------------------------------------------
// Petits accès typés
// ---------------------------------------------------------------------------

/** Rang d'une carte de couleur (0 si ce n'en est pas une). */
function suitRank(card: TarotCard): number {
  return card.kind === 'suit' ? card.rank : 0;
}

/** Rang d'un atout (0 si ce n'en est pas un). */
function trumpRank(card: TarotCard): number {
  return card.kind === 'trump' ? card.rank : 0;
}

/** Ordonne pour préférer se défaire d'une couleur (0) plutôt que d'un atout (1). */
function trumpPreference(card: TarotCard): number {
  return card.kind === 'trump' ? 1 : 0;
}
