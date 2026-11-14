import React, {type ReactNode, useRef, useState} from 'react';
import clsx from 'clsx';
import Disclosure from '@site/src/components/Disclosure';
import styles from './styles.module.css';

export type Side = 'orbit' | 'ground';

export type BarRow = {
  key: string;
  label: string;
  orbit?: number;
  ground?: number;
  /** A total: set apart from the lines that add up to it. */
  strong?: boolean;
};

const SIDE_NAME: Record<Side, string> = {orbit: 'Orbit', ground: 'Darat'};

type Props = {
  rows: readonly BarRow[];
  /** Which bars each row has. One side makes a plain bar chart. */
  sides: readonly Side[];
  /** The value as printed at the end of a bar. */
  format: (value: number) => string;
  /** Values at or below this are shown as a dash, without a bar. */
  negligible?: number;
  /** One line of the tooltip: more than the label at the bar already says. */
  detail: (row: BarRow, side: Side) => ReactNode;
};

/**
 * Horizontal bars, one row per line item, with orbit and ground side by side
 * where both apply. Every bar carries its value; hovering or focusing a row
 * adds detail.
 */
export default function PairedBars({
  rows,
  sides,
  format,
  negligible = 0,
  detail,
}: Props): ReactNode {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{key: string; x: number; y: number}>();

  const scale = Math.max(
    ...rows.flatMap((row) => sides.map((side) => row[side] ?? 0)),
  );
  const hovered = rows.find((row) => row.key === hover?.key);

  const place = (key: string, clientX: number, clientY: number) => {
    const box = chartRef.current?.getBoundingClientRect();
    if (box) {
      setHover({key, x: clientX - box.left, y: clientY - box.top});
    }
  };

  return (
    <div ref={chartRef} className={styles.chart}>
      {sides.length > 1 && (
        <ul className={styles.legend}>
          {sides.map((side) => (
            <li key={side}>
              <i className={styles[side]} />
              {SIDE_NAME[side]}
            </li>
          ))}
        </ul>
      )}

      <div role="list">
        {rows.map((row) => (
          <div
            key={row.key}
            role="listitem"
            tabIndex={0}
            className={clsx(
              styles.row,
              row.strong && styles.totalRow,
              row.key === hover?.key && styles.rowActive,
            )}
            aria-label={`${row.label}: ${sides
              .map(
                (side) =>
                  `${sides.length > 1 ? `${SIDE_NAME[side]} ` : ''}${format(row[side] ?? 0)}`,
              )
              .join(', ')}`}
            onPointerMove={(event) =>
              place(row.key, event.clientX, event.clientY)
            }
            onPointerLeave={() => setHover(undefined)}
            onFocus={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              place(row.key, box.left + box.width / 2, box.bottom);
            }}
            onBlur={() => setHover(undefined)}>
            <div className={styles.rowLabel}>{row.label}</div>
            <div>
              {sides.map((side) => {
                const value = row[side] ?? 0;
                const shown = value > negligible;
                return (
                  <div key={side} className={styles.barLine}>
                    {shown && (
                      <span
                        className={clsx(styles.mark, styles[side])}
                        // The widest bar leaves room for its own value label.
                        style={{
                          width: `max(2px, calc((100% - 5rem) * ${value / scale}))`,
                        }}
                      />
                    )}
                    <span className={styles.value}>
                      {shown ? format(value) : '–'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hover && hovered && (
        <div
          className={styles.tooltip}
          style={{left: hover.x, top: hover.y}}
          role="status">
          <p className={styles.tooltipTitle}>{hovered.label}</p>
          {sides.map((side) => (
            <p key={side}>
              <i className={clsx(styles.key, styles[side])} />
              {detail(hovered, side)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** The same numbers as a table, for readers who want or need one. */
export function TableView({
  head,
  rows,
}: {
  head: readonly string[];
  rows: readonly (readonly string[])[];
}): ReactNode {
  return (
    <Disclosure className={styles.more} summary="Lihat sebagai tabel">
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, ...cells]) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              {cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Disclosure>
  );
}
