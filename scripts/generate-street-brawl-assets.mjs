import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'assets', 'game', 'street-brawl');
const backgroundWidth = 2400;
const backgroundHeight = 540;

const transparent = [0, 0, 0, 0];
const ink = [22, 20, 28, 255];
const skin = [228, 169, 105, 255];
const skinDark = [140, 82, 58, 255];
const white = [246, 240, 222, 255];

const palettes = {
  hero: {
    jacket: [38, 196, 166, 255],
    pants: [38, 54, 82, 255],
    accent: [246, 215, 74, 255],
  },
  grunt: {
    jacket: [214, 70, 70, 255],
    pants: [54, 44, 62, 255],
    accent: [255, 157, 77, 255],
  },
  runner: {
    jacket: [246, 184, 66, 255],
    pants: [36, 42, 64, 255],
    accent: [255, 239, 160, 255],
  },
  bruiser: {
    jacket: [110, 83, 184, 255],
    pants: [35, 31, 48, 255],
    accent: [222, 111, 210, 255],
  },
  blocker: {
    jacket: [67, 112, 180, 255],
    pants: [24, 48, 70, 255],
    accent: [141, 210, 255, 255],
  },
  thrower: {
    jacket: [56, 156, 92, 255],
    pants: [34, 61, 44, 255],
    accent: [192, 255, 164, 255],
  },
  blade: {
    jacket: [210, 55, 118, 255],
    pants: [50, 34, 56, 255],
    accent: [255, 190, 224, 255],
  },
  drone: {
    jacket: [80, 220, 240, 255],
    pants: [28, 62, 76, 255],
    accent: [240, 255, 255, 255],
  },
  boss: {
    jacket: [118, 72, 242, 255],
    pants: [32, 26, 44, 255],
    accent: [246, 215, 74, 255],
  },
};

const districts = {
  downtown: {
    sky: [37, 30, 62, 255],
    back: [68, 49, 94, 255],
    floor: [46, 43, 56, 255],
    line: [246, 215, 74, 255],
    neon: [38, 196, 166, 255],
    signs: [
      'JOE PIZZA',
      'NEON SHOP',
      'ARCADE 88',
      'MOTO FIX',
      'CAFE LUX',
      'BYTE BURGER',
      'TAXI BAR',
      'VINYL DEN',
      'KICKS 24',
      'LUCKY RAMEN',
      'NOVA GYM',
      'PIXEL PRESS',
      'ROXY NAILS',
      'MOON MART',
    ],
  },
  docks: {
    sky: [20, 52, 70, 255],
    back: [33, 86, 102, 255],
    floor: [48, 58, 65, 255],
    line: [91, 190, 222, 255],
    neon: [255, 141, 78, 255],
    signs: [
      'FISH BAR',
      'PIER MART',
      'ANCHOR INN',
      'CARGO 7',
      'NOVA BAIT',
      'TIDE CAFE',
      'SALT RADIO',
      'BOAT FIX',
      'DOCK 12',
      'BLUE CRAB',
      'FOG HOTEL',
      'NET DEPOT',
      'WAVE GRILL',
      'HARBOR RX',
    ],
  },
  factory: {
    sky: [54, 34, 32, 255],
    back: [95, 58, 44, 255],
    floor: [60, 50, 45, 255],
    line: [232, 119, 63, 255],
    neon: [255, 211, 111, 255],
    signs: [
      'IRON TOOLS',
      'OIL STOP',
      'SPARKS',
      'JUNK YARD',
      'GEAR BOX',
      'BOLT BAR',
      'STEAM DELI',
      'TIRE KING',
      'FUSE LAB',
      'METAL MAX',
      'COIL SHOP',
      'RUST CAFE',
      'AUTO REX',
      'WELD 9',
    ],
  },
  uptown: {
    sky: [33, 38, 62, 255],
    back: [75, 70, 92, 255],
    floor: [48, 48, 62, 255],
    line: [230, 193, 92, 255],
    neon: [255, 96, 158, 255],
    signs: [
      'MAE MODE',
      'GOLD BANK',
      'HOTEL REX',
      'LUXE HAIR',
      'VINYL CLUB',
      'SKY BISTRO',
      'CROWN SPA',
      'PRISM ART',
      'ONYX SUITS',
      'PEARL CAFE',
      'RUBY LOUNGE',
      'ZEN OPTIC',
      'VELVET BAR',
      'ASTRA REALTY',
    ],
  },
  citadel: {
    sky: [22, 18, 42, 255],
    back: [53, 33, 82, 255],
    floor: [35, 31, 48, 255],
    line: [153, 103, 255, 255],
    neon: [82, 242, 214, 255],
    signs: [
      'NULL NET',
      'DATA CORE',
      'SYNC LAB',
      'BYTE SHOP',
      'TOWER 0',
      'GRID CAFE',
      'KILO BANK',
      'CYAN CLINIC',
      'ZERO COMMS',
      'ECHO VR',
      'NEXUS TEA',
      'PHASE LAB',
      'ION MARKET',
      'VOID HOTEL',
    ],
  },
};

function main() {
  mkdirSync(outDir, { recursive: true });

  for (const action of ['idle', 'walk', 'attack', 'heavy', 'fury', 'hurt', 'down']) {
    writePng(join(outDir, `player-${action}.png`), drawFighter('hero', action));
  }

  for (const kind of ['grunt', 'runner', 'bruiser', 'blocker', 'thrower', 'blade', 'drone', 'boss']) {
    for (const action of ['idle', 'walk', 'attack', 'hurt', 'down']) {
      writePng(join(outDir, `${kind}-${action}.png`), drawFighter(kind, action));
    }
  }

  for (const [district, palette] of Object.entries(districts)) {
    writePng(join(outDir, `bg-${district}.png`), drawBackground(palette));
  }

for (const kind of ['health', 'fury', 'strength', 'speed', 'shield', 'score', 'knife', 'pipe', 'bat']) {
  writePng(join(outDir, `power-${kind}.png`), drawPower(kind));
}

  writePng(join(outDir, 'logo.png'), drawLogo());
}

function drawFighter(kind, action) {
  const image = createImage(64, 96);
  const palette = palettes[kind];
  const attacking = action === 'attack' || action === 'heavy' || action === 'fury';
  const hurt = action === 'hurt';
  const down = action === 'down';
  const walk = action === 'walk';
  const drone = kind === 'drone';

  if (down) {
    fillRect(image, 10, 58, 46, 18, ink);
    fillRect(image, 14, 52, 34, 16, palette.jacket);
    fillRect(image, 42, 48, 12, 12, skin);
    fillRect(image, 7, 76, 50, 6, [0, 0, 0, 80]);
    return image;
  }

  if (drone) {
    fillRect(image, 12, 34, 40, 22, ink);
    fillRect(image, 16, 30, 32, 22, palette.jacket);
    fillRect(image, 24, 36, 16, 8, palette.accent);
    fillRect(image, 4, 38, 12, 5, white);
    fillRect(image, 48, 38, 12, 5, white);
    fillRect(image, 18, 58, 28, 6, [0, 0, 0, 80]);
    return image;
  }

  const lean = attacking ? 4 : hurt ? -4 : 0;
  const bob = walk ? 2 : 0;

  fillRect(image, 19 + lean, 9 + bob, 22, 23, ink);
  fillRect(image, 22 + lean, 8 + bob, 16, 18, skin);
  fillRect(image, 25 + lean, 15 + bob, 4, 3, ink);
  fillRect(image, 35 + lean, 15 + bob, 4, 3, ink);
  fillRect(image, 21 + lean, 4 + bob, 18, 7, palette.pants);

  fillRect(image, 15 + lean, 32 + bob, 34, 31, ink);
  fillRect(image, 18 + lean, 31 + bob, 28, 28, palette.jacket);
  fillRect(image, 28 + lean, 32 + bob, 7, 25, palette.accent);

  if (attacking) {
    fillRect(image, 45 + lean, 36 + bob, action === 'heavy' ? 18 : 14, 8, ink);
    fillRect(image, 47 + lean, 34 + bob, action === 'heavy' ? 16 : 12, 7, skin);
  } else {
    fillRect(image, 8 + lean, 35 + bob, 10, 22, ink);
    fillRect(image, 10 + lean, 36 + bob, 7, 18, skinDark);
    fillRect(image, 46 + lean, 35 + bob, 10, 22, ink);
    fillRect(image, 47 + lean, 36 + bob, 7, 18, skin);
  }

  const legShift = walk ? 5 : 0;
  fillRect(image, 19 + lean - legShift, 60 + bob, 11, 26, ink);
  fillRect(image, 20 + lean - legShift, 60 + bob, 8, 23, palette.pants);
  fillRect(image, 35 + lean + legShift, 60 + bob, 11, 26, ink);
  fillRect(image, 36 + lean + legShift, 60 + bob, 8, 23, palette.pants);
  fillRect(image, 14 + lean - legShift, 84 + bob, 17, 6, ink);
  fillRect(image, 34 + lean + legShift, 84 + bob, 17, 6, ink);

  if (action === 'fury') {
    strokeRect(image, 5, 5, 54, 86, palette.accent);
    strokeRect(image, 8, 8, 48, 80, [255, 255, 255, 180]);
  }

  return image;
}

function drawBackground(palette) {
  const image = createImage(backgroundWidth, backgroundHeight);
  fillRect(image, 0, 0, image.width, image.height, palette.sky);
  drawSkyline(image, palette);
  drawStreetBlock(image, palette);
  drawRoad(image, palette);
  return image;
}

function drawSkyline(image, palette) {
  for (let i = 0; i < 34; i += 1) {
    const x = i * 74 - 28;
    const width = 44 + ((i * 19) % 42);
    const h = 64 + ((i * 31) % 132);
    fillRect(image, x, 214 - h, width, h, ink);
    fillRect(image, x + 5, 214 - h + 6, width - 10, h - 6, mix(palette.back, [0, 0, 0, 255], 0.1 + (i % 4) * 0.04));
    for (let wy = 214 - h + 16; wy < 196; wy += 19) {
      fillRect(image, x + 12, wy, 8, 7, i % 2 ? palette.neon : palette.line);
      fillRect(image, x + Math.max(28, width - 22), wy, 8, 7, [255, 255, 255, 72]);
    }
    if (i % 3 === 0) {
      fillRect(image, x + 18, 214 - h - 10, Math.max(18, width - 34), 10, palette.neon);
    }
    if (i % 5 === 0) {
      fillRect(image, x + width / 2 - 2, 214 - h - 30, 4, 30, palette.line);
    }
  }
}

function drawStreetBlock(image, palette) {
  const widths = [126, 104, 148, 118, 136, 112, 152, 120, 92, 168, 108, 142, 132, 156];
  const signColors = [
    palette.line,
    palette.neon,
    [255, 96, 158, 255],
    [96, 190, 255, 255],
    [255, 141, 78, 255],
    [194, 255, 120, 255],
    [255, 255, 255, 255],
  ];
  let x = -18;
  for (let i = 0; x < image.width + 80; i += 1) {
    const width = widths[(i * 3 + 2) % widths.length];
    const floors = 2 + (i % 3);
    const roofY = 76 + ((i * 17) % 64);
    const buildingColor = mix(palette.back, i % 2 ? [40, 30, 42, 255] : [95, 83, 104, 255], 0.35);
    fillRect(image, x, roofY, width, 166 - roofY, ink);
    fillRect(image, x + 5, roofY + 5, width - 10, 161 - roofY, buildingColor);

    drawRoof(image, palette, x, roofY, width, i);

    if (i % 2 === 0 || width > 130) {
      const signColor = signColors[(i + Math.floor(width)) % signColors.length];
      fillRect(image, x + 10, roofY - 12, width - 22, 12, ink);
      fillRect(image, x + 13, roofY - 10, width - 28, 8, signColor);
      drawPixelText(image, palette.signs[(i * 5 + width) % palette.signs.length], x + 17, roofY - 9, [28, 23, 32, 255], 1);
    }

    for (let floor = 0; floor < floors; floor += 1) {
      const wy = roofY + 16 + floor * 28;
      for (let wx = x + 15; wx < x + width - 20; wx += 28) {
        drawWindow(image, wx, wy, i + floor, palette);
      }
    }

    drawStorefront(image, palette, x + 4, 162, width - 8, i);
    x += width - 4;
  }
}

function drawWindow(image, x, y, seed, palette) {
  fillRect(image, x, y, 16, 16, ink);
  fillRect(image, x + 2, y + 2, 12, 12, seed % 4 === 0 ? palette.neon : [255, 232, 160, 120]);
  fillRect(image, x + 7, y + 2, 2, 12, [20, 18, 26, 110]);
  fillRect(image, x + 2, y + 8, 12, 2, [20, 18, 26, 110]);
}

function drawStorefront(image, palette, x, y, width, index) {
  const awningOptions = [
    palette.neon,
    palette.line,
    [255, 96, 158, 255],
    [96, 190, 255, 255],
    [194, 255, 120, 255],
    [255, 141, 78, 255],
  ];
  const awning = awningOptions[(index * 7 + width) % awningOptions.length];
  fillRect(image, x, y, width, 88, ink);
  fillRect(image, x + 4, y + 5, width - 8, 78, mix(palette.floor, palette.back, 0.38));
  fillRect(image, x + 8, y + 10, width - 16, 20, awning);
  for (let sx = x + 8; sx < x + width - 12; sx += 20) {
    fillRect(image, sx, y + 10, 10, 20, [255, 255, 255, 70]);
  }
  drawPixelText(image, palette.signs[(index * 3 + width) % palette.signs.length], x + 14, y + 16, [19, 18, 24, 255], 1);

  const doorX = x + Math.max(12, width - 42);
  fillRect(image, doorX, y + 38, 24, 45, ink);
  fillRect(image, doorX + 3, y + 41, 18, 42, [41, 34, 48, 255]);
  fillRect(image, doorX + 16, y + 60, 3, 3, palette.line);

  const glassWidth = Math.max(30, doorX - x - 22);
  fillRect(image, x + 10, y + 39, glassWidth, 35, ink);
  fillRect(image, x + 14, y + 43, glassWidth - 8, 27, [91, 190, 222, 120]);
  fillRect(image, x + 18, y + 48, glassWidth - 20, 4, [255, 255, 255, 100]);
  fillRect(image, x + 23, y + 57, glassWidth - 30, 3, palette.neon);

  if (index % 3 === 0) {
    drawHouseDetails(image, palette, x, y, width);
  }
}

function drawHouseDetails(image, palette, x, y, width) {
  fillRect(image, x + width - 70, y - 20, 54, 20, ink);
  fillRect(image, x + width - 64, y - 16, 42, 16, mix(palette.back, [255, 255, 255, 255], 0.14));
  fillRect(image, x + width - 56, y - 9, 10, 9, palette.line);
  fillRect(image, x + width - 38, y - 9, 10, 9, palette.neon);
}

function drawRoad(image, palette) {
  fillRect(image, 0, 250, image.width, 7, palette.line);
  fillRect(image, 0, 258, image.width, 198, palette.floor);
  fillRect(image, 0, 456, image.width, 8, [20, 18, 26, 255]);
  fillRect(image, 0, 464, image.width, 76, mix(palette.floor, [0, 0, 0, 255], 0.24));
  for (let x = 0; x < image.width; x += 64) {
    fillRect(image, x, 350, 34, 5, [255, 255, 255, 45]);
    fillRect(image, x + 22, 430, 58, 5, [0, 0, 0, 60]);
  }
  for (let x = 18; x < image.width; x += 148) {
    drawStreetProp(image, palette, x, 232 + (x % 2) * 10);
  }
}

function drawRoof(image, palette, x, roofY, width, seed) {
  if (seed % 4 === 0) {
    fillRect(image, x + 6, roofY - 14, width - 12, 14, ink);
    fillRect(image, x + 12, roofY - 10, width - 24, 10, mix(palette.back, [255, 255, 255, 255], 0.16));
    return;
  }
  if (seed % 4 === 1) {
    for (let sx = x + 8; sx < x + width - 8; sx += 18) {
      fillRect(image, sx, roofY - 18, 12, 18, ink);
      fillRect(image, sx + 2, roofY - 15, 8, 15, palette.neon);
    }
    return;
  }
  if (seed % 4 === 2) {
    fillRect(image, x + width - 38, roofY - 26, 24, 26, ink);
    fillRect(image, x + width - 34, roofY - 22, 16, 22, palette.line);
    fillRect(image, x + 12, roofY - 8, width - 24, 8, ink);
    return;
  }
  fillRect(image, x + 12, roofY - 8, width - 24, 8, ink);
  fillRect(image, x + 18, roofY - 13, width - 36, 5, palette.neon);
}

function drawStreetProp(image, palette, x, y) {
  fillRect(image, x, y, 10, 42, ink);
  fillRect(image, x + 3, y + 5, 4, 37, [70, 68, 82, 255]);
  fillRect(image, x - 10, y, 30, 10, ink);
  fillRect(image, x - 7, y + 2, 24, 6, palette.neon);
  fillRect(image, x + 28, y + 22, 22, 26, ink);
  fillRect(image, x + 31, y + 25, 16, 22, palette.line);
  fillRect(image, x + 31, y + 34, 16, 2, [0, 0, 0, 80]);
}

function drawPower(kind) {
  const image = createImage(40, 40);
  const color =
    kind === 'health'
      ? [231, 69, 82, 255]
      : kind === 'fury'
        ? [142, 92, 255, 255]
        : kind === 'strength'
          ? [246, 184, 66, 255]
          : kind === 'speed'
            ? [38, 196, 166, 255]
            : kind === 'shield'
              ? [75, 145, 232, 255]
              : kind === 'knife'
                ? [210, 220, 230, 255]
                : kind === 'pipe'
                  ? [132, 150, 162, 255]
                  : kind === 'bat'
                    ? [154, 94, 55, 255]
                    : [246, 215, 74, 255];
  fillRect(image, 8, 8, 24, 24, ink);
  fillRect(image, 11, 7, 18, 24, color);
  if (kind === 'health') {
    fillRect(image, 18, 12, 4, 14, white);
    fillRect(image, 13, 17, 14, 4, white);
  } else if (kind === 'knife') {
    fillRect(image, 20, 9, 4, 18, white);
    fillRect(image, 17, 25, 10, 4, [90, 62, 48, 255]);
  } else if (kind === 'pipe') {
    fillRect(image, 14, 11, 6, 20, white);
    fillRect(image, 20, 10, 6, 20, [100, 116, 128, 255]);
  } else if (kind === 'bat') {
    fillRect(image, 16, 10, 7, 20, [110, 66, 38, 255]);
    fillRect(image, 23, 13, 4, 14, white);
  } else if (kind === 'shield') {
    fillRect(image, 15, 12, 10, 15, white);
  } else if (kind === 'speed') {
    fillRect(image, 14, 12, 12, 4, white);
    fillRect(image, 12, 19, 16, 4, white);
    fillRect(image, 16, 26, 8, 4, white);
  } else {
    fillRect(image, 17, 12, 6, 16, white);
    fillRect(image, 14, 15, 12, 5, white);
  }
  return image;
}

function drawLogo() {
  const image = createImage(512, 512);
  fillRect(image, 0, 0, 512, 512, [22, 20, 28, 255]);
  fillRect(image, 36, 320, 440, 80, [46, 43, 56, 255]);
  fillRect(image, 36, 300, 440, 18, [246, 215, 74, 255]);
  const hero = drawFighter('hero', 'fury');
  blit(image, hero, 142, 162, 2.15);
  fillRect(image, 72, 92, 368, 42, [38, 196, 166, 255]);
  fillRect(image, 92, 142, 328, 32, [246, 215, 74, 255]);
  return image;
}

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
      setPixel(image, px, py, color);
    }
  }
}

function drawPixelText(image, text, x, y, color, scale = 1) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    if (char === ' ') {
      cursor += 4 * scale;
      continue;
    }
    drawChar(image, char, cursor, y, color, scale);
    cursor += 6 * scale;
  }
}

function drawChar(image, char, x, y, color, scale) {
  const glyph = font[char] ?? font['?'];
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] === '1') {
        fillRect(image, x + col * scale, y + row * scale, scale, scale, color);
      }
    }
  }
}

function mix(a, b, amount) {
  return [
    Math.round(a[0] * (1 - amount) + b[0] * amount),
    Math.round(a[1] * (1 - amount) + b[1] * amount),
    Math.round(a[2] * (1 - amount) + b[2] * amount),
    255,
  ];
}

const font = {
  A: ['01110', '10001', '11111', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '11111'],
  F: ['11111', '10000', '11110', '10000', '10000'],
  G: ['01111', '10000', '10111', '10001', '01111'],
  H: ['10001', '10001', '11111', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '11100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001'],
  O: ['01110', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '11110', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10011', '01111'],
  R: ['11110', '10001', '11110', '10010', '10001'],
  S: ['01111', '10000', '01110', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100'],
  Z: ['11111', '00010', '00100', '01000', '11111'],
  0: ['01110', '10011', '10101', '11001', '01110'],
  1: ['00100', '01100', '00100', '00100', '01110'],
  2: ['11110', '00001', '01110', '10000', '11111'],
  3: ['11110', '00001', '01110', '00001', '11110'],
  4: ['10010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '11110'],
  6: ['01111', '10000', '11110', '10001', '01110'],
  7: ['11111', '00010', '00100', '01000', '01000'],
  8: ['01110', '10001', '01110', '10001', '01110'],
  9: ['01110', '10001', '01111', '00001', '11110'],
  '?': ['11110', '00001', '00110', '00000', '00100'],
};

function strokeRect(image, x, y, width, height, color) {
  fillRect(image, x, y, width, 2, color);
  fillRect(image, x, y + height - 2, width, 2, color);
  fillRect(image, x, y, 2, height, color);
  fillRect(image, x + width - 2, y, 2, height, color);
}

function blit(target, source, x, y, scale) {
  for (let sy = 0; sy < source.height; sy += 1) {
    for (let sx = 0; sx < source.width; sx += 1) {
      const offset = (sy * source.width + sx) * 4;
      const color = [source.data[offset], source.data[offset + 1], source.data[offset + 2], source.data[offset + 3]];
      if (color[3] === 0) {
        continue;
      }
      fillRect(target, x + sx * scale, y + sy * scale, scale, scale, color);
    }
  }
}

function setPixel(image, x, y, color) {
  const offset = (y * image.width + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  image.data[offset] = Math.round(color[0] * alpha + image.data[offset] * inverse);
  image.data[offset + 1] = Math.round(color[1] * alpha + image.data[offset + 1] * inverse);
  image.data[offset + 2] = Math.round(color[2] * alpha + image.data[offset + 2] * inverse);
  image.data[offset + 3] = Math.round(color[3] + image.data[offset + 3] * inverse);
}

function writePng(filePath, image) {
  const stride = image.width * 4 + 1;
  const raw = new Uint8Array(stride * image.height);
  for (let y = 0; y < image.height; y += 1) {
    raw[y * stride] = 0;
    raw.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), y * stride + 1);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const chunks = [pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))];
  writeFileSync(filePath, Buffer.concat([signature, ...chunks]));
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

main();
