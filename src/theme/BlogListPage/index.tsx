import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import type {Props} from '@theme/BlogListPage';
import Story, {getPostCard} from '@site/src/components/Story';
import styles from './styles.module.css';

// How the first page is laid out. Change postsPerPage in docusaurus.config.ts
// along with these.
const SIDE_COUNT = 3;
const CARD_COUNT = 4;

function Metadata({metadata}: Props): ReactNode {
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const title = permalink === '/' ? siteTitle : blogTitle;

  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function FrontPage({items}: Pick<Props, 'items'>): ReactNode {
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const [lead, ...others] = items;
  const side = others.slice(0, SIDE_COUNT);
  const cards = others.slice(SIDE_COUNT, SIDE_COUNT + CARD_COUNT);
  const rest = others.slice(SIDE_COUNT + CARD_COUNT);
  // Without a lead image there is nothing to fill a tall left column, so the
  // side stories move below the lead instead of beside it.
  const stacked = !lead || !getPostCard(lead.content).cover;

  return (
    <>
      <h1 className="sr-only">{siteTitle}</h1>
      <section
        className={clsx(styles.top, stacked && styles.stacked)}
        aria-label="Tulisan terbaru">
        {lead && <Story content={lead.content} variant="lead" />}
        {side.length > 0 && (
          <div className={styles.side}>
            {side.map(({content}) => (
              <Story
                key={content.metadata.permalink}
                content={content}
                variant="side"
              />
            ))}
          </div>
        )}
      </section>
      {cards.length > 0 && (
        <section className={styles.cards} aria-label="Tulisan lain">
          {cards.map(({content}) => (
            <Story
              key={content.metadata.permalink}
              content={content}
              variant="card"
            />
          ))}
        </section>
      )}
      {rest.length > 0 && (
        <section className={styles.river}>
          <h2 className={styles.sectionTitle}>Sebelumnya</h2>
          {rest.map(({content}) => (
            <Story
              key={content.metadata.permalink}
              content={content}
              variant="row"
              headingAs="h3"
            />
          ))}
        </section>
      )}
    </>
  );
}

function LaterPage({items, metadata}: Props): ReactNode {
  return (
    <section className={styles.river}>
      <h1 className={styles.sectionTitle}>
        Semua tulisan, halaman {metadata.page} dari {metadata.totalPages}
      </h1>
      {items.map(({content}) => (
        <Story
          key={content.metadata.permalink}
          content={content}
          variant="row"
        />
      ))}
    </section>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  const {metadata, items, sidebar} = props;

  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <Metadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogLayout sidebar={sidebar}>
        {metadata.page === 1 ? (
          <FrontPage items={items} />
        ) : (
          <LaterPage {...props} />
        )}
        <BlogListPaginator metadata={metadata} />
      </BlogLayout>
    </HtmlClassNameProvider>
  );
}
