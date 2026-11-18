/**
 * Remark plugin: exposes what a post needs to appear as a story card on
 * listing pages. It adds `export const card = {excerpt, cover, coverAlt}` to
 * every blog post module:
 *
 * - `excerpt`: the first paragraph of text, in the inline markdown of
 *   src/lib/inlineMarkdown.ts: emphasis, strong and code are kept, links and
 *   everything else become their text
 * - `cover`: the first image of the post, resolved through webpack, or
 *   `cover.image` in the front matter when the listing should show another
 *
 * Listing pages load the truncated version of a post, so both are taken from
 * the part above the `<!-- truncate -->` marker.
 */

type Node = {
  type: string;
  value?: string;
  url?: string;
  alt?: string;
  children?: Node[];
  [key: string]: unknown;
};

// Skipped when looking for an excerpt or a cover: not article prose.
const SKIPPED = new Set([
  'blockquote',
  'code',
  'containerDirective',
  'footnoteDefinition',
  'list',
  'table',
]);

function text(node: Node): string {
  if (node.type === 'image' || node.type === 'footnoteReference') {
    return '';
  }
  if (typeof node.value === 'string') {
    return node.type === 'text' || node.type === 'inlineCode' ? node.value : '';
  }
  return (node.children ?? []).map(text).join('');
}

const escape = (value: string) => value.replace(/[\\*_`]/g, '\\$&');

/** Wraps in a mark, keeping whitespace at either end outside of it. */
function mark(marker: string, inner: string): string {
  const [, before, core, after] = /^(\s*)(.*?)(\s*)$/s.exec(inner)!;
  return core ? `${before}${marker}${core}${marker}${after}` : inner;
}

/** Like `text`, but as inline markdown. */
function markdown(node: Node): string {
  switch (node.type) {
    case 'text':
      return escape(node.value ?? '');
    case 'inlineCode': {
      const value = node.value ?? '';
      return value.includes('`') ? escape(value) : `\`${value}\``;
    }
    case 'emphasis':
      return mark('*', children(node));
    case 'strong':
      return mark('**', children(node));
  }
  // Links and the like become their text; images and footnote references,
  // which have no children, nothing.
  return node.type === 'image' ? '' : children(node);
}

const children = (node: Node) => (node.children ?? []).map(markdown).join('');

function findImage(node: Node): Node | undefined {
  if (node.type === 'image') {
    // Light/dark variants are diagrams, not cover art.
    return /#gh-(dark|light)-mode-only$/.test(node.url ?? '') ? undefined : node;
  }
  for (const child of node.children ?? []) {
    const found = findImage(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

const identifier = (name: string) => ({type: 'Identifier', name});
const literal = (value: string) => ({
  type: 'Literal',
  value,
  raw: JSON.stringify(value),
});
const property = (key: string, value: unknown) => ({
  type: 'Property',
  key: identifier(key),
  value,
  kind: 'init',
  method: false,
  shorthand: false,
  computed: false,
});

type File = {data?: {frontMatter?: {cover?: {image?: unknown}}}};

export default function postCard() {
  return (tree: Node, file: File) => {
    let excerpt = '';
    // An image chosen for listing pages wins over the first one in the post.
    const image = file.data?.frontMatter?.cover?.image;
    let cover: Node | undefined =
      typeof image === 'string' && image
        ? {type: 'image', url: image, alt: ''}
        : undefined;

    for (const node of tree.children ?? []) {
      if (SKIPPED.has(node.type)) {
        continue;
      }
      if (!cover) {
        cover = findImage(node);
      }
      if (!excerpt && node.type === 'paragraph') {
        excerpt = markdown(node).replace(/\s+/g, ' ').trim();
      }
      if (cover && excerpt) {
        break;
      }
    }

    const body: unknown[] = [];
    const properties = [property('excerpt', literal(excerpt))];

    if (cover?.url) {
      const url = cover.url.replace(/#.*$/, '');
      const isRemote = /^([a-z][a-z0-9+.-]*:)?\/\//i.test(url);

      if (isRemote || url.startsWith('/')) {
        properties.push(property('cover', literal(url)));
      } else {
        body.push({
          type: 'ImportDeclaration',
          specifiers: [
            {
              type: 'ImportDefaultSpecifier',
              local: identifier('__postCardCover'),
            },
          ],
          source: literal(/^\.{1,2}\//.test(url) ? url : `./${url}`),
          attributes: [],
        });
        properties.push(property('cover', identifier('__postCardCover')));
      }
      properties.push(property('coverAlt', literal(cover.alt ?? '')));
    }

    body.push({
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: identifier('card'),
            init: {type: 'ObjectExpression', properties},
          },
        ],
      },
      specifiers: [],
      source: null,
      attributes: [],
    });

    (tree.children ??= []).push({
      type: 'mdxjsEsm',
      value: '',
      data: {estree: {type: 'Program', sourceType: 'module', body}},
    });
  };
}
