import React from "react";
import Giscus from "@giscus/react";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { usePluginData } from "@docusaurus/useGlobalData";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import {
  PLUGIN_NAME as UNDATED_URLS,
  type UndatedUrlsData,
} from "@site/src/plugins/undatedUrls";

export default function Comments() {
  const { colorMode } = useColorMode();
  const { siteConfig } = useDocusaurusContext();
  const isBrowser = useIsBrowser();

  // giscus loads the theme into its iframe, so it needs an absolute URL. The
  // page's own origin lets the dev server serve it too; see static/giscus.
  const themePath = useBaseUrl(`/giscus/${colorMode}.css`);
  const origin = isBrowser ? window.location.origin : siteConfig.url;

  // The discussion of a post is named after its dated path, which was its
  // address before the date was dropped (see src/plugins/undatedUrls.ts).
  const { metadata } = useBlogPost();
  const { datedPaths } = usePluginData(UNDATED_URLS) as UndatedUrlsData;
  const term = datedPaths[metadata.permalink];

  return (
    <div>
      <Giscus
        repo="priyadi/priyadi.id"
        repoId="R_kgDON7bvLg"
        category="Blog Comments"
        categoryId="DIC_kwDON7bvLs4CnEzv"
        mapping={term ? "specific" : "pathname"}
        term={term}
        strict="1"
        reactionsEnabled="1"
        emitMetadata="1"
        inputPosition="top"
        theme={origin + themePath}
        lang="id"
        loading="eager"
      />
    </div>
  );
}
