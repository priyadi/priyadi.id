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
 *       headline:
 *         case: upper
 *         gradient:                   # colours painted top to bottom
 *           light: ['#e4572e', '#c4126b']
 *           dark: ['#ffd36e', '#ff3d9a']
 *
 * Everything is optional; what is left out keeps the site's own look. The
 * post page turns it into CSS variables (see postStyleCss), and
 * scripts/socialcards.mjs draws the card of the post with the dark values.
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
  headline?: {case?: 'upper' | 'none'; gradient?: PerMode<string[]>};
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
   * The face the social card draws with, from scripts/socialcard-fonts. The
   * site's own typefaces are always loaded there.
   */
  card?: {family: string; file?: string; weight: number};
};

/**
 * Typefaces a post can name in `fonts`. A new one needs an @font-face at the
 * top of src/css/custom.css (the file is fetched only by a page that uses
 * it) and, for the card, a TTF in scripts/socialcard-fonts.
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
    tracking: 0.01,
    leading: 1,
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
  if (style.headline?.case === 'upper') base.push('--display-case: uppercase');
  if (base.length) rules.push(`html:root { ${base.join('; ')}; }`);

  for (const mode of ['light', 'dark'] as const) {
    const vars: string[] = [];
    for (const name of COLOR_NAMES) {
      const value = inMode(style.colors?.[name], mode);
      if (value) vars.push(`${CSS_VAR[name]}: ${value}`);
    }
    const accent = inMode(style.colors?.accent, mode);
    if (accent) vars.push(`--ifm-color-primary: ${accent}`);
    const gradient = inMode(style.headline?.gradient, mode);
    if (gradient?.length) {
      vars.push(`--headline-fill: ${gradientCss(gradient, 180)}`);
    }
    if (vars.length) {
      rules.push(`html[data-theme='${mode}']:root { ${vars.join('; ')}; }`);
    }
  }

  return rules.join('\n');
}

/** Whether the headline of the post is painted with a gradient. */
export function hasHeadlineGradient(style: PostStyle | undefined): boolean {
  const g = style?.headline?.gradient;
  return Boolean(inMode(g, 'light')?.length || inMode(g, 'dark')?.length);
}
