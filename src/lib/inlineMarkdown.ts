/**
 * The little markdown that a post's `description` may use:
 *
 *     *emphasis* or _emphasis_, **strong**, `code`, and \* for a literal *
 *
 * Nothing else: no links, no block syntax. The description is shown as the
 * dek of the post and as its summary on listing pages, where the marks are
 * rendered, and it ends up in meta tags and feeds, where they are stripped.
 *
 * Plain TypeScript without enums or other non-erasable syntax, so that
 * scripts/socialcards.mjs can import it with Node's type stripping.
 */

export type InlineNode =
  | {type: 'text'; value: string}
  | {type: 'code'; value: string}
  | {type: 'em' | 'strong'; children: InlineNode[]};

// `_` only counts at word boundaries, so snake_case stays as it is.
const TOKEN =
  /\\([\\*_`])|`([^`]+)`|\*\*(?=\S)(.+?)(?<=\S)\*\*|\*(?=\S)(.+?)(?<=\S)\*|(?<![\p{L}\p{N}])_(?=\S)(.+?)(?<=\S)_(?![\p{L}\p{N}])/gu;

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const text = (value: string) => {
    if (!value) return;
    const last = nodes[nodes.length - 1];
    if (last?.type === 'text') last.value += value;
    else nodes.push({type: 'text', value});
  };

  let at = 0;
  for (const m of source.matchAll(TOKEN)) {
    text(source.slice(at, m.index));
    at = m.index + m[0].length;
    const [, escaped, code, strong, em, underscored] = m;
    if (escaped !== undefined) text(escaped);
    else if (code !== undefined) nodes.push({type: 'code', value: code});
    else if (strong !== undefined) {
      nodes.push({type: 'strong', children: parseInline(strong)});
    } else {
      nodes.push({type: 'em', children: parseInline(em ?? underscored)});
    }
  }
  text(source.slice(at));
  return nodes;
}

export function toPlainText(source: string | InlineNode[]): string {
  const nodes = typeof source === 'string' ? parseInline(source) : source;
  return nodes
    .map((node) => ('children' in node ? toPlainText(node.children) : node.value))
    .join('');
}
