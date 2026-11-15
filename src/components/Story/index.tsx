import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useDateTimeFormat} from '@docusaurus/theme-common/internal';
import type {PropBlogPostContent} from '@docusaurus/plugin-content-blog';
import InlineMarkdown, {PostTitle} from '@site/src/components/InlineMarkdown';
import styles from './styles.module.css';

/** Added to each post module by src/remark/postCard.ts. */
type PostCard = {
  excerpt?: string;
  cover?: string;
  coverAlt?: string;
};

/** `cover` in the front matter of a post. */
type CoverOptions = {
  /** `contain` shows the image whole instead of cropping it to the frame. */
  fit?: 'cover' | 'contain';
};

export type StoryVariant = 'lead' | 'side' | 'card' | 'row';

type Props = {
  content: PropBlogPostContent;
  variant: StoryVariant;
  /** Heading element for the headline; depends on the page outline. */
  headingAs?: 'h2' | 'h3';
  /**
   * For the `side` variant on wide screens, where it sits in a narrow column
   * beside the lead: `top` puts the image above the text instead of beside
   * it, `none` leaves the image out. Narrow screens keep the thumbnail.
   */
  wideMedia?: 'top' | 'none';
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
  wideMedia,
}: Props): ReactNode {
  const {metadata, frontMatter} = content;
  const card = getPostCard(content);
  const formatDate = usePostDate();
  const {cover: coverOptions} = frontMatter as {cover?: CoverOptions};
  const whole = coverOptions?.fit === 'contain';
  // The first tag of a post is its main topic.
  const topic = metadata.tags[0];
  // The description may carry inline markdown; the excerpt is plain text.
  const summary = frontMatter.description ? (
    <InlineMarkdown>{frontMatter.description}</InlineMarkdown>
  ) : (
    card.excerpt
  );

  return (
    <article
      className={clsx(
        styles.story,
        styles[variant],
        !card.cover && styles.textOnly,
        wideMedia === 'top' && styles.wideTop,
        wideMedia === 'none' && styles.wideNone,
      )}>
      {card.cover && (
        <div className={clsx(styles.media, whole && styles.contain)}>
          {whole && (
            <img className={styles.backdrop} src={card.cover} alt="" aria-hidden />
          )}
          <img
            src={card.cover}
            alt=""
            loading={variant === 'lead' ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      )}
      <div className={styles.text}>
        {topic && (
          <Link to={topic.permalink} className={styles.kicker}>
            {topic.label}
          </Link>
        )}
        <Heading className={styles.headline}>
          <Link to={metadata.permalink}>
            <PostTitle permalink={metadata.permalink} title={metadata.title} />
          </Link>
        </Heading>
        {summary && <p className={styles.summary}>{summary}</p>}
        <time className={styles.date} dateTime={metadata.date}>
          {formatDate(metadata.date)}
        </time>
      </div>
    </article>
  );
}
