import React, { type ReactNode } from 'react';
import styles from './styles.module.css';

type Props = {
  /** The in-page anchor to jump to, e.g. "#pemeriksa". */
  to: string;
  /** Who the shortcut is for, as a question or short phrase. */
  lead: string;
  /** The link text. */
  label: string;
};

/**
 * A one-line shortcut near the top of a post to the tool further down, for
 * readers who come back with what the tool needs. It takes everything as
 * props, so the Facebook text (scripts/posttexts.mjs) leaves it out.
 */
export default function JumpLink({ to, lead, label }: Props): ReactNode {
  return (
    <p className={styles.jump}>
      <span className={styles.lead}>{lead}</span>{' '}
      <a className={styles.link} href={to}>
        {label}
        <svg
          className={styles.icon}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3v10M4 9l4 4 4-4" />
        </svg>
      </a>
    </p>
  );
}
