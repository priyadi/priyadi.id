import React, {type ReactNode} from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';
import {parseInline, type InlineNode} from '@site/src/lib/inlineMarkdown';
import {
  PLUGIN_NAME,
  type InlineMarkdownData,
} from '@site/src/plugins/inlineMarkdown';

function render(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'code':
        return <code key={i}>{node.value}</code>;
      case 'em':
        return <em key={i}>{render(node.children)}</em>;
      case 'strong':
        return <strong key={i}>{render(node.children)}</strong>;
    }
  });
}

/** Renders `*em*`, `**strong**` and `` `code` `` in a short line of text. */
export default function InlineMarkdown({children}: {children: string}): ReactNode {
  return <>{render(parseInline(children))}</>;
}

/**
 * The title of a post, with the inline markdown of its front matter. Takes
 * the plain title from the metadata and looks up the marked-up one, so that
 * it works for any post a page has the metadata of.
 */
export function PostTitle({
  permalink,
  title,
}: {
  permalink: string;
  title: string;
}): ReactNode {
  const {titles} = usePluginData(PLUGIN_NAME) as InlineMarkdownData;
  const marked = titles[permalink];
  return marked ? <InlineMarkdown>{marked}</InlineMarkdown> : title;
}
