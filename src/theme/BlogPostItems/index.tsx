import React, {type ReactNode} from 'react';
import type {Props} from '@theme/BlogPostItems';
import Story from '@site/src/components/Story';

export default function BlogPostItems({items}: Props): ReactNode {
  return (
    <>
      {items.map(({content}) => (
        <Story
          key={content.metadata.permalink}
          content={content}
          variant="row"
        />
      ))}
    </>
  );
}
