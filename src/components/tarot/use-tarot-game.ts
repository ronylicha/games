// Hook d'état d'une partie de Tarot français à 4 joueurs.
//
// `useTarotGame` orchestre tout le cycle d'une donne — distribution, enchères,
// écart, jeu des plis, décompte — et fait jouer les adversaires artificiels.
//
// Architecture :
//  - un *reducer pur* (`tarotReducer`) encode toutes les transitions de phase
//    (aucun effet de bord, entièrement déterministe et testable) ;
//  - un *effet d'orchestration* détecte lorsqu'une IA doit agir et dispatche
//    son action après un court délai (pour laisser respirer l'interface),
//    à l'image des autres jeux du projet.
//
// Le hook ne duplique aucune règle : il s'appuie sur le moteur (`@/game/tarot`)
// pour les enchères, l'écart, les coups légaux, la résolution des plis et le
// score. Il gère en revanche la *distribution des cartes gagnées* entre les
// deux camps, y compris l'échange de l'Excuse (qui reste à son camp moyennant
// une carte de compensation), afin que le total des points reste exact (91).

import { useCallback, useEffect, useMemo, useReducer } from 'react';

import {
  applyEcart,
  applyBid,
  canBid,
  cardPointValue,
  chooseBid,
  chooseCardToPlay,
  chooseEcart,
  createBiddingState,
  createTrick,
  dealTarot,
  everyonePassed,
  isLegalPlay,
  isTrickComplete,
  legalPlays,
  playInTrick,
  resolveChien,
  scoreContractFromCards,
  TAROT_PLAYER_COUNT,
  trickWinner,
  validateEcart,
  type TarotAnnounceableContract,
  type TarotBiddingState,
  type TarotCard,
  type TarotChienResolution,
  type TarotContract,
  type TarotPhase,
  type TarotPlayer,
  type TarotScoreResult,
  type TarotTeam,
  type TarotTrick,
} from '@/game/tarot';

/** Délai (ms) avant qu'une IA ne joue, pour rendre le déroulé lisible. */
const AI_DELAY_MS = 650;

// ---------------------------------------------------------------------------
// État et actions
// ---------------------------------------------------------------------------

/** État complet d'une partie de Tarot piloté par le reducer. */
export type TarotGameState = {
  /** Phase courante de la donne. */
  phase: TarotPhase;
  /** Joueurs à la table (le humain et les IA). */
  players: TarotPlayer[];
  /** Index du joueur humain. */
  humanPlayer: number;
  /** Index du donneur ; le joueur à sa gauche parle/entame en premier. */
  dealer: number;
  /** Mains courantes, indexées par position (vidées au fil des plis). */
  hands: TarotCard[][];
  /** Le chien (talon) de la donne. */
  chien: TarotCard[];
  /** État de la phase d'enchères. */
  bidding: TarotBiddingState;
  /** Index du preneur, ou `null` tant qu'il n'est pas désigné. */
  taker: number | null;
  /** Contrat retenu, ou `null`. */
  contract: TarotAnnounceableContract | null;
  /** Résolution du chien selon le contrat (Petite/Garde : main combinée). */
  chienResolution: TarotChienResolution | null;
  /** Main combinée (main + chien) du preneur à écarter (Petite/Garde). */
  combinedHand: TarotCard[] | null;
  /** Écart constitué par le preneur (compte dans ses levées). */
  ecart: TarotCard[];
  /** Le preneur doit-il encore constituer son écart ? */
  awaitingEcart: boolean;
  /** Pli en cours. */
  trick: TarotTrick;
  /** Dernier pli résolu (pour l'affichage), ou `null`. */
  lastTrick: TarotTrick | null;
  /** Numéro du pli courant (1..18), 0 hors phase de jeu. */
  trickNumber: number;
  /** Cartes gagnées par le camp du preneur (plis + écart/chien selon contrat). */
  takerWon: TarotCard[];
  /** Cartes gagnées par la défense. */
  defenseWon: TarotCard[];
  /** Nombre de plis remportés par le preneur (pour détecter le chelem). */
  takerTricks: number;
  /** Compensation de l'Excuse à régler en fin de donne, ou `null`. */
  excuseComp: { from: TarotTeam; to: TarotTeam } | null;
  /** Résultat du décompte, ou `null` tant que la donne n'est pas finie. */
  result: TarotScoreResult | null;
  /** Scores cumulés de la partie, indexés par position. */
  totals: number[];
};

/** Actions du reducer (humaines ou déclenchées par l'IA). */
export type TarotAction =
  | { type: 'BID'; contract: TarotContract }
  | { type: 'SET_ECART'; selection: TarotCard[] }
  | { type: 'PLAY'; card: TarotCard }
  | { type: 'NEXT_DEAL' }
  | { type: 'NEW_GAME' };

/** Camp d'un joueur : le preneur joue seul, les autres défendent. */
function team(player: number, taker: number): TarotTeam {
  return player === taker ? 'taker' : 'defense';
}

/** Joueur dont c'est le tour d'agir, ou `null` si l'on attend un événement. */
export function currentActor(state: TarotGameState): number | null {
  switch (state.phase) {
    case 'bidding':
      return state.bidding.currentPlayer;
    case 'discard':
      return state.awaitingEcart ? state.taker : null;
    case 'playing':
      return (state.trick.leader + state.trick.plays.length) % TAROT_PLAYER_COUNT;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Création / transitions de phase
// ---------------------------------------------------------------------------

/** Démarre une nouvelle donne (distribution + enchères). */
function startDeal(
  players: TarotPlayer[],
  humanPlayer: number,
  dealer: number,
  totals: number[],
): TarotGameState {
  const deal = dealTarot(TAROT_PLAYER_COUNT);
  const firstBidder = (dealer + 1) % TAROT_PLAYER_COUNT;
  return {
    phase: 'bidding',
    players,
    humanPlayer,
    dealer,
    hands: deal.hands,
    chien: deal.chien,
    bidding: createBiddingState(TAROT_PLAYER_COUNT, firstBidder),
    taker: null,
    contract: null,
    chienResolution: null,
    combinedHand: null,
    ecart: [],
    awaitingEcart: false,
    trick: createTrick(firstBidder),
    lastTrick: null,
    trickNumber: 0,
    takerWon: [],
    defenseWon: [],
    takerTricks: 0,
    excuseComp: null,
    result: null,
    totals,
  };
}

/** Passe à la phase d'écart (ou directement au jeu selon le contrat). */
function enterDiscard(state: TarotGameState): TarotGameState {
  const taker = state.taker as number;
  const contract = state.contract as TarotAnnounceableContract;
  const resolution = resolveChien(contract, state.hands[taker], state.chien);

  if (resolution.requiresEcart) {
    return {
      ...state,
      phase: 'discard',
      chienResolution: resolution,
      combinedHand: resolution.combinedHand,
      awaitingEcart: true,
    };
  }

  // Garde Sans / Garde Contre : le chien rejoint directement un camp.
  let takerWon = state.takerWon;
  let defenseWon = state.defenseWon;
  if (resolution.chienOwner === 'taker') {
    takerWon = [...takerWon, ...resolution.chien];
  } else if (resolution.chienOwner === 'defense') {
    defenseWon = [...defenseWon, ...resolution.chien];
  }

  return enterPlaying({
    ...state,
    chienResolution: resolution,
    takerWon,
    defenseWon,
  });
}

/** Démarre la phase de jeu : le joueur à gauche du donneur entame. */
function enterPlaying(state: TarotGameState): TarotGameState {
  const leader = (state.dealer + 1) % TAROT_PLAYER_COUNT;
  return {
    ...state,
    phase: 'playing',
    awaitingEcart: false,
    combinedHand: null,
    trick: createTrick(leader),
    trickNumber: 1,
  };
}

/**
 * Répartit les cartes d'un pli résolu entre les camps, en gérant l'échange de
 * l'Excuse : sauf au dernier pli, l'Excuse reste à son camp, qui compense le
 * camp gagnant par une carte de faible valeur (réglée en fin de donne).
 */
function assignTrick(
  state: TarotGameState,
  trick: TarotTrick,
  winner: number,
  isLastTrick: boolean,
): Pick<TarotGameState, 'takerWon' | 'defenseWon' | 'excuseComp'> {
  const taker = state.taker as number;
  const winnerTeam = team(winner, taker);
  const excusePlay = trick.plays.find((play) => play.card.kind === 'excuse');

  let takerWon = state.takerWon;
  let defenseWon = state.defenseWon;
  let excuseComp = state.excuseComp;

  const addTo = (side: TarotTeam, cards: TarotCard[]) => {
    if (side === 'taker') {
      takerWon = [...takerWon, ...cards];
    } else {
      defenseWon = [...defenseWon, ...cards];
    }
  };

  if (excusePlay && !isLastTrick) {
    const ownerTeam = team(excusePlay.player, taker);
    const rest = trick.plays.filter((play) => play.card.kind !== 'excuse').map((play) => play.card);
    addTo(winnerTeam, rest);
    addTo(ownerTeam, [excusePlay.card]);
    if (ownerTeam !== winnerTeam) {
      excuseComp = { from: ownerTeam, to: winnerTeam };
    }
  } else {
    addTo(
      winnerTeam,
      trick.plays.map((play) => play.card),
    );
  }

  return { takerWon, defenseWon, excuseComp };
}

/** Décompte la donne et met à jour les scores cumulés. */
function enterScoring(state: TarotGameState): TarotGameState {
  const taker = state.taker as number;
  let takerWon = state.takerWon;
  let defenseWon = state.defenseWon;

  // Règle la compensation de l'Excuse : une carte à 0,5 point change de camp.
  if (state.excuseComp) {
    const fromTaker = state.excuseComp.from === 'taker';
    const fromPile = fromTaker ? takerWon : defenseWon;
    const index = fromPile.findIndex((card) => cardPointValue(card) === 0.5);
    if (index >= 0) {
      const card = fromPile[index];
      const reduced = fromPile.filter((_, i) => i !== index);
      if (fromTaker) {
        takerWon = reduced;
        defenseWon = [...defenseWon, card];
      } else {
        defenseWon = reduced;
        takerWon = [...takerWon, card];
      }
    }
  }

  // Petit au bout : le Petit (atout 1) joué au tout dernier pli, au camp qui le remporte.
  const lastTrick = state.trick;
  const petitInLast = lastTrick.plays.some(
    (play) => play.card.kind === 'trump' && play.card.rank === 1,
  );
  const petitAuBout =
    petitInLast && lastTrick.winner !== null ? team(lastTrick.winner, taker) : null;

  // Chelem (non annoncé) : le preneur remporte la totalité des plis.
  const chelem = state.takerTricks === totalTricks(state) ? 'unannounced-success' : null;

  const result = scoreContractFromCards(takerWon, {
    contract: state.contract as TarotAnnounceableContract,
    playerCount: TAROT_PLAYER_COUNT,
    petitAuBout,
    poignee: null,
    chelem,
  });

  const totals = state.totals.map(
    (total, index) => total + (index === taker ? result.takerScore : result.defenderScore),
  );

  return {
    ...state,
    phase: 'scoring',
    takerWon,
    defenseWon,
    excuseComp: null,
    result,
    totals,
  };
}

/** Nombre total de plis d'une donne (= taille initiale d'une main). */
function totalTricks(state: TarotGameState): number {
  // 78 cartes − 6 (chien) = 72 cartes jouées sur 4 mains → 18 plis.
  return (78 - state.chien.length) / TAROT_PLAYER_COUNT;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Action que joue l'IA pour le joueur `actor` selon la phase courante, ou
 * `null` si rien n'est attendu de lui. Fonction pure, partagée par l'effet
 * d'orchestration et les tests.
 */
export function aiActionFor(state: TarotGameState, actor: number): TarotAction | null {
  switch (state.phase) {
    case 'bidding':
      return { type: 'BID', contract: chooseBid(state.hands[actor], state.bidding) };
    case 'discard':
      return state.combinedHand
        ? { type: 'SET_ECART', selection: chooseEcart(state.combinedHand, state.chien.length) }
        : null;
    case 'playing': {
      const legal = legalPlays(state.hands[actor], state.trick.plays);
      const card = chooseCardToPlay({
        legalCards: legal,
        trick: state.trick,
        player: actor,
        taker: state.taker as number,
        playerCount: TAROT_PLAYER_COUNT,
      });
      return { type: 'PLAY', card };
    }
    default:
      return null;
  }
}

export function tarotReducer(state: TarotGameState, action: TarotAction): TarotGameState {
  switch (action.type) {
    case 'BID': {
      if (state.phase !== 'bidding') {
        return state;
      }
      if (!canBid(state.bidding, action.contract)) {
        return state;
      }
      const bidding = applyBid(state.bidding, action.contract);
      if (!bidding.finished) {
        return { ...state, bidding };
      }
      if (everyonePassed(bidding)) {
        // Tout le monde a passé : on redonne (le donneur tourne).
        return startDeal(
          state.players,
          state.humanPlayer,
          (state.dealer + 1) % TAROT_PLAYER_COUNT,
          state.totals,
        );
      }
      return enterDiscard({
        ...state,
        bidding,
        taker: bidding.taker,
        contract: bidding.contract,
      });
    }

    case 'SET_ECART': {
      if (state.phase !== 'discard' || !state.awaitingEcart || !state.combinedHand) {
        return state;
      }
      const chienSize = state.chien.length;
      if (!validateEcart(action.selection, state.combinedHand, chienSize).valid) {
        return state;
      }
      const applied = applyEcart(action.selection, state.combinedHand, chienSize);
      const hands = state.hands.map((hand, index) =>
        index === state.taker ? applied.hand : hand,
      );
      return enterPlaying({
        ...state,
        hands,
        ecart: applied.ecart,
        takerWon: [...state.takerWon, ...applied.ecart],
      });
    }

    case 'PLAY': {
      if (state.phase !== 'playing') {
        return state;
      }
      const actor = (state.trick.leader + state.trick.plays.length) % TAROT_PLAYER_COUNT;
      const hand = state.hands[actor];
      if (!isLegalPlay(action.card, hand, state.trick.plays)) {
        return state;
      }

      const hands = state.hands.map((current, index) =>
        index === actor ? current.filter((card) => card.id !== action.card.id) : current,
      );
      let trick = playInTrick(state.trick, { player: actor, card: action.card });

      if (!isTrickComplete(trick, TAROT_PLAYER_COUNT)) {
        return { ...state, hands, trick };
      }

      // Pli complet : résolution + répartition des cartes.
      const winner = trickWinner(trick.plays);
      trick = { ...trick, winner };
      const isLastTrick = hands.every((current) => current.length === 0);
      const distribution = assignTrick(state, trick, winner, isLastTrick);
      const takerTricks = state.takerTricks + (team(winner, state.taker as number) === 'taker' ? 1 : 0);

      if (!isLastTrick) {
        return {
          ...state,
          hands,
          trick: createTrick(winner),
          lastTrick: trick,
          trickNumber: state.trickNumber + 1,
          takerTricks,
          ...distribution,
        };
      }

      return enterScoring({
        ...state,
        hands,
        trick,
        lastTrick: trick,
        takerTricks,
        ...distribution,
      });
    }

    case 'NEXT_DEAL': {
      if (state.phase !== 'scoring' && state.phase !== 'finished') {
        return state;
      }
      return startDeal(
        state.players,
        state.humanPlayer,
        (state.dealer + 1) % TAROT_PLAYER_COUNT,
        state.totals,
      );
    }

    case 'NEW_GAME':
      return startDeal(
        state.players,
        state.humanPlayer,
        0,
        state.players.map(() => 0),
      );

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Noms par défaut des joueurs (position 0 = humain). */
const DEFAULT_NAMES: [string, string, string, string] = ['Vous', 'Awa', 'Théo', 'Lina'];

export type UseTarotGameOptions = {
  /** Index du joueur humain (défaut : 0). */
  humanPlayer?: number;
  /** Noms des quatre joueurs (défaut : Vous/Awa/Théo/Lina). */
  playerNames?: [string, string, string, string];
};

/** Construit l'état initial d'une partie (mémoïsé via l'initialiseur paresseux). */
export function createInitialState(options: UseTarotGameOptions): TarotGameState {
  const humanPlayer = options.humanPlayer ?? 0;
  const names = options.playerNames ?? DEFAULT_NAMES;
  const players: TarotPlayer[] = names.map((name, index) => ({
    index,
    name,
    isHuman: index === humanPlayer,
  }));
  return startDeal(players, humanPlayer, 0, players.map(() => 0));
}

/**
 * Valeur de retour du hook : l'état complet, des dérivés pratiques pour l'UI et
 * les actions du joueur humain. Les IA jouent automatiquement.
 */
export type UseTarotGameResult = {
  state: TarotGameState;
  /** Joueur dont c'est le tour, ou `null`. */
  currentPlayer: number | null;
  /** Est-ce au joueur humain d'agir ? */
  isHumanTurn: boolean;
  /** Coups légaux du joueur humain pendant son tour de jeu (sinon vide). */
  humanLegalCards: TarotCard[];
  /** Annonce un contrat pour le joueur humain. */
  bid: (contract: TarotContract) => void;
  /** Constitue l'écart du preneur humain. */
  setEcart: (selection: TarotCard[]) => void;
  /** Joue une carte pour le joueur humain. */
  playCard: (card: TarotCard) => void;
  /** Lance la donne suivante après le décompte. */
  nextDeal: () => void;
  /** Démarre une nouvelle partie (scores remis à zéro). */
  newGame: () => void;
};

export function useTarotGame(options: UseTarotGameOptions = {}): UseTarotGameResult {
  const [state, dispatch] = useReducer(tarotReducer, options, createInitialState);

  const actor = currentActor(state);
  const isAiTurn = actor !== null && !state.players[actor]?.isHuman;

  // Effet d'orchestration : fait agir l'IA après un court délai.
  useEffect(() => {
    if (actor === null || state.players[actor]?.isHuman) {
      return;
    }

    const timeout = setTimeout(() => {
      const action = aiActionFor(state, actor);
      if (action) {
        dispatch(action);
      }
    }, AI_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [actor, state]);

  const isHumanTurn = actor !== null && !isAiTurn && actor === state.humanPlayer;

  const humanLegalCards = useMemo(() => {
    if (state.phase !== 'playing' || actor !== state.humanPlayer) {
      return [];
    }
    return legalPlays(state.hands[state.humanPlayer], state.trick.plays);
  }, [state, actor]);

  const bid = useCallback((contract: TarotContract) => dispatch({ type: 'BID', contract }), []);
  const setEcart = useCallback(
    (selection: TarotCard[]) => dispatch({ type: 'SET_ECART', selection }),
    [],
  );
  const playCard = useCallback((card: TarotCard) => dispatch({ type: 'PLAY', card }), []);
  const nextDeal = useCallback(() => dispatch({ type: 'NEXT_DEAL' }), []);
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);

  return {
    state,
    currentPlayer: actor,
    isHumanTurn,
    humanLegalCards,
    bid,
    setEcart,
    playCard,
    nextDeal,
    newGame,
  };
}
