/**
 * Draw the illustration of the post on "The Act of Killing": the giant
 * concrete carp from the film's key art, weathered and up on stilts in the
 * grass, a red walkway running out of its open mouth towards the lake, a row
 * of dancers on it, and a storm coming in over the water.
 *
 *     node scripts/ilustrasi-act-of-killing.mjs blog/2025-11/07-the-act-of-killing/ikan.png
 *
 * Reference: the film's promotional image, as used for the thumbnail of the
 * trailer embedded in the post (https://i.ytimg.com/vi/3tILiqotj7Y/maxresdefault.jpg).
 * Drawn, not traced. One PNG with its own sky, so that it reads on the light
 * page as well as the dark one. The fish sits in the middle so that a 4:3
 * crop on listing pages keeps its body and mouth.
 */
import fs from 'node:fs';
import {Resvg} from '@resvg/resvg-js';

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/ilustrasi-act-of-killing.mjs <out.png>');
  process.exit(1);
}

const W = 1200;
const H = 675;
const C = {
  skyTop: '#2a1a30',
  plum: '#4b3052',
  mauve: '#93405c',
  rose: '#d94a4c',
  haze: '#b98a98',
  storm: '#1c1622',
  lake: '#2f6f86',
  lakeDeep: '#1d4a5e',
  hills: '#26323f',
  grass: '#3f6530',
  grassDeep: '#16281a',
  blade: '#58803c',
  bladeDark: '#24401f',
  bronze: '#a98250',
  bronzeDark: '#4a3424',
  grime: '#1e1612',
  window: '#e8cf8a',
  windowDark: '#2a1e18',
  fin: '#d9ccb8',
  carpet: '#d94a4c',
  deck: '#5a4a4e',
  post: '#6d6467',
  dancer: '#ff5f9e',
  dancerDeep: '#c23d78',
  skin: '#b07a58',
  ink: '#1a1214',
};

/* A small deterministic generator, so the grass and the rain stay put between runs. */
let seed = 19651001;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const between = (a, b) => a + rand() * (b - a);

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

/* The fish's outline, facing right, mouth open at the snout. */
const BODY =
  'M240 338 C300 282 420 252 560 270 C650 282 730 330 788 392 L792 470 C730 522 600 540 470 532 C380 526 300 500 240 462 Z';

svg += `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.skyTop}"/>
    <stop offset="0.35" stop-color="${C.plum}"/>
    <stop offset="0.62" stop-color="${C.mauve}"/>
    <stop offset="0.8" stop-color="${C.haze}"/>
  </linearGradient>
  <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.lake}"/>
    <stop offset="1" stop-color="${C.lakeDeep}"/>
  </linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.grass}"/>
    <stop offset="1" stop-color="${C.grassDeep}"/>
  </linearGradient>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.bronze}"/>
    <stop offset="0.55" stop-color="#7a5a38"/>
    <stop offset="1" stop-color="${C.bronzeDark}"/>
  </linearGradient>
  <linearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#c9a678"/>
    <stop offset="1" stop-color="#7a5a38"/>
  </linearGradient>
  <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.storm}" stop-opacity="0.85"/>
    <stop offset="1" stop-color="${C.lake}" stop-opacity="0.15"/>
  </linearGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="grime" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
  <clipPath id="bodyClip"><path d="${BODY}"/></clipPath>
</defs>`;

/* The sky, and a storm rolling in from the right. */
svg += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
svg += `<g filter="url(#soft)">
  <ellipse cx="180" cy="90" rx="320" ry="90" fill="${C.skyTop}" opacity="0.7"/>
  <ellipse cx="620" cy="150" rx="300" ry="70" fill="${C.plum}" opacity="0.8"/>
  <ellipse cx="470" cy="300" rx="260" ry="60" fill="#d3b3bd" opacity="0.45"/>
  <ellipse cx="980" cy="250" rx="300" ry="120" fill="${C.storm}" opacity="0.85"/>
  <ellipse cx="1100" cy="330" rx="200" ry="90" fill="#2a3540" opacity="0.9"/>
  <ellipse cx="820" cy="330" rx="140" ry="50" fill="#3a3a4c" opacity="0.6"/>
</g>`;

/* Rain hanging under the storm, over the far shore. */
svg += `<path d="M900 300 L1200 280 L1200 455 L920 455 Z" fill="url(#rain)" opacity="0.7" filter="url(#grime)"/>`;
let rain = '';
for (let i = 0; i < 70; i++) {
  const x = between(910, 1200);
  const y = between(300, 360);
  rain += `M${x.toFixed(1)} ${y.toFixed(1)}l-6 ${between(80, 140).toFixed(1)}`;
}
svg += `<path d="${rain}" fill="none" stroke="#9fb4c4" stroke-width="1" opacity="0.25"/>`;

/* The far shore, then the lake. */
svg += `<path d="M700 452 C800 440 860 420 960 424 C1040 427 1100 410 1200 414 L1200 456 L700 456 Z" fill="${C.hills}"/>`;
svg += `<rect x="0" y="454" width="${W}" height="80" fill="url(#lake)"/>`;
svg += `<path d="M720 470h120M900 482h160M1000 466h110M760 496h90" stroke="#7fb6c8" stroke-width="1.5" opacity="0.35"/>`;

/* A few trees on the left, behind the tail. */
svg += `<g fill="#2c4a26">
  <ellipse cx="38" cy="468" rx="40" ry="34"/>
  <ellipse cx="86" cy="482" rx="30" ry="24"/>
  <ellipse cx="14" cy="440" rx="26" ry="30"/>
</g>`;

/* The meadow. */
svg += `<path d="M0 500 C200 490 420 506 640 500 C860 494 1020 506 1200 498 L1200 ${H} L0 ${H} Z" fill="url(#ground)"/>`;

/* Grass behind the stilts. */
const blades = (count, y0, y1, colors, len) => {
  let g = '';
  for (let i = 0; i < count; i++) {
    const x = between(-10, W + 10);
    const y = between(y0, y1);
    const h = between(len[0], len[1]) * (0.6 + ((y - y0) / (y1 - y0)) * 0.8);
    const lean = between(-10, 10);
    const color = colors[Math.floor(rand() * colors.length)];
    g += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q${(lean / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}" stroke="${color}" stroke-width="${between(1.2, 2.4).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  }
  return g;
};
svg += blades(500, 505, 600, [C.blade, C.bladeDark, '#58843a'], [8, 18]);

/* The stilts under the fish and under the walkway. */
let posts = '';
for (const x of [290, 345, 400, 455, 510, 565, 620, 675, 730]) {
  posts += `<rect x="${x - 5}" y="490" width="10" height="${600 - 490}" fill="${C.post}"/>`;
  posts += `<rect x="${x - 5}" y="490" width="3" height="${600 - 490}" fill="#8f8689"/>`;
}
for (const x of [850, 950, 1050, 1150]) {
  posts += `<rect x="${x - 3}" y="476" width="6" height="${590 - 476}" fill="${C.post}"/>`;
}
svg += posts;

/* The walkway, red carpet on top, running from the mouth to the lake. */
svg += `<rect x="770" y="470" width="${W - 770 + 10}" height="10" fill="${C.deck}"/>`;
svg += `<rect x="770" y="466" width="${W - 770 + 10}" height="5" fill="${C.carpet}"/>`;

/* The tail, upright like a fan, and the dorsal fin, spiked. */
svg += `<path d="M252 372 Q200 322 152 252 Q118 330 138 398 Q114 464 150 530 Q200 474 252 432 Z" fill="url(#tail)" stroke="${C.bronzeDark}" stroke-width="2"/>`;
svg += `<path d="M152 252 Q170 330 200 360 M138 398 Q190 400 230 402 M150 530 Q180 470 210 440" fill="none" stroke="${C.bronzeDark}" stroke-width="1.5" opacity="0.6"/>`;
svg += `<path d="M330 290 L352 222 L372 266 L398 206 L414 260 L442 198 L456 256 L486 206 L494 258 L526 222 L540 268 Z" fill="#8a6640" stroke="${C.bronzeDark}" stroke-width="2" stroke-linejoin="round"/>`;

/* The body: weathered concrete in bronze, scales, grime, windows. */
svg += `<path d="${BODY}" fill="url(#body)"/>`;
svg += `<g clip-path="url(#bodyClip)">`;
let scales = '';
for (let row = 0; row < 11; row++) {
  const y = 262 + row * 26;
  for (let col = 0; col < 15; col++) {
    const x = 262 + col * 30 + (row % 2) * 15;
    if (x > 650) continue;
    scales += `M${x} ${y - 15} Q${x - 16} ${y} ${x} ${y + 15}`;
  }
}
svg += `<path d="${scales}" fill="none" stroke="${C.bronzeDark}" stroke-width="2" opacity="0.55"/>`;
svg += `<path d="${scales}" fill="none" stroke="#d6b27c" stroke-width="1" opacity="0.25" transform="translate(2 -1)"/>`;
svg += `<g filter="url(#grime)">
  <ellipse cx="560" cy="440" rx="120" ry="50" fill="${C.grime}" opacity="0.55"/>
  <ellipse cx="380" cy="470" rx="110" ry="40" fill="${C.grime}" opacity="0.5"/>
  <ellipse cx="700" cy="420" rx="60" ry="80" fill="${C.grime}" opacity="0.45"/>
  <ellipse cx="300" cy="350" rx="50" ry="40" fill="${C.grime}" opacity="0.35"/>
  <ellipse cx="470" cy="300" rx="90" ry="22" fill="#d6b27c" opacity="0.35"/>
  <ellipse cx="500" cy="520" rx="260" ry="30" fill="${C.grime}" opacity="0.6"/>
</g>`;
/* Streaks of rainwater down the flank. */
let streaks = '';
for (let i = 0; i < 40; i++) {
  const x = between(260, 760);
  const y = between(290, 380);
  streaks += `M${x.toFixed(1)} ${y.toFixed(1)}l${between(-2, 2).toFixed(1)} ${between(40, 120).toFixed(1)}`;
}
svg += `<path d="${streaks}" stroke="${C.grime}" stroke-width="3" opacity="0.12" fill="none"/>`;
/* The gill plate. */
svg += `<path d="M668 300 Q632 410 688 520" fill="none" stroke="${C.bronzeDark}" stroke-width="4" opacity="0.8"/>`;
svg += `<path d="M672 300 Q638 410 692 520" fill="none" stroke="#c9a678" stroke-width="1.5" opacity="0.4"/>`;
svg += `</g>`;
svg += `<path d="${BODY}" fill="none" stroke="${C.bronzeDark}" stroke-width="2.5"/>`;

/* Square windows cut into the flank, some lit, some empty. */
const windows = [
  [298, 400, 1], [338, 388, 1], [388, 392, 0], [430, 382, 1], [496, 374, 1],
  [560, 380, 0], [610, 388, 1], [372, 452, 1], [456, 446, 0], [520, 458, 1],
  [588, 450, 1], [320, 340, 0],
];
for (const [x, y, lit] of windows) {
  svg += `<rect x="${x}" y="${y}" width="18" height="18" transform="rotate(${between(-6, 6).toFixed(1)} ${x + 9} ${y + 9})" fill="${lit ? C.window : C.windowDark}" stroke="${C.bronzeDark}" stroke-width="1.5" opacity="${lit ? 0.9 : 1}"/>`;
}

/* The eye, a round porthole. */
svg += `<circle cx="728" cy="392" r="17" fill="${C.ink}" stroke="#8f7a62" stroke-width="4"/>`;
svg += `<circle cx="723" cy="387" r="5" fill="#6d6467" opacity="0.6"/>`;

/* The open mouth, the walkway's door. */
svg += `<ellipse cx="790" cy="431" rx="22" ry="44" fill="#120c0e"/>`;
svg += `<ellipse cx="790" cy="431" rx="22" ry="44" fill="none" stroke="#c9a678" stroke-width="7"/>`;
svg += `<ellipse cx="792" cy="431" rx="22" ry="44" fill="none" stroke="${C.bronzeDark}" stroke-width="1.5"/>`;

/* A pectoral fin, broken loose and hanging. */
svg += `<path d="M612 498 Q560 520 486 566 Q500 590 534 586 Q590 560 626 518 Z" fill="${C.fin}" stroke="#8f8170" stroke-width="2" stroke-linejoin="round"/>`;
svg += `<path d="M612 504 L500 574 M614 508 L516 584 M618 512 L534 584" stroke="#8f8170" stroke-width="1" opacity="0.6"/>`;

/* The dancers on the red carpet, fans raised, headdresses up. */
const dancer = (x, flip) => {
  const s = flip ? -1 : 1;
  const y = 466;
  return `<g>
    <path d="M${x - 3} ${y - 14}V${y} M${x + 3} ${y - 14}V${y}" stroke="${C.ink}" stroke-width="2"/>
    <path d="M${x - 5} ${y - 30} L${x + 5} ${y - 30} L${x + 12} ${y - 12} L${x - 12} ${y - 12} Z" fill="${C.dancer}"/>
    <path d="M${x - 12} ${y - 12} L${x + 12} ${y - 12}" stroke="${C.dancerDeep}" stroke-width="2"/>
    <rect x="${x - 3.5}" y="${y - 40}" width="7" height="11" fill="${C.dancer}"/>
    <path d="M${x} ${y - 37} L${x + s * 11} ${y - 50}" stroke="${C.skin}" stroke-width="2" stroke-linecap="round"/>
    <path d="M${x + s * 11} ${y - 50} l${s * 9} -6 l${-s * 2} 11 Z" fill="${C.dancer}"/>
    <path d="M${x} ${y - 37} L${x - s * 8} ${y - 28}" stroke="${C.skin}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y - 44}" r="4" fill="${C.skin}"/>
    <path d="M${x - 4} ${y - 47} L${x} ${y - 60} L${x + 4} ${y - 47} Z" fill="${C.dancer}"/>
  </g>`;
};
for (let i = 0; i < 6; i++) svg += dancer(850 + i * 40, false);

/* Grass in front of the stilts, so they stand in it rather than on it. */
svg += blades(900, 560, 690, [C.blade, C.bladeDark, '#4a7334'], [12, 24]);

svg += `</svg>`;

const png = new Resvg(svg, {font: {loadSystemFonts: false}, fitTo: {mode: 'width', value: W * 2}}).render().asPng();
fs.writeFileSync(out, png);
console.log(`${out}: ${W * 2}x${H * 2}`);
