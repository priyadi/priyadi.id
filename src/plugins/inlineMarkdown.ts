/**
 * Inline markdown in the `title` and `description` of a post's front matter
 * (see src/lib/inlineMarkdown.ts).
 *
 * The pages render the marks; everything else that Docusaurus builds from a
 * post's metadata (the <title>, meta tags, structured data, feeds) should get
 * plain text. So `processBlogPosts` strips the marks from the metadata, and
 * the plugin publishes the marked-up titles for the pages to use, keyed by
 * permalink: a page only has the metadata of the posts it links to, such as
 * the previous and next post, not their front matter.
 */

import type {Plugin} from '@docusaurus/types';
import type {
  BlogContent,
  BlogPost,
} from '@docusaurus/plugin-content-blog';
import {toPlainText} from '../lib/inlineMarkdown';

export const PLUGIN_NAME = 'inline-markdown';

/** Global data of the plugin: marked-up titles by permalink. */
export type InlineMarkdownData = {titles: Record<string, string>};

export async function processBlogPosts({
  blogPosts,
}: {
  blogPosts: BlogPost[];
}): Promise<BlogPost[]> {
  return blogPosts.map((post) => {
    const {title, description} = post.metadata.frontMatter;
    return {
      ...post,
      metadata: {
        ...post.metadata,
        ...(title && {title: toPlainText(title)}),
        ...(description && {description: toPlainText(description)}),
      },
    };
  });
}

export default function inlineMarkdownPlugin(): Plugin {
  return {
    name: PLUGIN_NAME,
    async allContentLoaded({allContent, actions}) {
      const blog = allContent['docusaurus-plugin-content-blog']?.default as
        | BlogContent
        | undefined;
      const titles: Record<string, string> = {};
      for (const {metadata} of blog?.blogPosts ?? []) {
        const {title} = metadata.frontMatter;
        if (title && title !== metadata.title) {
          titles[metadata.permalink] = title;
        }
      }
      actions.setGlobalData({titles} satisfies InlineMarkdownData);
    },
  };
}
