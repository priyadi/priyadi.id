#!/usr/bin/env node
/**
 * Write a post as plain text, to paste into a Facebook post.
 *
 *     node scripts/posttexts.mjs POST_DIR [OUTPUT]
 *
 * The text is written next to the post as index.txt, or to OUTPUT (`-` for
 * standard output). The posttext skill (.claude/skills/posttext) starts
 * from this and fixes what a script cannot.
 *
 * Facebook shows text as it is: no markdown, and every line break is kept. So
 * paragraphs are joined into single lines, and:
 *
 * - the title comes first, then the post
 * - emphasis, code and heading marks are dropped, keeping the words
 * - a link keeps its text but not its address, since Facebook ranks posts
 *   with links lower
 * - images and figures are left out, and so are components without content
 *   (charts, calculators, tools); those are named on stderr so the text
 *   around them can be checked
 * - an admonition keeps its title, or the name of its kind
 * - footnotes are numbered [1], [2]… in the order they are first cited, and
 *   listed with their addresses after a line at the end, ready to be cut out
 *   into the first comment
 * - <sub> and <sup> become Unicode subscripts and superscripts where they
 *   exist (CO<sub>2</sub> → CO₂)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { load as loadYaml } from 'js-yaml';

// Names Docusaurus gives the admonitions in Indonesian, shown when an
// admonition has no title of its own.
const ADMONITIONS = {
  note: 'Catatan',
  tip: 'Tips',
  info: 'Info',
  warning: 'Peringatan',
  caution: 'Perhatian',
  danger: 'Bahaya',
  important: 'Penting',
  success: 'Sukses',
  secondary: 'Catatan',
};

// Elements whose content is visual: left out with everything inside.
const VISUAL = new Set(['figure', 'Figure', 'img', 'svg', 'picture', 'video']);

const SUBSCRIPT = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈',
  9: '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ',
  o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};
const SUPERSCRIPT = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸',
  9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  i: 'ⁱ', n: 'ⁿ',
};

function script(text, table) {
  const chars = [...text];
  return chars.every((c) => c in table)
    ? chars.map((c) => table[c]).join('')
    : null;
}

/**
 * Parse like Docusaurus does: MDX with GFM and directives, HTML comments
 * allowed, `:::note Title` read as `:::note[Title]`, and `{#id}` after a
 * heading dropped.
 */
function parse(source) {
  let inFence = null;
  const lines = source.split('\n').map((line) => {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) inFence = fence[1];
      else if (fence[1].startsWith(inFence)) inFence = null;
      return line;
    }
    if (inFence) return line;
    return line
      .replace(/^(\s*:::\s*)([a-z]+)\s+([^[{\s].*)$/, '$1$2[$3]')
      // A heading's explicit id, `## Title {#id}`, which Docusaurus reads.
      .replace(/^(#{1,6}\s.*?)\s*\{#[\w-]+\}\s*$/, '$1');
  });
  let text = lines.join('\n');
  // Comments, outside fenced code. Good enough for prose.
  text = text.replace(/(^|\n)(```[\s\S]*?\n```|~~~[\s\S]*?\n~~~)|<!--[\s\S]*?-->/g,
    (match, lead, fence) => (fence ? match : ''));

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkDirective)
    .parse(text);
}

class Renderer {
  constructor() {
    this.definitions = new Map(); // footnote identifier → node
    this.cited = []; // footnote identifiers, in order of first citation
    this.skipped = [];
  }

  footnoteNumber(identifier) {
    let index = this.cited.indexOf(identifier);
    if (index < 0) index = this.cited.push(identifier) - 1;
    return index + 1;
  }

  skip(component) {
    this.skipped.push(component);
  }

  // Blocks, separated by blank lines.
  blocks(nodes) {
    return nodes
      .map((node) => this.block(node))
      .filter((text) => text && text.trim())
      .join('\n\n');
  }

  block(node) {
    switch (node.type) {
      case 'paragraph':
      case 'heading':
        return this.inline(node.children).trim();
      case 'thematicBreak':
        return '* * *';
      case 'blockquote':
        return this.blocks(node.children)
          .split('\n')
          .map((line) => (line ? `> ${line}` : '>'))
          .join('\n');
      case 'list':
        return this.list(node, 0);
      case 'code':
        return node.value;
      case 'table':
        return this.table(node);
      case 'containerDirective':
        return this.admonition(node);
      case 'mdxJsxFlowElement':
        return this.element(node, true);
      case 'footnoteDefinition':
        this.definitions.set(node.identifier, node);
        return '';
      case 'html': // only in plain markdown, which these posts are not
      case 'yaml':
      case 'mdxjsEsm':
      case 'mdxFlowExpression':
      case 'definition':
        return '';
      default:
        if (node.children) return this.blocks(node.children);
        return node.value ?? '';
    }
  }

  list(node, depth) {
    const indent = '   '.repeat(depth);
    const start = node.start ?? 1;
    return node.children
      .map((item, i) => {
        let marker = node.ordered ? `${start + i}. ` : depth ? '◦ ' : '• ';
        if (item.checked === true) marker += '☑ ';
        if (item.checked === false) marker += '☐ ';
        const parts = item.children.map((child) =>
          child.type === 'list' ? this.list(child, depth + 1) : this.block(child));
        const pad = ' '.repeat(marker.length);
        const text = parts
          .filter((p) => p.trim())
          .join(node.spread || item.spread ? '\n\n' : '\n')
          .split('\n')
          .map((line, j) => {
            if (j === 0) return indent + marker + line;
            // Nested lists carry their own indent.
            return line && !line.startsWith(indent + '   ') ? indent + pad + line : line;
          })
          .join('\n');
        return text;
      })
      .join(node.spread ? '\n\n' : '\n');
  }

  table(node) {
    return node.children
      .map((row) => row.children.map((cell) => this.inline(cell.children).trim()).join(' | '))
      .join('\n');
  }

  admonition(node) {
    let children = node.children;
    let title = ADMONITIONS[node.name] ?? node.name;
    if (children[0]?.data?.directiveLabel) {
      title = this.inline(children[0].children).trim();
      children = children.slice(1);
    } else if (node.attributes?.title) {
      title = node.attributes.title;
    }
    const body = this.blocks(children);
    return title ? `${title}\n\n${body}` : body;
  }

  element(node, flow) {
    const name = node.name ?? '';
    if (VISUAL.has(name)) {
      if (/^[A-Z]/.test(name)) this.skip(name);
      return '';
    }
    if (name === 'br') return '\n';
    if (!flow && (name === 'sub' || name === 'sup')) {
      const text = this.inline(node.children);
      return script(text, name === 'sub' ? SUBSCRIPT : SUPERSCRIPT) ?? text;
    }
    if (!node.children?.length) {
      if (/^[A-Z]/.test(name)) this.skip(name);
      return '';
    }
    return flow ? this.blocks(node.children) : this.inline(node.children);
  }

  inline(nodes) {
    return nodes.map((node) => this.phrase(node)).join('');
  }

  phrase(node) {
    switch (node.type) {
      case 'text':
        return node.value.replace(/[ \t]*\n[ \t]*/g, ' ');
      case 'inlineCode':
        return node.value;
      case 'break':
        return '\n';
      case 'image':
      case 'imageReference':
        return '';
      case 'footnoteReference':
        return `[${this.footnoteNumber(node.identifier)}]`;
      case 'mdxJsxTextElement':
        return this.element(node, false);
      case 'mdxTextExpression':
      case 'html':
        return '';
      default:
        // emphasis, strong, delete, link, linkReference, textDirective…
        if (node.children) return this.inline(node.children);
        return node.value ?? '';
    }
  }

  // Footnotes keep their addresses: they are the sources.
  footnotes() {
    const lines = [];
    // A footnote may cite another, so the list can grow while it is written.
    for (let i = 0; i < this.cited.length; i++) {
      const definition = this.definitions.get(this.cited[i]);
      if (!definition) continue;
      const text = definition.children
        .map((child) => (child.type === 'paragraph'
          ? this.withUrls(child.children)
          : this.block(child)))
        .join(' ')
        .trim();
      lines.push(`[${i + 1}] ${text}`);
    }
    return lines.join('\n');
  }

  withUrls(nodes) {
    return nodes
      .map((node) => {
        if (node.type !== 'link') return this.phrase(node);
        const text = this.inline(node.children).trim();
        return text && text !== node.url ? `${text} ${node.url}` : node.url;
      })
      .join('');
  }
}

export function postText(source) {
  const tree = parse(source);
  const renderer = new Renderer();

  // Definitions first, so citations can be numbered as they are met.
  for (const node of tree.children) {
    if (node.type === 'footnoteDefinition') renderer.definitions.set(node.identifier, node);
  }

  const frontMatter = tree.children.find((node) => node.type === 'yaml');
  const data = frontMatter ? loadYaml(frontMatter.value) ?? {} : {};
  const parts = [];
  if (data.title) {
    const title = parse(String(data.title)).children[0];
    parts.push(title ? renderer.inline(title.children ?? []).trim() : String(data.title));
  }
  parts.push(renderer.blocks(tree.children));
  const notes = renderer.footnotes();
  if (notes) parts.push(`———\n\n${notes}`);

  const text = parts
    .join('\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text: `${text}\n`, skipped: renderer.skipped };
}

function main(argv) {
  const [dir, output] = argv;
  if (!dir) {
    console.error('usage: node scripts/posttexts.mjs POST_DIR [OUTPUT]');
    process.exit(2);
  }
  const file = ['index.mdx', 'index.md'].map((f) => join(dir, f)).find(existsSync);
  if (!file) {
    console.error(`${dir}: no index.md or index.mdx`);
    process.exit(1);
  }

  const { text, skipped } = postText(readFileSync(file, 'utf8'));
  const target = output ?? join(dir, 'index.txt');
  if (target === '-') process.stdout.write(text);
  else writeFileSync(target, text);

  const where = target === '-' ? relative('.', file) : relative('.', target);
  if (skipped.length) {
    console.error(`${where}: left out ${[...new Set(skipped)].join(', ')}`);
  }
}

main(process.argv.slice(2));
