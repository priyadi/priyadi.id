/**
 * Draw the illustration of the post on AI datacenters in orbit: a station
 * above the Earth's limb, its solar wings facing the sun and its radiators
 * shedding heat as infrared, with a rocket on its way up.
 *
 *     node scripts/ilustrasi-orbit.mjs blog/2026-11/14-datacenter-ai-di-orbit/datacenter-orbit.png
 *
 * One PNG on a night-sky background, so that it reads on the light page as
 * well as the dark one and can serve as the post's image on listing pages and
 * on its social card. The station sits in the middle so that a 4:3 crop on
 * listing pages keeps it whole.
 */
import fs from 'node:fs';
import {Resvg} from '@resvg/resvg-js';

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/ilustrasi-orbit.mjs <out.png>');
  process.exit(1);
}

const W = 1200;
const H = 675;
const C = {
  sky: '#17121a',
  skyHigh: '#241c2b',
  ink: '#efe9ea',
  soft: '#aba1ab',
  metal: '#8d8291',
  metalDark: '#4a3d50',
  accent: '#ff9068',
  heat: '#f7994e',
  heatDeep: '#c9485b',
  sun: '#ffe2b8',
  cell: '#2e4a86',
  cellLit: '#4a6fb8',
  cellLine: '#8aa5dc',
  sea: '#1b2c4c',
  seaLit: '#2f5d8f',
  air: '#7cc4e8',
  city: '#ffd27a',
};

/* A small deterministic generator, so the stars stay put between runs. */
let seed = 20261114;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const stroke = (color, width = 2) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

svg += `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.skyHigh}"/>
    <stop offset="1" stop-color="${C.sky}"/>
  </linearGradient>
  <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.sun}" stop-opacity="0.55"/>
    <stop offset="0.35" stop-color="${C.heat}" stop-opacity="0.18"/>
    <stop offset="1" stop-color="${C.heat}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="earth" gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="${W}" y2="640">
    <stop offset="0" stop-color="${C.seaLit}"/>
    <stop offset="0.5" stop-color="${C.sea}"/>
    <stop offset="0.78" stop-color="#101827"/>
    <stop offset="1" stop-color="#0b1019"/>
  </linearGradient>
  <linearGradient id="rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0" stop-color="${C.air}" stop-opacity="1"/>
    <stop offset="0.7" stop-color="${C.air}" stop-opacity="0.7"/>
    <stop offset="1" stop-color="${C.air}" stop-opacity="0.15"/>
  </linearGradient>
  <linearGradient id="cell" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.cellLit}"/>
    <stop offset="1" stop-color="${C.cell}"/>
  </linearGradient>
  <linearGradient id="radiator" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.heatDeep}"/>
    <stop offset="0.5" stop-color="${C.accent}"/>
    <stop offset="1" stop-color="${C.heatDeep}"/>
  </linearGradient>
  <linearGradient id="module" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5d5163"/>
    <stop offset="1" stop-color="#352b3a"/>
  </linearGradient>
  <linearGradient id="plume" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.heat}" stop-opacity="0"/>
    <stop offset="1" stop-color="${C.sun}"/>
  </linearGradient>
  <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="halo" filterUnits="userSpaceOnUse" x="0" y="480" width="${W}" height="${H - 480}"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="earthClip"><circle cx="600" cy="2160" r="1600"/></clipPath>
</defs>`;

svg += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;

/* Stars, kept away from the sun's glare. */
for (let i = 0; i < 140; i++) {
  const x = rand() * W;
  const y = rand() * 600;
  if (Math.hypot(x - 110, y - 95) < 190) continue;
  const r = rand() < 0.1 ? 1.6 : 0.6 + rand() * 0.6;
  svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${C.ink}" opacity="${(0.25 + rand() * 0.55).toFixed(2)}"/>`;
}

/* The sun, upper left. */
svg += `<circle cx="110" cy="95" r="220" fill="url(#sunGlow)"/>`;
svg += `<circle cx="110" cy="95" r="34" fill="${C.sun}" filter="url(#blur4)"/>`;
svg += `<circle cx="110" cy="95" r="28" fill="#fff6e6"/>`;

/* The Earth: a curved limb across the bottom, lit from the sun's side, with
 * the night side's cities on the right. */
svg += `<circle cx="600" cy="2160" r="1600" fill="url(#earth)"/>`;
svg += `<g clip-path="url(#earthClip)" fill="${C.city}">`;
for (let i = 0; i < 70; i++) {
  const x = 930 + rand() * 270;
  const y = 600 + rand() * 75;
  svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + rand() * 1.1).toFixed(2)}" opacity="${(0.35 + rand() * 0.5).toFixed(2)}"/>`;
}
svg += `</g>`;
/* Atmosphere: a soft halo and a thin bright rim. */
svg += `<circle cx="600" cy="2160" r="1604" ${stroke('url(#rim)', 14)} opacity="0.35" filter="url(#halo)"/>`;
svg += `<circle cx="600" cy="2160" r="1601" ${stroke('url(#rim)', 2.5)} opacity="0.85"/>`;

/* The whole spacecraft is drawn level and then tilted a little about the
 * compute module, so it looks like it is flying rather than posing. */
const TILT = 7;
svg += `<g transform="rotate(${TILT} 600 280)">`;

/* Infrared leaving the radiators: wavy lines that fade as they go out. */
const wave = (x, y, dx, dy, len = 120) => {
  const n = 6;
  const step = len / n;
  const ux = dx / Math.hypot(dx, dy);
  const uy = dy / Math.hypot(dx, dy);
  const px = -uy * 7;
  const py = ux * 7;
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * step;
    const e = (i + 1) * step;
    const sign = i % 2 ? -1 : 1;
    d += ` Q${(x + ux * s + px * sign).toFixed(1)} ${(y + uy * s + py * sign).toFixed(1)} ${(x + ux * e).toFixed(1)} ${(y + uy * e).toFixed(1)}`;
  }
  const id = `w${x}${y}${dx}${dy}`.replace(/[.-]/g, '_');
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + ux * len}" y2="${y + uy * len}">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
    <path d="${d}" fill="none" stroke="url(#${id})" stroke-width="3" stroke-linecap="round"/>`;
};

const RAD = {x: 553, w: 94, top: 58, topEnd: 236, bottom: 324, bottomEnd: 502};
for (const [y, dy, len] of [[90, -0.55, 120], [140, -0.25, 120], [190, 0.05, 80], [380, -0.05, 80], [430, 0.25, 120], [480, 0.55, 120]]) {
  svg += wave(RAD.x - 14, y, -1, dy, len);
  svg += wave(RAD.x + RAD.w + 14, y, 1, dy, len);
}

/* The truss that holds everything together. */
const TRUSS = 280;
svg += `<rect x="96" y="${TRUSS - 6}" width="1008" height="12" fill="${C.metalDark}"/>`;
svg += `<path d="M96 ${TRUSS - 6}H1104M96 ${TRUSS + 6}H1104" ${stroke(C.metal, 1.5)}/>`;
let lattice = '';
for (let x = 96; x < 1104; x += 16) lattice += `M${x} ${TRUSS - 6}l8 12l8 -12`;
svg += `<path d="${lattice}" ${stroke(C.metal, 1.2)} opacity="0.8"/>`;

/* Solar wings: two on each side, above and below the truss. */
const panel = (x, y, w, h) => {
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cell)" stroke="${C.cellLine}" stroke-width="1.5"/>`;
  let grid = '';
  const cols = Math.round(w / 18);
  const rows = Math.round(h / 18);
  for (let i = 1; i < cols; i++) grid += `M${(x + (w * i) / cols).toFixed(1)} ${y}v${h}`;
  for (let i = 1; i < rows; i++) grid += `M${x} ${(y + (h * i) / rows).toFixed(1)}h${w}`;
  g += `<path d="${grid}" stroke="${C.cellLine}" stroke-width="0.8" opacity="0.55"/>`;
  /* A sheen where the sunlight catches it. */
  g += `<path d="M${x + 4} ${y + h - 4} L${x + w * 0.42} ${y + 4} H${x + w * 0.58} L${x + w * 0.16} ${y + h - 4}Z" fill="#ffffff" opacity="0.07"/>`;
  return g;
};
const WING_H = 92;
for (const [x0, x1] of [[128, 452], [748, 1072]]) {
  const mid = (x0 + x1) / 2;
  for (const [a, b] of [[x0, mid - 5], [mid + 5, x1]]) {
    svg += panel(a, TRUSS - 12 - WING_H, b - a, WING_H);
    svg += panel(a, TRUSS + 12, b - a, WING_H);
  }
  /* The mast each wing hangs on. */
  svg += `<path d="M${mid} ${TRUSS - 12 - WING_H - 6}V${TRUSS + 12 + WING_H + 6}" ${stroke(C.metal, 3)}/>`;
}

/* Radiators: long warm panels above and below the module, with the coolant
 * lines that carry the heat out to them. */
const radiator = (y0, y1) => {
  let g = `<rect x="${RAD.x}" y="${y0}" width="${RAD.w}" height="${y1 - y0}" rx="3" fill="url(#radiator)"/>`;
  g += `<rect x="${RAD.x}" y="${y0}" width="${RAD.w}" height="${y1 - y0}" rx="3" fill="${C.accent}" opacity="0.35" filter="url(#blur8)"/>`;
  let lines = '';
  for (let y = y0 + 14; y < y1 - 6; y += 14) lines += `M${RAD.x + 6} ${y}H${RAD.x + RAD.w - 6}`;
  g += `<path d="${lines}" ${stroke(C.sun, 1.2)} opacity="0.45"/>`;
  g += `<path d="M${RAD.x + RAD.w / 2} ${y0 + 6}V${y1 - 6}" ${stroke(C.sun, 1.5)} opacity="0.6"/>`;
  return g;
};
svg += radiator(RAD.top, RAD.topEnd);
svg += radiator(RAD.bottom, RAD.bottomEnd);

/* The compute module: a pressure-less box of racks, lit at the seams. */
const M = {x: 530, y: 236, w: 140, h: 88};
svg += `<rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h}" rx="8" fill="url(#module)" stroke="${C.metal}" stroke-width="2"/>`;
for (let i = 0; i < 5; i++) {
  const x = M.x + 14 + i * 24;
  svg += `<rect x="${x}" y="${M.y + 14}" width="16" height="${M.h - 28}" rx="2" fill="#241c2b" stroke="${C.metalDark}" stroke-width="1"/>`;
  for (let j = 0; j < 5; j++) {
    const on = rand() < 0.7;
    svg += `<circle cx="${x + 8}" cy="${M.y + 22 + j * 11}" r="1.8" fill="${on ? '#7fca9b' : C.accent}" opacity="${on ? 0.95 : 0.8}"/>`;
  }
}
svg += `</g>`;

/* A rocket on its way up from the limb, with its plume trailing back. */
const R = {x: 948, y: 470, angle: -38};
svg += `<g transform="translate(${R.x} ${R.y}) rotate(${R.angle})">
  <path d="M-150 0 Q-80 -9 -18 0 Q-80 9 -150 0Z" fill="url(#plume)" opacity="0.9"/>
  <path d="M-130 0 Q-70 -4 -18 0 Q-70 4 -130 0Z" fill="${C.sun}" opacity="0.7"/>
  <rect x="-18" y="-5" width="34" height="10" rx="2" fill="${C.ink}"/>
  <path d="M16 -5 Q30 0 16 5Z" fill="${C.ink}"/>
  <path d="M-18 -5l-7 -6v22l7 -6z" fill="${C.soft}"/>
</g>`;

svg += `</svg>`;

const png = new Resvg(svg, {font: {loadSystemFonts: false}, fitTo: {mode: 'width', value: W * 2}}).render().asPng();
fs.writeFileSync(out, png);
console.log(`${out}: ${W * 2}x${H * 2}`);
