import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {Details} from '@docusaurus/theme-common/Details';
import styles from './styles.module.css';

type Props = {
  summary: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A section that opens and closes with a short height animation. It is a
 * native <details>, so it works without JavaScript, and the animation is
 * skipped for readers who ask for reduced motion.
 */
export default function Disclosure({
  summary,
  className,
  children,
}: Props): ReactNode {
  return (
    <Details
      className={clsx(styles.disclosure, className)}
      summary={<summary>{summary}</summary>}>
      {children}
    </Details>
  );
}
