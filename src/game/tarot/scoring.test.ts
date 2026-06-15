// Tests unitaires du décompte et du score du Tarot (scoring.ts) : valeur des
// cartes (système demi-points), comptage des points et des bouts, seuil selon
// les bouts, puis la formule du contrat (socle, petit au bout, poignée, chelem,
// répartition preneur/défense). Lancé via `npm test`.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cardPointValue,
  countBouts,
  countCardPoints,
  createTarotDeck,
  scoreContract,
  scoreContractFromCards,
  targetPoints,
  TAROT_TOTAL_CARD_POINTS,
  type TarotCard,
  type TarotSuit,
  type TarotSuitRank,
  type TarotTrumpRank,
} from '@/game/tarot';

function suitCard(suit: TarotSuit, rank: TarotSuitRank, id?: string): TarotCard {
  return { id: id ?? `${suit}-${rank}`, kind: 'suit', suit, rank };
}

function trumpCard(rank: TarotTrumpRank, id?: string): TarotCard {
  return { id: id ?? `trump-${rank}`, kind: 'trump', rank };
}

function excuseCard(id = 'excuse'): TarotCard {
  return { id, kind: 'excuse' };
}

// --- cardPointValue ------------------------------------------------------

describe('cardPointValue (système demi-points)', () => {
  it('compte les bouts à 4,5 (Petit, 21, Excuse)', () => {
    assert.equal(cardPointValue(trumpCard(1)), 4.5);
    assert.equal(cardPointValue(trumpCard(21)), 4.5);
    assert.equal(cardPointValue(excuseCard()), 4.5);
  });

  it('compte les figures : Roi 4,5 · Dame 3,5 · Cavalier 2,5 · Valet 1,5', () => {
    assert.equal(cardPointValue(suitCard('hearts', 14)), 4.5);
    assert.equal(cardPointValue(suitCard('hearts', 13)), 3.5);
    assert.equal(cardPointValue(suitCard('hearts', 12)), 2.5);
    assert.equal(cardPointValue(suitCard('hearts', 11)), 1.5);
  });

  it('compte les basses cartes et les atouts simples à 0,5', () => {
    assert.equal(cardPointValue(suitCard('clubs', 5)), 0.5);
    assert.equal(cardPointValue(suitCard('clubs', 10)), 0.5);
    assert.equal(cardPointValue(trumpCard(8)), 0.5);
  });
});

// --- countCardPoints / countBouts ---------------------------------------

describe('countCardPoints', () => {
  it('somme les valeurs des cartes', () => {
    // Roi(4,5) + Dame(3,5) + atout simple(0,5) + bout(4,5) = 13
    const cards = [suitCard('spades', 14), suitCard('spades', 13), trumpCard(7), trumpCard(21)];
    assert.equal(countCardPoints(cards), 13);
  });

  it('vaut 0 pour un ensemble vide', () => {
    assert.equal(countCardPoints([]), 0);
  });

  it('invariant : le paquet complet vaut 91 points', () => {
    assert.equal(countCardPoints(createTarotDeck()), TAROT_TOTAL_CARD_POINTS);
    assert.equal(TAROT_TOTAL_CARD_POINTS, 91);
  });
});

describe('countBouts', () => {
  it('compte les trois bouts (Petit, 21, Excuse)', () => {
    const cards = [trumpCard(1), trumpCard(21), excuseCard(), suitCard('hearts', 14), trumpCard(5)];
    assert.equal(countBouts(cards), 3);
  });

  it('vaut 0 sans aucun bout', () => {
    assert.equal(countBouts([suitCard('hearts', 14), trumpCard(20), trumpCard(5)]), 0);
  });

  it('le paquet complet contient exactement 3 bouts', () => {
    assert.equal(countBouts(createTarotDeck()), 3);
  });
});

// --- targetPoints --------------------------------------------------------

describe('targetPoints', () => {
  it('suit le barème : 0→56, 1→51, 2→41, 3→36', () => {
    assert.equal(targetPoints(0), 56);
    assert.equal(targetPoints(1), 51);
    assert.equal(targetPoints(2), 41);
    assert.equal(targetPoints(3), 36);
  });

  it('borne le nombre de bouts à [0, 3]', () => {
    assert.equal(targetPoints(-2), 56);
    assert.equal(targetPoints(9), 36);
  });

  it('tronque les valeurs flottantes', () => {
    assert.equal(targetPoints(2.9), 41);
  });
});

// --- scoreContract -------------------------------------------------------

describe('scoreContract', () => {
  it('contrat gagné : socle (25 + écart) × multiplicateur, réparti sur les défenseurs', () => {
    // Petite (×1), 1 bout (seuil 51), 56 points → écart +5.
    const r = scoreContract({ contract: 'petite', takerCardPoints: 56, takerBouts: 1 });
    assert.equal(r.target, 51);
    assert.equal(r.diff, 5);
    assert.equal(r.contractWon, true);
    assert.equal(r.baseValue, 30); // (25 + 5) × 1
    assert.equal(r.perDefender, 30);
    assert.equal(r.takerScore, 90); // × 3 défenseurs
    assert.equal(r.defenderScore, -30);
  });

  it('contrat perdu : montant négatif pour le preneur (multiplicateur appliqué)', () => {
    // Garde (×2), 2 bouts (seuil 41), 30 points → écart −11.
    const r = scoreContract({ contract: 'garde', takerCardPoints: 30, takerBouts: 2 });
    assert.equal(r.contractWon, false);
    assert.equal(r.ecart, 11);
    assert.equal(r.baseValue, -72); // −(25 + 11) × 2
    assert.equal(r.takerScore, -216);
    assert.equal(r.defenderScore, 72);
  });

  it('seuil atteint pile (écart 0) : contrat gagné', () => {
    const r = scoreContract({ contract: 'petite', takerCardPoints: 51, takerBouts: 1 });
    assert.equal(r.diff, 0);
    assert.equal(r.contractWon, true);
    assert.equal(r.baseValue, 25);
  });

  it('petit au bout du preneur : +10 × multiplicateur', () => {
    const r = scoreContract({
      contract: 'garde',
      takerCardPoints: 41,
      takerBouts: 2,
      petitAuBout: 'taker',
    });
    assert.equal(r.petitAuBoutValue, 20); // +10 × 2
    assert.equal(r.perDefender, r.baseValue + 20);
  });

  it('petit au bout de la défense : −10 × multiplicateur, indépendant du contrat', () => {
    const r = scoreContract({
      contract: 'petite',
      takerCardPoints: 60,
      takerBouts: 2,
      petitAuBout: 'defense',
    });
    assert.equal(r.contractWon, true);
    assert.equal(r.petitAuBoutValue, -10);
  });

  it('poignée : prime forfaitaire acquise au camp qui remporte la donne', () => {
    const won = scoreContract({ contract: 'petite', takerCardPoints: 56, takerBouts: 1, poignee: 'simple' });
    assert.equal(won.poigneeValue, 20); // gagnée → +20

    const lost = scoreContract({ contract: 'garde', takerCardPoints: 30, takerBouts: 2, poignee: 'simple' });
    assert.equal(lost.poigneeValue, -20); // perdue → la prime va à la défense
  });

  it('chelem : prime forfaitaire signée, non multipliée', () => {
    const base = { contract: 'garde', takerCardPoints: 41, takerBouts: 2 } as const;
    assert.equal(scoreContract({ ...base, chelem: 'announced-success' }).chelemValue, 400);
    assert.equal(scoreContract({ ...base, chelem: 'unannounced-success' }).chelemValue, 200);
    assert.equal(scoreContract({ ...base, chelem: 'announced-fail' }).chelemValue, -200);
  });

  it('respecte le nombre de joueurs pour la répartition', () => {
    const r = scoreContract({ contract: 'petite', takerCardPoints: 56, takerBouts: 1, playerCount: 5 });
    assert.equal(r.playerCount, 5);
    assert.equal(r.takerScore, r.perDefender * 4);
  });

  it('somme nulle : takerScore = −defenderScore × (joueurs − 1)', () => {
    const r = scoreContract({ contract: 'garde-contre', takerCardPoints: 48, takerBouts: 1 });
    assert.equal(r.takerScore, -r.defenderScore * (r.playerCount - 1));
  });
});

// --- scoreContractFromCards ---------------------------------------------

describe('scoreContractFromCards', () => {
  it('compte points et bouts depuis les cartes puis applique la formule', () => {
    // Petit(4,5/bout) + Roi(4,5) + atout simple(0,5) = 9,5 points, 1 bout.
    const takerCards = [trumpCard(1), suitCard('hearts', 14), trumpCard(7)];
    const fromCards = scoreContractFromCards(takerCards, { contract: 'petite' });
    const direct = scoreContract({ contract: 'petite', takerCardPoints: 9.5, takerBouts: 1 });
    assert.deepEqual(fromCards, direct);
    assert.equal(fromCards.takerCardPoints, 9.5);
    assert.equal(fromCards.takerBouts, 1);
  });
});
