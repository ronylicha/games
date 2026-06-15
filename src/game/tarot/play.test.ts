// Tests unitaires du moteur de plis du Tarot (play.ts) : couleur demandée,
// coups légaux (fournir / couper / surcouper / défausse, échappatoire Excuse) et
// résolution du pli (atout maître, plus haute carte de la couleur, l'Excuse ne
// gagne jamais). Lancé via `npm test` (node:test + scripts/ts-test-loader.mjs).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createTrick,
  highestTrumpRank,
  isLegalPlay,
  isTrickComplete,
  ledSuit,
  legalPlays,
  playInTrick,
  resolveTrick,
  trickWinner,
  trickWonByTrump,
  type TarotCard,
  type TarotPlay,
  type TarotSuit,
  type TarotSuitRank,
  type TarotTrumpRank,
} from '@/game/tarot';

// --- Fabriques de cartes -------------------------------------------------

function suitCard(suit: TarotSuit, rank: TarotSuitRank, id?: string): TarotCard {
  return { id: id ?? `${suit}-${rank}`, kind: 'suit', suit, rank };
}

function trumpCard(rank: TarotTrumpRank, id?: string): TarotCard {
  return { id: id ?? `trump-${rank}`, kind: 'trump', rank };
}

function excuseCard(id = 'excuse'): TarotCard {
  return { id, kind: 'excuse' };
}

function play(player: number, card: TarotCard): TarotPlay {
  return { player, card };
}

/** Identifiants triés d'un ensemble de cartes (comparaison ordre-insensible). */
function ids(cards: TarotCard[]): string[] {
  return cards.map((card) => card.id).sort();
}

// --- ledSuit -------------------------------------------------------------

describe('ledSuit', () => {
  it('renvoie null pour un pli vide', () => {
    assert.equal(ledSuit([]), null);
  });

  it("renvoie null lorsque seule l'Excuse a été jouée (elle ne fixe pas la couleur)", () => {
    assert.equal(ledSuit([play(0, excuseCard())]), null);
  });

  it('renvoie la couleur de la première carte de couleur', () => {
    assert.equal(ledSuit([play(0, suitCard('hearts', 7))]), 'hearts');
  });

  it("renvoie 'trump' lorsque le pli est entamé à l'atout", () => {
    assert.equal(ledSuit([play(0, trumpCard(8))]), 'trump');
  });

  it("ignore l'Excuse en tête et retient la couleur suivante", () => {
    assert.equal(ledSuit([play(0, excuseCard()), play(1, suitCard('clubs', 4))]), 'clubs');
  });
});

// --- highestTrumpRank ----------------------------------------------------

describe('highestTrumpRank', () => {
  it("renvoie null lorsqu'aucun atout n'a été posé", () => {
    assert.equal(highestTrumpRank([play(0, suitCard('spades', 10))]), null);
    assert.equal(highestTrumpRank([play(0, excuseCard())]), null);
  });

  it('renvoie le plus fort rang d’atout posé', () => {
    const plays = [play(0, trumpCard(5)), play(1, trumpCard(18)), play(2, trumpCard(12))];
    assert.equal(highestTrumpRank(plays), 18);
  });
});

// --- legalPlays : meneur -------------------------------------------------

describe('legalPlays (meneur)', () => {
  it('autorise toute la main pour le meneur (pli vide)', () => {
    const hand = [suitCard('hearts', 3), trumpCard(9), excuseCard()];
    assert.deepEqual(ids(legalPlays(hand, [])), ids(hand));
  });

  it("autorise toute la main quand seule l'Excuse a été jouée (couleur non fixée)", () => {
    const hand = [suitCard('hearts', 3), trumpCard(9)];
    assert.deepEqual(ids(legalPlays(hand, [play(0, excuseCard())])), ids(hand));
  });
});

// --- legalPlays : fournir la couleur ------------------------------------

describe('legalPlays (fournir la couleur)', () => {
  it('oblige à fournir la couleur demandée quand on la possède', () => {
    const hand = [suitCard('hearts', 2), suitCard('hearts', 10), suitCard('spades', 5), trumpCard(4)];
    const legal = legalPlays(hand, [play(0, suitCard('hearts', 8))]);
    assert.deepEqual(ids(legal), ids([suitCard('hearts', 2), suitCard('hearts', 10)]));
  });

  it("fournir prime sur couper : aucune obligation de monter à l'atout", () => {
    // On possède la couleur même si un atout a déjà coupé : on fournit quand même.
    const hand = [suitCard('hearts', 2), trumpCard(20)];
    const plays = [play(0, suitCard('hearts', 9)), play(1, trumpCard(5))];
    assert.deepEqual(ids(legalPlays(hand, plays)), ids([suitCard('hearts', 2)]));
  });

  it("ajoute l'Excuse comme coup légal même quand on doit fournir", () => {
    const hand = [suitCard('hearts', 2), excuseCard()];
    const legal = legalPlays(hand, [play(0, suitCard('hearts', 8))]);
    assert.deepEqual(ids(legal), ids([suitCard('hearts', 2), excuseCard()]));
  });
});

// --- legalPlays : couper / surcouper ------------------------------------

describe('legalPlays (couper)', () => {
  it("oblige à couper à l'atout quand on est défaussé de la couleur", () => {
    const hand = [suitCard('spades', 6), trumpCard(3), trumpCard(11)];
    const legal = legalPlays(hand, [play(0, suitCard('hearts', 9))]);
    // Aucun atout encore posé → tous les atouts conviennent (pas la couleur off).
    assert.deepEqual(ids(legal), ids([trumpCard(3), trumpCard(11)]));
  });

  it("oblige à surcouper (monter au-dessus de l'atout maître) si possible", () => {
    const hand = [trumpCard(4), trumpCard(15)];
    const plays = [play(0, suitCard('hearts', 9)), play(1, trumpCard(10))];
    // Atout maître = 10 → seuls les atouts > 10 sont légaux.
    assert.deepEqual(ids(legalPlays(hand, plays)), ids([trumpCard(15)]));
  });

  it('autorise la sous-coupe (pisser) quand on ne peut pas surcouper', () => {
    const hand = [trumpCard(4), trumpCard(7)];
    const plays = [play(0, suitCard('hearts', 9)), play(1, trumpCard(12))];
    // Atout maître = 12, aucun atout supérieur → tous les atouts deviennent légaux.
    assert.deepEqual(ids(legalPlays(hand, plays)), ids([trumpCard(4), trumpCard(7)]));
  });

  it("l'Excuse reste légale même lorsqu'une coupe est imposée", () => {
    const hand = [trumpCard(3), excuseCard()];
    const legal = legalPlays(hand, [play(0, suitCard('hearts', 9))]);
    assert.deepEqual(ids(legal), ids([trumpCard(3), excuseCard()]));
  });
});

// --- legalPlays : défausse libre ----------------------------------------

describe('legalPlays (défausse libre)', () => {
  it('autorise la défausse libre sans la couleur ni atout', () => {
    const hand = [suitCard('spades', 6), suitCard('clubs', 2)];
    const legal = legalPlays(hand, [play(0, suitCard('hearts', 9))]);
    assert.deepEqual(ids(legal), ids(hand));
  });
});

// --- legalPlays : atout demandé -----------------------------------------

describe('legalPlays (atout demandé)', () => {
  it("oblige à monter à l'atout quand l'atout est demandé", () => {
    const hand = [trumpCard(2), trumpCard(19), suitCard('hearts', 5)];
    const legal = legalPlays(hand, [play(0, trumpCard(10))]);
    assert.deepEqual(ids(legal), ids([trumpCard(19)]));
  });

  it("autorise tout atout quand on ne peut pas surmonter l'atout demandé", () => {
    const hand = [trumpCard(2), trumpCard(6)];
    const legal = legalPlays(hand, [play(0, trumpCard(10))]);
    assert.deepEqual(ids(legal), ids([trumpCard(2), trumpCard(6)]));
  });

  it("autorise la défausse libre + Excuse quand l'atout est demandé sans atout en main", () => {
    const hand = [suitCard('hearts', 5), suitCard('clubs', 9), excuseCard()];
    const legal = legalPlays(hand, [play(0, trumpCard(10))]);
    assert.deepEqual(ids(legal), ids(hand));
  });
});

// --- isLegalPlay ---------------------------------------------------------

describe('isLegalPlay', () => {
  const hand = [suitCard('hearts', 2), suitCard('spades', 9), trumpCard(7)];
  const plays = [play(0, suitCard('hearts', 8))];

  it('vrai pour une carte effectivement jouable (fournir la couleur)', () => {
    assert.equal(isLegalPlay(suitCard('hearts', 2), hand, plays), true);
  });

  it('faux pour une carte non jouable (couper alors qu’on a la couleur)', () => {
    assert.equal(isLegalPlay(trumpCard(7), hand, plays), false);
  });

  it("faux pour une carte absente de la main", () => {
    assert.equal(isLegalPlay(suitCard('diamonds', 5), hand, plays), false);
  });
});

// --- createTrick / playInTrick / isTrickComplete -------------------------

describe('cycle de vie du pli', () => {
  it('createTrick crée un pli vide entamé par le meneur', () => {
    const trick = createTrick(2);
    assert.deepEqual(trick, { leader: 2, plays: [], winner: null });
  });

  it('playInTrick ajoute une carte sans muter le pli d’origine', () => {
    const trick = createTrick(0);
    const next = playInTrick(trick, play(0, trumpCard(5)));
    assert.equal(trick.plays.length, 0, 'le pli original reste vide (immuabilité)');
    assert.equal(next.plays.length, 1);
    assert.equal(next.winner, null);
  });

  it('isTrickComplete vrai quand chaque joueur a posé une carte', () => {
    let trick = createTrick(0);
    trick = playInTrick(trick, play(0, suitCard('hearts', 3)));
    trick = playInTrick(trick, play(1, suitCard('hearts', 9)));
    assert.equal(isTrickComplete(trick, 4), false);
    trick = playInTrick(trick, play(2, suitCard('hearts', 1)));
    trick = playInTrick(trick, play(3, suitCard('hearts', 5)));
    assert.equal(isTrickComplete(trick, 4), true);
  });
});

// --- trickWinner ---------------------------------------------------------

describe('trickWinner', () => {
  it('lève une erreur pour un pli vide', () => {
    assert.throws(() => trickWinner([]), /pli vide/);
  });

  it('la plus haute carte de la couleur demandée gagne (sans coupe)', () => {
    const plays = [
      play(0, suitCard('hearts', 5)),
      play(1, suitCard('hearts', 10)),
      play(2, suitCard('spades', 14)), // hors couleur demandée : ignoré
      play(3, suitCard('hearts', 2)),
    ];
    assert.equal(trickWinner(plays), 1);
  });

  it('le Roi (rang 14) coiffe sa couleur', () => {
    const plays = [play(0, suitCard('hearts', 13)), play(1, suitCard('hearts', 14))];
    assert.equal(trickWinner(plays), 1);
  });

  it("le plus fort atout l'emporte en cas de coupe", () => {
    const plays = [
      play(0, suitCard('hearts', 14)), // Roi de cœur, mais coupé
      play(1, trumpCard(3)),
      play(2, trumpCard(17)),
    ];
    assert.equal(trickWinner(plays), 2);
  });

  it("l'Excuse ne remporte jamais le pli", () => {
    const plays = [play(0, excuseCard()), play(1, suitCard('clubs', 6))];
    assert.equal(trickWinner(plays), 1);
  });

  it("un atout, même petit, bat la plus haute carte de couleur", () => {
    const plays = [play(0, suitCard('diamonds', 14)), play(1, trumpCard(1))];
    assert.equal(trickWinner(plays), 1);
  });
});

// --- resolveTrick --------------------------------------------------------

describe('resolveTrick', () => {
  it('renseigne le gagnant sans muter le pli d’origine', () => {
    const trick = {
      leader: 0,
      plays: [play(0, suitCard('hearts', 4)), play(1, suitCard('hearts', 12))],
      winner: null,
    };
    const resolved = resolveTrick(trick);
    assert.equal(resolved.winner, 1);
    assert.equal(trick.winner, null, 'le pli original n’est pas muté');
  });
});

// --- trickWonByTrump -----------------------------------------------------

describe('trickWonByTrump', () => {
  it('vrai dès qu’un atout figure dans le pli', () => {
    assert.equal(trickWonByTrump([play(0, suitCard('hearts', 9)), play(1, trumpCard(2))]), true);
  });

  it('faux pour un pli sans atout', () => {
    assert.equal(trickWonByTrump([play(0, suitCard('hearts', 9)), play(1, suitCard('hearts', 3))]), false);
  });

  it('faux pour un pli vide', () => {
    assert.equal(trickWonByTrump([]), false);
  });
});

// --- Pureté : pas de mutation des entrées --------------------------------

describe('pureté des fonctions', () => {
  it('legalPlays ne mute ni la main ni les cartes jouées', () => {
    const hand = [suitCard('hearts', 2), trumpCard(9)];
    const plays = [play(0, suitCard('hearts', 8))];
    const handSnapshot = ids(hand);
    const playsLength = plays.length;
    legalPlays(hand, plays);
    assert.deepEqual(ids(hand), handSnapshot);
    assert.equal(plays.length, playsLength);
  });
});
