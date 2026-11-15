import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import postCard from './src/remark/postCard';
import inlineMarkdownPlugin, {
  processBlogPosts,
} from './src/plugins/inlineMarkdown';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'priyadi.id',
  // Shown at the top of the front page. May use *emphasis*, **strong** and
  // `code`.
  // FILLER: replace with one or two sentences on who writes here and on what.
  tagline:
    'Narablog lawas dari tahun 2000-an, mulai lagi menulis dengan format baru di tahun 2025. Melakukan apa saja yang bisa dilakukan. Membaca apa saja yang bisa dibaca. Menulis apa saja yang bisa ditulis. Memikirkan apa saja yang bisa dipikirkan.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://priyadi.id',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'priyadi', // Usually your GitHub org/user name.
  projectName: 'priyadi.id', // Usually your repo name.

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'id',
    locales: ['id'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          routeBasePath: '/',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/priyadi/priyadi.id/edit/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          // The front page lays out 1 lead + 2 side stories + 4 cards, then
          // lists the rest.
          postsPerPage: 13,
          blogSidebarCount: 0,
          beforeDefaultRemarkPlugins: [postCard],
          // Strips inline markdown from titles and descriptions in metadata;
          // see src/plugins/inlineMarkdown.ts.
          processBlogPosts,
        },
        theme: {
          customCss: [
            require.resolve('@fontsource-variable/newsreader/opsz.css'),
            require.resolve('@fontsource-variable/newsreader/opsz-italic.css'),
            require.resolve('@fontsource-variable/inter/wght.css'),
            require.resolve('@fontsource-variable/inter/wght-italic.css'),
            require.resolve('@fontsource-variable/jetbrains-mono/wght.css'),
            './src/css/custom.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/priyadi.id.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    // The masthead and footer are custom components: see src/theme/Navbar
    // and src/theme/Footer.
    navbar: {
      title: 'priyadi.id',
      logo: {
        alt: 'priyadi.id',
        src: 'img/logo.svg',
      },
      items: [],
    },
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} Priyadi Iman Nurcahyo`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [require.resolve('docusaurus-lunr-search'), inlineMarkdownPlugin]
};

export default config;
