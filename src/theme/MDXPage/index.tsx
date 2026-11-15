import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import MDXContent from '@theme/MDXContent';
import ContentVisibility from '@theme/ContentVisibility';
import type {Props} from '@theme/MDXPage';
import styles from './styles.module.css';

/**
 * A standalone page written in Markdown (src/pages/*.md). It is set like an article: the same reading column and prose styles, with
 * the page's own `# Heading` as its headline.
 */
export default function MDXPage({content: MDXPageContent}: Props): ReactNode {
  const {metadata, assets} = MDXPageContent;
  const {title, description, frontMatter} = metadata;
  const image = assets.image ?? frontMatter.image;

  return (
    <HtmlClassNameProvider
      className={clsx(
        frontMatter.wrapperClassName ?? ThemeClassNames.wrapper.mdxPages,
        ThemeClassNames.page.mdxPage,
      )}>
      <Layout>
        <PageMetadata
          title={title}
          description={description}
          keywords={frontMatter.keywords}
          image={image}
        />
        <main className={styles.page}>
          <div className="columns">
            <ContentVisibility metadata={metadata} />
          </div>
          <article className={clsx('columns', 'markdown', 'prose')}>
            <MDXContent>
              <MDXPageContent />
            </MDXContent>
          </article>
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
