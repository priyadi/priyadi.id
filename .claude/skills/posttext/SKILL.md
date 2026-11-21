---
name: posttext
description: Turn a blog post into plain text to paste into a social media post (Facebook and the like), written to index.txt next to the post. Use when asked for a post's plain text or "posttext", or to share a post's text on Facebook or another platform.
argument-hint: "[post directory or part of its name] [platform]"
---

# Plain text of a post

Posts are shared on social media as their text rather than as a link, mostly on
Facebook, which ranks posts with links lower. The text has to stand on its own:
no markdown, no page around it. `scripts/posttexts.mjs` does the mechanical part
of the conversion. It cannot know what a chart shows, what an interactive
component would have said, or which sentence points at something that is no
longer there. Your job is to finish what it starts.

The target is Facebook unless the user names another platform. The script's
output and this guide are shaped for Facebook; for another platform, follow its
own limits and conventions where they differ (its length limit, whether it
renders any formatting, whether links in the post are penalised).

## 1. Find the post

The argument is a post directory (`blog/2026-11/14-datacenter-ai-di-orbit`) or
part of its name. Without one, take the post this branch changes
(`git diff --name-only main...HEAD -- blog/`). On `main` with nothing to go on,
ask which post. The author switches `draft/*` branches during a session, so
check the branch and that the post exists before you start.

The post's address is `https://priyadi.id/YYYY/MM/DD/slug/`, from its directory:
`blog/2026-11/14-datacenter-ai-di-orbit` is
`https://priyadi.id/2026/11/14/datacenter-ai-di-orbit/`. A `slug:` in the front
matter overrides the last part.

## 2. Run the script

```
node scripts/posttexts.mjs POST_DIR -
```

This prints the text to standard output. Standard error names the components it
left out. The text has:

- the title first, then the post, with paragraphs joined into single lines
  (Facebook, like most platforms, keeps every line break)
- no markdown marks; links keep their text but lose their address
- images, figures and components without content left out
- admonitions with their title, or the name of their kind
- footnotes numbered [1], [2]…, listed with their addresses after a `———`
  line at the end

Use it as the starting point. Most of a prose-only post can go through
unchanged.

## 3. Read the post and what was left out

Read the post's `index.md` or `index.mdx` and set it beside the script's
output. For every left-out component and image, decide what a reader of the plain text
loses without it:

- **Live prose** (components that write sentences from a model, such as
  `Lede` or `*Summary` in `OrbitalDatacenter`): read the component and write
  the sentences it renders under the default scenario, with the numbers. Get
  the numbers from the code and its defaults, not from memory. If `build/`
  holds a build of this post that is newer than the post and its components,
  its HTML has the rendered sentences.
- **Charts and figures**: if the prose around one relies on it, add one or
  two sentences giving what it shows. If the prose already says it, leave it
  out.
- **Calculators and tools** (`PajakPribadi`, `DkimVerifier`): the reader
  cannot use them here. Give the result for the post's own example or the
  default inputs, if the post has one, and say once that the tool is on the
  site, with the address in the first comment.
- **Images**: a photo or screenshot can be attached to the post. If
  the text introduces one ("perdebatan berikut:"), keep the sentence and add a
  short description of what it shows, so the text stands alone even when the
  picture is not seen beside it.
- **Shortcuts and navigation** (`JumpLink`, `CalculatorLink`, scenario bars):
  drop them.

## 4. Fix the text for the platform

Change only what reads wrong once the page is gone. The prose is the author's,
written with care; it is not yours to improve.

- Sentences that point at something not in the text: "di bawah ini", "geser
  nilai di dekat setiap ilustrasi", "pilih skenario lain", "klik di sini".
  Rewrite them to say what is there, or that it is on the site.
- Links whose text means nothing without the address ("di sini", "tautan
  ini"). Name the place instead, or move the address to the first comment
  as a footnote.
- Tables: turn them into short lists or sentences. Social media does not
  line up columns.
- Code: keep it if it is short and the post is about it; otherwise describe
  it.
- Headings stay as lines of their own between paragraphs, as the script left
  them.

Do not add emoji, hashtags, calls to action, a summary or a new opening. Do not
use the Unicode "bold" or "italic" letters (𝗯𝗼𝗹𝗱): screen readers and search do
not read them as words. Write in the post's language, in the post's voice.

A Facebook post can be at most 63,206 characters; other platforms allow far
less. If the text is longer than the platform allows, say so and ask what to
cut, or whether to split it into a thread; do not cut on your own.

## 5. The first comment

After the post, a `———` line, then the first comment: the post's address, then
the footnotes as the script listed them. If the post has interactive parts,
the address comes with one short line saying what the reader can do there.
On a platform where links in the post cost nothing, this can go at the end of
the post instead; on one with threads, it is the first reply.

```
[post text]

———

Versi interaktif, dengan angka yang bisa diubah: https://priyadi.id/2026/11/14/datacenter-ai-di-orbit/

[1] …
[2] …
```

Without interactive parts, the address alone is enough. Without footnotes,
the comment is just the address.

## 6. Write and report

Write the result to `POST_DIR/index.txt`. It is not committed (see
`.gitignore`), so replace any earlier one.

Then report briefly:

- what you changed from the script's output, and why, one line each
- the images to attach, in order, each with alt text taken from
  the post
- anything you were unsure of, such as numbers you computed rather than read
