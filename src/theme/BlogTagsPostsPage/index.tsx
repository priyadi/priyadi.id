import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import BlogPostItems from '@theme/BlogPostItems';
import SearchMetadata from '@theme/SearchMetadata';
import Unlisted from '@theme/ContentVisibility/Unlisted';
import type {Props} from '@theme/BlogTagsPostsPage';
import styles from './styles.module.css';

/**
 * The posts of one topic. The label above the headline of a story leads
 * here.
 */
export default function BlogTagsPostsPage({
  tag,
  items,
  sidebar,
  listMetadata,
}: Props): ReactNode {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagPostListPage,
      )}>
      <PageMetadata title={tag.label} description={tag.description} />
      <SearchMetadata tag="blog_tags_posts" />
      <BlogLayout sidebar={sidebar}>
        {tag.unlisted && <Unlisted />}
        <header className={styles.header}>
          <p className={styles.kicker}>
            <Link to={tag.allTagsPath}>Topik</Link>
          </p>
          <h1 className={styles.title}>{tag.label}</h1>
          {tag.description && (
            <p className={styles.description}>{tag.description}</p>
          )}
          <p className={styles.count}>{tag.count} tulisan</p>
        </header>
        <BlogPostItems items={items} />
        <BlogListPaginator metadata={listMetadata} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
