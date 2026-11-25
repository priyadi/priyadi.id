/**
 * Posts are served at `/<name>/` instead of the `/<yyyy>/<mm>/<dd>/<name>/`
 * that Docusaurus makes of a post folder such as `blog/2026-10/23-php2shell`.
 * The date still comes from the folder, so the order of the posts is the same.
 *
 * - `undateBlogPosts` (part of the blog's `processBlogPosts`) drops the date
 *   from each permalink. A post with a `slug` in its front matter keeps it.
 * - A `permalink` in the front matter (`permalink: banjir-sumatera`) gives a
 *   post a shorter address than its folder name, without moving the folder:
 *   the folder still makes the dated path, so the comments stay attached.
 * - The plugin publishes each post's dated path by its new permalink, for the
 *   comments: their GitHub Discussions are named after the dated path (see
 *   src/components/Comments).
 * - `createRedirects` (an option of @docusaurus/plugin-client-redirects) gives
 *   each post a redirect page at its dated path and, for a post with a
 *   `permalink`, at the address its folder name would give it.
 *
 * A post's `id` is the path Docusaurus made of its folder (or its front matter
 * `slug`), before `undateBlogPosts` changes the permalink. It is the old
 * permalink only because `baseUrl` and the blog's `routeBasePath` are both
 * `/`.
 */

import type {Plugin} from '@docusaurus/types';
import type {
  BlogContent,
  BlogPost,
} from '@docusaurus/plugin-content-blog';

export const PLUGIN_NAME = 'undated-urls';

/** Global data of the plugin: the dated path, without the leading slash and
 * with a trailing one, by permalink. */
export type UndatedUrlsData = {datedPaths: Record<string, string>};

// `/2026/10/23/` in `/2026/10/23/php2shell`.
const DATE_SEGMENTS = /\/\d{4}\/\d{1,2}\/\d{1,2}\//;

const withoutTrailingSlash = (path: string) => path.replace(/\/+$/, '');

/** The `permalink` of a post's front matter, as `/name/`, if it has one. */
function chosenPermalink(post: BlogPost): string | undefined {
  const name = post.metadata.frontMatter.permalink;
  if (name == null) {
    return undefined;
  }
  const trimmed = String(name).replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(trimmed)) {
    throw new Error(
      `${post.metadata.source}: front matter \`permalink: ${name}\` should be ` +
        'one lowercase name of letters, digits and hyphens',
    );
  }
  return `/${trimmed}/`;
}

export function undateBlogPosts(blogPosts: BlogPost[]): BlogPost[] {
  return blogPosts.map((post) => {
    if (post.metadata.frontMatter.slug) {
      return post;
    }
    return {
      ...post,
      metadata: {
        ...post.metadata,
        permalink:
          chosenPermalink(post) ??
          post.metadata.permalink.replace(DATE_SEGMENTS, '/'),
      },
    };
  });
}

// Earlier addresses of a post by its permalink, without trailing slashes.
// Filled once the content is loaded, read after the build by
// `createRedirects`.
const oldPermalinks = new Map<string, string[]>();

export function createRedirects(existingPath: string): string[] | undefined {
  return oldPermalinks.get(withoutTrailingSlash(existingPath));
}

export default function undatedUrlsPlugin(): Plugin {
  return {
    name: PLUGIN_NAME,
    async allContentLoaded({allContent, actions}) {
      const blog = allContent['docusaurus-plugin-content-blog']?.default as
        | BlogContent
        | undefined;
      const datedPaths: Record<string, string> = {};
      oldPermalinks.clear();
      for (const {id, metadata} of blog?.blogPosts ?? []) {
        const permalink = withoutTrailingSlash(metadata.permalink);
        const dated = withoutTrailingSlash(id);
        datedPaths[metadata.permalink] = `${dated.replace(/^\//, '')}/`;
        // The dated path, and the undated one when `permalink` replaced it.
        const old = [dated, dated.replace(DATE_SEGMENTS, '/')].filter(
          (path, i, all) => path !== permalink && all.indexOf(path) === i,
        );
        if (old.length > 0) {
          oldPermalinks.set(permalink, old);
        }
      }
      actions.setGlobalData({datedPaths} satisfies UndatedUrlsData);
    },
  };
}
