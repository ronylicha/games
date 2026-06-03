import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'assets', 'game', 'connect-four');

const colors = {
  dark: [9, 17, 31, 255],
  ink: [5, 10, 22, 255],
  blue: [36, 86, 242, 255],
  blueLight: [68, 182, 255, 255],
  cyan: [101, 215, 255, 255],
  red: [255, 62, 87, 255],
  redDark: [143, 23, 48, 255],
  yellow: [255, 216, 74, 255],
  yellowDark: [154, 106, 0, 255],
  white: [248, 247, 255, 255],
  transparent: [0, 0, 0, 0],
};

mkdirSync(outDir, { recursive: true });

function main() {
  writePng(join(outDir, 'bg-arena.png'), drawBackground());
  writePng(join(outDir, 'logo.png'), drawLogo());
  writePng(join(outDir, 'preview-board.png'), drawPreviewBoard());
  writePng(join(outDir, 'disc-red.png'), drawDisc('red', 160));
  writePng(join(outDir, 'disc-yellow.png'), drawDisc('yellow', 160));
}

function drawBackground() {
  const image = createImage(640, 360);
  fillRect(image, 0, 0, 640, 360, colors.dark);

  for (let y = 0; y < 360; y += 1) {
    const t = y / 360;
    fillRect(image, 0, y, 640, 1, [Math.round(9 + t * 18), Math.round(17 + t * 12), Math.round(31 + t * 36), 255]);
  }

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 61) % 640;
    const h = 44 + ((i * 37) % 122);
    const y = 360 - h;
    fillRoundedRect(image, x - 18, y, 44, h, 6, [6, 13, 31, 220]);
    fillRect(image, x - 9, y + 12, 8, 8, i % 2 ? colors.cyan : colors.blueLight);
    fillRect(image, x + 9, y + 32, 8, 8, i % 3 ? colors.yellow : colors.red);
  }

  fillCircle(image, 520, 74, 74, [101, 215, 255, 35]);
  fillCircle(image, 92, 92, 52, [255, 62, 87, 38]);
  fillCircle(image, 330, 240, 150, [36, 86, 242, 44]);
  fillRect(image, 0, 282, 640, 78, [3, 8, 18, 190]);
  fillRect(image, 0, 300, 640, 4, [101, 215, 255, 90]);

  return image;
}

function drawLogo() {
  const image = createImage(512, 512);
  fillRoundedRect(image, 38, 38, 436, 436, 42, colors.ink);
  fillRoundedRect(image, 72, 92, 338, 278, 22, colors.blue);
  fillRect(image, 72, 92, 338, 34, colors.blueLight);
  fillRect(image, 410, 120, 32, 278, [15, 33, 102, 255]);
  fillRect(image, 92, 370, 338, 34, [15, 33, 102, 255]);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const cx = 116 + col * 66;
      const cy = 148 + row * 54;
      fillCircle(image, cx + 4, cy + 6, 23, [0, 0, 0, 70]);
      fillCircle(image, cx, cy, 24, colors.dark);
      if ((row + col) % 3 !== 0) {
        drawDiscInto(image, cx, cy, 22, (row + col) % 2 ? 'red' : 'yellow');
      }
    }
  }

  fillRoundedRect(image, 122, 392, 92, 48, 8, colors.red);
  fillRoundedRect(image, 236, 392, 92, 48, 8, colors.yellow);
  fillCircle(image, 410, 96, 34, [101, 215, 255, 210]);
  return image;
}

function drawPreviewBoard() {
  const image = createImage(512, 330);
  fillRect(image, 0, 0, 512, 330, colors.transparent);
  fillRect(image, 76, 286, 360, 28, [0, 0, 0, 74]);
  fillRoundedRect(image, 54, 42, 366, 220, 16, colors.blue);
  fillRect(image, 54, 42, 366, 28, colors.blueLight);
  fillRect(image, 420, 62, 34, 222, [16, 33, 105, 255]);
  fillRect(image, 78, 262, 366, 34, [14, 28, 88, 255]);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const cx = 84 + col * 48;
      const cy = 84 + row * 44;
      fillCircle(image, cx + 3, cy + 4, 18, [0, 0, 0, 92]);
      fillCircle(image, cx, cy, 19, colors.dark);
      if (row > 1 || (row === 1 && [1, 3, 4].includes(col))) {
        drawDiscInto(image, cx, cy, 17, (row + col) % 2 ? 'red' : 'yellow');
      }
    }
  }

  drawDiscInto(image, 244, 24, 20, 'red');
  return image;
}

function drawDisc(kind, size) {
  const image = createImage(size, size);
  drawDiscInto(image, size / 2, size / 2, size * 0.38, kind);
  return image;
}

function drawDiscInto(image, cx, cy, radius, kind) {
  const fill = kind === 'red' ? colors.red : colors.yellow;
  const shadow = kind === 'red' ? colors.redDark : colors.yellowDark;
  const inner = kind === 'red' ? [213, 30, 68, 255] : [243, 183, 24, 255];
  const light = kind === 'red' ? [255, 156, 170, 255] : [255, 242, 168, 255];
  fillCircle(image, cx + radius * 0.14, cy + radius * 0.22, radius * 1.05, [0, 0, 0, 70]);
  fillCircle(image, cx, cy + radius * 0.1, radius, shadow);
  fillCircle(image, cx, cy, radius, fill);
  fillCircle(image, cx - radius * 0.08, cy - radius * 0.08, radius * 0.62, inner);
  fillCircle(image, cx - radius * 0.32, cy - radius * 0.34, radius * 0.17, light);
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
