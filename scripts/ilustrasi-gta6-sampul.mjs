/**
 * Draw an alternative figure for the social card of the post on a PC for GTA
 * VI, after the layout of the game's cover art: a collage of tilted panels in
 * thick dark frames. Each panel holds a part of the PC instead of a
 * character, on a pastel Vice City backdrop. In the middle, where the cover
 * has its numeral, stands a giant "Rp"; the card already carries the title.
 *
 *     node scripts/ilustrasi-gta6-sampul.mjs blog/2026-11/22-pc-untuk-gta-6
 *
 * Writes pc-gta6-sampul.png, 4:3, next to the post.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/ilustrasi-gta6-sampul.mjs <post-dir>');
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const W = 900;
const H = 675;
const C = {
  frame: '#191326',
  ink: '#1c1230',
  case: '#0f0818',
  part: '#26163a',
  blade: '#3d2a58',
  line: '#3b2552',
  silver: '#d9d4e4',
  silverDark: '#a49cb8',
  gold: '#f0c25a',
  goldDark: '#c18f2c',
  pcb: '#1d2f2a',
  pink: '#ff3d9a',
  violet: '#9b3dff',
  cyan: '#2fd4e6',
  white: '#ffffff',
};
const f = (n) => +n.toFixed(1);
const OUT = `stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"`;

let defs = `
  <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.pink}"/>
    <stop offset="0.5" stop-color="${C.violet}"/>
    <stop offset="1" stop-color="${C.cyan}"/>
  </linearGradient>
  <linearGradient id="rgbH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.pink}"/>
    <stop offset="0.5" stop-color="${C.violet}"/>
    <stop offset="1" stop-color="${C.cyan}"/>
  </linearGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f4f1f8"/>
    <stop offset="0.55" stop-color="${C.silver}"/>
    <stop offset="1" stop-color="${C.silverDark}"/>
  </linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff6e8"/>
    <stop offset="0.45" stop-color="#ffe0b8"/>
    <stop offset="0.85" stop-color="#ffb69c"/>
    <stop offset="1" stop-color="#f797b2"/>
  </linearGradient>
  <linearGradient id="numeral" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffc2d6"/>
    <stop offset="0.45" stop-color="#d27fd0"/>
    <stop offset="1" stop-color="#6f4fd0"/>
  </linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`;

/* ---- Panels: a grid of tilted lines, the middle cell left for the Rp. */

const COLS = [[0, 0], [258, 236], [640, 664], [W, W]]; // x at top, x at bottom
const ROWS = [[0, 0], [226, 202], [462, 486], [H, H]]; // y at left, y at right
function corner(i, j) {
  const [xt, xb] = COLS[i];
  const [yl, yr] = ROWS[j];
  const k = (yr - yl) / W;
  const t = (yl + k * xt) / (H - k * (xb - xt));
  return [xt + (xb - xt) * t, H * t];
}
const panels = [];
for (let j = 0; j < 3; j++) {
  for (let i = 0; i < 3; i++) {
    if (i === 1 && j === 1) continue;
    const pts = [corner(i, j), corner(i + 1, j), corner(i + 1, j + 1), corner(i, j + 1)];
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const box = {x: Math.min(...xs), y: Math.min(...ys)};
    box.w = Math.max(...xs) - box.x;
    box.h = Math.max(...ys) - box.y;
    box.cx = box.x + box.w / 2;
    box.cy = box.y + box.h / 2;
    panels.push({i, j, pts, box});
  }
}
const panelAt = (i, j) => panels.find((p) => p.i === i && p.j === j);

/* ---- Backdrops. */

let gradientId = 0;
function sky(box, stops) {
  const id = `sky${gradientId++}`;
  defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map((c, n) => `<stop offset="${f(n / (stops.length - 1))}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;
  return `<rect x="${f(box.x - 2)}" y="${f(box.y - 2)}" width="${f(box.w + 4)}" height="${f(box.h + 4)}" fill="url(#${id})"/>`;
}
function sun(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r * 1.35}" fill="#fff0dc" opacity="0.45" filter="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sun)"/>`;
}
function palm(x, y, h, lean, color, s = 1) {
  const tx = x + lean;
  const ty = y - h;
  let p = `<path d="M${x} ${y} Q${f(x + lean * 0.15)} ${f(y - h * 0.55)} ${f(tx)} ${f(ty)}" stroke="${color}" stroke-width="${f(7 * s)}" fill="none" stroke-linecap="round"/>`;
  for (const deg of [-172, -138, -100, -62, -24, 12, 192]) {
    const a = (deg * Math.PI) / 180;
    const L = 46 * s;
    const ex = tx + L * Math.cos(a);
    const ey = ty + L * Math.sin(a) + 18 * s;
    const qx = tx + L * 0.55 * Math.cos(a);
    const qy = ty + L * 0.55 * Math.sin(a) - 10 * s;
    p += `<path d="M${f(tx)} ${f(ty)} Q${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}" stroke="${color}" stroke-width="${f(8 * s)}" fill="none" stroke-linecap="round"/>`;
  }
  return p;
}
let seed = 11;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
function skyline(x0, x1, base, minH, maxH, color, windows) {
  let s = '';
  for (let x = x0; x < x1; ) {
    const w = 18 + rand() * 26;
    const h = minH + rand() * (maxH - minH);
    s += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h + 2)}" fill="${color}"/>`;
    if (windows) {
      for (let wy = base - h + 8; wy < base - 8; wy += 11) {
        for (let wx = x + 5; wx < x + w - 6; wx += 8) {
          if (rand() < 0.35) s += `<rect x="${f(wx)}" y="${f(wy)}" width="3" height="4" fill="${windows}"/>`;
        }
      }
    }
    x += w + 2;
  }
  return s;
}
function sea(box, top, color, light) {
  let s = `<rect x="${f(box.x - 2)}" y="${f(top)}" width="${f(box.w + 4)}" height="${f(box.y + box.h - top + 2)}" fill="${color}"/>`;
  for (let y = top + 8, n = 0; y < box.y + box.h; y += 12, n++) {
    const x = box.x + ((n * 47) % 60);
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(30 + (n % 3) * 18)}" height="3" rx="1.5" fill="${light}" opacity="0.6"/>`;
    s += `<rect x="${f(x + 110)}" y="${f(y + 4)}" width="${f(22 + (n % 2) * 20)}" height="3" rx="1.5" fill="${light}" opacity="0.5"/>`;
  }
  return s;
}

/* ---- Parts of the PC, each drawn about the origin. */

function fan(cx, cy, r) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.part}" ${OUT}/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r - 4)}" fill="none" stroke="url(#rgb)" stroke-width="4"/>`;
  for (let n = 0; n < 7; n++) {
    const a = (n * 2 * Math.PI) / 7;
    const r0 = r * 0.3;
    const r1 = r * 0.78;
    const p0 = [cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)];
    const q = [cx + r1 * Math.cos(a + 0.1), cy + r1 * Math.sin(a + 0.1)];
    const p1 = [cx + r1 * Math.cos(a + 0.75), cy + r1 * Math.sin(a + 0.75)];
    s += `<path d="M${f(p0[0])} ${f(p0[1])} Q${f(q[0])} ${f(q[1])} ${f(p1[0])} ${f(p1[1])}" stroke="${C.blade}" stroke-width="${f(r * 0.2)}" stroke-linecap="round" fill="none"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.27)}" fill="${C.case}" stroke="${C.ink}" stroke-width="2"/>`;
  return s;
}
const goldFingers = (x, y, w, h, gap) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.gold}" ${OUT}/>`;
  for (let gx = x + 5; gx < x + w - 2; gx += 6) {
    if (gap && gx > gap[0] && gx < gap[1]) continue;
    s += `<rect x="${gx}" y="${y + 2}" width="2" height="${h - 4}" fill="${C.goldDark}"/>`;
  }
  if (gap) s += `<rect x="${gap[0]}" y="${y - 1}" width="${gap[1] - gap[0]}" height="${h + 4}" fill="${C.case}"/>`;
  return s;
};
const label = (x, y, size, text, fill = C.white, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Pricedown" font-weight="900" font-size="${size}" fill="${fill}">${text}</text>`;
const small = (x, y, size, text, fill, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter" font-weight="600" font-size="${size}" letter-spacing="1" fill="${fill}">${text}</text>`;

function gpu() {
  let s = `<rect x="-128" y="-54" width="16" height="118" rx="2" fill="url(#metal)" ${OUT}/>`;
  for (let y = -40; y < 50; y += 14) s += `<rect x="-124" y="${y}" width="8" height="8" rx="1" fill="${C.silverDark}"/>`;
  s += goldFingers(-70, 44, 120, 14, [-46, -40]);
  s += `<rect x="-114" y="-50" width="240" height="98" rx="10" fill="${C.case}" ${OUT}/>`;
  s += `<path d="M-114 -36 V-40 Q-114 -50 -104 -50 H116 Q126 -50 126 -40 V-36 Z" fill="url(#rgbH)"/>`;
  s += `<path d="M-100 40 L-80 28 M110 40 L90 28" stroke="${C.line}" stroke-width="3"/>`;
  for (const cx of [-66, 6, 78]) s += fan(cx, 4, 36);
  s += `<rect x="96" y="-62" width="22" height="12" rx="2" fill="${C.part}" ${OUT}/>`;
  return s;
}

function cpu() {
  let s = `<rect x="-90" y="-90" width="180" height="180" rx="8" fill="${C.pcb}" ${OUT}/>`;
  for (let n = -76; n <= 70; n += 12) {
    s += `<rect x="${n}" y="-84" width="6" height="8" fill="${C.gold}"/>`;
    s += `<rect x="${n}" y="76" width="6" height="8" fill="${C.gold}"/>`;
    s += `<rect x="-84" y="${n}" width="8" height="6" fill="${C.gold}"/>`;
    s += `<rect x="76" y="${n}" width="8" height="6" fill="${C.gold}"/>`;
  }
  s += `<path d="M-90 62 L-62 90 H-82 Q-90 90 -90 82 Z" fill="${C.gold}"/>`;
  s += `<rect x="-68" y="-68" width="136" height="136" rx="12" fill="url(#metal)" ${OUT}/>`;
  s += `<rect x="-56" y="-56" width="112" height="112" rx="8" fill="none" stroke="${C.silverDark}" stroke-width="2"/>`;
  s += label(0, 4, 40, '8 CORE', C.ink);
  s += small(0, 28, 12, '5.0 GHz · X3D', '#5a4f70');
  s += `<circle cx="-46" cy="46" r="4" fill="${C.silverDark}"/>`;
  return s;
}

function ram() {
  const stick = (dy) => {
    let s = goldFingers(-112, dy + 30, 224, 14, [10, 18]);
    s += `<path d="M-118 ${dy - 26} L-96 ${dy - 38} H40 L56 ${dy - 26} H118 V${dy + 32} H-118 Z" fill="${C.case}" ${OUT}/>`;
    s += `<rect x="-112" y="${dy - 46}" width="226" height="14" rx="5" fill="url(#rgbH)" filter="url(#glow)" opacity="0.9"/>`;
    s += `<rect x="-112" y="${dy - 44}" width="226" height="10" rx="4" fill="url(#rgbH)" ${OUT}/>`;
    s += `<path d="M-100 ${dy + 8} H-20 L-8 ${dy - 6} H100" stroke="${C.line}" stroke-width="4" fill="none"/>`;
    s += label(-60, dy + 0, 18, 'ddr5', C.pink);
    return s;
  };
  return stick(-40) + stick(54);
}

function motherboard() {
  let s = `<rect x="-100" y="-110" width="200" height="220" rx="4" fill="#1d1430" ${OUT}/>`;
  for (const [x1, y1, x2, y2] of [[-90, 60, -10, 60], [-10, 60, 10, 80], [30, -100, 30, -60], [-90, -20, -60, -20], [70, 90, 90, 90], [50, 30, 90, 30]]) {
    s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${C.line}" stroke-width="2"/>`;
  }
  // Rear I/O shroud with its light, and the heatsinks around the socket.
  s += `<rect x="-100" y="-110" width="34" height="96" rx="3" fill="${C.part}" ${OUT}/>`;
  s += `<rect x="-94" y="-100" width="6" height="76" rx="3" fill="url(#rgb)"/>`;
  s += `<rect x="-60" y="-104" width="90" height="22" rx="3" fill="${C.silverDark}" ${OUT}/>`;
  for (let x = -54; x < 26; x += 8) s += `<rect x="${x}" y="-100" width="4" height="14" fill="${C.silver}"/>`;
  s += `<rect x="-58" y="-74" width="64" height="64" rx="4" fill="url(#metal)" ${OUT}/>`;
  s += `<rect x="-48" y="-64" width="44" height="44" rx="3" fill="${C.silverDark}"/>`;
  s += `<path d="M8 -70 V-14" stroke="${C.silver}" stroke-width="4"/>`;
  for (let x = 30; x < 86; x += 13) s += `<rect x="${x}" y="-96" width="7" height="94" rx="2" fill="${C.case}" ${OUT}/>`;
  // PCIe slots, the first armoured, and the chipset.
  s += `<rect x="-86" y="16" width="130" height="11" rx="2" fill="url(#metal)" ${OUT}/>`;
  s += `<rect x="-86" y="56" width="130" height="9" rx="2" fill="${C.case}" ${OUT}/>`;
  s += `<rect x="54" y="40" width="40" height="40" rx="4" fill="${C.part}" ${OUT}/>`;
  s += `<path d="M60 74 L88 46" stroke="url(#rgb)" stroke-width="5" stroke-linecap="round"/>`;
  s += `<rect x="-86" y="84" width="96" height="16" rx="3" fill="${C.silverDark}" ${OUT}/>`;
  return s;
}

function psu() {
  // A box seen from above and in front.
  let s = `<path d="M-100 -60 L-70 -88 H110 L80 -60 Z" fill="#2c2040" ${OUT}/>`;
  s += `<path d="M80 -60 L110 -88 V48 L80 76 Z" fill="${C.case}" ${OUT}/>`;
  s += `<rect x="-100" y="-60" width="180" height="136" rx="4" fill="#1b1229" ${OUT}/>`;
  s += `<circle cx="-10" cy="8" r="54" fill="${C.case}" ${OUT}/>`;
  for (const r of [46, 36, 26]) s += `<circle cx="-10" cy="8" r="${r}" fill="none" stroke="${C.silverDark}" stroke-width="2.5"/>`;
  s += `<path d="M-64 8 H44 M-10 -46 V62" stroke="${C.silverDark}" stroke-width="2.5"/>`;
  s += `<circle cx="-10" cy="8" r="14" fill="${C.part}" ${OUT}/>`;
  s += `<rect x="-94" y="-54" width="70" height="26" rx="3" fill="${C.gold}" ${OUT}/>`;
  s += label(-59, -33, 22, '850W', C.ink);
  s += small(46, 70, 9, '80+ GOLD', C.gold);
  return s;
}

function ssd() {
  let s = `<rect x="-146" y="-26" width="20" height="52" fill="${C.gold}" ${OUT}/>`;
  for (let y = -22; y < 24; y += 6) s += `<rect x="-143" y="${y}" width="14" height="2" fill="${C.goldDark}"/>`;
  s += `<rect x="-130" y="-30" width="260" height="60" rx="5" fill="#15101f" ${OUT}/>`;
  s += `<rect x="-149" y="6" width="26" height="6" fill="${C.frame}"/>`;
  s += `<path d="M130 -10 A10 10 0 0 0 130 10" fill="${C.frame}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="-110" y="-20" width="36" height="36" rx="3" fill="${C.part}" ${OUT}/>`;
  s += `<rect x="-62" y="-22" width="170" height="44" rx="4" fill="url(#rgbH)" ${OUT}/>`;
  s += label(-2, 9, 26, '2 TB', C.white);
  s += small(62, 6, 11, 'NVMe', C.white);
  return s;
}

function aio() {
  let s = '';
  // Hoses, behind everything.
  s += `<path d="M132 -18 C190 -18 190 30 214 34" stroke="${C.case}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M132 22 C170 22 172 64 206 64" stroke="${C.case}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  s += `<rect x="-160" y="-52" width="300" height="104" rx="6" fill="${C.case}" ${OUT}/>`;
  s += `<rect x="-168" y="-46" width="14" height="92" rx="3" fill="url(#metal)" ${OUT}/>`;
  s += `<rect x="132" y="-46" width="14" height="92" rx="3" fill="url(#metal)" ${OUT}/>`;
  for (const cx of [-104, -10, 84]) s += fan(cx, 0, 44);
  // Pump head with its ring of light and a temperature on its screen.
  s += `<circle cx="226" cy="44" r="56" fill="url(#rgb)" filter="url(#glow)" opacity="0.8"/>`;
  s += `<circle cx="226" cy="44" r="50" fill="${C.case}" ${OUT}/>`;
  s += `<circle cx="226" cy="44" r="42" fill="none" stroke="url(#rgb)" stroke-width="6"/>`;
  s += `<circle cx="226" cy="44" r="32" fill="#2a1a40"/>`;
  s += label(226, 56, 30, '42°', C.cyan);
  return s;
}

function tower() {
  let s = `<rect x="-62" y="-104" width="124" height="208" rx="8" fill="${C.case}" ${OUT}/>`;
  s += `<rect x="-52" y="-94" width="80" height="176" rx="4" fill="#1a0f28" stroke="${C.line}" stroke-width="2"/>`;
  for (const cy of [-66, -20, 26]) s += fan(8, cy, 19);
  s += `<rect x="-46" y="48" width="66" height="14" rx="2" fill="${C.part}" stroke="url(#rgbH)" stroke-width="2"/>`;
  s += `<rect x="-46" y="-86" width="30" height="40" rx="3" fill="${C.part}"/>`;
  s += `<rect x="40" y="-94" width="6" height="176" rx="3" fill="url(#rgb)"/>`;
  s += `<circle cx="50" cy="92" r="4" fill="${C.cyan}"/>`;
  s += `<rect x="-50" y="104" width="26" height="7" rx="2" fill="${C.ink}"/><rect x="24" y="104" width="26" height="7" rx="2" fill="${C.ink}"/>`;
  return s;
}

const place = (box, part, {dx = 0, dy = 0, rot = 0, scale = 1}) =>
  `<g transform="translate(${f(box.cx + dx)} ${f(box.cy + dy)}) rotate(${rot}) scale(${scale})">${part}</g>`;

/* ---- The panels, filled. */

const scenes = {
  // Graphics card over a lavender skyline.
  '0,0': (b) =>
    sky(b, ['#8f7ab8', '#c79ad0', '#f7b4c6']) +
    skyline(b.x, b.x + b.w, b.y + b.h, 40, 110, '#b18ec8', '#ffe9d6') +
    place(b, gpu(), {dx: 4, dy: 6, rot: -12, scale: 0.86}),
  // The processor, in the middle of the top, against the sun.
  '1,0': (b) =>
    sky(b, ['#7d6aae', '#d39bc6', '#ffc9a6']) +
    sun(b.cx, b.cy + 34, 96) +
    palm(b.x + 40, b.y + b.h + 4, 160, 30, '#7f62bb', 1.2) +
    palm(b.x + b.w - 30, b.y + b.h + 4, 180, -40, '#7f62bb', 1.25) +
    place(b, cpu(), {dy: 10, rot: 8, scale: 0.98}),
  // Memory, at a slant like a bike on one wheel.
  '2,0': (b) =>
    sky(b, ['#a891d6', '#f0b0c8']) +
    `<path d="M${b.x} ${b.y + b.h - 34} L${b.x + b.w} ${b.y + b.h - 58} V${b.y + b.h + 2} H${b.x} Z" fill="#b68ab3"/>` +
    place(b, ram(), {dx: 6, dy: 2, rot: -24, scale: 0.84}),
  // Motherboard on the beach.
  '0,1': (b) =>
    sky(b, ['#f2a7bd', '#ffd9b5']) +
    sea(b, b.y + b.h * 0.62, '#9a86cc', '#e9dbff') +
    palm(b.x + b.w - 30, b.y + b.h * 0.66, 110, -18, '#8a6cc0') +
    place(b, motherboard(), {dy: 4, rot: 7, scale: 0.9}),
  // Power supply under the neon of the city at night.
  '2,1': (b) =>
    sky(b, ['#5e4a9a', '#a46cbc', '#e48fb8']) +
    skyline(b.x, b.x + b.w, b.y + b.h, 50, 170, '#4b3a7e', '#ffd0e6') +
    place(b, psu(), {dy: 6, rot: -6, scale: 0.98}),
  // Drive over a turquoise sea.
  '0,2': (b) =>
    sky(b, ['#9fd2e0', '#c7b6e8']) +
    sea(b, b.y + b.h * 0.55, '#6fb6cf', '#e6fbff') +
    place(b, ssd(), {dx: 12, dy: 2, rot: -22, scale: 0.76}),
  // Liquid cooler in the evening haze.
  '1,2': (b) =>
    sky(b, ['#ffcfae', '#f49fb8', '#b98bd0']) +
    palm(b.x + 26, b.y + b.h + 4, 150, 26, '#9a72c8') +
    palm(b.x + b.w - 24, b.y + b.h + 4, 130, -24, '#9a72c8') +
    place(b, aio(), {dx: -26, dy: 6, rot: -4, scale: 0.84}),
  // The finished tower by the water.
  '2,2': (b) =>
    sky(b, ['#8ad0de', '#b6a6e3']) +
    sea(b, b.y + b.h * 0.6, '#7d9fd8', '#eef0ff') +
    place(b, tower(), {dy: 6, rot: 6, scale: 0.88}),
};

let body = '';
for (const p of panels) {
  const id = `clip${p.i}${p.j}`;
  const points = p.pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
  defs += `<clipPath id="${id}"><polygon points="${points}"/></clipPath>`;
  body += `<g clip-path="url(#${id})">${scenes[`${p.i},${p.j}`](p.box)}</g>`;
}
// The frames: every edge drawn thick in the colour of the ground.
for (const p of panels) {
  const points = p.pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
  body += `<polygon points="${points}" fill="none" stroke="${C.frame}" stroke-width="14" stroke-linejoin="round"/>`;
}
body += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${C.frame}" stroke-width="18"/>`;

/* ---- In the middle, a giant Rp that spills onto the panels: white with a
   black rim of 0.06em, like the headings of the post (OUTLINE_WIDTH in
   src/lib/postStyle.ts). A stroke is centred on the outline, hence twice. */

const mid = {x: (corner(1, 1)[0] + corner(2, 2)[0]) / 2, y: (corner(1, 1)[1] + corner(2, 2)[1]) / 2};
body += `<text x="${f(mid.x + 4)}" y="${f(mid.y + 112)}" text-anchor="middle" font-family="Pricedown" font-weight="900" font-size="370" fill="${C.white}" stroke="#000000" stroke-width="${f(2 * 0.06 * 370)}" paint-order="stroke" stroke-linejoin="round" transform="rotate(-5 ${f(mid.x)} ${f(mid.y)})">Rp</text>`;

const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${defs}</defs>
<rect width="${W}" height="${H}" fill="${C.frame}"/>
${body}
</svg>`;

const png = new Resvg(doc, {
  font: {
    loadSystemFonts: false,
    fontFiles: [
      path.join(ROOT, 'scripts/socialcard-fonts/Pricedown-Black.ttf'),
      path.join(ROOT, 'scripts/socialcard-fonts/Inter-SemiBold.ttf'),
    ],
    defaultFontFamily: 'Pricedown',
  },
  fitTo: {mode: 'width', value: W * 2},
})
  .render()
  .asPng();
const out = path.join(dir, 'pc-gta6-sampul.png');
fs.writeFileSync(out, png);
console.log(`${out}: ${W * 2}x${H * 2}`);
