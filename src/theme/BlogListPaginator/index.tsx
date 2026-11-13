import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogListPaginator';
import styles from './styles.module.css';

export default function BlogListPaginator({metadata}: Props): ReactNode {
  const {previousPage, nextPage} = metadata;

  if (!previousPage && !nextPage) {
    return null;
  }

  return (
    <nav className={styles.pager} aria-label="Halaman daftar tulisan">
      {previousPage && (
        <Link to={previousPage} className={styles.newer}>
          Tulisan lebih baru
        </Link>
      )}
      {nextPage && (
        <Link to={nextPage} className={styles.older}>
          Tulisan lebih lama
        </Link>
      )}
    </nav>
  );
}
