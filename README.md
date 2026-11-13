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
