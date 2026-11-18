import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import SearchMetadata from '@theme/SearchMetadata';
import type {Props} from '@theme/BlogTagsListPage';
import {isFormatTag} from '@site/src/components/Kicker';
import styles from './styles.module.css';

type Tag = Props['tags'][number];

const byLabel = (a: Tag, b: Tag) => a.label.localeCompare(b.label, 'id');

function TagList({tags}: {tags: Tag[]}): ReactNode {
  return (
    <ul className={styles.list}>
      {tags.map((tag) => (
        <li key={tag.permalink} className={styles.item}>
          <h3 className={styles.name}>
            <Link to={tag.permalink}>{tag.label}</Link>
          </h3>
          {tag.description && (
            <p className={styles.description}>{tag.description}</p>
          )}
          <p className={styles.count}>{tag.count} tulisan</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Every topic of the blog with what it covers, then the kinds of post
 * (blog/tags.yml). The masthead and the label above a topic page lead here.
 */
export default function BlogTagsListPage({tags, sidebar}: Props): ReactNode {
  const topics = tags.filter((tag) => !isFormatTag(tag)).sort(byLabel);
  const formats = tags.filter(isFormatTag).sort(byLabel);

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagsListPage,
      )}>
      <PageMetadata
        title="Topik"
        description="Semua topik tulisan di priyadi.id, dan tulisan yang meluruskan klaim atau berisi alat untuk dicoba sendiri."
      />
      <SearchMetadata tag="blog_tags_list" />
      <BlogLayout sidebar={sidebar}>
        <header className={styles.header}>
          <h1 className={styles.title}>Topik</h1>
        </header>
        <section aria-labelledby="topik">
          <h2 id="topik" className="sr-only">
            Topik
          </h2>
          <TagList tags={topics} />
        </section>
        {formats.length > 0 && (
          <section className={styles.formats} aria-labelledby="jenis-tulisan">
            <h2 id="jenis-tulisan" className={styles.sectionTitle}>
              Jenis tulisan
            </h2>
            <TagList tags={formats} />
          </section>
        )}
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
