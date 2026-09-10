import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const createCRC32Table = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
};

const crcTable = createCRC32Table();

const crc32 = (buf) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const makeChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
};

/**
 * Generates clean circular dial icon with:
 * - 9:00 to 18:00 sector highlighted with red opacity 0.5
 * - Clean central '!' exclamation mark in vibrant red
 * - No watch frame/lugs/crown and no arrows
 */
const generateDialPng = (size) => {
  const scanlineLength = size * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * size);

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.45;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0;

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = (x - cx) / R;
      const dy = (y - cy) / R;
      const distSq = dx * dx + dy * dy;

      if (distSq > 1.05) {
        // Transparent outside circular dial
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Outer bezel ring
      if (distSq > 0.88) {
        rawData[pxOffset] = 51;      // #334155
        rawData[pxOffset + 1] = 65;
        rawData[pxOffset + 2] = 85;
        rawData[pxOffset + 3] = 255;
        continue;
      }

      // Base dark dial color (#0b0f17)
      let r = 11;
      let g = 15;
      let b = 23;

      // 9:00 to 18:00 (6:00 PM) Sector Highlight with 0.5 opacity red (#ef4444)
      // Clockwise from 9:00 (left) through 12:00 (top) and 3:00 (right) to 18:00 (bottom)
      const inSector9to18 = dx >= 0 || dy <= 0;
      if (inSector9to18) {
        r = Math.round(r * 0.5 + 239 * 0.5);
        g = Math.round(g * 0.5 + 68 * 0.5);
        b = Math.round(b * 0.5 + 68 * 0.5);
      }

      // 9:00 and 18:00 dividing lines
      const is9Line = dy <= 0.04 && dy >= -0.04 && dx <= 0 && dx >= -0.92;
      const is18Line = dx <= 0.04 && dx >= -0.04 && dy >= 0 && dy <= 0.92;
      if (is9Line || is18Line) {
        r = 248; g = 113; b = 113;
      }

      // Minimalist Ticks at 9, 12, 15, 18
      const isTick12 = Math.abs(dx) <= 0.04 && dy >= -0.88 && dy <= -0.74;
      const isTick3  = Math.abs(dy) <= 0.04 && dx >= 0.74 && dx <= 0.88;
      const isTick6  = Math.abs(dx) <= 0.04 && dy >= 0.74 && dy <= 0.88;
      const isTick9  = Math.abs(dy) <= 0.04 && dx >= -0.88 && dx <= -0.74;

      if (isTick12 || isTick3 || isTick6 || isTick9) {
        r = 254; g = 202; b = 202;
      }

      // Central '!' Exclamation Mark (Bold, Red, No Arrows)
      // Upper stem
      const isExclStem = Math.abs(dx) <= 0.08 && dy >= -0.52 && dy <= 0.12;
      // Dot
      const dotDistSq = dx * dx + (dy - 0.42) * (dy - 0.42);
      const isExclDot = dotDistSq <= 0.11 * 0.11;

      if (isExclStem || isExclDot) {
        r = 239;
        g = 68;
        b = 68;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = 255;
    }
  }

  const signature = Buffer.from([137, 80, 78, 79, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

import { execSync } from 'child_process';

const iconsDir = path.resolve(process.cwd(), 'public/icons');
const svgPath = path.join(iconsDir, 'watch-icon.svg');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

let hasRsvg = false;
try {
  execSync('which rsvg-convert', { stdio: 'ignore' });
  hasRsvg = true;
} catch {
  hasRsvg = false;
}

[16, 48, 128].forEach((size) => {
  const filePath = path.join(iconsDir, `icon-${size}.png`);

  if (hasRsvg && fs.existsSync(svgPath)) {
    try {
      execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${filePath}"`);
      console.log(`Rendered icon from SVG: ${filePath} (${size}x${size})`);
      return;
    } catch (e) {
      console.warn(`rsvg-convert failed for ${size}x${size}, using fallback:`, e.message);
    }
  }

  // Fallback to pure JS buffer rasterizer
  const png = generateDialPng(size);
  fs.writeFileSync(filePath, png);
  console.log(`Generated icon from buffer: ${filePath} (${size}x${size}, ${png.length} bytes)`);
});
