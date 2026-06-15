// Génère les assets PNG du Tarot français à 4 joueurs (jeu de 78 cartes).
//
// Script Node autonome (aucune dépendance externe) : chaque carte est dessinée
// dans un tampon RGBA puis encodée en PNG (deflate + CRC). Les fichiers sont
// nommés d'après l'identifiant de carte du moteur (`deck.ts`), de sorte que le
// composant TarotCard puisse mapper directement `card.id` → `${card.id}.png` :
//
//   - cartes de couleur : suit-<suit>-<rank>.png   (4 couleurs × 14 rangs)
//   - atouts            : trump-<rank>.png          (1..21)
//   - excuse            : excuse.png
//   - dos / décor       : back.png, logo.png, bg-table.png, preview.png
//
// Usage : `npm run assets:tarot` (ou `node ./scripts/generate-tarot-assets.mjs`).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'assets', 'game', 'tarot');

// --- Dimensions et palette ------------------------------------------------

const CARD_W = 200;
const CARD_H = 300;
const CARD_RADIUS = 16;

const colors = {
  felt: [17, 74, 52, 255], // vert tapis
  feltDark: [10, 50, 35, 255],
  cream: [248, 246, 238, 255], // fond de carte
  ink: [26, 28, 38, 255], // piques / trèfles, texte sombre
  red: [196, 30, 45, 255], // cœurs / carreaux
  border: [60, 64, 82, 255], // liseré des cartes de couleur
  trump: [86, 74, 168, 255], // liseré indigo des atouts
  gold: [206, 160, 48, 255], // bouts, excuse
  goldLight: [245, 214, 120, 255],
  shadow: [0, 0, 0, 80],
  white: [255, 255, 255, 255],
  transparent: [0, 0, 0, 0],
};

// Les quatre couleurs (identiques à TAROT_SUITS du moteur).
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

/** Couleur d'encre d'une enseigne (rouge pour cœur/carreau, sombre sinon). */
function suitColor(suit) {
  return suit === 'hearts' || suit === 'diamonds' ? colors.red : colors.ink;
}

/** Libellé d'index d'un rang de couleur : chiffre, ou figure (V/C/D/R). */
function rankLabel(rank) {
  if (rank <= 10) {
    return String(rank);
  }
  return { 11: 'V', 12: 'C', 13: 'D', 14: 'R' }[rank];
}

// --- Police bitmap 5×7 ----------------------------------------------------
//
// Jeu de glyphes minimal couvrant chiffres + lettres utilisées (figures,
// « ATOUT », « EXCUSE », « TAROT »). Chaque glyphe est 7 lignes de 5 colonnes.

const FONT = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
};

const GLYPH_W = 5;
const GLYPH_H = 7;

/** Largeur en pixels d'un texte rendu à l'échelle `scale`. */
function textWidth(text, scale) {
  if (text.length === 0) {
    return 0;
  }
  return (text.length * GLYPH_W + (text.length - 1)) * scale;
}

/** Dessine un texte (coin haut-gauche en x,y) avec la police bitmap. */
function drawText(image, text, x, y, scale, color) {
  let cursor = x;
  for (const char of text) {
    const glyph = FONT[char];
    if (glyph) {
      for (let row = 0; row < GLYPH_H; row += 1) {
        for (let col = 0; col < GLYPH_W; col += 1) {
          if (glyph[row][col] === '1') {
            fillRect(image, cursor + col * scale, y + row * scale, scale, scale, color);
          }
        }
      }
    }
    cursor += (GLYPH_W + 1) * scale;
  }
}

/** Dessine un texte centré horizontalement autour de `cx`. */
function drawTextCentered(image, text, cx, y, scale, color) {
  drawText(image, text, cx - textWidth(text, scale) / 2, y, scale, color);
}

// --- Glyphes d'enseignes --------------------------------------------------

/** Cœur : deux lobes + une pointe triangulaire. `s` = demi-hauteur. */
function drawHeart(image, cx, cy, s, color) {
  fillCircle(image, cx - s * 0.5, cy - s * 0.28, s * 0.52, color);
  fillCircle(image, cx + s * 0.5, cy - s * 0.28, s * 0.52, color);
  fillTriangle(image, [cx - s, cy - s * 0.04], [cx + s, cy - s * 0.04], [cx, cy + s], color);
}

/** Carreau : losange (deux triangles). */
function drawDiamond(image, cx, cy, s, color) {
  const top = [cx, cy - s];
  const right = [cx + s * 0.72, cy];
  const bottom = [cx, cy + s];
  const left = [cx - s * 0.72, cy];
  fillTriangle(image, top, right, left, color);
  fillTriangle(image, bottom, right, left, color);
}

/** Pique : pointe vers le haut + deux lobes + tige. */
function drawSpade(image, cx, cy, s, color) {
  fillTriangle(image, [cx, cy - s], [cx - s * 0.86, cy + s * 0.26], [cx + s * 0.86, cy + s * 0.26], color);
  fillCircle(image, cx - s * 0.44, cy + s * 0.12, s * 0.5, color);
  fillCircle(image, cx + s * 0.44, cy + s * 0.12, s * 0.5, color);
  fillTriangle(image, [cx, cy + s * 0.12], [cx - s * 0.24, cy + s * 0.82], [cx + s * 0.24, cy + s * 0.82], color);
}

/** Trèfle : trois lobes + tige. */
function drawClub(image, cx, cy, s, color) {
  fillCircle(image, cx, cy - s * 0.42, s * 0.44, color);
  fillCircle(image, cx - s * 0.5, cy + s * 0.16, s * 0.44, color);
  fillCircle(image, cx + s * 0.5, cy + s * 0.16, s * 0.44, color);
  fillTriangle(image, [cx, cy + s * 0.1], [cx - s * 0.24, cy + s * 0.82], [cx + s * 0.24, cy + s * 0.82], color);
}

/** Dessine l'enseigne `suit` centrée en (cx,cy), taille `s`. */
function drawSuit(image, suit, cx, cy, s, color) {
  const fill = color ?? suitColor(suit);
  switch (suit) {
    case 'hearts':
      return drawHeart(image, cx, cy, s, fill);
    case 'diamonds':
      return drawDiamond(image, cx, cy, s, fill);
    case 'spades':
      return drawSpade(image, cx, cy, s, fill);
    case 'clubs':
      return drawClub(image, cx, cy, s, fill);
    default:
      return undefined;
  }
}

/** Étoile « éclat » à 4 branches (deux losanges croisés). */
function drawStar(image, cx, cy, r, color) {
  fillTriangle(image, [cx, cy - r], [cx - r * 0.28, cy], [cx + r * 0.28, cy], color);
  fillTriangle(image, [cx, cy + r], [cx - r * 0.28, cy], [cx + r * 0.28, cy], color);
  fillTriangle(image, [cx - r, cy], [cx, cy - r * 0.28], [cx, cy + r * 0.28], color);
  fillTriangle(image, [cx + r, cy], [cx, cy - r * 0.28], [cx, cy + r * 0.28], color);
}

// --- Composition des cartes ----------------------------------------------

/** Base commune : ombre portée, liseré coloré et panneau crème intérieur. */
function drawCardBase(image, borderColor) {
  fillRoundedRect(image, 4, 8, CARD_W - 8, CARD_H - 8, CARD_RADIUS, colors.shadow);
  fillRoundedRect(image, 0, 0, CARD_W, CARD_H, CARD_RADIUS, borderColor);
  fillRoundedRect(image, 7, 7, CARD_W - 14, CARD_H - 14, CARD_RADIUS - 4, colors.cream);
}

/** Index de coin : libellé de rang + petite enseigne (en haut-gauche). */
function drawTopIndex(image, label, suit, color) {
  drawText(image, label, 14, 14, 4, color);
  drawSuit(image, suit, 14 + textWidth(label.length > 1 ? '0' : label, 4) / 2, 64, 13, color);
}

/** Index de coin opposé (en bas-droite), enseigne au-dessus du libellé. */
function drawBottomIndex(image, label, suit, color) {
  const w = textWidth(label, 4);
  const x = CARD_W - 14 - w;
  drawText(image, label, x, CARD_H - 14 - GLYPH_H * 4, 4, color);
  drawSuit(image, suit, x + textWidth(label.length > 1 ? '0' : label, 4) / 2, CARD_H - 14 - GLYPH_H * 4 - 24, 13, color);
}

/** Carte de couleur (1..10 ou figure). */
function drawSuitCard(suit, rank) {
  const image = createImage(CARD_W, CARD_H);
  const color = suitColor(suit);
  const label = rankLabel(rank);

  drawCardBase(image, colors.border);
  drawTopIndex(image, label, suit, color);
  drawBottomIndex(image, label, suit, color);

  if (rank <= 10) {
    // Carte numérale : grande enseigne centrale + chapelet de pips.
    drawSuit(image, suit, CARD_W / 2, CARD_H / 2, 48, color);
    const pips = Math.min(rank, 5);
    for (let i = 0; i < pips; i += 1) {
      const x = CARD_W / 2 - (pips - 1) * 14 + i * 28;
      drawSuit(image, suit, x, 54, 9, color);
      if (rank > 5 && i < rank - 5) {
        drawSuit(image, suit, x, CARD_H - 54, 9, color);
      }
    }
  } else {
    // Figure : panneau teinté + lettre + enseigne.
    fillRoundedRect(image, 52, 92, CARD_W - 104, CARD_H - 184, 10, [color[0], color[1], color[2], 28]);
    drawSuit(image, suit, CARD_W / 2, 124, 20, color);
    drawTextCentered(image, label, CARD_W / 2, 150, 10, color);
    if (rank >= 13) {
      // Couronne stylisée pour Dame et Roi.
      const crownColor = colors.gold;
      fillTriangle(image, [CARD_W / 2 - 26, 122], [CARD_W / 2 - 26, 100], [CARD_W / 2 - 14, 116], crownColor);
      fillTriangle(image, [CARD_W / 2, 122], [CARD_W / 2, 94], [CARD_W / 2 + 12, 116], crownColor);
      fillTriangle(image, [CARD_W / 2 + 26, 122], [CARD_W / 2 + 26, 100], [CARD_W / 2 + 14, 116], crownColor);
    }
  }

  return image;
}

/** Carte d'atout (1..21). Les bouts (1 et 21) reçoivent une étoile dorée. */
function drawTrumpCard(rank) {
  const image = createImage(CARD_W, CARD_H);
  const isBout = rank === 1 || rank === 21;
  const accent = isBout ? colors.gold : colors.trump;
  const label = String(rank);

  drawCardBase(image, colors.trump);
  // Filets décoratifs intérieurs.
  fillRoundedRect(image, 16, 16, CARD_W - 32, CARD_H - 32, 10, [accent[0], accent[1], accent[2], 36]);

  drawText(image, label, 14, 14, 4, colors.trump);
  drawText(image, label, CARD_W - 14 - textWidth(label, 4), CARD_H - 14 - GLYPH_H * 4, 4, colors.trump);

  // Grand numéro central.
  drawTextCentered(image, label, CARD_W / 2, CARD_H / 2 - GLYPH_H * 9, 18, accent);
  // Libellé « ATOUT ».
  drawTextCentered(image, 'ATOUT', CARD_W / 2, CARD_H - 96, 3, colors.trump);

  if (isBout) {
    drawStar(image, CARD_W / 2, 66, 16, colors.goldLight);
    drawStar(image, CARD_W / 2, CARD_H - 66, 16, colors.goldLight);
  }

  return image;
}

/** L'Excuse (le Fou) : motif étoilé doré + libellé. */
function drawExcuseCard() {
  const image = createImage(CARD_W, CARD_H);
  drawCardBase(image, colors.gold);

  fillRoundedRect(image, 16, 16, CARD_W - 32, CARD_H - 32, 10, [colors.gold[0], colors.gold[1], colors.gold[2], 30]);

  // Soleil/étoile central.
  drawStar(image, CARD_W / 2, CARD_H / 2 - 18, 56, colors.gold);
  drawStar(image, CARD_W / 2, CARD_H / 2 - 18, 30, colors.goldLight);
  fillCircle(image, CARD_W / 2, CARD_H / 2 - 18, 14, colors.cream);

  drawTextCentered(image, 'EXCUSE', CARD_W / 2, CARD_H - 70, 4, colors.gold);
  // Petites étoiles dans les coins.
  drawStar(image, 30, 30, 9, colors.gold);
  drawStar(image, CARD_W - 30, CARD_H - 30, 9, colors.gold);

  return image;
}

/** Dos de carte : motif losangé indigo. */
function drawCardBack() {
  const image = createImage(CARD_W, CARD_H);
  drawCardBase(image, colors.trump);
  fillRoundedRect(image, 14, 14, CARD_W - 28, CARD_H - 28, 10, colors.trump);

  for (let row = -1; row < 12; row += 1) {
    for (let col = -1; col < 8; col += 1) {
      const cx = 14 + col * 26 + (row % 2 ? 13 : 0);
      const cy = 22 + row * 26;
      drawDiamond(image, cx, cy, 9, [colors.goldLight[0], colors.goldLight[1], colors.goldLight[2], 150]);
    }
  }
  // Cartouche central.
  fillRoundedRect(image, 56, 116, CARD_W - 112, 68, 8, colors.cream);
  drawTextCentered(image, 'TAROT', CARD_W / 2, 138, 4, colors.trump);
  return image;
}

/** Logo de la liste des jeux : éventail de cartes + titre. */
function drawLogo() {
  const image = createImage(512, 512);
  fillRoundedRect(image, 36, 36, 440, 440, 44, colors.feltDark);
  fillRoundedRect(image, 60, 60, 392, 392, 32, colors.felt);

  const fan = [
    { suit: 'spades', angle: -2 },
    { suit: 'hearts', angle: -1 },
    { suit: 'diamonds', angle: 1 },
    { suit: 'clubs', angle: 2 },
  ];
  fan.forEach((card, i) => {
    const x = 150 + i * 50;
    const y = 150 + Math.abs(card.angle) * 12;
    fillRoundedRect(image, x + 4, y + 6, 96, 140, 12, colors.shadow);
    fillRoundedRect(image, x, y, 96, 140, 12, colors.cream);
    fillRoundedRect(image, x, y, 96, 140, 12, [colors.border[0], colors.border[1], colors.border[2], 60]);
    drawSuit(image, card.suit, x + 48, y + 70, 30, suitColor(card.suit));
  });

  drawTextCentered(image, 'TAROT', 256, 372, 11, colors.cream);
  drawStar(image, 256, 110, 26, colors.gold);
  return image;
}

/** Fond de table (vert tapis) pour l'écran de jeu. */
function drawTableBackground() {
  const image = createImage(640, 360);
  for (let y = 0; y < 360; y += 1) {
    const t = y / 360;
    fillRect(image, 0, y, 640, 1, [
      Math.round(colors.felt[0] - t * 6),
      Math.round(colors.felt[1] - t * 22),
      Math.round(colors.felt[2] - t * 16),
      255,
    ]);
  }
  // Halo central + liseré doré.
  fillCircle(image, 320, 180, 220, [colors.goldLight[0], colors.goldLight[1], colors.goldLight[2], 16]);
  fillCircle(image, 320, 180, 150, [255, 255, 255, 10]);
  fillRoundedRect(image, 40, 40, 560, 280, 24, colors.transparent);
  return image;
}

/** Aperçu pour la grille de sélection des jeux : trois cartes en éventail. */
function drawPreview() {
  const image = createImage(512, 330);
  fillRoundedRect(image, 36, 30, 440, 270, 22, colors.feltDark);
  fillRoundedRect(image, 52, 46, 408, 238, 16, colors.felt);

  const cards = [
    { suit: 'hearts', label: 'R', x: 150, color: colors.red },
    { suit: 'spades', label: 'D', x: 224, color: colors.ink },
    { suit: 'diamonds', label: '1', x: 298, color: colors.red },
  ];
  cards.forEach((card, i) => {
    const y = 86 + (i === 1 ? -10 : 0);
    fillRoundedRect(image, card.x + 4, y + 6, 92, 132, 12, colors.shadow);
    fillRoundedRect(image, card.x, y, 92, 132, 12, colors.cream);
    drawText(image, card.label, card.x + 12, y + 12, 3, card.color);
    drawSuit(image, card.suit, card.x + 46, y + 76, 22, card.color);
  });

  drawTextCentered(image, 'TAROT', 256, 250, 4, colors.cream);
  return image;
}

// --- Génération -----------------------------------------------------------

function main() {
  mkdirSync(outDir, { recursive: true });
  let count = 0;

  for (const suit of SUITS) {
    for (let rank = 1; rank <= 14; rank += 1) {
      writePng(join(outDir, `suit-${suit}-${rank}.png`), drawSuitCard(suit, rank));
      count += 1;
    }
  }
  for (let rank = 1; rank <= 21; rank += 1) {
    writePng(join(outDir, `trump-${rank}.png`), drawTrumpCard(rank));
    count += 1;
  }
  writePng(join(outDir, 'excuse.png'), drawExcuseCard());
  count += 1;

  // Décor (non comptabilisé dans les 78 cartes du paquet).
  writePng(join(outDir, 'back.png'), drawCardBack());
  writePng(join(outDir, 'logo.png'), drawLogo());
  writePng(join(outDir, 'bg-table.png'), drawTableBackground());
  writePng(join(outDir, 'preview.png'), drawPreview());

  writeAssetManifest();

  console.log(`Tarot : ${count} cartes + 4 décors générés dans ${outDir}`);
}

/** Liste ordonnée des identifiants de carte (identique au paquet du moteur). */
function cardIds() {
  const ids = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 14; rank += 1) {
      ids.push(`suit-${suit}-${rank}`);
    }
  }
  for (let rank = 1; rank <= 21; rank += 1) {
    ids.push(`trump-${rank}`);
  }
  ids.push('excuse');
  return ids;
}

/**
 * Émet le manifeste TypeScript `src/components/tarot/tarotAssets.ts` : Metro
 * exige des chemins littéraux dans `require()`, on génère donc la table
 * statique card.id → asset en même temps que les PNG (codegen, zéro dérive).
 */
function writeAssetManifest() {
  const manifestPath = join(root, 'src', 'components', 'tarot', 'tarotAssets.ts');
  const entries = cardIds()
    .map((id) => `  '${id}': require('@/assets/game/tarot/${id}.png'),`)
    .join('\n');

  const content = `// AUTO-GÉNÉRÉ par scripts/generate-tarot-assets.mjs — NE PAS ÉDITER À LA MAIN.
// Régénérer via \`npm run assets:tarot\`.
//
// Table de correspondance identifiant de carte (\`TarotCard.id\`) → asset PNG.
// Le bundler Metro résout les \`require()\` statiquement : un chemin construit
// dynamiquement (\`require(\\\`...\${id}.png\\\`)\`) ne fonctionne pas. D'où cette
// table exhaustive, régénérée avec les images pour rester synchronisée.

import type { ImageSourcePropType } from 'react-native';

import type { TarotCard } from '@/game/tarot';

/** Face visible de chaque carte du paquet, indexée par \`TarotCard.id\`. */
export const TAROT_CARD_ASSETS: Record<string, ImageSourcePropType> = {
${entries}
};

/** Assets de décor (hors paquet) : dos de carte, logo, tapis, aperçu. */
export const TAROT_DECOR_ASSETS = {
  back: require('@/assets/game/tarot/back.png'),
  logo: require('@/assets/game/tarot/logo.png'),
  table: require('@/assets/game/tarot/bg-table.png'),
  preview: require('@/assets/game/tarot/preview.png'),
} as const;

/** Source d'image de la face d'une carte d'après son identifiant moteur. */
export function tarotCardAsset(card: TarotCard): ImageSourcePropType {
  return TAROT_CARD_ASSETS[card.id];
}
`;

  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, content);
}

// --- Primitives de dessin (tampon RGBA) -----------------------------------

function createImage(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

function fillRect(image, x, y, width, height, color) {
  const minX = Math.max(0, Math.floor(x));
  const minY = Math.max(0, Math.floor(y));
  const maxX = Math.min(image.width, Math.ceil(x + width));
  const maxY = Math.min(image.height, Math.ceil(y + height));
  for (let py = minY; py < maxY; py += 1) {
    for (let px = minX; px < maxX; px += 1) {
      blendPixel(image, px, py, color);
    }
  }
}

function fillRoundedRect(image, x, y, width, height, radius, color) {
  const minX = Math.max(0, Math.floor(x));
  const minY = Math.max(0, Math.floor(y));
  const maxX = Math.min(image.width, Math.ceil(x + width));
  const maxY = Math.min(image.height, Math.ceil(y + height));
  for (let py = minY; py < maxY; py += 1) {
    for (let px = minX; px < maxX; px += 1) {
      const dx = Math.max(x - px, 0, px - (x + width - 1));
      const dy = Math.max(y - py, 0, py - (y + height - 1));
      const insideCorner = dx * dx + dy * dy <= radius * radius;
      const insideEdge =
        (px >= x + radius && px <= x + width - radius) || (py >= y + radius && py <= y + height - radius);
      if (insideCorner || insideEdge) {
        blendPixel(image, px, py, color);
      }
    }
  }
}

function fillCircle(image, cx, cy, radius, color) {
  const minX = Math.max(0, Math.floor(cx - radius - 1));
  const minY = Math.max(0, Math.floor(cy - radius - 1));
  const maxX = Math.min(image.width, Math.ceil(cx + radius + 1));
  const maxY = Math.min(image.height, Math.ceil(cy + radius + 1));
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = clamp(radius + 0.5 - distance, 0, 1);
      if (coverage > 0) {
        blendPixel(image, x, y, withAlpha(color, color[3] * coverage));
      }
    }
  }
}

/** Remplit un triangle (anti-aliasé sur les bords) défini par 3 sommets [x,y]. */
function fillTriangle(image, a, b, c, color) {
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
  const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
  const maxX = Math.min(image.width, Math.ceil(Math.max(a[0], b[0], c[0])));
  const maxY = Math.min(image.height, Math.ceil(Math.max(a[1], b[1], c[1])));
  const area = edge(a, b, c);
  if (area === 0) {
    return;
  }
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const p = [x + 0.5, y + 0.5];
      const w0 = edge(b, c, p) / area;
      const w1 = edge(c, a, p) / area;
      const w2 = edge(a, b, p) / area;
      if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
        blendPixel(image, x, y, color);
      }
    }
  }
}

/** Produit en croix orienté (aire signée ×2) du triangle (p0,p1,p2). */
function edge(p0, p1, p2) {
  return (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
}

function blendPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }
  const index = (y * image.width + x) * 4;
  const alpha = color[3] / 255;
  const existingAlpha = image.data[index + 3] / 255;
  const outputAlpha = alpha + existingAlpha * (1 - alpha);
  if (outputAlpha <= 0) {
    return;
  }
  image.data[index] = Math.round((color[0] * alpha + image.data[index] * existingAlpha * (1 - alpha)) / outputAlpha);
  image.data[index + 1] = Math.round((color[1] * alpha + image.data[index + 1] * existingAlpha * (1 - alpha)) / outputAlpha);
  image.data[index + 2] = Math.round((color[2] * alpha + image.data[index + 2] * existingAlpha * (1 - alpha)) / outputAlpha);
  image.data[index + 3] = Math.round(outputAlpha * 255);
}

function withAlpha(color, alpha) {
  return [color[0], color[1], color[2], clamp(alpha, 0, 255)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- Encodage PNG ---------------------------------------------------------

function writePng(filePath, image) {
  mkdirSync(dirname(filePath), { recursive: true });
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const scanlineStart = y * (image.width * 4 + 1);
    raw[scanlineStart] = 0;
    raw.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), scanlineStart + 1);
  }

  writeFileSync(
    filePath,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr(image.width, image.height)),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

function ihdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8; // profondeur de bits
  buffer[9] = 6; // RGBA
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

main();
