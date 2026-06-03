import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'assets', 'game', 'tic-tac-toe');

const colors = {
  dark: [16, 24, 32, 255],
  ink: [8, 13, 18, 255],
  cream: [255, 248, 228, 255],
  paper: [255, 232, 163, 255],
  red: [249, 95, 98, 255],
  redDark: [152, 45, 62, 255],
  teal: [38, 196, 166, 255],
  tealDark: [18, 120, 113, 255],
  blue: [54, 91, 204, 255],
  yellow: [246, 215, 74, 255],
  purple: [113, 73, 198, 255],
  orange: [240, 133, 55, 255],
  transparent: [0, 0, 0, 0],
};

mkdirSync(outDir, { recursive: true });

function main() {
  writePng(join(outDir, 'bg-arcade.png'), drawBackground());
  writePng(join(outDir, 'logo.png'), drawLogo());
  writePng(join(outDir, 'board.png'), drawBoard());
  writePng(join(outDir, 'cell-idle.png'), drawCell(colors.cream, colors.teal));
  writePng(join(outDir, 'cell-active.png'), drawCell(colors.paper, colors.yellow));
  writePng(join(outDir, 'cell-win.png'), drawCell(colors.teal, colors.yellow));
  writePng(join(outDir, 'mark-x.png'), drawMarkX());
  writePng(join(outDir, 'mark-o.png'), drawMarkO());
  writePng(join(outDir, 'avatar-player-one.png'), drawAvatar('one'));
  writePng(join(outDir, 'avatar-player-two.png'), drawAvatar('two'));
  writePng(join(outDir, 'avatar-ai.png'), drawAvatar('ai'));
  writePng(join(outDir, 'spark.png'), drawSpark());
  writePng(join(outDir, 'badge-win.png'), drawBadge('win'));
  writePng(join(outDir, 'badge-draw.png'), drawBadge('draw'));
}

function drawBackground() {
  const image = createImage(512, 288);
  fillRect(image, 0, 0, 512, 288, colors.dark);

  for (let y = 0; y < 288; y += 16) {
    fillRect(image, 0, y, 512, 8, y % 32 ? [24, 33, 43, 255] : [12, 18, 26, 255]);
  }

  const cabinets = [
    [22, 96, 92, 150, colors.red],
    [130, 70, 112, 176, colors.teal],
    [270, 88, 92, 158, colors.purple],
    [386, 64, 102, 182, colors.orange],
  ];

  for (const [x, y, width, height, color] of cabinets) {
    fillRoundedRect(image, x, y, width, height, 8, colors.ink);
    fillRoundedRect(image, x + 6, y + 6, width - 12, height - 12, 6, color);
    fillRect(image, x + 18, y + 24, width - 36, 48, colors.dark);
    fillRect(image, x + 24, y + 30, width - 48, 36, colors.teal);
    fillRect(image, x + 22, y + 92, 20, 10, colors.yellow);
    fillCircle(image, x + width - 32, y + 97, 7, colors.redDark);
    fillCircle(image, x + width - 48, y + 97, 7, colors.blue);
  }

  for (let i = 0; i < 72; i += 1) {
    const x = (i * 47) % 512;
    const y = (i * 31) % 288;
    fillRect(image, x, y, 4, 4, i % 3 ? colors.yellow : colors.teal);
  }

  return image;
}

function drawLogo() {
  const image = createImage(512, 512);
  fillRoundedRect(image, 42, 42, 428, 428, 32, colors.dark);
  fillRoundedRect(image, 70, 70, 372, 372, 18, colors.cream);
  fillRoundedRect(image, 96, 96, 320, 320, 12, colors.ink);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      drawCellInto(image, 112 + col * 96, 112 + row * 96, 78, colors.cream, row === col ? colors.teal : colors.red);
    }
  }

  drawMarkXInto(image, 128, 128, 52);
  drawMarkOInto(image, 224, 128, 52);
  drawMarkXInto(image, 320, 128, 52);
  drawMarkOInto(image, 128, 224, 52);
  drawMarkXInto(image, 224, 224, 52);
  drawMarkOInto(image, 320, 224, 52);
  drawMarkXInto(image, 128, 320, 52);
  drawMarkOInto(image, 224, 320, 52);
  drawMarkXInto(image, 320, 320, 52);

  return image;
}

function drawBoard() {
  const image = createImage(384, 384);
  fillRoundedRect(image, 0, 0, 384, 384, 18, colors.ink);
  fillRoundedRect(image, 18, 18, 348, 348, 12, colors.dark);
  fillRoundedRect(image, 34, 34, 316, 316, 8, [29, 38, 49, 255]);

  for (const x of [138, 246]) {
    fillRoundedRect(image, x, 42, 10, 300, 5, colors.yellow);
    fillRoundedRect(image, x + 12, 42, 6, 300, 3, colors.teal);
  }

  for (const y of [138, 246]) {
    fillRoundedRect(image, 42, y, 300, 10, 5, colors.red);
    fillRoundedRect(image, 42, y + 12, 300, 6, 3, colors.teal);
  }

  fillRect(image, 24, 24, 336, 4, [255, 255, 255, 40]);
  fillRect(image, 24, 356, 336, 5, [0, 0, 0, 85]);
  return image;
}

function drawCell(fill, accent) {
  const image = createImage(128, 128);
  drawCellInto(image, 6, 6, 116, fill, accent);
  return image;
}

function drawCellInto(image, x, y, size, fill, accent) {
  fillRoundedRect(image, x, y, size, size, 8, colors.ink);
  fillRoundedRect(image, x + 6, y + 6, size - 12, size - 12, 4, fill);
  fillRect(image, x + 12, y + 12, size - 24, 8, [255, 255, 255, 80]);
  fillRect(image, x + 12, y + size - 22, size - 24, 8, [0, 0, 0, 40]);
  fillRect(image, x + 12, y + 12, 10, size - 24, accent);
}

function drawMarkX() {
  const image = createImage(128, 128);
  drawMarkXInto(image, 16, 16, 96);
  return image;
}

function drawMarkO() {
  const image = createImage(128, 128);
  drawMarkOInto(image, 16, 16, 96);
  return image;
}

function drawMarkXInto(image, x, y, size) {
  for (let offset = -12; offset <= 12; offset += 1) {
    drawLine(image, x + 12 + offset, y + 10, x + size - 10 + offset, y + size - 12, 8, colors.ink);
    drawLine(image, x + size - 10 + offset, y + 10, x + 12 + offset, y + size - 12, 8, colors.ink);
  }
  drawLine(image, x + 14, y + 12, x + size - 12, y + size - 14, 14, colors.red);
  drawLine(image, x + size - 12, y + 12, x + 14, y + size - 14, 14, colors.red);
  drawLine(image, x + 20, y + 16, x + size - 18, y + size - 22, 5, [255, 210, 205, 180]);
}

function drawMarkOInto(image, x, y, size) {
  strokeCircle(image, x + size / 2, y + size / 2, size * 0.36, 22, colors.ink);
  strokeCircle(image, x + size / 2, y + size / 2, size * 0.36, 14, colors.teal);
  strokeCircle(image, x + size / 2 - 3, y + size / 2 - 3, size * 0.26, 4, [202, 255, 238, 190]);
}

function drawAvatar(kind) {
  const image = createImage(192, 192);
  const fill = kind === 'ai' ? colors.purple : kind === 'two' ? colors.teal : colors.red;
  const accent = kind === 'ai' ? colors.teal : colors.yellow;
  fillCircle(image, 96, 96, 88, colors.ink);
  fillCircle(image, 96, 88, 78, fill);
  fillCircle(image, 96, 92, 62, kind === 'ai' ? [45, 50, 78, 255] : [255, 185, 150, 255]);

  if (kind === 'ai') {
    fillRoundedRect(image, 54, 58, 84, 56, 8, colors.dark);
    fillRect(image, 66, 76, 18, 12, colors.teal);
    fillRect(image, 108, 76, 18, 12, colors.teal);
    fillRect(image, 76, 104, 40, 7, colors.yellow);
    fillCircle(image, 96, 24, 12, colors.yellow);
    fillRect(image, 92, 34, 8, 24, colors.yellow);
  } else {
    fillCircle(image, 70, 78, 10, colors.ink);
    fillCircle(image, 122, 78, 10, colors.ink);
    fillRoundedRect(image, 70, 112, 52, 12, 6, colors.ink);
    fillRoundedRect(image, 48, 38, 96, 22, 7, accent);
    if (kind === 'two') {
      fillRect(image, 58, 122, 78, 12, colors.blue);
    }
  }

  fillCircle(image, 63, 66, 8, [255, 255, 255, 90]);
  return image;
}

function drawSpark() {
  const image = createImage(128, 128);
  drawLine(image, 64, 10, 64, 118, 8, colors.yellow);
  drawLine(image, 10, 64, 118, 64, 8, colors.yellow);
  drawLine(image, 24, 24, 104, 104, 8, colors.red);
  drawLine(image, 104, 24, 24, 104, 8, colors.teal);
  fillCircle(image, 64, 64, 18, colors.cream);
  fillCircle(image, 64, 64, 9, colors.yellow);
  return image;
}

function drawBadge(type) {
  const image = createImage(256, 160);
  const fill = type === 'win' ? colors.yellow : colors.teal;
  fillRoundedRect(image, 16, 32, 224, 96, 12, colors.ink);
  fillRoundedRect(image, 28, 44, 200, 72, 8, fill);
  if (type === 'win') {
    drawMarkXInto(image, 54, 56, 48);
    drawMarkOInto(image, 154, 56, 48);
    fillRect(image, 110, 78, 34, 10, colors.red);
  } else {
    fillRect(image, 70, 70, 116, 16, colors.cream);
    fillRect(image, 70, 96, 116, 16, colors.cream);
  }
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
      const insideEdge = (px >= x + radius && px <= x + width - radius) || (py >= y + radius && py <= y + height - radius);
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

function drawLine(image, x1, y1, x2, y2, width, color) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = lengthSquared === 0 ? 0 : clamp(((x - x1) * dx + (y - y1) * dy) / lengthSquared, 0, 1);
      const projectionX = x1 + t * dx;
      const projectionY = y1 + t * dy;
      if (Math.hypot(x - projectionX, y - projectionY) <= width / 2) {
        blendPixel(image, x, y, color);
      }
    }
  }
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
