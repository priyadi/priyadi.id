#!/usr/bin/env node
/**
 * Draw the social card of a post from its front matter.
 *
 *     node scripts/socialcards.mjs [--out DIR] [POST_DIR...]
 *
 * Without POST_DIR, draws every post under blog/ that has a `socialcard`
 * block. The card is written next to the post as socialcard.png, which the
 * post's `image` should point to. With --out, cards go to DIR instead, as
 * <yyyy-mm>-<dd-slug>.png, to try a design without touching the posts.
 *
 * A post without the block is left alone, so it can keep a card made by hand.
 *
 * Every card has the masthead, the date, the headline and the hill of the
 * site's logo. What fills the right-hand side is up to the post:
 *
 *     socialcard:
 *       variant: pattern      # default: a halftone sunset, unique per post
 *
 *     socialcard:
 *       variant: stat
 *       value: 14,5%
 *       label: dari total emisi gas rumah kaca berasal dari peternakan
 *
 *     socialcard:
 *       variant: figure
 *       image: ./chart.png
 *       fit: contain          # default; `cover` fills a square, for photos
 *       position: left top    # which part survives the crop when `cover`
 *
 * `title` and `description` in the block override those of the post, and
 * `description: false` leaves it out. `kicker` adds a label before the date.
 *
 * An SVG figure is drawn by resvg, which ignores CSS variables: a chart that
 * takes its colours from `var(--…)` loses them, so use a PNG export of it.
 *
 * Fonts come from scripts/socialcard-fonts (see scripts/socialcard-fonts.py).
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';
import {imageSize} from 'image-size';
import {load as parseYaml} from 'js-yaml';
import satori from 'satori';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(ROOT, 'scripts/socialcard-fonts');

const W = 1200;
const H = 630;
const MARGIN = 64;
const BAR = 10; // sunset strip along the top edge
const BODY_TOP = 132; // where the headline and the right-hand side start
const BODY_BOTTOM = 560;
const GAP = 48; // between the headline column and the right-hand side

// The dusk end of the site palette (dark mode in src/css/custom.css).
const C = {
  paper: '#17121a',
  ink: '#efe9ea',
  soft: '#aba1ab',
  rule: '#382e3c',
  accent: '#ff9068',
  hill: '#3a2443',
};
const SUNSET = ['#f7994e', '#f3674a', '#d94a4c', '#93405c', '#4b3052'];
const SUNSET_AT = [0, 0.3, 0.58, 0.82, 1];
const SUNSET_CSS = `linear-gradient(90deg, ${SUNSET.map(
  (c, i) => `${c} ${SUNSET_AT[i] * 100}%`,
).join(', ')})`;

const font = (file, name, weight) => ({
  name,
  weight,
  style: 'normal',
  data: fs.readFileSync(path.join(FONT_DIR, file)),
});
const FONTS = [
  font('Newsreader-Display-SemiBold.ttf', 'Newsreader', 600),
  font('Inter-Regular.ttf', 'Inter', 400),
  font('Inter-SemiBold.ttf', 'Inter', 600),
  font('JetBrainsMono-Medium.ttf', 'JetBrains Mono', 500),
];

// resvg scans every system font unless told not to, which can take minutes.
// The card's own fonts are enough: satori turns its text into outlines, and
// the text of an SVG figure falls back to these.
const RESVG_FONTS = {
  loadSystemFonts: false,
  fontFiles: fs
    .readdirSync(FONT_DIR)
    .filter((name) => name.endsWith('.ttf'))
    .map((name) => path.join(FONT_DIR, name)),
  defaultFontFamily: 'Inter',
  sansSerifFamily: 'Inter',
  serifFamily: 'Newsreader',
  monospaceFamily: 'JetBrains Mono',
};

// --- Small helpers -----------------------------------------------------------

/** A satori node. Every box is a flex container, as satori requires. */
function box(style, ...children) {
  const kids = children.flat().filter((c) => c != null && c !== false);
  return {
    type: 'div',
    props: {
      style: {display: 'flex', ...style},
      children: kids.length === 1 ? kids[0] : kids,
    },
  };
}

function image(src, style) {
  return {type: 'img', props: {src, style}};
}

const svgUri = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/** Seeded random numbers, so a post always gets the same sunset. */
function random(seed) {
  let a = 2166136261;
  for (const ch of seed) {
    a = Math.imul(a ^ ch.codePointAt(0), 16777619);
  }
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const smooth = (lo, hi, x) => {
  const t = clamp((x - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

/** Colour at t (0 to 1) along the sunset gradient. */
function sunset(t) {
  const x = clamp(t);
  let i = SUNSET_AT.findIndex((stop) => stop >= x);
  i = Math.max(1, i);
  const f = (x - SUNSET_AT[i - 1]) / (SUNSET_AT[i] - SUNSET_AT[i - 1]);
  const a = SUNSET[i - 1];
  const b = SUNSET[i];
  const mix = (o) => {
    const va = parseInt(a.slice(o, o + 2), 16);
    const vb = parseInt(b.slice(o, o + 2), 16);
    return Math.round(va + (vb - va) * f)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}

/** Typographic quotes, for titles written with straight ones. */
function typeset(text) {
  return text
    .replace(/"(\S[^"]*)"/g, '\u201c$1\u201d')
    .replace(/(^|[\s(])'(\S[^']*)'/g, '$1\u2018$2\u2019')
    .replace(/'/g, '\u2019');
}

/** Height that satori gives a node laid out at this width. */
async function heightOf(node, width) {
  const svg = await satori(node, {width, fonts: FONTS});
  return Number(svg.match(/<svg[^>]*\sheight="([\d.]+)"/)[1]);
}

// --- Artwork -----------------------------------------------------------------

/** The masthead wordmark, taken from the component that the site uses. */
function wordmark() {
  const tsx = fs.readFileSync(
    path.join(ROOT, 'src/theme/Navbar/Wordmark.tsx'),
    'utf8',
  );
  const viewBox = tsx.match(/viewBox="([^"]+)"/)[1];
  const paths = [...tsx.matchAll(/<path fill="[^"]+" d="([^"]+)"/g)];
  if (paths.length !== 2) {
    throw new Error('Wordmark.tsx no longer has the two paths expected here');
  }
  const [, , width, height] = viewBox.split(' ').map(Number);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
    `<path fill="${C.ink}" d="${paths[0][1]}"/>` +
    `<path fill="${C.accent}" d="${paths[1][1]}"/></svg>`;
  return {uri: svgUri(svg), ratio: width / height};
}

/**
 * The hill of the logo along the bottom edge and, when `sun` is set, a
 * halftone sun going down behind it.
 */
function landscape(seed, {sun}) {
  const rnd = random(seed);
  const between = (lo, hi) => lo + (hi - lo) * rnd();
  const parts = [];

  if (sun) {
    const cx = between(900, 1020);
    const cy = between(395, 445); // low enough for the hill to cut it off
    const radius = between(122, 152);
    const glow = between(200, 250);
    const step = 21;
    for (let row = 0, y = BAR + step; y < H; row++, y += step * 0.866) {
      for (let x = (row % 2) * (step / 2) + 600; x < W + step; x += step) {
        const d = Math.hypot(x - cx, y - cy);
        // 1 inside the disc, fading to 0 across the glow around it.
        const light = d <= radius ? 1 : clamp(1 - (d - radius) / glow) ** 1.7;
        const r = step * 0.47 * light * smooth(690, 800, x);
        if (r < 0.6) continue;
        const colour =
          d <= radius
            ? sunset(0.02 + 0.5 * ((y - (cy - radius)) / (2 * radius)))
            : sunset(0.6 + 0.4 * ((d - radius) / glow));
        parts.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${colour}"/>`,
        );
      }
    }
  }

  // The outline of the hill in static/img/priyadi.id.svg, as heights above
  // the bottom edge at x in 0 to 1280, nudged a little for each post.
  const tall = between(0.62, 0.78);
  const lift = () => between(-10, 10);
  const pt = (x, h) =>
    `${((x * W) / 1280).toFixed(1)} ${(H - h * tall + lift()).toFixed(1)}`;
  parts.push(
    `<path fill="${C.hill}" d="M${pt(0, 77.7)}` +
      `C${pt(180, 128.7)} ${pt(340, 140.7)} ${pt(500, 116.7)}` +
      `C${pt(650, 94.2)} ${pt(760, 98.7)} ${pt(900, 130.2)}` +
      `C${pt(1032, 160.2)} ${pt(1152, 164.7)} ${pt(1280, 139.2)}` +
      `V${H}H0Z"/>`,
  );

  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`,
  );
}

// --- Right-hand side ---------------------------------------------------------

const SIDE_H = BODY_BOTTOM - BODY_TOP;

async function statSide(card) {
  if (card.value == null) throw new Error('variant "stat" needs a `value`');
  const width = 388;
  const value = String(card.value);
  const number = (fontSize) =>
    box(
      {
        fontFamily: 'Newsreader',
        fontWeight: 600,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        wordBreak: 'break-all',
        backgroundImage: `linear-gradient(100deg, ${SUNSET[0]}, ${SUNSET[1]} 55%, ${SUNSET[2]})`,
        backgroundClip: 'text',
        color: 'transparent',
      },
      value,
    );
  // The largest size at which the number still fits on one line.
  let size = 200;
  while (size > 60 && (await heightOf(number(size), width)) > size * 1.5) {
    size -= 8;
  }
  return {
    width: width + 41,
    node: box(
      {
        width: width + 41,
        flexDirection: 'column',
        paddingLeft: 40,
        borderLeft: `1px solid ${C.rule}`,
      },
      number(size),
      card.label &&
        box(
          {
            marginTop: 18,
            fontFamily: 'Inter',
            fontSize: 27,
            lineHeight: 1.36,
            color: C.soft,
            textWrap: 'balance',
          },
          String(card.label),
        ),
    ),
  };
}

function figureSide(card, postDir) {
  if (!card.image) throw new Error('variant "figure" needs an `image`');
  const file = path.resolve(postDir, card.image);
  let data = fs.readFileSync(file);
  let mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`unsupported image type: ${card.image}`);
  if (mime === 'image/svg+xml') {
    // Drawn here rather than embedded: resvg leaves out the text of an SVG
    // that sits inside another one.
    data = new Resvg(data, {
      fitTo: {mode: 'width', value: 1200},
      font: RESVG_FONTS,
    })
      .render()
      .asPng();
    mime = 'image/png';
  }
  const src = `data:${mime};base64,${data.toString('base64')}`;
  const frame = {
    borderRadius: 10,
    border: `1px solid ${C.rule}`,
    backgroundColor: '#ffffff',
  };

  if ((card.fit ?? 'contain') === 'cover') {
    const side = SIDE_H;
    return {
      width: side,
      node: image(src, {
        ...frame,
        width: side,
        height: side,
        objectFit: 'cover',
        objectPosition: card.position ?? 'center',
      }),
    };
  }

  // Shown whole, as large as the space allows.
  const size = imageSize(data);
  const scale = Math.min(540 / size.width, SIDE_H / size.height);
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);
  return {width, node: image(src, {...frame, width, height})};
}

// --- The card ----------------------------------------------------------------

async function drawCard(post) {
  const card = post.card;
  const variant = card.variant ?? 'pattern';

  let side = null;
  if (variant === 'stat') side = await statSide(card);
  else if (variant === 'figure') side = figureSide(card, post.dir);
  else if (variant !== 'pattern') {
    throw new Error(`unknown variant "${variant}"`);
  }

  const columnW = side ? W - 2 * MARGIN - GAP - side.width : 640;

  // Headline: the largest size that leaves it within its share of the column.
  const LINE = 1.08; // line height of the headline
  const headline = (fontSize) =>
    box(
      {
        fontFamily: 'Newsreader',
        fontWeight: 600,
        fontSize,
        lineHeight: LINE,
        letterSpacing: '-0.014em',
        textWrap: 'balance',
        color: C.ink,
      },
      post.title,
    );
  // Large type gets three lines at most: four short lines of it look ragged.
  const sizes = [84, 76, 68, 62, 56, 50, 46, 42, 38];
  let size = sizes.at(-1);
  let headlineH = 0;
  for (const candidate of sizes) {
    headlineH = await heightOf(headline(candidate), columnW);
    size = candidate;
    const lines = Math.round(headlineH / (candidate * LINE));
    if (headlineH <= 300 && (lines <= 3 || candidate <= 56)) break;
  }

  // Description: as many lines as still fit above the hill, or none.
  let description = null;
  if (post.description) {
    const fontSize = 27;
    const lineHeight = 1.4;
    const marginTop = 22;
    const room = SIDE_H - headlineH - marginTop;
    const lines = Math.min(3, Math.floor(room / (fontSize * lineHeight)));
    if (lines >= 1) {
      description = box(
        {
          marginTop,
          fontFamily: 'Inter',
          fontSize,
          lineHeight,
          color: C.soft,
          display: 'block',
          lineClamp: lines,
        },
        post.description,
      );
    }
  }

  const mark = wordmark();
  const markH = 34;

  const tree = box(
    {
      width: W,
      height: H,
      position: 'relative',
      backgroundColor: C.paper,
      color: C.ink,
    },
    image(landscape(post.slug, {sun: variant === 'pattern'}), {
      position: 'absolute',
      left: 0,
      top: 0,
      width: W,
      height: H,
    }),
    box({
      position: 'absolute',
      left: 0,
      top: 0,
      width: W,
      height: BAR,
      backgroundImage: SUNSET_CSS,
    }),
    // Masthead
    box(
      {
        position: 'absolute',
        left: MARGIN,
        top: 52,
        width: W - 2 * MARGIN,
        height: markH,
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      image(mark.uri, {width: Math.round(markH * mark.ratio), height: markH}),
      box(
        {
          fontFamily: 'JetBrains Mono',
          fontWeight: 500,
          fontSize: 19,
          letterSpacing: '0.09em',
          color: C.soft,
        },
        [card.kicker, post.date].filter(Boolean).join('  ·  ').toUpperCase(),
      ),
    ),
    // Body
    box(
      {
        position: 'absolute',
        left: MARGIN,
        top: BODY_TOP,
        width: W - 2 * MARGIN,
        height: SIDE_H,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      },
      box(
        {width: columnW, flexDirection: 'column'},
        headline(size),
        description,
      ),
      side?.node,
    ),
  );

  const svg = await satori(tree, {width: W, height: H, fonts: FONTS});
  return new Resvg(svg, {fitTo: {mode: 'width', value: W}, font: RESVG_FONTS})
    .render()
    .asPng();
}

// --- Posts -------------------------------------------------------------------

const MONTHS = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function readPost(dir) {
  const file = ['index.mdx', 'index.md']
    .map((name) => path.join(dir, name))
    .find((candidate) => fs.existsSync(candidate));
  if (!file) return null;
  const match = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const meta = (match && parseYaml(match[1])) || {};
  if (meta.socialcard == null) return null;
  const card = meta.socialcard === true ? {} : meta.socialcard;

  // blog/2026-05/26-some-slug
  const day = path.basename(dir);
  const month = path.basename(path.dirname(dir));
  const fromPath = `${month}-${day}`.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  const date = meta.date
    ? new Date(meta.date)
    : fromPath && new Date(Date.UTC(+fromPath[1], fromPath[2] - 1, +fromPath[3]));

  const description =
    card.description === false ? null : card.description ?? meta.description;

  return {
    dir,
    slug: `${month}-${day}`,
    title: typeset(String(card.title ?? meta.title ?? '')),
    description: description ? typeset(String(description)) : null,
    date: date ? MONTHS.format(date) : null,
    card,
  };
}

function allPostDirs() {
  const blog = path.join(ROOT, 'blog');
  return fs
    .readdirSync(blog, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .flatMap((month) =>
      fs
        .readdirSync(path.join(blog, month.name), {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(blog, month.name, entry.name)),
    )
    .sort();
}

async function main() {
  const args = process.argv.slice(2);
  let out = null;
  const dirs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') out = path.resolve(args[++i]);
    else dirs.push(path.resolve(args[i]));
  }

  const named = dirs.length > 0;
  const posts = [];
  for (const dir of named ? dirs : allPostDirs()) {
    const post = readPost(dir);
    if (post) posts.push(post);
    else if (named) {
      throw new Error(
        `${path.relative(ROOT, dir)}: no post with a \`socialcard\` block`,
      );
    }
  }

  if (out) fs.mkdirSync(out, {recursive: true});
  for (const post of posts) {
    let png;
    try {
      png = await drawCard(post);
    } catch (error) {
      error.message = `${path.relative(ROOT, post.dir)}: ${error.message}`;
      throw error;
    }
    const target = out
      ? path.join(out, `${post.slug}.png`)
      : path.join(post.dir, 'socialcard.png');
    fs.writeFileSync(target, png);
    console.log(
      `${path.relative(ROOT, target)}  ${Math.round(png.length / 1024)} KB`,
    );
  }
  if (posts.length === 0) console.log('No post has a `socialcard` block.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
