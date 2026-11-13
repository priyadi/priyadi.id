import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';

export default function Footer(): ReactNode {
  const {footer} = useThemeConfig();
  const rssUrl = useBaseUrl('/rss.xml');
  const atomUrl = useBaseUrl('/atom.xml');

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copyright}>{footer?.copyright}</p>
        <ul className={styles.links}>
          <li>
            <Link to="/archive">Arsip</Link>
          </li>
          <li>
            <a href={rssUrl}>RSS</a>
          </li>
          <li>
            <a href={atomUrl}>Atom</a>
          </li>
          <li>
            <a href="https://github.com/priyadi">GitHub</a>
          </li>
          <li>
            <a href="https://bsky.app/profile/priyadi.id">Bluesky</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
