import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDateTimeFormat} from '@docusaurus/theme-common/internal';
import Layout from '@theme/Layout';
import type {Props} from '@theme/BlogArchivePage';

type ArchiveBlogPost = Props['archive']['blogPosts'][number];
import styles from './styles.module.css';

function groupByYear(
  posts: readonly ArchiveBlogPost[],
): [string, ArchiveBlogPost[]][] {
  const years = new Map<string, ArchiveBlogPost[]>();

  for (const post of posts) {
    const year = post.metadata.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }

  return [...years].sort(([a], [b]) => b.localeCompare(a));
}

export default function BlogArchivePage({archive}: Props): ReactNode {
  const dayFormat = useDateTimeFormat({
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const newestFirst = [...archive.blogPosts].sort((a, b) =>
    b.metadata.date.localeCompare(a.metadata.date),
  );

  return (
    <>
      <PageMetadata title="Arsip" description="Semua tulisan di priyadi.id" />
      <Layout>
        <main className="page">
          <h1 className={styles.title}>Arsip</h1>
          {groupByYear(newestFirst).map(([year, posts]) => (
            <section key={year} className={styles.year}>
              <h2 id={year}>{year}</h2>
              <ul>
                {posts.map(({metadata}) => (
                  <li key={metadata.permalink}>
                    <time dateTime={metadata.date}>
                      {dayFormat.format(new Date(metadata.date))}
                    </time>
                    <Link to={metadata.permalink}>{metadata.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>
      </Layout>
    </>
  );
}
