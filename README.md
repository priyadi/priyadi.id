# Kode Sumber Untuk Website [priyadi.id](https://priyadi.id)

### Development

```
npm install
make start
```

## Layout

The site is a Docusaurus blog with its own news-style theme. The pieces live
in:

- `src/css/custom.css`: colours, type and the article column grid
- `src/theme/`: masthead (`Navbar`), footer, front page (`BlogListPage`),
  article page (`BlogPostPage`), archive, standalone pages (`MDXPage`)
- `src/components/Story`: a post as it appears on listing pages
- `src/remark/postCard.ts`: takes each post's first image and first paragraph
  (above `<!-- truncate -->`) for use on listing pages. A post without an
  image there is listed as text only. `description` in the front matter
  replaces the paragraph, and is also shown under the headline of the post.

### Introduction on the front page

The sentence at the top of the front page is `tagline` in
`docusaurus.config.ts`. It takes the same marks as a post's `description`:
`*emphasis*`, `**strong**` and `` `code` ``, but no links. Without a tagline
the front page starts with the newest post.

Any Markdown file in `src/pages/` becomes a page set like an article; start
it with a `# Heading`.

### Topics

Every post has `tags` in its front matter, taken from `blog/tags.yml`:

```yaml
tags: [iklim, agama]
```

The first tag is the main topic of the post. It is shown as the label above
the headline, on listing pages and on the post itself, and leads to the page
of that topic. Put the most fitting tag first, and keep to two or three.

A new topic needs an entry in `blog/tags.yml` first; a tag that is not listed
there gives a warning during the build.

### Image of a post on listing pages

Listing pages crop the image to the frame it sits in, keeping the centre. For
an image that must not lose its edges, such as a screenshot, add this to the
front matter:

```yaml
cover:
  fit: contain
```

The image is then shown whole in the centre of the frame, and a blurred copy
of it fills the rest.

### Width of content in a post

Text stays in a narrow reading column. Charts, maps and large images can break
out of it. These components need no import:

```mdx
<Figure title="Emisi per kapita" caption="Dalam ton CO₂." source="Our World in Data">
  <MyChart />
</Figure>

<Figure width="wide" title="…">…</Figure>   {/* up to 1080px */}
<Figure width="full" title="…">…</Figure>   {/* edge to edge */}

<Wide>…</Wide>             {/* no title or caption, just the width */}
<FullWidth>…</FullWidth>
```

For a plain Markdown image, add `#wide` or `#full` to the path:

```md
![Peta](./peta.png#wide)
```

To make a whole post full width, wrap its content in `<FullWidth>`.

A chart, map or diagram goes in a `<Figure>` rather than in the text as a bare
image, in `.md` posts too. The title says what it shows, and the source goes
in `source`, not in the picture and not in a footnote. Leave a blank line
around the image:

```mdx
<Figure
  title="Emisi gas rumah kaca per 100 gram protein"
  caption="Sumber protein hewani dan nabati, dalam kg CO₂eq."
  source={<a href="https://…">Poore & Nemecek (2018), Science</a>}>

![Diagram batang emisi per sumber protein](./emisi.svg)

</Figure>
```

Illustrations and screenshots can stay plain images.

### Images in dark mode

The site opens in dark mode by default, so every image has to work on the
dark page (`#17121a`) as well as on white. Check a new post in both modes
with the toggle in the masthead. What goes wrong, and what to do:

- **A white background** (a chart exported as PNG or JPEG, an illustration on
  white) glares on the dark page. For an illustration, use a background that
  is part of the picture, a scene or a mid-tone colour, instead of plain
  white. For a chart or diagram, make two files as below.
- **A transparent background with dark text or lines** disappears on the dark
  page. Do not publish a transparent PNG or SVG as a single file, unless
  everything in it is legible on both white and `#17121a`.
- **An SVG that switches on `prefers-color-scheme`** follows the reader's
  system, not the toggle of the site, so it can come out dark-on-dark or
  light-on-light. Give it fixed colours and make two files.

Two files, one for each mode, with the mode at the end of the path:

```md
![Diagram](./diagram.light.svg#gh-light-mode-only)
![Diagram](./diagram.dark.svg#gh-dark-mode-only)
```

Only the one for the current mode is shown. Both can sit together in one
`<Figure>`. For the dark file use `#17121a` or a transparent background, text
in `#efe9ea`, and rules in `#382e3c`; for the light one white or transparent,
text in `#201a1f`, rules in `#e2dce0`. PlantUML diagrams get both files from
`make diagrams` (see the `Makefile`).

Such a pair is never used as the image of the post on listing pages. If the
post should have one there, put another image above `<!-- truncate -->`.

A chart drawn by a component, not an image, needs none of this: it reads the
colours of the current mode, see below.

For an image from someone else that cannot be redrawn, such as a chart from
another site with a white background, there is no second file to make. It is
shown as it is; prefer a redrawn version when the chart matters to the post.

### Colours in charts

Charts can use the site's CSS variables so they follow light and dark mode:
`--c-ink`, `--c-ink-soft`, `--c-rule`, `--c-paper`, `--c-surface`,
`--c-accent`, and `--font-sans` for labels.

### Social cards

The card that a post shows when shared is drawn from its front matter by
`scripts/socialcards.mjs`. A post opts in with a `socialcard` block and points
`image` at the result:

```yaml
image: ./socialcard.png
socialcard:
  variant: pattern
```

`make socialcards` (also part of `make`) then writes `socialcard.png` next to
every such post. Commit it with the post. A card is only redrawn when the post,
an image beside it, or the drawing code is newer than the card; `make -B
socialcards` redraws them all, and `make -j` draws them in parallel.

Every card has the masthead, the date, the headline, the description if the
post has one, and the hill of the logo. The variant decides what fills the
right-hand side:

```yaml
socialcard:
  variant: pattern      # a halftone sunset, different for each post

socialcard:
  variant: stat         # a number from the post, set large
  value: 14,5%
  label: dari emisi gas rumah kaca global berasal dari sektor peternakan

socialcard:
  variant: figure       # a chart, diagram, screenshot or photo from the post
  image: ./upcoming.png
  fit: contain          # default, shown whole; `cover` crops to a square
  position: left top    # with `cover`: the part that survives the crop
```

Also accepted in the block: `title` and `description` to override those of the
post on the card, `description: false` to leave it out, and `kicker` for a
label before the date.

Do not use AI-generated illustrations as the figure: social sites seem to
penalise cards that carry them, which is why the cards are drawn this way.

An SVG figure that takes its colours from CSS variables comes out wrong; use a
PNG of it instead.

The script draws one card at a time. To try a design without touching the
post, write the card elsewhere:

```
node scripts/socialcards.mjs blog/2026-05/26-some-post /tmp/card.png
```

A post without the block is left alone, so it can use any image as its card,
such as one drawn by hand.

The fonts in `scripts/socialcard-fonts/` are fixed instances of the site's
variable fonts, made by `scripts/socialcard-fonts.py`. Run it again only when
the card needs another weight.

### Plain text for Facebook

Facebook ranks posts with links lower, so a post can be shared as its text
instead. `make posttexts` (also part of `make`) writes `index.txt` next to
every post, ready to paste. It is not committed; `make` writes it again when
the post changes.

The title comes first, paragraphs are joined into single lines, and markdown
marks are dropped. Links keep their text but not their address. Images,
figures and components without content (charts, calculators, tools) are left
out, and the script names those components, so the text around them can be
checked. Footnotes become [1], [2]… and are listed with their addresses after
a line at the end, to be cut out into the first comment.

To see the text of one post without writing the file:

```
node scripts/posttexts.mjs blog/2026-05/26-some-post -
```

### Orbital AI Datacenter article

`src/components/OrbitalDatacenter` holds the components of the article built
on the
[Orbital AI Datacenter Calculator](https://github.com/priyadi/orbital-ai-datacenter):
live prose, the scenario bar, the charts with their sliders, and the list of
all assumptions. They share one scenario, which is mirrored in the address bar
in the calculator's own link format, so a link opens the same scenario in
either place.

The article computes with the calculator's own code and uses its Indonesian
wording. Three files there are copies, made by a script:

- `model.generated.ts`: the model, inputs, presets, number formatters and
  orbit geometry
- `id.generated.ts`: the translator and the part of the dictionary in use
- `land.generated.ts`: the outline of the continents for the orbit animation

After the calculator changes, refresh them (the argument defaults to
`../orbital-ai-datacenter`; the script reads the last commit there, not
uncommitted edits):

```
node scripts/sync-orbital-calculator.mjs [path/to/orbital-ai-datacenter]
```
