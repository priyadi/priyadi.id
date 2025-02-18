import React, {type ReactNode} from 'react';
import BlogPostItem from '@theme-original/BlogPostItem';
import type BlogPostItemType from '@theme/BlogPostItem';
import type {WrapperProps} from '@docusaurus/types';

type Props = WrapperProps<typeof BlogPostItemType>;

export default function BlogPostItemWrapper(props: Props): ReactNode {
  return (
    <>
      <BlogPostItem {...props} />
      <script src="https://giscus.app/client.js"
        data-repo="priyadi/priyadi.id"
        data-repo-id="R_kgDON7bvLg"
        data-category="Blog Comments"
        data-category-id="DIC_kwDON7bvLs4CnEzv"
        data-mapping="pathname"
        data-strict="1"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="id"
        crossorigin="anonymous"
        async>
      </script>
    </>
  );
}
