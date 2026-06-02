import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'assets', 'game', 'checkers');
const chessOutDir = join(root, 'assets', 'game', 'chess');

const colors = {
  ivory: [248, 239, 225, 255],
  ivoryLight: [255, 250, 235, 255],
  ivoryShadow: [155, 132, 101, 150],
  red: [170, 46, 53, 255],
  redLight: [207, 75, 82, 255],
  redShadow: [60, 14, 20, 160],
  gold: [246, 200, 95, 255],
  teal: [71, 100, 91, 255],
  cream: [233, 214, 183, 255],
  dark: [25, 26, 31, 255],
  transparent: [0, 0, 0, 0],
};

mkdirSync(outDir, { recursive: true });
mkdirSync(chessOutDir, { recursive: true });

function main() {
  writePng(join(outDir, 'ivory-man.png'), drawPiece('ivory', false));
  writePng(join(outDir, 'ivory-king.png'), drawPiece('ivory', true));
  writePng(join(outDir, 'red-man.png'), drawPiece('red', false));
  writePng(join(outDir, 'red-king.png'), drawPiece('red', true));
  writePng(join(outDir, 'logo.png'), drawLogo());
  writePng(join(outDir, 'tile-light.png'), drawTile(colors.cream));
  writePng(join(outDir, 'tile-dark.png'), drawTile(colors.teal));

  for (const color of ['white', 'black']) {
    for (const piece of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) {
      writePng(join(chessOutDir, `${color}-${piece}.png`), drawChessPiece(color, piece));
    }
  }
}

function drawPiece(player, king) {
  const image = createImage(256, 256);
  const isIvory = player === 'ivory';
  const fill = isIvory ? colors.ivory : colors.red;
  const light = isIvory ? colors.ivoryLight : colors.redLight;
  const shadow = isIvory ? colors.ivoryShadow : colors.redShadow;

  fillCircle(image, 128, 142, 86, shadow);
  fillCircle(image, 128, 124, 86, fill);
  strokeCircle(image, 128, 124, 59, 12, light);
  strokeCircle(image, 128, 124, 83, 6, isIvory ? [255, 255, 255, 110] : [255, 180, 170, 90]);
  fillCircle(image, 90, 78, 18, [255, 255, 255, isIvory ? 110 : 55]);

  if (king) {
    fillCircle(image, 88, 116, 13, colors.gold);
    fillCircle(image, 128, 94, 15, colors.gold);
    fillCircle(image, 168, 116, 13, colors.gold);
    fillRoundedRect(image, 78, 136, 100, 20, 8, colors.gold);
    strokeCircle(image, 128, 124, 34, 6, colors.gold);
  }

  return image;
}

function drawLogo() {
  const image = createImage(512, 512);
  fillRoundedRect(image, 54, 54, 404, 404, 64, [25, 26, 31, 255]);

  const tile = 50.5;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const color = (row + col) % 2 ? colors.teal : colors.cream;
      fillRect(image, 54 + col * tile, 54 + row * tile, tile + 1, tile + 1, color);
    }
  }

  fillCircle(image, 188, 294, 58, colors.ivoryShadow);
  fillCircle(image, 188, 282, 58, colors.ivory);
  strokeCircle(image, 188, 282, 38, 8, colors.ivoryLight);

  fillCircle(image, 316, 230, 58, colors.redShadow);
  fillCircle(image, 316, 218, 58, colors.red);
  strokeCircle(image, 316, 218, 38, 8, colors.redLight);
  fillCircle(image, 292, 212, 9, colors.gold);
  fillCircle(image, 316, 198, 10, colors.gold);
  fillCircle(image, 340, 212, 9, colors.gold);
  fillRoundedRect(image, 286, 228, 60, 13, 5, colors.gold);

  return image;
}

function drawTile(color) {
  const image = createImage(128, 128);
  fillRect(image, 0, 0, 128, 128, color);
  fillRect(image, 0, 0, 128, 8, [255, 255, 255, 20]);
  fillRect(image, 0, 120, 128, 8, [0, 0, 0, 18]);
  return image;
}

function drawChessPiece(color, piece) {
  const image = createImage(256, 256);
  const isWhite = color === 'white';
  const fill = isWhite ? colors.ivory : colors.dark;
  const light = isWhite ? colors.ivoryLight : [65, 67, 76, 255];
  const shadow = isWhite ? colors.ivoryShadow : [0, 0, 0, 125];
  const stroke = isWhite ? [115, 98, 76, 210] : [248, 239, 225, 210];

  fillEllipse(image, 128, 212, 74, 22, shadow);
  fillRoundedRect(image, 58, 188, 140, 26, 10, shadow);
  fillRoundedRect(image, 64, 176, 128, 28, 10, fill);
  fillRoundedRect(image, 80, 152, 96, 30, 12, fill);
  strokeCircle(image, 128, 126, 75, 5, stroke);

  if (piece === 'pawn') {
    fillRoundedRect(image, 100, 116, 56, 50, 18, fill);
    fillCircle(image, 128, 90, 34, fill);
    fillCircle(image, 116, 76, 8, light);
  }

  if (piece === 'rook') {
    fillRoundedRect(image, 90, 78, 76, 88, 10, fill);
    for (const x of [86, 116, 146]) {
      fillRoundedRect(image, x, 58, 24, 32, 5, fill);
    }
    fillRoundedRect(image, 82, 86, 92, 18, 6, light);
  }

  if (piece === 'knight') {
    fillRoundedRect(image, 100, 82, 62, 82, 18, fill);
    fillCircle(image, 117, 76, 30, fill);
    fillCircle(image, 146, 94, 28, fill);
    fillCircle(image, 137, 82, 5, stroke);
    fillRoundedRect(image, 92, 106, 46, 20, 8, light);
  }

  if (piece === 'bishop') {
    fillEllipse(image, 128, 111, 42, 58, fill);
    fillCircle(image, 128, 54, 17, fill);
    fillRoundedRect(image, 122, 76, 12, 64, 6, light);
  }

  if (piece === 'queen') {
    for (const crown of [
      [86, 91],
      [108, 68],
      [128, 60],
      [148, 68],
      [170, 91],
    ]) {
      fillCircle(image, crown[0], crown[1], 13, fill);
    }
    fillRoundedRect(image, 84, 94, 88, 68, 20, fill);
    fillRoundedRect(image, 92, 112, 72, 16, 8, light);
  }

  if (piece === 'king') {
    fillRoundedRect(image, 92, 90, 72, 72, 18, fill);
    fillRoundedRect(image, 122, 48, 12, 46, 5, fill);
    fillRoundedRect(image, 106, 61, 44, 12, 5, fill);
    fillCircle(image, 128, 104, 25, light);
  }

  fillRoundedRect(image, 72, 188, 112, 14, 7, light);
  strokeCircle(image, 128, 126, 78, 4, stroke);
  return image;
}

function createImage(width, height) {
  return {
    width,
    height,
    data: new Uint8Array(width * height * 4),
  };
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
        (px >= x + radius && px <= x + width - radius) ||
        (py >= y + radius && py <= y + height - radius);
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

function fillEllipse(image, cx, cy, radiusX, radiusY, color) {
  const minX = Math.max(0, Math.floor(cx - radiusX - 1));
  const minY = Math.max(0, Math.floor(cy - radiusY - 1));
  const maxX = Math.min(image.width, Math.ceil(cx + radiusX + 1));
  const maxY = Math.min(image.height, Math.ceil(cy + radiusY + 1));
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const dx = (x + 0.5 - cx) / radiusX;
      const dy = (y + 0.5 - cy) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const coverage = clamp(1.02 - distance, 0, 1);
      if (coverage > 0) {
        blendPixel(image, x, y, withAlpha(color, color[3] * coverage));
      }
    }
  }
}

function strokeCircle(image, cx, cy, radius, width, color) {
  const minX = Math.max(0, Math.floor(cx - radius - width));
  const minY = Math.max(0, Math.floor(cy - radius - width));
  const maxX = Math.min(image.width, Math.ceil(cx + radius + width));
  const maxY = Math.min(image.height, Math.ceil(cy + radius + width));
  const inner = radius - width / 2;
  const outer = radius + width / 2;
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const outerCoverage = clamp(outer + 0.5 - distance, 0, 1);
      const innerCoverage = clamp(distance - inner + 0.5, 0, 1);
      const coverage = Math.min(outerCoverage, innerCoverage);
      if (coverage > 0) {
        blendPixel(image, x, y, withAlpha(color, color[3] * coverage));
      }
    }
  }
}

function blendPixel(image, x, y, color) {
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
  buffer[8] = 8;
  buffer[9] = 6;
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
