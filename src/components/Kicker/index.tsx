import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type Tag = {label: string; permalink: string};

/**
 * Tags in blog/tags.yml that say what kind of post it is rather than what it
 * is about. After the main topic, the label above a headline names any of
 * these the post also carries: "Energi · Sanggahan".
 */
export const FORMAT_TAGS = ['sanggahan', 'interaktif'];

/** The key of a tag in blog/tags.yml: the last part of its permalink. */
const tagKey = (tag: Tag) =>
  tag.permalink.replace(/\/+$/, '').split('/').pop() ?? '';

export const isFormatTag = (tag: Tag): boolean =>
  FORMAT_TAGS.includes(tagKey(tag));

type Props = {
  /** The tags of a post. The first one is its main topic. */
  tags: readonly Tag[];
  className?: string;
};

/**
 * The label above a headline: the main topic of the post, in the accent, then
 * the kinds of post it also is, in Faded Ink. Each leads to its own page.
 */
export default function Kicker({tags, className}: Props): ReactNode {
  const [topic, ...rest] = tags;
  if (!topic) {
    return null;
  }
  const formats = rest.filter(isFormatTag);

  return (
    <p className={clsx(styles.kicker, className)}>
      <Link to={topic.permalink} className={styles.topic}>
        {topic.label}
      </Link>
      {formats.map((format) => (
        <React.Fragment key={format.permalink}>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <Link to={format.permalink} className={styles.format}>
            {format.label}
          </Link>
        </React.Fragment>
      ))}
    </p>
  );
}
