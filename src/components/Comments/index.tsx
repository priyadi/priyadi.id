import React from "react";
import Giscus from "@giscus/react";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";

export default function Comments() {
  const { colorMode } = useColorMode();
  const { siteConfig } = useDocusaurusContext();
  const isBrowser = useIsBrowser();

  // giscus loads the theme into its iframe, so it needs an absolute URL. The
  // page's own origin lets the dev server serve it too; see static/giscus.
  const themePath = useBaseUrl(`/giscus/${colorMode}.css`);
  const origin = isBrowser ? window.location.origin : siteConfig.url;

  return (
    <div>
      <Giscus
        repo="priyadi/priyadi.id"
        repoId="R_kgDON7bvLg"
        category="Blog Comments"
        categoryId="DIC_kwDON7bvLs4CnEzv"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
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
