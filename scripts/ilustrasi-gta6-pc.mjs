/**
 * Draw the illustration of the post on a PC for GTA VI: a gaming PC standing
 * on a seaside promenade at sunset, in the pastel haze of the game's key art
 * (a lavender sky going pink and peach, lilac palms, a pale city),
 * under the heads-up display of a game: wanted stars, a money counter running
 * into the red, and a minimap with its route to the computer shop.
 *
 *     node scripts/ilustrasi-gta6-pc.mjs blog/2026-11/22-pc-untuk-gta-6
 *
 * Two PNGs on a sky that is neither light nor dark, so that they read on the
 * light page as well as the dark one:
 *
 * - pc-gta6.png, 16:9, the illustration in the post and its image on listing
 *   pages. The PC stands in the middle so that a 4:3 crop on listing pages
 *   keeps it whole; the HUD sits in the corners, where a crop may lose it.
 * - pc-gta6-socialcard.png, 4:3, the figure of the social card. The same
 *   scene cropped around the sun and the PC, with the HUD drawn larger so
 *   that it still reads at the size of a card in a feed.
 *
 * MONEY is the amount on the counter: the price in the post of a PC that
 * plays it about as well as a console.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/ilustrasi-gta6-pc.mjs <post-dir>');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MONEY = '-Rp 36.100.000';

const W = 1200;
const H = 675;
const HORIZON = 432;
const C = {
  // The sky, top to horizon.
  night: '#7d6aae',
  dusk: '#9c83c2',
  magenta: '#d39bc6',
  coral: '#f3a9b6',
  amber: '#ffc9a6',
  sunCore: '#fff6e8',
  sunGlow: '#fff0dc',
  cloud: '#fff3f6',
  window: '#fff1de',
  // Neon of the PC and the promenade.
  pink: '#ff3d9a',
  violet: '#9b3dff',
  cyan: '#2fd4e6',
  // The scene.
  far: '#d9adc8',
  near: '#a88bcb',
  sea: '#b996cb',
  seaDeep: '#8a71b6',
  shore: '#f1bfae',
  ground: '#c792b0',
  dash: '#e8b7c0',
  palm: '#7f62bb',
  ink: '#1c1230',
  case: '#0f0818',
  glass: '#1a0f28',
  board: '#170c24',
  part: '#26163a',
  line: '#3b2552',
  tag: '#ffe9a8',
  money: '#72d572',
  white: '#ffffff',
  black: '#000000',
};

/* Seeded random numbers, so that the skyline comes out the same each time. */
let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const between = (lo, hi) => lo + (hi - lo) * rand();
const f = (n) => +n.toFixed(1);

/* The scene, in a frame of W × H; the HUD is drawn over it per picture. */
let svg = `<defs>
  <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${HORIZON}">
    <stop offset="0" stop-color="${C.night}"/>
    <stop offset="0.32" stop-color="${C.dusk}"/>
    <stop offset="0.62" stop-color="${C.magenta}"/>
    <stop offset="0.84" stop-color="${C.coral}"/>
    <stop offset="1" stop-color="${C.amber}"/>
  </linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.sunCore}"/>
    <stop offset="0.4" stop-color="#ffe0b8"/>
    <stop offset="0.8" stop-color="#ffb69c"/>
    <stop offset="1" stop-color="#f797b2"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.sea}"/>
    <stop offset="1" stop-color="${C.seaDeep}"/>
  </linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.shore}"/>
    <stop offset="1" stop-color="${C.ground}"/>
  </linearGradient>
  <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.pink}"/>
    <stop offset="0.5" stop-color="${C.violet}"/>
    <stop offset="1" stop-color="${C.cyan}"/>
  </linearGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0.3" stop-color="${C.white}" stop-opacity="0"/>
    <stop offset="0.42" stop-color="${C.white}" stop-opacity="0.07"/>
    <stop offset="0.5" stop-color="${C.white}" stop-opacity="0"/>
  </linearGradient>
  <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <linearGradient id="mapHaze" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c1230" stop-opacity="0.55"/>
    <stop offset="0.45" stop-color="#1c1230" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="map" clipPathUnits="userSpaceOnUse"><rect x="28" y="508" width="196" height="118" rx="10"/></clipPath>
</defs>
<rect width="${W}" height="${HORIZON}" fill="url(#sky)"/>
`;

/* The sun going down, cut by the bands of a retro sunset. */
const SUN = {x: 420, y: 340, r: 140};
svg += `<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 40}" fill="${C.sunGlow}" opacity="0.8" filter="url(#blur30)"/>`;
svg += `<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" fill="url(#sun)"/>`;
for (let i = 0, y = SUN.y - 20; y < HORIZON; i++) {
  const h = 3 + i * 1.6;
  svg += `<rect x="${SUN.x - SUN.r}" y="${f(y)}" width="${SUN.r * 2}" height="${f(h)}" fill="url(#sky)"/>`;
  y += h + 14 - i * 1.2;
}

/* Long thin clouds across the sky. */
for (const [x, y, w, o] of [
  [60, 120, 340, 0.35],
  [700, 90, 420, 0.3],
  [880, 190, 280, 0.25],
  [180, 250, 220, 0.3],
  [560, 300, 300, 0.22],
]) {
  svg += `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="${C.cloud}" opacity="${o}"/>`;
  svg += `<rect x="${x + 40}" y="${y + 11}" width="${w * 0.6}" height="4" rx="2" fill="${C.coral}" opacity="${o}"/>`;
}

/* Two rows of skyline: a hazy one far off, and a nearer one with lit windows. */
function skyline(color, base, minH, maxH, windows) {
  let out = '';
  for (let x = -10; x < W; ) {
    const w = between(26, 70);
    const h = between(minH, maxH);
    const top = base - h;
    out += `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h + 2)}" fill="${color}"/>`;
    const kind = rand();
    if (kind < 0.25) {
      // Art deco: stepped top and a spire.
      out += `<rect x="${f(x + w * 0.15)}" y="${f(top - 14)}" width="${f(w * 0.7)}" height="15" fill="${color}"/>`;
      out += `<rect x="${f(x + w * 0.3)}" y="${f(top - 26)}" width="${f(w * 0.4)}" height="13" fill="${color}"/>`;
      out += `<rect x="${f(x + w * 0.48)}" y="${f(top - 52)}" width="${f(w * 0.04 + 1)}" height="27" fill="${color}"/>`;
    } else if (kind < 0.4) {
      out += `<path d="M${f(x)} ${f(top)} L${f(x + w / 2)} ${f(top - w * 0.4)} L${f(x + w)} ${f(top)}Z" fill="${color}"/>`;
    }
    if (windows) {
      for (let wy = top + 8; wy < base - 8; wy += 10) {
        for (let wx = x + 5; wx < x + w - 6; wx += 8) {
          if (rand() < 0.22) {
            const lit = rand() < 0.5 ? C.window : C.coral;
            out += `<rect x="${f(wx)}" y="${f(wy)}" width="3" height="4" fill="${lit}" opacity="${f(between(0.35, 0.8))}"/>`;
          }
        }
      }
    }
    x += w + between(-4, 8);
  }
  return out;
}
svg += skyline(C.far, HORIZON + 2, 40, 150, false);
svg += skyline(C.near, HORIZON + 4, 20, 95, true);

/* The sea, with the sun laid across it in strokes. */
svg += `<rect y="${HORIZON + 4}" width="${W}" height="${560 - HORIZON}" fill="url(#sea)"/>`;
for (let i = 0, y = HORIZON + 12; y < 552; i++, y += 8 + i * 0.6) {
  const w = SUN.r * 1.6 * (1 - i * 0.07) * between(0.75, 1.1);
  if (w < 20) break;
  const colour = i < 4 ? C.sunCore : i < 8 ? C.amber : C.coral;
  svg += `<rect x="${f(SUN.x - w / 2 + between(-12, 12))}" y="${f(y)}" width="${f(w)}" height="3" rx="1.5" fill="${colour}" opacity="${f(0.85 - i * 0.05)}"/>`;
}
for (let i = 0; i < 26; i++) {
  const x = between(0, W);
  const y = between(HORIZON + 14, 550);
  svg += `<rect x="${f(x)}" y="${f(y)}" width="${f(between(20, 60))}" height="2" rx="1" fill="${C.cloud}" opacity="0.35"/>`;
}

/* The promenade, with a neon edge. */
svg += `<rect y="558" width="${W}" height="${H - 558}" fill="url(#ground)"/>`;
svg += `<rect y="556" width="${W}" height="3" fill="${C.pink}" opacity="0.9"/>`;
svg += `<rect y="552" width="${W}" height="10" fill="${C.pink}" opacity="0.35" filter="url(#blur3)"/>`;
for (let x = 20; x < W; x += 90) {
  svg += `<rect x="${x}" y="622" width="46" height="5" rx="2" fill="${C.dash}"/>`;
}

/* Palm trees: a curved trunk and a crown of drooping fronds. */
function palm(x, y, h, lean, s = 1) {
  const top = [x + lean, y - h];
  const ctrl = [x + lean * 0.15, y - h * 0.55];
  let out = `<path d="M${x} ${y} Q${f(ctrl[0])} ${f(ctrl[1])} ${f(top[0])} ${f(top[1])}" stroke="${C.palm}" stroke-width="${f(13 * s)}" fill="none" stroke-linecap="round"/>`;
  const fronds = [-168, -140, -112, -70, -40, -12, 15, 160];
  for (const angle of fronds) {
    const a = (angle * Math.PI) / 180;
    const len = (95 + 25 * Math.cos(a * 2)) * s;
    const tip = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.55 + 40 * s];
    const mid = [top[0] + Math.cos(a) * len * 0.55, top[1] + Math.sin(a) * len * 0.5 - 18 * s];
    const n = [-Math.sin(a), Math.cos(a)];
    const wdt = 13 * s;
    out += `<path d="M${f(top[0])} ${f(top[1])} Q${f(mid[0] + n[0] * wdt)} ${f(mid[1] - wdt)} ${f(tip[0])} ${f(tip[1])} Q${f(mid[0] - n[0] * wdt * 0.3)} ${f(mid[1] + wdt * 0.6)} ${f(top[0])} ${f(top[1])}Z" fill="${C.palm}"/>`;
    // Notches along the frond.
    for (let t = 0.3; t < 0.95; t += 0.13) {
      const px = top[0] + (tip[0] - top[0]) * t;
      const py = mid[1] + (tip[1] - mid[1]) * t * t + (top[1] - mid[1]) * (1 - t) * (1 - t) * 0.6;
      out += `<path d="M${f(px)} ${f(py)} l${f(Math.cos(a) * 6 * s)} ${f(16 * s)} l${f(4 * s)} ${f(-10 * s)}Z" fill="${C.palm}"/>`;
    }
  }
  out += `<circle cx="${f(top[0])}" cy="${f(top[1] + 4 * s)}" r="${f(9 * s)}" fill="${C.palm}"/>`;
  return out;
}
svg += palm(96, 640, 420, 70, 1.15);
svg += palm(236, 610, 300, 38, 0.85);
svg += palm(1040, 625, 360, -60, 1);
svg += palm(1150, 660, 450, -40, 1.2);

/* The PC: a glass-sided tower lit from inside. */
const P = {x: 620, y: 196, w: 236, h: 400};
const fan = (cx, cy, r) => {
  let out = `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="url(#rgb)" stroke-width="7" opacity="0.8" filter="url(#blur8)"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b0613" stroke="url(#rgb)" stroke-width="4"/>`;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const b = a + 0.9;
    const x1 = cx + Math.cos(a) * r * 0.28;
    const y1 = cy + Math.sin(a) * r * 0.28;
    const x2 = cx + Math.cos(b) * r * 0.86;
    const y2 = cy + Math.sin(b) * r * 0.86;
    const qx = cx + Math.cos(a + 0.2) * r * 0.8;
    const qy = cy + Math.sin(a + 0.2) * r * 0.8;
    out += `<path d="M${f(x1)} ${f(y1)} Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}" stroke="#3a2452" stroke-width="${f(r * 0.22)}" stroke-linecap="round" fill="none"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.26)}" fill="#1d1129" stroke="${C.line}" stroke-width="1.5"/>`;
  return out;
};
// Glow on the ground and the wall of light behind.
svg += `<ellipse cx="${P.x + P.w / 2}" cy="${P.y + P.h}" rx="210" ry="26" fill="${C.pink}" opacity="0.45" filter="url(#blur30)"/>`;
svg += `<rect x="${P.x - 20}" y="${P.y + 20}" width="${P.w + 40}" height="${P.h - 40}" rx="30" fill="${C.violet}" opacity="0.4" filter="url(#blur30)"/>`;
svg += `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="12" fill="${C.case}" stroke="${C.black}" stroke-width="5"/>`;
svg += `<rect x="${P.x + P.w - 22}" y="${P.y + 18}" width="8" height="${P.h - 60}" rx="4" fill="url(#rgb)" opacity="0.9"/>`;
// Behind the glass.
const G = {x: P.x + 14, y: P.y + 14, w: P.w - 50, h: P.h - 56};
svg += `<rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" rx="6" fill="${C.glass}" stroke="#2b1840" stroke-width="2"/>`;
svg += `<rect x="${G.x + 10}" y="${G.y + 10}" width="${G.w - 70}" height="${G.h - 112}" rx="4" fill="${C.board}" stroke="${C.line}" stroke-width="1.5"/>`;
// Traces on the board.
for (let i = 0; i < 9; i++) {
  const y = G.y + 26 + i * 18;
  svg += `<path d="M${G.x + 16} ${y} h${f(between(20, 50))} l8 8 h${f(between(10, 30))}" stroke="#2c1a40" stroke-width="1.5" fill="none"/>`;
}
// CPU cooler, memory, graphics card, power supply cover.
svg += fan(G.x + 62, G.y + 72, 36);
for (let i = 0; i < 4; i++) {
  const x = G.x + 112 + i * 9;
  svg += `<rect x="${x}" y="${G.y + 30}" width="6" height="86" rx="1.5" fill="${C.part}"/>`;
  svg += `<rect x="${x}" y="${G.y + 30}" width="6" height="10" rx="1.5" fill="${[C.pink, C.violet, C.cyan, C.pink][i]}"/>`;
}
const GPU = {x: G.x + 8, y: G.y + 150, w: G.w - 60, h: 52};
svg += `<rect x="${GPU.x}" y="${GPU.y}" width="${GPU.w}" height="${GPU.h}" rx="5" fill="${C.part}" stroke="${C.black}" stroke-width="2"/>`;
svg += `<rect x="${GPU.x + 6}" y="${GPU.y + 6}" width="${GPU.w - 12}" height="8" rx="3" fill="url(#rgb)"/>`;
svg += `<rect x="${GPU.x + 6}" y="${GPU.y + 6}" width="${GPU.w - 12}" height="8" rx="3" fill="url(#rgb)" filter="url(#blur8)"/>`;
for (let i = 0; i < 9; i++) {
  svg += `<rect x="${GPU.x + 12 + i * 13}" y="${GPU.y + 22}" width="6" height="22" rx="2" fill="#1a0f28"/>`;
}
svg += `<rect x="${G.x}" y="${G.y + G.h - 88}" width="${G.w}" height="88" rx="4" fill="#120a1c" stroke="#2b1840" stroke-width="2"/>`;
svg += `<rect x="${G.x + 20}" y="${G.y + G.h - 48}" width="70" height="6" rx="3" fill="${C.line}"/>`;
// Front fans, seen through the glass along the front edge.
for (let i = 0; i < 3; i++) svg += fan(G.x + G.w - 32, G.y + 46 + i * 78, 27);
// Glare on the glass.
svg += `<rect x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}" rx="6" fill="url(#glare)"/>`;
// Feet and power button.
svg += `<rect x="${P.x + 18}" y="${P.y + P.h - 2}" width="40" height="8" rx="2" fill="${C.black}"/>`;
svg += `<rect x="${P.x + P.w - 58}" y="${P.y + P.h - 2}" width="40" height="8" rx="2" fill="${C.black}"/>`;
svg += `<circle cx="${P.x + P.w - 18}" cy="${P.y + P.h - 22}" r="5" fill="${C.cyan}"/>`;

/* A tag hanging off the top of the case, its string tied through the hole. */
const T = {x: 420, y: 258, scale: 1.5, angle: -14};
const hole = (() => {
  const a = (T.angle * Math.PI) / 180;
  const [hx, hy] = [20 * T.scale, 30 * T.scale];
  return {x: T.x + hx * Math.cos(a) - hy * Math.sin(a), y: T.y + hx * Math.sin(a) + hy * Math.cos(a)};
})();
svg += `<path d="M${P.x + 14} ${P.y + 6} C${P.x - 30} ${P.y - 30} ${f(hole.x + 60)} ${f(hole.y - 80)} ${f(hole.x)} ${f(hole.y)}" stroke="${C.tag}" stroke-width="2.5" fill="none"/>`;
svg += `<g transform="translate(${T.x} ${T.y}) rotate(${T.angle}) scale(${T.scale})">
  <path d="M0 14 L18 0 H118 V60 H18 L0 46Z" fill="${C.tag}" stroke="${C.black}" stroke-width="3"/>
  <circle cx="20" cy="30" r="5" fill="${C.glass}"/>
  <text x="73" y="31" text-anchor="middle" font-family="Pricedown" font-weight="900" font-size="25" fill="${C.ink}">gta 6</text>
  <text x="73" y="50" text-anchor="middle" font-family="Pricedown" font-weight="900" font-size="15" fill="${C.ink}">compatible</text>
</g>`;

/* The HUD: wanted stars and the money counter, top right. */
let top = '';
const star = (cx, cy, r, lit) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${lit ? C.white : 'none'}" stroke="${C.black}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"/>`;
};
for (let i = 0; i < 5; i++) top += star(W - 40 - i * 36, 44, 15, true);
top += `<text x="${W - 26}" y="104" text-anchor="end" font-family="Pricedown" font-weight="900" font-size="46" fill="${C.money}" stroke="${C.black}" stroke-width="7" paint-order="stroke" stroke-linejoin="round">${MONEY}</text>`;

/* The minimap, bottom left, with the route to the shop. As in the radar of
   the newer games it is the ground in perspective, seen from above and behind
   the player: a point (X, Z) on the ground, Z ahead of the camera, lands at
   y = MAP_HORIZON + MAP_K / Z on the map, and its X shrinks by 1 / Z, so
   that streets narrow and close in towards the top. Shapes are drawn on the
   ground and projected; the blip of the shop stands upright, as icons do. */
const MAP = {x: 28, y: 508, w: 196, h: 118};
const MAP_HORIZON = -50; // above the map, so that all of it is ground
const MAP_K = 138; // the player, at Z = 1, sits 88px down
const MAP_S = 62; // pixels per unit across, at Z = 1
const proj = (X, Z) => [
  f(MAP.x + MAP.w / 2 + (MAP_S * X) / Z),
  f(MAP.y + MAP_HORIZON + MAP_K / Z),
];
const poly = (points, attrs) =>
  `<polygon points="${points.map((p) => proj(...p).join(',')).join(' ')}" ${attrs}/>`;
// A strip of ground along straight segments, `hw` wide on each side.
const strip = (points, hw, attrs) => {
  let out = '';
  for (let i = 1; i < points.length; i++) {
    const [x0, z0] = points[i - 1];
    const [x1, z1] = points[i];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const [nx, nz] = [((z0 - z1) / len) * hw, ((x1 - x0) / len) * hw];
    // Run each piece past its ends by hw, so that corners close.
    const [ex, ez] = [((x1 - x0) / len) * hw, ((z1 - z0) / len) * hw];
    out += poly(
      [
        [x0 - ex + nx, z0 - ez + nz],
        [x1 + ex + nx, z1 + ez + nz],
        [x1 + ex - nx, z1 + ez - nz],
        [x0 - ex - nx, z0 - ez - nz],
      ],
      attrs,
    );
  }
  return out;
};
const NEAR = 0.7; // behind the bottom edge
const FAR = 3.2; // past the top edge
const along = (fn, n = 24) =>
  Array.from({length: n + 1}, (_, i) => fn(NEAR + ((FAR - NEAR) * i) / n));

let ground = '';
// Land, then the sea along the left and across the far end.
ground += `<rect x="${MAP.x}" y="${MAP.y}" width="${MAP.w}" height="${MAP.h}" fill="#4a3f57"/>`;
ground += poly(
  [[-9, NEAR], ...along((z) => [-1.7 + 0.45 * Math.sin(2.4 * z), z]), [-9, FAR]],
  'fill="#2b4a5e"',
);
ground += poly(
  [[-9, FAR + 2], ...Array.from({length: 25}, (_, i) => {
    const x = -9 + (18 * i) / 24;
    return [x, 2.55 + 0.18 * Math.sin(1.3 * x)];
  }), [9, FAR + 2]],
  'fill="#2b4a5e"',
);
// A park, and the streets.
ground += poly([[0.3, 1.33], [1.1, 1.33], [1.1, 1.57], [0.3, 1.57]], 'fill="#47624f"');
const ROAD = 'fill="#7a6d86"';
for (const x of [-0.95, 0, 1.4]) ground += strip([[x, NEAR], [x, FAR]], 0.07, ROAD);
for (const z of [1.22, 1.65, 2.2]) ground += strip([[-9, z], [9, z]], 0.07, ROAD);
ground += strip([[2.0, NEAR], [3.6, FAR]], 0.07, ROAD);
// The route: ahead, then right, to the shop.
ground += strip([[0, 1], [0, 1.65], [1.4, 1.65]], 0.045, `fill="${C.pink}"`);
// The player, lying on the ground with the map.
ground += poly(
  [[0, 1.13], [0.09, 0.91], [0, 0.96], [-0.09, 0.91]],
  `fill="${C.white}" stroke="${C.black}" stroke-width="1.5" stroke-linejoin="round"`,
);
// Haze towards the far edge, so that it reads as distance.
ground += `<rect x="${MAP.x}" y="${MAP.y}" width="${MAP.w}" height="${MAP.h}" fill="url(#mapHaze)"/>`;
// The shop, upright on its corner.
const [bx, by] = proj(1.4, 1.65);
ground += `<rect x="${f(bx - 10)}" y="${f(by - 24)}" width="20" height="20" rx="4" fill="${C.cyan}" stroke="${C.black}" stroke-width="2"/>`;
ground += `<path d="M${f(bx - 4)} ${f(by - 5)} L${bx} ${by} L${f(bx + 4)} ${f(by - 5)}Z" fill="${C.black}"/>`;
ground += `<text x="${bx}" y="${f(by - 9)}" text-anchor="middle" font-family="Pricedown" font-weight="900" font-size="14" fill="${C.ink}">PC</text>`;

let map = '';
map += `<rect x="24" y="504" width="204" height="126" rx="13" fill="${C.black}" opacity="0.85"/>`;
map += `<g clip-path="url(#map)">${ground}</g>`;
map += `<rect x="28" y="636" width="96" height="7" rx="2" fill="${C.money}" stroke="${C.black}" stroke-width="1.5"/>`;
map += `<rect x="128" y="636" width="96" height="7" rx="2" fill="#4aa3e8" stroke="${C.black}" stroke-width="1.5"/>`;


/**
 * One picture: the scene seen through a window of `width` from `left`, the
 * full height, with the HUD scaled by `hud` and held to the corners.
 */
function render(file, {left = 0, width = W, hud = 1, map: mapScale = hud}) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}">
<g transform="translate(${-left} 0)">${svg}</g>
<g transform="translate(${width} 0) scale(${hud}) translate(${-W} 0)">${top}</g>
<g transform="translate(0 ${H}) scale(${mapScale}) translate(0 ${-H})">${map}</g>
</svg>`;
  const png = new Resvg(doc, {
    font: {
      loadSystemFonts: false,
      fontFiles: [path.join(ROOT, 'scripts/socialcard-fonts/Pricedown-Black.ttf')],
      defaultFontFamily: 'Pricedown',
    },
    fitTo: {mode: 'width', value: width * 2},
  })
    .render()
    .asPng();
  const out = path.join(dir, file);
  fs.writeFileSync(out, png);
  console.log(`${out}: ${width * 2}x${H * 2}`);
}

render('pc-gta6.png', {});
render('pc-gta6-socialcard.png', {left: 190, width: 900, hud: 1.5, map: 1.4});
