#!/usr/bin/env node
/**
 * Renders the Flowe app icon, Android adaptive layers and splash mark (canvas
 * section A: brand/app-icon-1024, app-icon-sizes, splash) to PNG with no
 * dependencies: the mark's two strokes are sampled from their path geometry
 * and drawn with round caps; colours come from theme/tokens.js.
 *
 *   node scripts/generate-brand-assets.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { gradient, colors } = require('../theme/tokens');

const OUT = path.join(__dirname, '..', 'assets', 'images');

function hex(c) {
  const h = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// ── PNG encoding ───────────────────────────────────────────────────────────
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ── The mark, in its 64-unit design space ──────────────────────────────────
function cubic(p0, p1, p2, p3, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return pts;
}
// M22 56 V27 c0-10 6-16 15-16 5 0 9 2 12 5
const stem = [[22, 56], ...cubic([22, 27], [22, 17], [28, 11], [37, 11]).slice(0), ...cubic([37, 11], [42, 11], [46, 13], [49, 16]).slice(1)];
// M10 35 c5-5 10-5 15 0 s10 5 15 0 10-5 15 0
const wave = [...cubic([10, 35], [15, 30], [20, 30], [25, 35]), ...cubic([25, 35], [30, 40], [35, 40], [40, 35]).slice(1), ...cubic([40, 35], [45, 30], [50, 30], [55, 35]).slice(1)];
const SEGMENTS = [stem, wave].flatMap((poly) => poly.slice(1).map((p, i) => [poly[i], p]));

function distToSegment(px, py, [a, b]) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = dx * dx + dy * dy;
  let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx - px, y = a[1] + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

/** Coverage (0..1) of the mark at a pixel, with 1 px antialiasing. */
function markCoverage(x, y, box, strokeUnits) {
  const s = box.size / 64;
  const ux = (x - box.x) / s, uy = (y - box.y) / s;
  if (ux < -6 || uy < -6 || ux > 70 || uy > 70) return 0;
  let d = Infinity;
  for (const seg of SEGMENTS) { const v = distToSegment(ux, uy, seg); if (v < d) d = v; }
  const edge = (strokeUnits / 2 - d) * s;
  return Math.max(0, Math.min(1, edge + 0.5));
}

function render({ size, background, mark, markColor, cornerRadius = 0 }) {
  const buf = Buffer.alloc(size * size * 4);
  const top = hex(gradient.from), bottom = hex(gradient.to), ink = hex(markColor ?? colors['on-primary']);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const bg = [0, 1, 2].map((i) => Math.round(top[i] + (bottom[i] - top[i]) * t));
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      let a = 0, rgb = [0, 0, 0];
      if (background === 'gradient') {
        a = 255; rgb = bg;
        if (cornerRadius) {
          const cx = Math.min(Math.max(x, cornerRadius), size - 1 - cornerRadius);
          const cy = Math.min(Math.max(y, cornerRadius), size - 1 - cornerRadius);
          const dd = Math.hypot(x - cx, y - cy) - cornerRadius;
          a = Math.round(255 * Math.max(0, Math.min(1, 0.5 - dd)));
        }
      }
      if (mark) {
        const c = markCoverage(x + 0.5, y + 0.5, mark.box, mark.stroke);
        if (c > 0) {
          rgb = rgb.map((v, i) => Math.round(v * (1 - c) + ink[i] * c));
          a = Math.max(a, Math.round(255 * c));
          if (background !== 'gradient') rgb = ink;
        }
      }
      buf[o] = rgb[0]; buf[o + 1] = rgb[1]; buf[o + 2] = rgb[2]; buf[o + 3] = a;
    }
  }
  return png(size, size, buf);
}

const centred = (size, share) => ({ x: (size - size * share) / 2, y: (size - size * share) / 2, size: size * share });
const write = (name, data) => { fs.writeFileSync(path.join(OUT, name), data); console.log('wrote', name); };

// iOS / store icon: full-bleed gradient (the OS applies its own mask), white mark at 58%.
write('icon.png', render({ size: 1024, background: 'gradient', mark: { box: centred(1024, 0.58), stroke: 6.5 } }));
// Android adaptive: gradient background layer; white mark inside the 66 dp safe zone on transparent.
write('android-icon-background.png', render({ size: 1024, background: 'gradient' }));
write('android-icon-foreground.png', render({ size: 1024, background: 'none', mark: { box: centred(1024, 0.44), stroke: 7 } }));
write('android-icon-monochrome.png', render({ size: 1024, background: 'none', mark: { box: centred(1024, 0.44), stroke: 7 } }));
// Splash: white mark on transparent; the splash background colour is the gradient's top stop.
write('splash-icon.png', render({ size: 512, background: 'none', mark: { box: centred(512, 0.8), stroke: 6.5 } }));
write('favicon.png', render({ size: 64, background: 'gradient', cornerRadius: 14, mark: { box: centred(64, 0.6), stroke: 8 } }));
