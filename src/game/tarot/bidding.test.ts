// Tests unitaires de la phase d'enchères du Tarot (bidding.ts) : force des
// contrats, état initial, contrats disponibles, légalité d'une annonce, machine
// à états (tour de table unique, désignation du preneur, redonne si tout passe).
// Lancé via `npm test`.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyBid,
  availableContracts,
  biddingResult,
  canBid,
  contractRank,
  createBiddingState,
  everyonePassed,
  type TarotBiddingState,
  type TarotContract,
} from '@/game/tarot';

/** Applique une suite d'annonces successives au joueur courant. */
function applyBids(state: TarotBiddingState, contracts: TarotContract[]): TarotBiddingState {
  return contracts.reduce((current, contract) => applyBid(current, contract), state);
}

// --- contractRank --------------------------------------------------------

describe('contractRank', () => {
  it('ordonne les contrats : passe < petite < garde < garde-sans < garde-contre', () => {
    assert.equal(contractRank('pass'), 0);
    assert.equal(contractRank('petite'), 1);
    assert.equal(contractRank('garde'), 2);
    assert.equal(contractRank('garde-sans'), 3);
    assert.equal(contractRank('garde-contre'), 4);
  });
});

// --- createBiddingState --------------------------------------------------

describe('createBiddingState', () => {
  it('initialise un état vierge, premier parleur en main', () => {
    const state = createBiddingState(4, 0);
    assert.equal(state.playerCount, 4);
    assert.equal(state.firstBidder, 0);
    assert.equal(state.currentPlayer, 0);
    assert.deepEqual(state.bids, []);
    assert.equal(state.highestBid, null);
    assert.equal(state.finished, false);
    assert.equal(state.taker, null);
    assert.equal(state.contract, null);
  });

  it('normalise firstBidder modulo le nombre de joueurs (y compris négatif)', () => {
    assert.equal(createBiddingState(4, 5).firstBidder, 1);
    assert.equal(createBiddingState(4, -1).firstBidder, 3);
  });
});

// --- availableContracts / canBid -----------------------------------------

describe('availableContracts', () => {
  it('propose les quatre contrats au premier parleur', () => {
    const state = createBiddingState(4, 0);
    assert.deepEqual(availableContracts(state), ['petite', 'garde', 'garde-sans', 'garde-contre']);
  });

  it('ne propose que les contrats strictement supérieurs au contrat courant', () => {
    const state = applyBid(createBiddingState(4, 0), 'garde');
    assert.deepEqual(availableContracts(state), ['garde-sans', 'garde-contre']);
  });

  it('renvoie une liste vide une fois les enchères closes', () => {
    const state = applyBids(createBiddingState(4, 0), ['petite', 'pass', 'pass', 'pass']);
    assert.deepEqual(availableContracts(state), []);
  });
});

describe('canBid', () => {
  it('autorise toujours le passe tant que les enchères sont ouvertes', () => {
    assert.equal(canBid(createBiddingState(4, 0), 'pass'), true);
  });

  it('refuse une annonce inférieure ou égale au contrat courant', () => {
    const state = applyBid(createBiddingState(4, 0), 'garde');
    assert.equal(canBid(state, 'garde'), false);
    assert.equal(canBid(state, 'petite'), false);
    assert.equal(canBid(state, 'garde-sans'), true);
  });
});

// --- applyBid : mécanique ------------------------------------------------

describe('applyBid', () => {
  it('enregistre une annonce et fait tourner la parole', () => {
    const state = applyBid(createBiddingState(4, 0), 'petite');
    assert.equal(state.bids.length, 1);
    assert.deepEqual(state.highestBid, { player: 0, contract: 'petite' });
    assert.equal(state.currentPlayer, 1);
    assert.equal(state.finished, false);
  });

  it('un passe ne modifie pas le meilleur contrat', () => {
    const state = applyBid(createBiddingState(4, 0), 'pass');
    assert.equal(state.highestBid, null);
    assert.equal(state.currentPlayer, 1);
  });

  it('ne mute pas l’état d’origine (immuabilité)', () => {
    const initial = createBiddingState(4, 0);
    applyBid(initial, 'garde');
    assert.equal(initial.bids.length, 0);
    assert.equal(initial.currentPlayer, 0);
  });

  it('lève une erreur sur une annonce illégale', () => {
    const state = applyBid(createBiddingState(4, 0), 'garde');
    assert.throws(() => applyBid(state, 'petite'), /illégale/);
  });

  it('lève une erreur si on annonce après la clôture', () => {
    const finished = applyBids(createBiddingState(4, 0), ['pass', 'pass', 'pass', 'pass']);
    assert.throws(() => applyBid(finished, 'petite'), /terminées/);
  });

  it('désigne le plus offrant comme preneur en fin de tour', () => {
    const state = applyBids(createBiddingState(4, 0), ['petite', 'garde', 'pass', 'pass']);
    assert.equal(state.finished, true);
    assert.equal(state.currentPlayer, null);
    assert.equal(state.taker, 1);
    assert.equal(state.contract, 'garde');
  });

  it('fait tourner la parole à partir de firstBidder', () => {
    let state = createBiddingState(4, 2);
    assert.equal(state.currentPlayer, 2);
    state = applyBid(state, 'pass');
    assert.equal(state.currentPlayer, 3);
    state = applyBid(state, 'petite');
    assert.equal(state.currentPlayer, 0);
    state = applyBid(state, 'pass');
    assert.equal(state.currentPlayer, 1);
    state = applyBid(state, 'pass');
    assert.equal(state.finished, true);
    assert.equal(state.taker, 3);
    assert.equal(state.contract, 'petite');
  });

  it('tout le monde passe : pas de preneur, donne à rejouer', () => {
    const state = applyBids(createBiddingState(4, 0), ['pass', 'pass', 'pass', 'pass']);
    assert.equal(state.finished, true);
    assert.equal(state.taker, null);
    assert.equal(state.contract, null);
  });
});

// --- biddingResult / everyonePassed --------------------------------------

describe('biddingResult', () => {
  it('renvoie null tant que les enchères ne sont pas closes', () => {
    assert.equal(biddingResult(createBiddingState(4, 0)), null);
  });

  it('renvoie le preneur et le contrat une fois closes', () => {
    const state = applyBids(createBiddingState(4, 0), ['garde-sans', 'pass', 'pass', 'pass']);
    assert.deepEqual(biddingResult(state), { taker: 0, contract: 'garde-sans' });
  });
});

describe('everyonePassed', () => {
  it('vrai seulement si les enchères sont closes sans aucune prise', () => {
    const passed = applyBids(createBiddingState(4, 0), ['pass', 'pass', 'pass', 'pass']);
    assert.equal(everyonePassed(passed), true);
  });

  it('faux si quelqu’un a pris', () => {
    const taken = applyBids(createBiddingState(4, 0), ['petite', 'pass', 'pass', 'pass']);
    assert.equal(everyonePassed(taken), false);
  });

  it('faux tant que les enchères sont en cours', () => {
    assert.equal(everyonePassed(applyBid(createBiddingState(4, 0), 'pass')), false);
  });
});
