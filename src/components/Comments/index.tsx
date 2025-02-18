import React from "react";
import Giscus from "@giscus/react";
import { useColorMode } from "@docusaurus/theme-common";

export default function Comments(): JSX.Element {
  const { colorMode } = useColorMode();

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
        theme={colorMode}
        lang="id"
        loading="lazy"
        crossorigin="anonymous"
        async
      />
    </div>
  );
}