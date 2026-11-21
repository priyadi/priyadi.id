# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, served equally:

- **The general Indonesian public.** Non-specialist readers, usually arriving
  from a post shared on Facebook or Bluesky, often while a viral claim is being
  argued about. They read on phones.
- **Tech-literate peers.** Engineers and IT people, many of whom know the
  author from the 2000s blogging era. They are comfortable with technical
  depth (security, programming, AI, infrastructure).

A single post may lean towards one audience, but the site as a whole must not
favour either.

## Product Purpose

priyadi.id is the personal blog of Priyadi Iman Nurcahyo, a blogger since the
2000s who started writing again in 2025 in a new format. It publishes essays
in Bahasa Indonesia on politics, the environment, religion, history, language,
information technology, energy and personal finance.

Success means a reader leaves with a claim checked against evidence: they
understand the argument, can see the data behind it, and in interactive posts
have worked out the answer for their own situation.

## Positioning

Three things together set it apart from other Indonesian opinion writing:

1. **Evidence and sources.** Arguments rest on cited data and primary sources.
   Charts show the evidence instead of asserting it, and every figure names
   its source.
2. **Interactive explainers.** Some posts let readers enter their own numbers
   and see the result: the personal income tax flow (`PajakPribadi`), the
   orbital AI datacenter scenarios (`OrbitalDatacenter`, built on the author's
   own calculator), the DKIM email verifier (`DkimVerifier`).
3. **Rebutting misinformation.** Correcting viral claims and myths is a core
   job of the site (the `sanggahan` topic), not an occasional one.

## Operating Context

- Posts are shared on Facebook as plain text (the `posttext` skill),
  because Facebook ranks posts with links lower, and on Bluesky and elsewhere
  with a social card drawn from the front matter (`make socialcards`).
- Readers comment through Giscus and search through lunr.
- Each post has a main topic (the first tag, from `blog/tags.yml`), shown above
  the headline and linking to that topic's page.
- The author writes in MDX, and builds interactive components and charts
  alongside the prose, in the same repository.

## Capabilities and Constraints

- Docusaurus 3 site with a custom theme (`src/theme/`), React 19 and d3 for
  charts. Deployed as a static site to `priyadi.id`.
- **Bahasa Indonesia only.** All interface text and content stay in Indonesian.
  No English UI and no language switch.
- **Text-first, mobile-first.** Most readers are on phones. Every post has to
  work fully there, interactive figures included.
- **No ads, tracking, newsletter prompts or paywall.**
- Light and dark mode are both first-class, and the site opens in dark mode.
  Images and charts must read correctly in both; the conventions are in
  `README.md`.
- Social cards must not carry AI-generated illustrations; social sites appear
  to penalise them.
- The README is the authoring guide (figures, widths, dark-mode images, social
  cards) and stays in sync with the theme.

## Brand Commitments

- Name and wordmark: **priyadi.id**. The logo is a hill under a sunset;
  wordmark explorations are in `design/wordmark/`.
- Voice: the author's own. First person, direct, argumentative where the
  evidence warrants it, sometimes sarcastic (`SarcasmToggler`).
- Author identity, photo and socials are in `blog/authors.yml`.

## Evidence on Hand

- About 30 published posts under `blog/`, from February 2025 onwards.
- Interactive components in `src/components/`: `PajakPribadi`,
  `OrbitalDatacenter`, `DkimVerifier`, `TimeSensitive`, `Disclosure`, `Figure`.
- The social card generator in `scripts/socialcards.mjs`, with fonts in
  `scripts/socialcard-fonts/`.
- There are no readership numbers, testimonials, press mentions or endorsements
  on hand. Do not invent any.

## Product Principles

1. **Show the evidence, then the argument.** A claim earns its place with a
   source the reader can follow. Sources sit in the figure's `source`, not
   buried in the picture.
2. **Let readers check it themselves.** Where a number depends on the reader's
   situation, give them the tool, not just the conclusion.
3. **Respect the reader on a phone.** Whoever arrives from a shared link on a
   small screen gets the whole post, interactive parts included, with nothing
   in the way.
4. **Serve both audiences without talking down to either.** Technical depth is
   welcome, but it must stay understandable to a non-specialist.
5. **Nothing between the reader and the text.** No ads, tracking or
   subscription prompts.
