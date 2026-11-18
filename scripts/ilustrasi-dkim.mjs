/**
 * Draw the illustration of the post on verifying BI-checking results: the
 * chain of trust from OJK's signature to the reader's browser.
 *
 *     node scripts/ilustrasi-dkim.mjs blog/2026-08/14-bi-checking-idebku-slik/rantai-kepercayaan.png
 *
 * One PNG on a dusk background, so that it reads on the light page as well as
 * the dark one and can serve as the post's image on listing pages and on its
 * social card.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';

const out = process.argv[2];
if (!out) {
  console.error('usage: node scripts/ilustrasi-dkim.mjs <out.png>');
  process.exit(1);
}

const W = 1200;
const H = 675;
const C = {
  paper: '#211a25',
  ink: '#efe9ea',
  soft: '#aba1ab',
  rule: '#4a3d50',
  accent: '#ff9068',
  key: '#f7994e',
  pass: '#7fca9b',
};

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x, y, s, {size = 26, weight = 400, fill = C.ink, anchor = 'middle'} = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(s)}</text>`;
const stroke = (color, width = 3) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

/* Icons, drawn around a centre point in a box of about 96px. */
const icons = {
  building: (x, y) => `<g transform="translate(${x - 48} ${y - 48})" ${stroke(C.ink)}>
      <path d="M10 34 48 12l38 22z"/>
      <path d="M14 34h68M14 84h68M8 92h80"/>
      <path d="M24 42v34M40 42v34M56 42v34M72 42v34"/>
    </g>`,
  person: (x, y) => `<g transform="translate(${x - 48} ${y - 48})" ${stroke(C.ink)}>
      <circle cx="48" cy="30" r="16"/>
      <path d="M16 90c2-20 15-32 32-32s30 12 32 32"/>
    </g>`,
  forward: (x, y) => `<g transform="translate(${x - 48} ${y - 48})" ${stroke(C.ink)}>
      <rect x="8" y="22" width="80" height="58" rx="4"/>
      <path d="m10 25 38 28 38-28"/>
      <path d="M70 6v34a8 8 0 0 1-16 0V14a5 5 0 0 1 10 0v24" stroke="${C.soft}"/>
    </g>`,
  browser: (x, y) => `<g transform="translate(${x - 48} ${y - 48})">
      <g ${stroke(C.ink)}>
        <rect x="6" y="12" width="84" height="72" rx="5"/>
        <path d="M6 28h84"/>
      </g>
      <g fill="${C.soft}"><circle cx="16" cy="20" r="2.5"/><circle cx="25" cy="20" r="2.5"/><circle cx="34" cy="20" r="2.5"/></g>
      <path d="m32 56 11 11 21-23" ${stroke(C.pass, 4)}/>
    </g>`,
  key: (x, y) => `<g transform="translate(${x - 22} ${y - 14})" ${stroke(C.key)}>
      <circle cx="11" cy="14" r="9"/>
      <path d="M20 14h24M36 14v8M43 14v6"/>
    </g>`,
  /* A sealed envelope: the signed email in transit. */
  letter: (x, y) => `<g transform="translate(${x - 22} ${y - 15})">
      <rect x="1.5" y="1.5" width="41" height="28" rx="2.5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="m3 3 19 14L41 3" ${stroke(C.ink, 2.5)}/>
      <circle cx="35" cy="24" r="7" fill="${C.accent}" stroke="${C.paper}" stroke-width="2.5"/>
    </g>`,
};

const stations = [
  {x: 165, icon: 'building', title: 'OJK', lines: ['menandatangani email', 'dengan kunci privat']},
  {x: 455, icon: 'person', title: 'Pihak ketiga', lines: ['menerima email', 'hasil iDeb']},
  {x: 745, icon: 'forward', title: 'Diteruskan', lines: ['kepada Anda', 'sebagai lampiran']},
  {x: 1035, icon: 'browser', title: 'Pemeriksa', lines: ['di peramban Anda', 'mencocokkan tanda tangan']},
];
const ROW = 380;
const FIRST = stations[0].x;
const LAST = stations[stations.length - 1].x;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="${W}" height="${H}" fill="${C.paper}"/>`;

/* DNS: where the public key is published, and where the verifier finds it. */
svg += `<rect x="420" y="62" width="360" height="104" rx="4" ${stroke(C.rule, 2)}/>`;
svg += icons.key(478, 114);
svg += text(512, 106, 'DNS ojk.go.id', {size: 30, weight: 600, anchor: 'start'});
svg += text(512, 140, 'kunci publik', {size: 22, fill: C.soft, anchor: 'start'});

const dashed = `fill="none" stroke="${C.key}" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round"`;
svg += `<path d="M${FIRST} ${ROW - 70} V114 H408" ${dashed}/>`;
svg += `<path d="M792 114 H${LAST} V${ROW - 70}" ${dashed}/>`;
svg += `<path d="m400 106 10 8-10 8" ${stroke(C.key, 2.5)}/>`;
svg += `<path d="m${LAST - 8} ${ROW - 80} 8 10 8-10" ${stroke(C.key, 2.5)}/>`;
svg += text((FIRST + 408) / 2, 100, 'diterbitkan', {size: 21, fill: C.key});
svg += text((792 + LAST) / 2, 100, 'diambil', {size: 21, fill: C.key});

/* The email, signed, passed along from station to station. */
for (let i = 0; i < stations.length - 1; i++) {
  const x0 = stations[i].x + 66;
  const x1 = stations[i + 1].x - 66;
  svg += `<path d="M${x0} ${ROW} H${x1}" ${stroke(C.soft, 2.5)}/>`;
  svg += `<path d="m${x1 - 9} ${ROW - 8} 9 8-9 8" ${stroke(C.soft, 2.5)}/>`;
  svg += icons.letter((x0 + x1) / 2, ROW);
}

for (const s of stations) {
  svg += icons[s.icon](s.x, ROW);
  svg += text(s.x, ROW + 92, s.title, {size: 30, weight: 600});
  s.lines.forEach((line, i) => {
    svg += text(s.x, ROW + 128 + i * 30, line, {size: 22, fill: C.soft});
  });
}

/* What the reader gets at the end of the chain. */
svg += `<path d="m${LAST - 128} 618 9 9 17-19" ${stroke(C.pass, 3.5)}/>`;
svg += text(LAST + 16, 628, "asli, tidak diubah", {size: 26, weight: 600, fill: C.pass});

/* The seal, explained once. */
svg += icons.letter(FIRST - 64, 618);
svg += text(FIRST - 30, 628, '= email bertanda tangan DKIM', {size: 21, fill: C.soft, anchor: 'start'});

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
console.log(`${out}: ${W * 2}x${H * 2}`);
