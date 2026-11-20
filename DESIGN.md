---
name: priyadi.id
description: An Indonesian essay blog set like a news desk, under the logo's sunset.
colors:
  ember-red: "#b3261a"
  afterglow-coral: "#ff9068"
  paper: "#ffffff"
  paper-dusk: "#17121a"
  surface: "#f6f3f5"
  surface-dusk: "#211a25"
  ink: "#201a1f"
  ink-dusk: "#efe9ea"
  ink-soft: "#625a63"
  ink-soft-dusk: "#aba1ab"
  rule: "#e2dce0"
  rule-dusk: "#382e3c"
  sunset-amber: "#f7994e"
  sunset-flame: "#f3674a"
  sunset-rose: "#d94a4c"
  sunset-mauve: "#93405c"
  sunset-plum: "#4b3052"
typography:
  display:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(2.125rem, 1.5rem + 2.6vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(1.3125rem, 1.2rem + 0.5vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.16
  dek:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.6
  body-compact:
    fontFamily: "Newsreader Variable, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.45
  figure-title:
    fontFamily: "Inter Variable, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.3
  ui:
    fontFamily: "Inter Variable, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter Variable, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.3
  caption:
    fontFamily: "Inter Variable, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: "JetBrains Mono Variable, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  hairline: "2px"
  code: "3px"
  base: "4px"
  avatar: "50%"
spacing:
  gutter: "clamp(1.125rem, 4vw, 2.5rem)"
  text-measure: "42.5rem"
  wide-measure: "67.5rem"
  page-measure: "77.5rem"
  story-gap: "1.5rem"
  section-gap: "2.5rem"
  figure-gap: "2.5rem"
  bleed-gap: "4rem"
components:
  button-hairline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0.3rem 0.65rem"
    typography: "{typography.ui}"
  select-hairline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0.35rem 0.5rem"
    typography: "{typography.ui}"
  search-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    height: "2.125rem"
    width: "11rem"
  kicker:
    textColor: "{colors.ember-red}"
    typography: "{typography.label}"
  story-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "1.5rem 0"
    typography: "{typography.title}"
  figure:
    textColor: "{colors.ink}"
    typography: "{typography.figure-title}"
  masthead:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "4.25rem"
    padding: "0 {spacing.gutter}"
  tooltip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.code}"
    typography: "{typography.caption}"
---

# Design System: priyadi.id

## Overview

**Creative North Star: "The Evidence Desk"**

priyadi.id is set like the desk of a serious newspaper where every claim
arrives with its chart and its source. Serif headlines and serif prose carry
the argument; a sans-serif voice handles everything that frames it: topics,
bylines, captions, tables, controls. Structure comes from hairline rules, not
boxes or shadows. The page should feel sober and authoritative enough to be
cited in an argument, and still unmistakably one person's desk: warm, personal,
signed.

The warmth comes from a single source, the logo's sunset sky, running from
amber down to dusk plum. Light mode is white newsprint with plum-black ink;
dark mode, the default, is the dusk end of the same sky. The sunset appears
whole only as the thin horizon line across the top of every page; elsewhere
it survives as one accent colour per mode, used for marks rather than
surfaces.

Data is a first-class citizen. Numbers set in tabular figures, tables read as
data rather than grids of cells, charts draw from the same colour tokens as
the page and switch mode with it, and interactive explainers behave like
instruments: labelled, precise, with numeric readouts. There is no decorative
motion system; the page holds still and lets the reader work.

**Key Characteristics:**

- Serif for what is read, sans for what frames it.
- Hairline rules in two weights of meaning: soft rule for separation, ink for
  structure.
- Flat everywhere; the only shadow belongs to floating tooltips.
- One accent per mode, used as thin marks: kicker text, link underlines, focus
  rings, the `.id` of the wordmark.
- Light and dark are equal citizens, and dark is the default.
- Controls are hairline-bordered instruments with 2px corners and no fill.

## Colors

A warm, near-neutral plum palette pulled from the logo's sunset, with one
accent per mode and the full gradient kept for a single horizon line.

### Primary

- **Ember Red** (`ember-red`): the light-mode accent. Kicker text above
  headlines, link underlines in prose (the text itself stays ink), the active
  nav underline, the focus ring, the `.id` of the wordmark, and a 22% tint
  for text selection.
- **Afterglow Coral** (`afterglow-coral`): the same role in dark mode.
  Lighter and warmer so it holds contrast on dusk paper.

### Tertiary

- **The Sunset** (`sunset-amber` → `sunset-flame` 30% → `sunset-rose` 58% →
  `sunset-mauve` 82% → `sunset-plum`): the logo's sky as a 90° linear
  gradient (`--sunset`). Used as the 4px horizon line at the very top of the
  masthead, in the logo, and in the social cards. Not a fill for UI.

### Neutral

- **Newsprint White** (`paper`) / **Dusk Plum-Black** (`paper-dusk`): the
  page background in light / dark mode. Dark images and charts are drawn for
  this exact dusk value.
- **Mauve Mist** (`surface`) / **Twilight Surface** (`surface-dusk`): the
  one tonal step above paper. Image frames before they load, the active row in
  a chart table, admonitions in dark mode.
- **Plum-Black Ink** (`ink`) / **Moonlit Ink** (`ink-dusk`): headlines, prose,
  and structural rules.
- **Faded Ink** (`ink-soft`) / **Dusk Grey** (`ink-soft-dusk`): deks,
  summaries, datelines, captions, footnotes, blockquotes, the footer.
- **Hairline** (`rule`) / **Night Hairline** (`rule-dusk`): every separating
  rule between stories, bylines, table rows, and the borders of controls.

These map to the CSS variables `--c-paper`, `--c-surface`, `--c-ink`,
`--c-ink-soft`, `--c-rule` and `--c-accent` in `src/css/custom.css`, which
switch value with `html[data-theme='dark']`. Components and charts reference
the variables, never the hex values, so both modes follow automatically.

### Named Rules

**The Ember Thread Rule.** The accent is a thread, never a field. It appears
as text colour, a 1–2px underline, an outline, or a small tint; it never fills
a button, a panel or a background.

**The One Horizon Rule.** The full sunset gradient appears once per page, as
the 4px line at the top. Do not repeat it as a divider, a button fill, a
heading treatment or a chart palette.

**The Dusk Default Rule.** Dark mode is the default, not an afterthought.
Every new colour, image and chart is checked on `paper-dusk` first, then on
`paper`.

**The Scoped Chart Colour Rule.** A chart's categorical colours are defined
per article as scoped CSS variables with a light and a dark value each
(e.g. `--c-orbit`, `--c-ground`), each with one meaning throughout that
article, and checked for colour-vision separation and contrast against both
papers.

## Typography

**Display Font:** Newsreader Variable (with Iowan Old Style, Palatino, Georgia)
**Body Font:** Newsreader Variable for prose; Inter Variable for interface
and data (with system-ui)
**Label/Mono Font:** Inter Variable for labels; JetBrains Mono Variable for
code

**Character:** A contemporary newspaper serif with real optical sizing carries
both headlines and long reading; Inter does the desk work around it. The
pairing reads as a publication, not a blog theme.

### Hierarchy

- **Display** (`display`): the headline of a post or standalone page, and the
  lead story on the front page at a slightly smaller clamp (1.875rem →
  3rem). Balanced wrapping.
- **Headline** (`headline`): `h2` inside prose (1.5em of body). `h3` steps
  down to 1.25em, `h4`/`h5` to 1.05em. Headings sit tight to what follows
  (0.7em) and well clear of what precedes (1.75–2.25em).
- **Title** (`title`): headlines in story lists; 1.3125rem in cards, 1.1875rem
  for previous/next links.
- **Dek** (`dek`): the description under a post's headline and the lead
  story's summary, in Faded Ink, `text-wrap: pretty`.
- **Body** (`body`): article prose at 1.25rem, dropping to 1.1875rem below
  48rem, line-height 1.6, inside a 42.5rem column (about 70 characters).
  `body-compact` is for story summaries, clamped to three lines.
- **Figure title** (`figure-title`): the bold sans title above a chart or map.
- **UI** (`ui`): bylines, the table of contents, nav, tables, admonitions,
  details, and every control.
- **Label** (`label`): the kicker (main topic) above headlines, in the accent,
  sentence case; 0.875rem on a post page. Section titles on listing pages use
  the same weight at 0.9375rem in ink.
- **Caption** (`caption`): figure captions in Faded Ink; the source line
  under it at 0.8125rem.
- **Mono** (`mono`): code blocks; inline code at 0.85em.

### Named Rules

**The Serif Reads, Sans Frames Rule.** Anything the reader reads as argument
(headlines, deks, prose, summaries) is serif. Anything that labels, locates
or measures it (kickers, bylines, captions, tables, figure titles, controls,
nav) is sans.

**The Tabular Figures Rule.** Every number that may be compared (table cells,
chart ticks, slider outputs, verdicts) uses `font-variant-numeric:
tabular-nums`; tables add `lining-nums`.

**The Sentence Case Rule.** No uppercase labels and no letter-spaced
eyebrows. Kickers, admonition titles and section titles are sentence case at
normal tracking.

## Layout

**Measures.** Three widths do all the work: the reading column
(`text-measure`), the wide breakout (`wide-measure`), and the page frame
(`page-measure`), each with a fluid `gutter` on both sides.

**The article grid.** Posts are a five-track grid: margin, wide, text, wide,
margin. Everything sits in the text track by default. A direct child breaks
out with `.bleed-wide` (up to the wide measure) or `.bleed-full` (edge to
edge); a Markdown image does the same with `#wide` or `#full` on its path.
Full-bleed figures keep their title and caption inside the wide frame. Grid
items do not collapse margins, so prose spacing is set from above only
(`* + *` at 1.4em).

**Pauses around figures.** A figure gets `figure-gap` above and below it; a
figure that breaks out gets `bleed-gap` (3rem below 48rem), so it reads as a
deliberate pause in the text.

**The front page.** An intro sentence, then the lead story and a side column
of stories in a 2 : 1 split divided by a vertical hairline (from 62rem), then
a row of three image cards under an ink rule, then the running list in two
columns. In the split the lead runs headline first, then its image, which
takes the height the side column leaves (at least 22rem), so the two columns
end together. The side column holds two stories, each with a 3:2 image above
the text. Below 62rem everything stacks with hairlines between, the lead
image above its headline.

**Phones.** Below 40rem every story except the lead becomes a compact row:
the headline on the left, a 6.5rem 4:3 thumbnail on the right, no summary.
The masthead shrinks to 3.5rem, RSS hides, and search collapses to an icon
that expands over the masthead on focus.

**Breakpoints.** 36rem (two-up layouts collapse), 40rem (phone), 48rem
(prose size, bleed spacing), 62rem (two-column front page).

## Elevation & Depth

The system is flat. Depth and grouping come from hairline rules and, at most,
one tonal step (`surface`). Nothing rests on a shadow; the masthead scrolls
with the page rather than floating over it. The one exception is a floating
layer that sits over a chart: tooltips carry a single soft shadow to separate
them from the data beneath.

### Shadow Vocabulary

- **Tooltip lift** (`box-shadow: 0 2px 10px rgb(0 0 0 / 0.14)`): chart
  tooltips and other popovers that float over content, including the
  floating table of contents. Nothing else.

### Named Rules

**The Two Hairlines Rule.** A soft rule (1px `rule`) separates items within
a group: stories, byline, table rows, side column. An ink rule (1px `ink`,
1.5px under a table head) marks structure: the bottom of the masthead, the
top of the footer, section titles, the card row, previous/next links. If a
line is doing structural work, it is ink; otherwise it is soft.

**The Flat Desk Rule.** No shadow on cards, panels, controls, images or the
masthead. If something needs to stand apart, give it a rule or the surface
tone, not a lift.

## Shapes

Square-shouldered. Controls take 2px corners (`hairline`), inline code 3px,
code blocks and chart bars 4px (`base`); story images and thumbnails are
unrounded rectangles cropped to fixed ratios (16:9 lead, 3:2 rows, 4:3 phone
thumbnails). The only circle is the author's avatar. Blockquotes are a 2px
ink rule on the left, not a box. Images that must not lose their edges
(`cover: {fit: contain}`) sit whole in their frame over a blurred copy of
themselves rather than being letterboxed.

## Components

### Buttons

Instrument-like: a hairline outline, no fill, the label in ink.

- **Shape:** 2px corners (`hairline`).
- **Default:** transparent background, 1px `rule` border, `ink` text in the
  surrounding sans size.
- **Hover:** the border darkens to `ink`. No colour fill, no lift.
- **Focus:** the global focus ring, 2px accent outline offset 2px.

### Inputs / Fields

- **Select:** `paper` background, 1px `rule` border, 2px corners, inherits
  the surrounding font at regular weight.
- **Search:** 11rem by 2.125rem, transparent with a `rule` border; on focus
  the border turns `ink` and the outline is suppressed. On phones it collapses
  to an icon and expands to up to 18rem over the masthead.
- **Sliders:** native range inputs with `accent-color: ink`; a label on the
  left and a tabular `<output>` readout on the right of the head line, with a
  note in Faded Ink below.

### Navigation (Masthead)

The 4px sunset horizon, then a paper band with an ink rule beneath it: logo
mark (36px) and outlined wordmark on the left, then `Topik`, `Arsip` and
`RSS` in 15px medium sans, then search and the colour-mode toggle. Nav links carry a
2px transparent bottom border that becomes the accent on hover or when
current; they are never underlined. The footer mirrors it with an ink rule
on top and Faded Ink text.

### Kicker

The post's main topic above its headline: sans 650, sentence case, in the
accent, linking to the topic page. When the post is also a kind of post
(`sanggahan`, `interaktif`), the kind follows after a middle dot in Faded
Ink, linking to its own page: "Energi · Sanggahan". On listing pages it sits
above the stretched link that makes the whole story clickable, so its links
lead to their pages instead; each reaches at least 24px tall to a finger
without taking more room in the layout.

### Story

A post as it appears on listing pages, in four variants: **lead** (large
display headline, dek, and an image that fills its column beside the side
stories, 16:9 above the headline when stacked), **side** (beside the lead, small
thumbnail or none), **card** (image on top, in a row of three), and **row**
(the running list, thumbnail on the right, soft rule above). The whole story
is one link target via a stretched `::after`; hover underlines the headline
in ink (1px, 0.14em offset). Summaries clamp to three lines (eight when a
story has no image).

### Figure (signature component)

Every chart, map or diagram sits in a `<Figure>`: a sans `figure-title`
saying what it shows, the content, a caption in Faded Ink, and the source as
its own line beneath, never inside the picture or in a footnote. Widths are
`text` (default), `wide` and `full`. Images inside are either theme-paired
files (`#gh-light-mode-only` / `#gh-dark-mode-only`) or are drawn by a
component that reads the `--c-*` tokens.

### Data Table

Tables read as data: no cell boxes, no stripes, no header fill. A 1.5px ink
rule under the header row, soft rules under each row, left-aligned bold
headers set to the bottom, the first column flush with the text edge,
tabular lining figures throughout.

### Scenario Bar (instrument pattern)

The control strip of an interactive explainer: paper band between soft rules,
a labelled select, the live verdicts as sans term/value pairs with tabular
values at 650, and a hairline reset button. When pinned it becomes fixed to
the top of the viewport with an ink rule beneath. The top of the viewport
belongs to it; the only other element that stays in view is the floating
table of contents, at the bottom.

### Floating Table of Contents

A post with five or more headings keeps its table of contents in view once
the one in the header has scrolled away, until the end of the article. On
most screens it is a hairline button in the lower left corner, ink border on
paper, naming the section being read after a soft rule; it opens the list
above it. Both float over the text, so both take the tooltip lift. From 96rem
the margin beside the wide column has room, and it becomes a margin note
instead: a label at 650 over the list on a soft rule, flat, with the current
section in ink at 650 on a 2px ink rule.

### Tool Frame (instrument pattern)

A tool the reader feeds their own input (`DkimVerifier`) breaks out to the
wide measure between two ink rules, so it reads as something to use and not
as one more figure. Inside: the tool's name in `figure-title`, the input
target outlined in ink at rest (the surface tone on hover or drag), a privacy
or scope note in Faded Ink, then a soft rule and an output area that shows an
empty readout ("Hasil  belum ada …") until there is a result. The section that
holds it gets an explicit heading id (`## … {#pemeriksa}`), and when the post
is long, a `JumpLink` near the top points to it.

### Byline

Between soft rules: a 44px round avatar, the author's name in ink at 650,
then the date and reading time in Faded Ink separated by a thin vertical rule.

## Do's and Don'ts

### Do:

- **Do** reference `--c-paper`, `--c-surface`, `--c-ink`, `--c-ink-soft`,
  `--c-rule`, `--c-accent` and `--font-*` in components and charts, so they
  follow the colour mode.
- **Do** check every new piece on dusk paper first, then on white (The Dusk
  Default Rule).
- **Do** put charts, maps and diagrams in a `<Figure>` with a title that says
  what it shows and the source in `source`.
- **Do** make two image files (`.light` / `.dark`, with the
  `#gh-light-mode-only` / `#gh-dark-mode-only` suffix) for any chart or
  diagram exported as an image; dark files use `#17121a` or transparent,
  text `#efe9ea`, rules `#382e3c`.
- **Do** use tabular figures for every number that can be compared.
- **Do** separate with hairlines, choosing soft or ink by whether the line is
  structural (The Two Hairlines Rule).
- **Do** build interactive controls as hairline instruments: 2px corners,
  `rule` border that darkens to `ink` on hover, labelled, with a numeric
  readout.
- **Do** design every interactive figure for a phone first.

### Don't:

- **Don't** fill buttons, panels or backgrounds with the accent or the sunset
  gradient (The Ember Thread Rule, The One Horizon Rule).
- **Don't** put shadows on anything that rests on the page; only floating
  tooltips get `0 2px 10px rgb(0 0 0 / 0.14)`.
- **Don't** use uppercase or letter-spaced labels.
- **Don't** publish a transparent image with dark lines as a single file, or
  an SVG that switches on `prefers-color-scheme`: it follows the OS, not the
  site's toggle.
- **Don't** set prose in sans or interface furniture in serif.
- **Don't** use Infima's stock emphasis fills, 8px corners or dashed drop
  zones for a tool; `DkimVerifier` shows the hairline version: one verdict
  line with a drawn icon, facts in a ruled list, detail behind a disclosure.
- **Don't** use AI-generated illustrations in social cards.
