import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useDateTimeFormat} from '@docusaurus/theme-common/internal';
import type {PropBlogPostContent} from '@docusaurus/plugin-content-blog';
import styles from './styles.module.css';

/** Added to each post module by src/remark/postCard.ts. */
type PostCard = {
  excerpt?: string;
  cover?: string;
  coverAlt?: string;
};

export type StoryVariant = 'lead' | 'side' | 'card' | 'row';

type Props = {
  content: PropBlogPostContent;
  variant: StoryVariant;
  /** Heading element for the headline; depends on the page outline. */
  headingAs?: 'h2' | 'h3';
};

export function getPostCard(content: PropBlogPostContent): PostCard {
  return (content as {card?: PostCard}).card ?? {};
}

export function usePostDate(): (date: string) => string {
  const format = useDateTimeFormat({
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (date) => format.format(new Date(date));
}

export default function Story({
  content,
  variant,
  headingAs: Heading = 'h2',
}: Props): ReactNode {
  const {metadata, frontMatter} = content;
  const card = getPostCard(content);
  const formatDate = usePostDate();
  const summary = frontMatter.description ?? card.excerpt;

  return (
    <article
      className={clsx(
        styles.story,
        styles[variant],
        !card.cover && styles.textOnly,
      )}>
      {card.cover && (
        <div className={styles.media}>
          <img
            src={card.cover}
            alt=""
            loading={variant === 'lead' ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      )}
      <div className={styles.text}>
        <Heading className={styles.headline}>
          <Link to={metadata.permalink}>{metadata.title}</Link>
        </Heading>
        {summary && <p className={styles.summary}>{summary}</p>}
        <time className={styles.date} dateTime={metadata.date}>
          {formatDate(metadata.date)}
        </time>
      </div>
    </article>
  );
}
