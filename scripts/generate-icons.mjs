#!/usr/bin/env node
/**
 * Renders every Flowe icon PNG from the master SVGs with sharp.
 *
 *   node scripts/generate-icons.mjs
 *
 * Sources of truth (edit these, then re-run):
 *   assets/brand/flowe-logo.svg  app icon: 1024 rounded square (r 228), gradient #011A4D → #1665B1, white mark ~600px
 *   assets/brand/flowe-mark.svg  the mark alone: white stroke 6.5 in a 64-unit box
 *
 * Writes:
 *   flowe-akmal/assets/images/*            Expo icon, adaptive layers, splash, notification icon, favicon
 *   flowe-akmal/android/app/src/main/res/  mipmap-* launcher icons, drawable-* splash + notification icon
 *   flowe-akmal/store-assets/google-play/  Play Console icon, feature graphic, 1024 master export
 *   flowe-desktop/public/                  favicon PNGs, apple-touch-icon, brand/ SVG copies
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESKTOP = join(ROOT, '..', 'flowe-desktop');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');

const NAVY = '#011A4D';
const BLUE = '#1665B1';
const WHITE = '#FFFFFF';

const LOGO_SVG = readFileSync(join(ROOT, 'assets/brand/flowe-logo.svg'), 'utf8');
const MARK_SVG = readFileSync(join(ROOT, 'assets/brand/flowe-mark.svg'), 'utf8');
/** The mark's <path> elements, lifted from the master so nothing is re-typed here. */
const MARK_PATHS = [...MARK_SVG.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]).join('');
if (!MARK_PATHS) throw new Error('flowe-mark.svg: no <path> elements found');

/** Mark share of the icon edge in the master: 600 / 1024. */
const MARK_RATIO = 600 / 1024;

function mark(x, y, box, color = WHITE) {
  return `<svg x="${x}" y="${y}" width="${box}" height="${box}" viewBox="0 0 64 64" fill="none" stroke="${color}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS}</svg>`;
}

/**
 * One SVG canvas.
 * bg: 'gradient' | 'transparent' | a hex colour. shape: 'square' | 'rounded' | 'circle'.
 * markBox: the 64-unit box edge in px (the visible stroke spans ~80% of it), centred.
 */
function canvas({ w, h = w, bg = 'gradient', shape = 'square', markBox, markColor = WHITE, extra = '' }) {
  const fill = bg === 'gradient' ? 'url(#g)' : bg;
  const r = shape === 'rounded' ? (228 / 1024) * w : 0;
  let back = '';
  if (bg !== 'transparent') {
    back = shape === 'circle'
      ? `<circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}" fill="${fill}"/>`
      : `<rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"/>`;
  }
  const m = markBox ? mark((w - markBox) / 2, (h - markBox) / 2, markBox, markColor) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${BLUE}"/></linearGradient></defs>
${back}${m}${extra}</svg>`;
}

const written = [];
async function render(svg, out, { format = 'png', opaque = false } = {}) {
  mkdirSync(dirname(out), { recursive: true });
  // density keeps librsvg from rasterising small and upscaling.
  let img = sharp(Buffer.from(svg), { density: 300 });
  const { width, height } = await sharp(Buffer.from(svg)).metadata();
  img = img.resize(width, height);
  if (opaque) img = img.flatten({ background: NAVY });
  img = format === 'webp' ? img.webp({ lossless: true }) : img.png({ compressionLevel: 9 });
  await img.toFile(out);
  written.push(out);
}

// ── Mobile: Expo assets (assets/images) ────────────────────────────────────
const IMG = join(ROOT, 'assets/images');
// iOS rejects alpha in the app icon and applies its own mask: full-bleed, opaque.
await render(canvas({ w: 1024, markBox: 1024 * MARK_RATIO }), join(IMG, 'icon.png'), { opaque: true });
// Adaptive foreground: 108dp canvas, launchers show the inner 72dp and may mask to a
// circle of the inner 66%. Box 432 → visible stroke ≈ 350px, well inside the 676px circle.
const ADAPTIVE_BOX = 432 / 1024;
await render(canvas({ w: 1024, bg: 'transparent', markBox: 1024 * ADAPTIVE_BOX }), join(IMG, 'android-icon-foreground.png'));
await render(canvas({ w: 1024, bg: 'transparent', markBox: 1024 * ADAPTIVE_BOX }), join(IMG, 'android-icon-monochrome.png'));
await render(canvas({ w: 1024, bg: 'transparent', markBox: 1024 }), join(IMG, 'splash-icon.png'));
await render(canvas({ w: 96, bg: 'transparent', markBox: 96 }), join(IMG, 'notification-icon.png'));
await render(canvas({ w: 64, shape: 'rounded', markBox: 64 * MARK_RATIO }), join(IMG, 'favicon.png'));

// ── Mobile: native Android resources (a rebuild without prebuild picks these up) ──
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, s] of Object.entries(DENSITIES)) {
  const legacy = 48 * s;
  const adaptive = 108 * s;
  await render(canvas({ w: legacy, shape: 'rounded', markBox: legacy * MARK_RATIO }), join(RES, `mipmap-${d}/ic_launcher.webp`), { format: 'webp' });
  await render(canvas({ w: legacy, shape: 'circle', markBox: legacy * MARK_RATIO }), join(RES, `mipmap-${d}/ic_launcher_round.webp`), { format: 'webp' });
  await render(canvas({ w: adaptive, bg: 'transparent', markBox: adaptive * ADAPTIVE_BOX }), join(RES, `mipmap-${d}/ic_launcher_foreground.webp`), { format: 'webp' });
  await render(canvas({ w: adaptive, bg: 'transparent', markBox: adaptive * ADAPTIVE_BOX }), join(RES, `mipmap-${d}/ic_launcher_monochrome.webp`), { format: 'webp' });
  // No background layer: the adaptive background is the colour #011A4D (@color/iconBackground).
  // Android 12+ splash icon: 288dp canvas; app.config.js sets imageWidth 104dp.
  await render(canvas({ w: 288 * s, bg: 'transparent', markBox: 104 * s }), join(RES, `drawable-${d}/splashscreen_logo.png`));
  // Status-bar icon: 24dp, white on transparent (Android uses only the alpha).
  await render(canvas({ w: 24 * s, bg: 'transparent', markBox: 24 * s }), join(RES, `drawable-${d}/notification_icon.png`));
}

// ── Google Play store listing ──────────────────────────────────────────────
const PLAY = join(ROOT, 'store-assets/google-play');
// Play applies its own mask: full-bleed square, 32-bit PNG with alpha channel kept.
await render(canvas({ w: 512, markBox: 512 * MARK_RATIO }), join(PLAY, 'icon-512.png'));
await sharp(Buffer.from(LOGO_SVG), { density: 300 }).resize(1024, 1024).png().toFile(join(PLAY, 'icon-1024.png'));
written.push(join(PLAY, 'icon-1024.png'));
{
  // Feature graphic: mark + "Flowe" wordmark (Inter SemiBold, rendered by Pango from the bundled TTF).
  const W = 1024, H = 500, box = 220;
  const word = await sharp({
    text: {
      text: `<span foreground="${WHITE}" letter_spacing="-3072">Flowe</span>`,
      fontfile: join(ROOT, 'assets/fonts/Inter-SemiBold.ttf'),
      font: 'Inter SemiBold 150',
      dpi: 72,
      rgba: true,
    },
  }).png().toBuffer();
  const wm = await sharp(word).metadata();
  const gap = 36;
  const total = box * 0.8 + gap + wm.width; // visible mark ≈ 80% of its box
  const markX = (W - total) / 2 - box * 0.1;
  const bg = await sharp(Buffer.from(canvas({ w: W, h: H, extra: mark(markX, (H - box) / 2, box) })), { density: 300 })
    .resize(W, H).png().toBuffer();
  const composed = await sharp(bg)
    .composite([{ input: word, left: Math.round(markX + box * 0.9 + gap), top: Math.round((H - wm.height) / 2) }])
    .png()
    .toBuffer();
  // Separate pass: sharp runs composite after flatten within one pipeline.
  // Play wants a 24-bit PNG (no alpha) for the feature graphic.
  await sharp(composed).flatten({ background: NAVY }).removeAlpha().png().toFile(join(PLAY, 'feature-graphic-1024x500.png'));
  written.push(join(PLAY, 'feature-graphic-1024x500.png'));
}

// ── Desktop (flowe-desktop/public) ─────────────────────────────────────────
const PUB = join(DESKTOP, 'public');
for (const n of [32, 192, 512]) {
  await render(canvas({ w: n, shape: 'rounded', markBox: n * MARK_RATIO }), join(PUB, `favicon-${n}.png`));
}
// iOS rounds it itself: full-bleed and opaque.
await render(canvas({ w: 180, markBox: 180 * MARK_RATIO }), join(PUB, 'apple-touch-icon.png'), { opaque: true });
mkdirSync(join(PUB, 'brand'), { recursive: true });
copyFileSync(join(ROOT, 'assets/brand/flowe-logo.svg'), join(PUB, 'brand/flowe-logo.svg'));
copyFileSync(join(ROOT, 'assets/brand/flowe-mark.svg'), join(PUB, 'brand/flowe-mark.svg'));

console.log(`wrote ${written.length} images (+2 SVG copies in flowe-desktop/public/brand)`);
