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
