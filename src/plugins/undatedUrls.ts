/**
 * Posts are served at `/<name>/` instead of the `/<yyyy>/<mm>/<dd>/<name>/`
 * that Docusaurus makes of a post folder such as `blog/2026-10/23-php2shell`.
 * The date still comes from the folder, so the order of the posts is the same.
 *
 * - `undateBlogPosts` (part of the blog's `processBlogPosts`) drops the date
 *   from each permalink. A post with a `slug` in its front matter keeps it.
 * - The plugin publishes each post's dated path by its new permalink, for the
 *   comments: their GitHub Discussions are named after the dated path (see
 *   src/components/Comments).
 * - `createRedirects` (an option of @docusaurus/plugin-client-redirects) gives
 *   each post a redirect page at its dated path.
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

export function undateBlogPosts(blogPosts: BlogPost[]): BlogPost[] {
  return blogPosts.map((post) => {
    if (post.metadata.frontMatter.slug) {
      return post;
    }
    return {
      ...post,
      metadata: {
        ...post.metadata,
        permalink: post.metadata.permalink.replace(DATE_SEGMENTS, '/'),
      },
    };
  });
}

// Dated permalink by permalink, without trailing slashes. Filled once the
// content is loaded, read after the build by `createRedirects`.
const datedPermalinks = new Map<string, string>();

export function createRedirects(existingPath: string): string[] | undefined {
  const dated = datedPermalinks.get(withoutTrailingSlash(existingPath));
  return dated ? [dated] : undefined;
}

export default function undatedUrlsPlugin(): Plugin {
  return {
    name: PLUGIN_NAME,
    async allContentLoaded({allContent, actions}) {
      const blog = allContent['docusaurus-plugin-content-blog']?.default as
        | BlogContent
        | undefined;
      const datedPaths: Record<string, string> = {};
      datedPermalinks.clear();
      for (const {id, metadata} of blog?.blogPosts ?? []) {
        const permalink = withoutTrailingSlash(metadata.permalink);
        const dated = withoutTrailingSlash(id);
        datedPaths[metadata.permalink] = `${dated.replace(/^\//, '')}/`;
        if (dated !== permalink) {
          datedPermalinks.set(permalink, dated);
        }
      }
      actions.setGlobalData({datedPaths} satisfies UndatedUrlsData);
    },
  };
}
