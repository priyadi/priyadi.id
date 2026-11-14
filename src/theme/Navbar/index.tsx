import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import SearchBar from '@theme/SearchBar';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import Wordmark from './Wordmark';
import styles from './styles.module.css';

export default function Navbar(): ReactNode {
  const {navbar} = useThemeConfig();
  const logoSrc = useBaseUrl(navbar.logo?.src ?? 'img/logo.svg');
  const rssUrl = useBaseUrl('/rss.xml');

  return (
    <header className={styles.masthead}>
      <div className={styles.horizon} aria-hidden="true" />
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <img src={logoSrc} alt="" width={36} height={36} />
          <Wordmark className={styles.wordmark} title={navbar.title ?? ''} />
        </Link>
        <nav className={styles.nav} aria-label="Navigasi utama">
          <Link to="/archive" activeClassName={styles.current}>
            Arsip
          </Link>
          <a href={rssUrl} className={styles.optional}>
            RSS
          </a>
        </nav>
        <div className={styles.tools}>
          <SearchBar />
          <NavbarColorModeToggle />
        </div>
      </div>
    </header>
  );
}
