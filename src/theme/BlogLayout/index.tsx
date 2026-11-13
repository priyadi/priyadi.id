import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import type {Props} from '@theme/BlogLayout';

/**
 * Listing pages (front page, tags, authors) share one plain page frame. The
 * sidebar and table of contents of the stock blog layout are not used.
 */
export default function BlogLayout(props: Props): ReactNode {
  const {sidebar: _sidebar, toc: _toc, children, ...layoutProps} = props;

  return (
    <Layout {...layoutProps}>
      <main className="page">{children}</main>
    </Layout>
  );
}
