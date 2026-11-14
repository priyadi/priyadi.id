import React, {type ReactNode} from 'react';
import clsx from 'clsx';

type Width = 'text' | 'wide' | 'full';

const bleedClass: Record<Width, string | undefined> = {
  text: undefined,
  wide: 'bleed-wide',
  full: 'bleed-full',
};

type FigureProps = {
  /** `text` stays in the reading column, `wide` and `full` break out of it. */
  width?: Width;
  title?: ReactNode;
  caption?: ReactNode;
  source?: ReactNode;
  /** Shown below the caption: a table view of the chart, notes on method. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A chart, map, table or image with an optional title, caption and source.
 *
 *     <Figure width="wide" title="Emisi per kapita" source="Our World in Data">
 *       <MyChart />
 *     </Figure>
 */
export default function Figure({
  width = 'text',
  title,
  caption,
  source,
  footer,
  className,
  children,
}: FigureProps): ReactNode {
  return (
    <figure className={clsx('figure', bleedClass[width], className)}>
      {title && <p className="figure__title">{title}</p>}
      <div className="figure__content">{children}</div>
      {(caption || source) && (
        <figcaption className="figure__caption">
          {caption}
          {source && <span className="figure__source">Sumber: {source}</span>}
        </figcaption>
      )}
      {footer && <div className="figure__footer">{footer}</div>}
    </figure>
  );
}

type BleedProps = {className?: string; children: ReactNode};

/** Breaks out of the reading column, up to the wide measure. */
export function Wide({className, children}: BleedProps): ReactNode {
  return <div className={clsx('bleed-wide', className)}>{children}</div>;
}

/** Breaks out of the reading column, edge to edge. */
export function FullWidth({className, children}: BleedProps): ReactNode {
  return <div className={clsx('bleed-full', className)}>{children}</div>;
}
