// Constantes de regles du Tarot francais (variante a 4 joueurs).
//
// Ce fichier est la source de verite des regles : les types du moteur en
// derivent (ex. `typeof TAROT_SUITS[number]`). Il ne depend d'aucun autre
// module afin de rester autonome et testable isolement.

/** Nombre de joueurs supporte par ce moteur. */
export const TAROT_PLAYER_COUNT = 4;

/** Taille du paquet complet : 56 cartes de couleur + 21 atouts + l'Excuse. */
export const TAROT_DECK_SIZE = 78;

/** Total des points presents dans le paquet (systeme demi-points). */
export const TAROT_TOTAL_CARD_POINTS = 91;

// --- Couleurs et rangs --------------------------------------------------

/** Les quatre couleurs (enseignes) du jeu, dans l'ordre canonique. */
export const TAROT_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

/** Rangs d'une couleur, du plus faible au plus fort. */
export const TAROT_SUIT_RANKS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  'jack',
  'knight',
  'queen',
  'king',
] as const;

/** Nombre de cartes par couleur (1 a 10 + 4 figures). */
export const TAROT_CARDS_PER_SUIT = 14;

// --- Atouts et Excuse ---------------------------------------------------

/** Numero du plus petit atout (le Petit). */
export const TAROT_TRUMP_MIN = 1;

/** Numero du plus grand atout (le 21 / le Monde). */
export const TAROT_TRUMP_MAX = 21;

/** Identifiant de l'Excuse (le Fou), seule carte sans couleur ni atout. */
export const TAROT_EXCUSE_ID = 'excuse';

/**
 * Les trois bouts (oudlers) : cartes maitresses qui fixent le seuil de
 * points a atteindre par le preneur.
 */
export const TAROT_BOUTS = {
  petit: TAROT_TRUMP_MIN,
  monde: TAROT_TRUMP_MAX,
  excuse: TAROT_EXCUSE_ID,
} as const;

/** Nombre total de bouts dans le paquet. */
export const TAROT_BOUT_COUNT = 3;

// --- Distribution -------------------------------------------------------

/** Nombre de cartes du chien (4 joueurs). */
export const TAROT_DOG_SIZE = 6;

/** Nombre de cartes en main par joueur (4 joueurs : (78 - 6) / 4). */
export const TAROT_HAND_SIZE = 18;

/** Nombre de cartes distribuees a chaque pioche (regle des paquets de 3). */
export const TAROT_DEAL_BATCH = 3;

// --- Valeur des cartes (systeme demi-points) ----------------------------

/**
 * Valeur en points de chaque categorie de carte. Les cartes se comptent par
 * paires ; la somme du paquet vaut TAROT_TOTAL_CARD_POINTS (91).
 */
export const TAROT_CARD_POINTS = {
  /** Bout (Petit, 21, Excuse). */
  bout: 4.5,
  /** Roi. */
  king: 4.5,
  /** Dame. */
  queen: 3.5,
  /** Cavalier. */
  knight: 2.5,
  /** Valet. */
  jack: 1.5,
  /** Toute autre carte (atout simple ou basse carte de couleur). */
  plain: 0.5,
} as const;

// --- Encheres (contrats) ------------------------------------------------

/**
 * Contrats annoncables et leur multiplicateur de score. `pass` (multiplicateur
 * 0) represente le fait de passer.
 */
export const TAROT_CONTRACTS = {
  pass: { label: 'Passe', multiplier: 0 },
  petite: { label: 'Petite', multiplier: 1 },
  garde: { label: 'Garde', multiplier: 2 },
  'garde-sans': { label: 'Garde Sans', multiplier: 4 },
  'garde-contre': { label: 'Garde Contre', multiplier: 6 },
} as const;

/** Ordre croissant des contrats annoncables (sans le passe). */
export const TAROT_CONTRACT_ORDER = [
  'petite',
  'garde',
  'garde-sans',
  'garde-contre',
] as const;

// --- Scoring ------------------------------------------------------------

/**
 * Seuil de points a atteindre par le preneur selon le nombre de bouts qu'il
 * possede en fin de partie (cle = nombre de bouts).
 */
export const TAROT_TARGET_BY_BOUTS = {
  0: 56,
  1: 51,
  2: 41,
  3: 36,
} as const;

/** Socle de points ajoute (ou retire) a l'ecart avant multiplication. */
export const TAROT_BASE_SCORE = 25;

/**
 * Prime du Petit au bout : 10 points (multiplies par le contrat) accordes au
 * camp qui remporte le dernier pli avec le Petit (atout 1).
 */
export const TAROT_PETIT_AU_BOUT_BONUS = 10;

/**
 * Primes de poignee (atouts montres avant le jeu) pour la variante 4 joueurs :
 * nombre d'atouts requis et bonus de points associe.
 */
export const TAROT_POIGNEE = {
  simple: { trumps: 10, bonus: 20 },
  double: { trumps: 13, bonus: 30 },
  triple: { trumps: 15, bonus: 40 },
} as const;

/**
 * Bonus/malus de chelem (tous les plis remportes) :
 * - annonce et reussi : +400
 * - non annonce mais reussi : +200
 * - annonce et echoue : -200
 */
export const TAROT_CHELEM = {
  announcedSuccess: 400,
  unannouncedSuccess: 200,
  announcedFail: -200,
} as const;
