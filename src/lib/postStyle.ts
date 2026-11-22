/**
 * The look of a single post, set in its front matter under `style`:
 *
 *     style:
 *       colors:                       # each a colour, or {light, dark}
 *         accent: {light: '#c4126b', dark: '#ff4f9e'}
 *         paper: {dark: '#140a1f'}
 *         surface: {dark: '#211230'}
 *         ink: …
 *         inkSoft: …
 *         rule: {dark: '#3b2552'}
 *       horizon: ['#ffb35c', '#ff6b5b', '#ff3d9a', '#9b3dff', '#2fd4e6']
 *       fonts:
 *         display: pricedown          # headline and headings
 *         body: serif                 # the text
 *       headline:                     # the headline and the headings
 *         case: upper                 # or lower
 *         color: '#ffffff'            # or a gradient, not both:
 *         gradient:                   # colours painted top to bottom
 *           light: ['#e4572e', '#c4126b']
 *           dark: ['#ffd36e', '#ff3d9a']
 *         outline: '#000000'          # a rim around the letters
 *       css: |                        # raw CSS, for the page only
 *         .prose.markdown > h2 { font-size: 2em; }
 *
 * Everything is optional; what is left out keeps the site's own look. The
 * post page turns it into CSS variables (see postStyleCss), and
 * scripts/socialcards.mjs draws the card of the post with the dark values.
 * `css` is added to the page as it is, after the variables, and only while
 * the post is on screen; the card does not see it.
 *
 * Plain TypeScript without enums or other non-erasable syntax, so that
 * scripts/socialcards.mjs can import it with Node's type stripping.
 */

export type Mode = 'light' | 'dark';
type PerMode<T> = T | {light?: T; dark?: T};

export const COLOR_NAMES = [
  'accent',
  'paper',
  'surface',
  'ink',
  'inkSoft',
  'rule',
] as const;
export type ColorName = (typeof COLOR_NAMES)[number];

export type PostStyle = {
  colors?: Partial<Record<ColorName, PerMode<string>>>;
  horizon?: string[];
  fonts?: {display?: string; body?: string};
  headline?: {
    case?: 'upper' | 'lower' | 'none';
    color?: PerMode<string>;
    gradient?: PerMode<string[]>;
    outline?: PerMode<string>;
  };
  css?: string;
};

/** A typeface a post can ask for by name. */
export type PostFont = {
  /** CSS font-family list for the page. */
  css: string;
  /** Weight the headline and headings are set in. */
  weight?: number;
  /** Letter spacing of the headline, in em. */
  tracking?: number;
  /** Line height of the headline. */
  leading?: number;
  /**
   * A face that is not one of the site's own: declared by the page of a post
   * that uses it, not in custom.css, where the CSS minifier would drop it as
   * unused. `src` is a file in static/fonts.
   */
  face?: {family: string; src: string; weight: number};
  /**
   * The face the social card draws with, from scripts/socialcard-fonts. The
   * site's own typefaces are always loaded there.
   */
  card?: {family: string; file?: string; weight: number};
};

/**
 * Typefaces a post can name in `fonts`. A new one needs its file in
 * static/fonts, named in `face` (it is fetched only by a page that uses it),
 * and, for the card, a TTF in scripts/socialcard-fonts.
 */
export const POST_FONTS: Record<string, PostFont> = {
  serif: {
    css: 'var(--font-serif)',
    card: {family: 'Newsreader', weight: 600},
  },
  sans: {
    css: 'var(--font-sans)',
    weight: 700,
    tracking: -0.025,
    card: {family: 'Inter', weight: 600},
  },
  // Pricedown Black by Ray Larabie, the lettering of Grand Theft Auto.
  pricedown: {
    css: "'Pricedown', Impact, 'Arial Narrow Bold', sans-serif",
    weight: 900,
    // No letter-spacing: any would make browsers drop the ligatures that join
    // its capitals with a tail along the baseline.
    tracking: 0,
    leading: 1,
    face: {family: 'Pricedown', src: '/fonts/pricedown-black.woff', weight: 900},
    card: {family: 'Pricedown', file: 'Pricedown-Black.ttf', weight: 900},
  },
};

export function postFont(name: string | undefined): PostFont | undefined {
  if (name == null) return undefined;
  const font = POST_FONTS[name];
  if (!font) {
    throw new Error(
      `unknown font "${name}" in style.fonts; known: ${Object.keys(POST_FONTS).join(', ')}`,
    );
  }
  return font;
}

/** The value of a per-mode setting in one mode. */
export function inMode<T>(
  value: PerMode<T> | undefined,
  mode: Mode,
): T | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (value as {light?: T; dark?: T})[mode];
  }
  return value as T;
}

const CSS_VAR: Record<ColorName, string> = {
  accent: '--c-accent',
  paper: '--c-paper',
  surface: '--c-surface',
  ink: '--c-ink',
  inkSoft: '--c-ink-soft',
  rule: '--c-rule',
};

/** Colour stops spread evenly, as a CSS gradient at this angle. */
export function gradientCss(colors: string[], angle: number): string {
  if (colors.length === 1) return colors[0];
  const stops = colors.map(
    (c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`,
  );
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

/** Width of the outline of the headline and headings, in em. */
export const OUTLINE_WIDTH = 0.06;

/**
 * An outline around text as a text-shadow: copies of the letters pushed out
 * in sixteen directions, so that it also works on a face with no stroke of
 * its own and keeps out of the letters. `width` takes the unit given.
 */
export function outlineShadow(
  color: string,
  width: number = OUTLINE_WIDTH,
  unit = 'em',
): string {
  const shadows: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 2 * Math.PI;
    const x = +(Math.cos(a) * width).toFixed(4);
    const y = +(Math.sin(a) * width).toFixed(4);
    shadows.push(`${x}${unit} ${y}${unit} 0 ${color}`);
  }
  return shadows.join(', ');
}

function fontFaceCss({family, src, weight}: NonNullable<PostFont['face']>) {
  const format = src.endsWith('.woff2') ? 'woff2' : 'woff';
  return (
    `@font-face { font-family: '${family}'; font-style: normal; ` +
    `font-weight: ${weight}; font-display: swap; ` +
    `src: url('${src}') format('${format}'); }`
  );
}

/**
 * The CSS that gives the page of a post its style: variables on the root,
 * in each mode. Values come from the post's own front matter. `html:root`
 * outranks the plain `:root` and `html[data-theme]` of custom.css, whatever
 * the order of the stylesheets.
 */
export function postStyleCss(style: PostStyle | undefined): string {
  if (!style) return '';
  const rules: string[] = [];

  const base: string[] = [];
  if (style.horizon?.length) {
    base.push(`--sunset: ${gradientCss(style.horizon, 90)}`);
  }
  const display = postFont(style.fonts?.display);
  if (display) {
    base.push(`--font-display: ${display.css}`);
    base.push(`--ifm-heading-font-weight: ${display.weight ?? 600}`);
    if (display.weight) base.push(`--display-weight: ${display.weight}`);
    if (display.tracking != null) {
      base.push(`--display-tracking: ${display.tracking}em`);
    }
    if (display.leading) base.push(`--display-leading: ${display.leading}`);
  }
  const body = postFont(style.fonts?.body);
  if (body) base.push(`--font-body: ${body.css}`);
  for (const font of new Set([display, body])) {
    if (font?.face) rules.push(fontFaceCss(font.face));
  }
  const textCase = style.headline?.case;
  if (textCase === 'upper' || textCase === 'lower') {
    base.push(`--display-case: ${textCase}case`);
  }
  if (base.length) rules.push(`html:root { ${base.join('; ')}; }`);

  for (const mode of ['light', 'dark'] as const) {
    const vars: string[] = [];
    for (const name of COLOR_NAMES) {
      const value = inMode(style.colors?.[name], mode);
      if (value) vars.push(`${CSS_VAR[name]}: ${value}`);
    }
    const accent = inMode(style.colors?.accent, mode);
    if (accent) vars.push(`--ifm-color-primary: ${accent}`);
    const color = inMode(style.headline?.color, mode);
    if (color) vars.push(`--ifm-heading-color: ${color}`);
    const outline = inMode(style.headline?.outline, mode);
    if (outline) vars.push(`--display-outline: ${outlineShadow(outline)}`);
    const gradient = inMode(style.headline?.gradient, mode);
    if (gradient?.length) {
      vars.push(`--headline-fill: ${gradientCss(gradient, 180)}`);
    }
    if (vars.length) {
      rules.push(`html[data-theme='${mode}']:root { ${vars.join('; ')}; }`);
    }
  }

  if (style.css) rules.push(style.css);
  return rules.join('\n');
}

/** Whether the headline of the post is painted with a gradient. */
export function hasHeadlineGradient(style: PostStyle | undefined): boolean {
  const g = style?.headline?.gradient;
  return Boolean(inMode(g, 'light')?.length || inMode(g, 'dark')?.length);
}
