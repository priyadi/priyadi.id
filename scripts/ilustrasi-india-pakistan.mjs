/**
 * Draw the map for the post on nationalism: India and Pakistan, with Karnal,
 * where Kalpana Chawla was born, a short way south-east of the border.
 *
 *     node scripts/ilustrasi-india-pakistan.mjs blog/2026-11/20-apakah-nasionalisme-dapat-dibenarkan/india-pakistan.png
 *
 * The borders are Natural Earth's (1:50m, via world-atlas), fetched at run
 * time. They follow the lines of control in Kashmir, not either country's
 * claim. One PNG on a dark background, like the other drawn illustrations, so
 * that it reads on the light page as well as the dark one.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';
import {geoConicConformal, geoPath, geoDistance, geoInterpolate} from 'd3-geo';
import {feature, mesh} from 'topojson-client';

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/ilustrasi-india-pakistan.mjs <out.png>');
  process.exit(1);
}

const DATA = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const topology = await (await fetch(DATA)).json();
const countries = feature(topology, topology.objects.countries).features;
const byName = (name) => countries.find((c) => c.properties.name === name);

const W = 1200;
const H = 1000;
const C = {
  sea: '#17121a',
  seaLine: '#241c2b',
  land: '#2e2533',
  landLine: '#4a3d50',
  ink: '#efe9ea',
  soft: '#aba1ab',
  faint: '#7d7280',
  india: '#f7994e',
  pakistan: '#5fae84',
  accent: '#ff9068',
  pin: '#ffe2b8',
};

const KARNAL = [76.9905, 29.6857];
const LAHORE = [74.3587, 31.5204];
const DELHI = [77.209, 28.6139];

const india = byName('India');
const pakistan = byName('Pakistan');
/* Siachen is its own polygon in Natural Earth; India holds it. */
const siachen = byName('Siachen Glacier');

const projection = geoConicConformal()
  .rotate([-78, 0])
  .parallels([12, 32])
  .fitExtent(
    [
      [90, 60],
      [W - 60, H - 40],
    ],
    {type: 'FeatureCollection', features: [india, pakistan]},
  );
const toPath = geoPath(projection);
const P = (lonlat) => projection(lonlat).map((v) => +v.toFixed(1));

/* The nearest point on Pakistan's border from Karnal, for the distance line. */
let nearest = null;
let best = Infinity;
const {type, coordinates} = pakistan.geometry;
for (const polygon of type === 'Polygon' ? [coordinates] : coordinates) {
  for (const ring of polygon) {
    for (const point of ring) {
      const d = geoDistance(KARNAL, point);
      if (d < best) [best, nearest] = [d, point];
    }
  }
}
const km = Math.round((best * 6371) / 10) * 10;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x, y, s, {size = 22, weight = 400, fill = C.ink, anchor = 'middle', spacing = 0, halo = true} = {}) => {
  const attrs = `x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter" font-weight="${weight}" font-size="${size}" letter-spacing="${spacing}"`;
  const back = halo
    ? `<text ${attrs} fill="none" stroke="${C.sea}" stroke-width="5" stroke-linejoin="round" opacity="0.85">${esc(s)}</text>`
    : '';
  return back + `<text ${attrs} fill="${fill}">${esc(s)}</text>`;
};
const stroke = (color, width = 2) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<defs>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.pin}" stop-opacity="0.55"/>
    <stop offset="1" stop-color="${C.pin}" stop-opacity="0"/>
  </radialGradient>
</defs>`;
svg += `<rect width="${W}" height="${H}" fill="${C.sea}"/>`;

/* A faint graticule, for a sense of the curve of the projection. */
let grid = '';
for (let lon = 50; lon <= 110; lon += 5) {
  grid += toPath({type: 'LineString', coordinates: Array.from({length: 41}, (_, i) => [lon, -5 + i])});
}
for (let lat = 0; lat <= 40; lat += 5) {
  grid += toPath({type: 'LineString', coordinates: Array.from({length: 61}, (_, i) => [50 + i, lat])});
}
svg += `<path d="${grid}" ${stroke(C.seaLine, 1)}/>`;

/* Every country, muted, then the two that matter on top. */
svg += `<path d="${countries.map(toPath).join('')}" fill="${C.land}"/>`;
svg += `<path d="${toPath(mesh(topology, topology.objects.countries, (a, b) => a !== b))}" ${stroke(C.landLine, 1.2)}/>`;
svg += `<path d="${toPath(pakistan)}" fill="${C.pakistan}" fill-opacity="0.82" ${stroke(C.sea, 1.5).replace('fill="none" ', '')}/>`;
svg += `<path d="${toPath(india)}${toPath(siachen)}" fill="${C.india}" fill-opacity="0.82" ${stroke(C.sea, 1.5).replace('fill="none" ', '')}/>`;

/* The border between the two, drawn over both. */
const border = mesh(
  topology,
  topology.objects.countries,
  (a, b) =>
    [a.properties.name, b.properties.name].includes('Pakistan') &&
    ['India', 'Siachen Glacier'].some((n) => [a.properties.name, b.properties.name].includes(n)),
);
svg += `<path d="${toPath(border)}" ${stroke(C.ink, 2.2)} stroke-dasharray="7 6" opacity="0.9"/>`;

/* Country names. */
const label = (lonlat, s, opts) => {
  const [x, y] = P(lonlat);
  return text(x, y, s, opts);
};
svg += label([79.2, 20.5], 'INDIA', {size: 46, weight: 600, spacing: 8, fill: C.sea, halo: false});
svg += label([67.6, 27.4], 'PAKISTAN', {size: 34, weight: 600, spacing: 6, fill: C.sea, halo: false});
for (const [lonlat, s] of [
  [[65.5, 33.6], 'Afganistan'],
  [[58.5, 31], 'Iran'],
  [[94.5, 30.4], 'Tiongkok'],
  [[84, 28.35], 'Nepal'],
  [[89.6, 20.9], 'Bangladesh'],
  [[80.75, 7.7], 'Sri Lanka'],
  [[95.6, 21.5], 'Myanmar'],
]) {
  svg += label(lonlat, s, {size: 19, fill: C.soft});
}
svg += label([66, 17], 'Laut Arab', {size: 20, fill: C.faint, spacing: 2, halo: false});
svg += label([88.5, 15.5], 'Teluk Benggala', {size: 20, fill: C.faint, spacing: 2, halo: false});

/* The distance from Karnal to the border, along the great circle. */
const [kx, ky] = P(KARNAL);
const [bx, by] = P(nearest);
const arc = geoInterpolate(KARNAL, nearest);
svg += `<path d="${toPath({type: 'LineString', coordinates: Array.from({length: 11}, (_, i) => arc(i / 10))})}" ${stroke(C.pin, 2.5)} stroke-dasharray="2 6"/>`;
svg += `<circle cx="${bx}" cy="${by}" r="4" fill="${C.pin}"/>`;

/* Lahore and New Delhi, for scale. */
for (const [lonlat, s, dx, anchor] of [
  [LAHORE, 'Lahore', -12, 'end'],
  [DELHI, 'New Delhi', 12, 'start'],
]) {
  const [x, y] = P(lonlat);
  svg += `<circle cx="${x}" cy="${y}" r="5" fill="${C.sea}" stroke="${C.ink}" stroke-width="2"/>`;
  svg += text(x + dx, y + 7, s, {size: 18, anchor});
}

/* Karnal, with a glow so the eye goes there first. */
svg += `<circle cx="${kx}" cy="${ky}" r="38" fill="url(#glow)"/>`;
svg += `<circle cx="${kx}" cy="${ky}" r="9" fill="${C.accent}" stroke="${C.pin}" stroke-width="3"/>`;

/* Its callout, out to the east over the Himalaya and Tibet. */
const cx = kx + 150;
const cy = ky - 150;
svg += `<path d="M${kx + 8} ${ky - 8}L${cx - 14} ${cy + 14}H${cx}" ${stroke(C.pin, 2)}/>`;
svg += text(cx + 8, cy + 2, 'Karnal, Haryana', {size: 26, weight: 600, anchor: 'start'});
svg += text(cx + 8, cy + 32, 'tempat lahir Kalpana Chawla', {size: 20, fill: C.soft, anchor: 'start'});
/* The distance goes in the callout: by the dotted line it crowds Lahore. */
svg += text(cx + 8, cy + 60, `± ${km} km dari perbatasan Pakistan`, {size: 20, fill: C.pin, anchor: 'start'});

/* Legend and source, bottom left. */
const LX = 70;
const LY = H - 120;
svg += `<rect x="${LX}" y="${LY}" width="22" height="16" rx="2" fill="${C.india}" fill-opacity="0.82"/>`;
svg += text(LX + 34, LY + 14, 'India', {size: 18, anchor: 'start', halo: false});
svg += `<rect x="${LX}" y="${LY + 28}" width="22" height="16" rx="2" fill="${C.pakistan}" fill-opacity="0.82"/>`;
svg += text(LX + 34, LY + 42, 'Pakistan', {size: 18, anchor: 'start', halo: false});
svg += `<path d="M${LX} ${LY + 64}h22" ${stroke(C.ink, 2.2)} stroke-dasharray="7 6"/>`;
svg += text(LX + 34, LY + 70, 'Perbatasan India–Pakistan', {size: 18, anchor: 'start', halo: false});
svg += text(LX, H - 18, 'Batas wilayah: Natural Earth (garis kontrol de facto di Kashmir)', {
  size: 14,
  fill: C.faint,
  anchor: 'start',
  halo: false,
});

svg += `</svg>`;

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.join(here, 'socialcard-fonts');
const png = new Resvg(svg, {
  font: {
    fontFiles: ['Inter-Regular.ttf', 'Inter-SemiBold.ttf'].map((f) => path.join(fonts, f)),
    loadSystemFonts: false,
    defaultFontFamily: 'Inter',
  },
  fitTo: {mode: 'width', value: W * 2},
}).render().asPng();
fs.writeFileSync(out, png);
console.log(`${out}: ${W * 2}x${H * 2}, Karnal to the border ≈ ${km} km at ${nearest.map((v) => v.toFixed(2))}`);
