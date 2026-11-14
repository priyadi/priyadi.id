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
  article page (`BlogPostPage`), archive
- `src/components/Story`: a post as it appears on listing pages
- `src/remark/postCard.ts`: takes each post's first image and first paragraph
  (above `<!-- truncate -->`) for use on listing pages. A post without an
  image there is listed as text only. `description` in the front matter
  replaces the paragraph, and is also shown under the headline of the post.

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
every such post. Commit it with the post.

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

To try a design without touching the posts, write the cards elsewhere:

```
node scripts/socialcards.mjs --out /tmp/cards [blog/2026-05/26-some-post ...]
```

A post without the block is left alone, so it can use any image as its card,
such as one drawn by hand.

The fonts in `scripts/socialcard-fonts/` are fixed instances of the site's
variable fonts, made by `scripts/socialcard-fonts.py`. Run it again only when
the card needs another weight.
