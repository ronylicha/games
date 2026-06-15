/**
 * Barrel export du moteur de Tarot français à 4 joueurs.
 *
 * Surface d'import unique pour les consommateurs (hook useTarotGame, UI,
 * IA) : `import { dealTarot, scoreContract, type TarotCard } from '@/game/tarot'`.
 *
 * Couches réexportées :
 *  - constants : règles figées (paquet, contrats, primes, seuils).
 *  - types     : vocabulaire partagé (cartes, donne, joueurs, plis).
 *  - deck      : création/mélange/distribution + prédicats de cartes.
 *  - bidding   : machine à états des enchères.
 *  - discard   : prise du chien et constitution de l'écart.
 *  - play      : coups légaux et résolution des plis.
 *  - scoring   : comptage des points et score du contrat.
 *  - ai        : adversaires artificiels (enchères, écart, jeu de la carte).
 */
export * from './constants';
export * from './types';
export * from './deck';
export * from './bidding';
export * from './discard';
export * from './play';
export * from './scoring';
export * from './ai';

// `constants.ts` et `deck.ts` déclarent tous deux `TAROT_DECK_SIZE` et
// `TAROT_SUITS` (valeurs identiques). Deux `export *` rendraient ces noms
// ambigus → silencieusement exclus du barrel. La réexport nommée ci-dessous
// a priorité et fixe `constants.ts` comme source de vérité.
export { TAROT_DECK_SIZE, TAROT_SUITS } from './constants';
