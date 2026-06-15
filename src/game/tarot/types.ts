// Types de base du Tarot français (jeu de 78 cartes).
//
// Le jeu se compose de :
//  - 56 cartes de couleur : 4 couleurs × 14 rangs (1..10 puis Valet, Cavalier,
//    Dame, Roi soit les rangs 11..14) ;
//  - 21 atouts numérotés de 1 à 21 ;
//  - l'Excuse, carte unique sans couleur ni rang.

export type TarotSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type TarotCardKind = 'suit' | 'trump' | 'excuse';

/** Rang d'une carte de couleur : 1..10, puis 11=Valet, 12=Cavalier, 13=Dame, 14=Roi. */
export type TarotSuitRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** Rang d'un atout : 1..21 (le 1 est le « Petit »). */
export type TarotTrumpRank =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;

export type TarotSuitCard = {
  id: string;
  kind: 'suit';
  suit: TarotSuit;
  rank: TarotSuitRank;
};

export type TarotTrumpCard = {
  id: string;
  kind: 'trump';
  rank: TarotTrumpRank;
};

export type TarotExcuseCard = {
  id: string;
  kind: 'excuse';
};

/**
 * Une carte du Tarot. Union discriminée sur `kind` : seules les cartes de
 * couleur portent une `suit`, ce qui rend impossible un atout avec couleur.
 */
export type TarotCard = TarotSuitCard | TarotTrumpCard | TarotExcuseCard;

/** Nombre de joueurs supportés à une table de Tarot. */
export type TarotPlayerCount = 3 | 4 | 5;

/** Paramètres de distribution selon le nombre de joueurs. */
export type TarotDealConfig = {
  players: TarotPlayerCount;
  /** Nombre de cartes dans la main de chaque joueur. */
  handSize: number;
  /** Nombre de cartes mises de côté dans le chien (talon). */
  chienSize: number;
};

/** Résultat d'une distribution : une main par joueur et le chien. */
export type TarotDeal = {
  /** Mains des joueurs, indexées par position (0 = donneur suivant). */
  hands: TarotCard[][];
  /** Le chien (talon) mis de côté pendant la donne. */
  chien: TarotCard[];
};

// ---------------------------------------------------------------------------
// Types transverses du moteur
//
// Ces types relient les phases de la donne (enchères, écart, jeu de la carte,
// décompte). Ils constituent le vocabulaire partagé des modules de plis, de
// score et de l'interface (table, plateau). Les types propres à une phase
// précise restent co-localisés avec sa logique (cf. `bidding.ts`, `discard.ts`),
// tandis que l'agrégat d'état de partie est laissé au hook orchestrateur.
// ---------------------------------------------------------------------------

/**
 * Identité d'un joueur à la table. `index` est la position canonique
 * (0..playerCount-1) utilisée par tous les modules pour désigner un joueur.
 */
export type TarotPlayer = {
  /** Position à la table (0..playerCount-1). */
  index: number;
  /** Nom affiché du joueur. */
  name: string;
  /** Vrai si le joueur est contrôlé par un humain, faux pour l'IA. */
  isHuman: boolean;
};

/**
 * Camp d'un joueur une fois le preneur désigné : le preneur joue seul
 * (`taker`) contre les autres joueurs (`defense`).
 */
export type TarotTeam = 'taker' | 'defense';

/**
 * Phase courante d'une donne de Tarot, dans l'ordre chronologique du
 * déroulement : distribution, enchères, écart, jeu des plis, décompte, fin.
 */
export type TarotPhase =
  | 'dealing'
  | 'bidding'
  | 'discard'
  | 'playing'
  | 'scoring'
  | 'finished';

/** Une carte posée par un joueur au cours d'un pli. */
export type TarotPlay = {
  /** Index du joueur (0..playerCount-1) ayant joué la carte. */
  player: number;
  /** Carte effectivement posée. */
  card: TarotCard;
};

/**
 * Un pli : la suite ordonnée des cartes jouées par les joueurs lors d'un tour
 * de table. `winner` n'est renseigné qu'une fois le pli complet (résolu par le
 * module de jeu de la carte).
 */
export type TarotTrick = {
  /** Index du joueur qui entame le pli (pose la première carte). */
  leader: number;
  /** Cartes jouées, dans l'ordre de jeu. */
  plays: TarotPlay[];
  /** Index du joueur remportant le pli, ou `null` tant qu'il n'est pas résolu. */
  winner: number | null;
};
