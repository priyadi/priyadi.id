# priyadi.id

## Branches and drafts

- Unpublished posts live on `draft/<name>` branches. The owner switches branches, stages and commits while an agent session is running, so post folders seen earlier can disappear and the current branch can change.
- Before a bulk edit across `blog/`, re-list the posts and run `git branch --show-current`; don't trust an earlier listing.
- Leave posts that exist only on the current draft branch alone unless asked: uncommitted edits to them can block the owner's next branch switch.
- Site-wide changes (`src/theme` overrides, shared components, `DESIGN.md`) are committed to `main`, even when the work started on a `draft/*` branch. Only a post's own files and its article-specific components go on the draft branch. Before committing, split the work: site-wide files → `main` (switch, commit, switch back), post files → the draft branch. If unsure which a file is, ask.

## Dev server

- A `docusaurus start` dev server is often running in the repo (usually port 3001). Don't disturb its `.docusaurus` cache.
- It doesn't pick up a newly added post folder ("Blog post not found") until restarted. To preview work in progress, rsync the repo (excluding `node_modules`, `.docusaurus`, `build`, `.git`) to a temporary directory, symlink `node_modules`, and run `docusaurus start --port <another port>` there.
- To verify a production build, build such a copy rather than the repo itself.

## Sources

- Every fact, figure, quote and process step in research or post content needs a source retrieved in the current session (a URL, document or file). Don't fill gaps from model knowledge, even when confident.
- If a source can't be retrieved (paywall, blocking, bot challenge, login wall, dead link), report it to the owner: which source, what failed, and which claims depend on it. Don't fall back on memory or quietly swap in a different source.

## Memory

- Auto memory is off for this repo (`.claude/settings.json`). Don't turn it back on, write memory files, or carry over anything learned from earlier sessions, from this site or the owner's other work.
- Work only from this repo, the current conversation, and sources retrieved in it. If something should persist across sessions, propose adding it to this file so the owner can review it.
