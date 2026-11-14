import React, {type ReactNode, useMemo, useRef, useState} from 'react';
import Figure from '@site/src/components/Figure';
import {tr} from './id';
import {type Inputs, type Outputs, compute, controlOf} from './model';
import {TableView} from './PairedBars';
import {setInput, useScenario} from './scenario';
import {Sliders} from './Slider';
import styles from './styles.module.css';
import {useWidth} from './useWidth';

const HEIGHT = 300;
const SAMPLES = 60;

/** Round tick values between two bounds: 1-2-5 per decade, or even steps. */
function niceTicks(low: number, high: number, log: boolean): number[] {
  const ticks: number[] = [];
  if (log) {
    for (
      let e = Math.floor(Math.log10(low));
      e <= Math.ceil(Math.log10(high));
      e++
    ) {
      for (const k of [1, 2, 5]) {
        const value = k * 10 ** e;
        if (value >= low * 0.999 && value <= high * 1.001) {
          ticks.push(value);
        }
      }
    }
    return ticks;
  }
  const rough = (high - low) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((k) => k * magnitude).find((s) => s >= rough)!;
  for (
    let value = Math.ceil(low / step) * step;
    value <= high * 1.0001;
    value += step
  ) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}

/** Drops ticks until the labels of the ones left have room between them. */
function spaced(
  ticks: number[],
  position: (value: number) => number,
  text: (value: number) => string,
): number[] {
  // About 6.5 px per character at the tick font size, plus breathing room.
  const half = (value: number) => (text(value).length * 6.5) / 2;
  const kept: number[] = [];
  for (const tick of ticks) {
    const last = kept[kept.length - 1];
    if (
      last === undefined ||
      position(tick) - position(last) >= half(tick) + half(last) + 14
    ) {
      kept.push(tick);
    }
  }
  return kept;
}

type Props = {
  /** The input swept along the horizontal axis. */
  input: string;
  /** Sweep only this part of the input's range. */
  range?: readonly [number, number];
  /** The output plotted on the vertical axis. */
  value: (outputs: Outputs) => number;
  /** How a vertical value is printed (ticks, labels, tooltip, table). */
  yText: (value: number) => string;
  /** A logarithmic vertical axis, with ticks at these values. */
  logTicks?: readonly number[];
  /** A horizontal line the reader should compare against. */
  reference?: {value: number; label: string};
  /** Space for the vertical tick labels, in pixels. */
  gutter?: number;
  xTitle: string;
  title: string;
  caption: (ends: {first: Sample; last: Sample}) => ReactNode;
  tableHead: readonly [string, string];
  /** Inputs offered above the chart. */
  sliders?: readonly string[];
};

type Sample = {x: number; y: number; xText: string; yText: string};

/**
 * A line chart of one output against one input, everything else in the
 * scenario held as it is. The scenario's own value is marked; clicking the
 * chart moves the input there.
 */
export default function SweepFigure({
  input,
  range,
  value,
  yText,
  logTicks,
  reference,
  gutter = 44,
  xTitle,
  title,
  caption,
  tableHead,
  sliders,
}: Props): ReactNode {
  const {inputs, outputs} = useScenario();
  const frameRef = useRef<HTMLDivElement>(null);
  const width = useWidth(frameRef, 680);
  const [pointed, setPointed] = useState<number>();

  const control = controlOf(input);
  const xText = (x: number) => tr(control.fmt(x));
  const low = range?.[0] ?? (control.log ? 10 ** control.min : control.min);
  const high = range?.[1] ?? (control.log ? 10 ** control.max : control.max);
  const along = (x: number) =>
    control.log
      ? (Math.log10(x) - Math.log10(low)) / (Math.log10(high) - Math.log10(low))
      : (x - low) / (high - low);
  const at = (inputsAt: Inputs, x: number): Sample => {
    const y = value(compute({...inputsAt, [input]: x}));
    return {x, y, xText: xText(x), yText: yText(y)};
  };

  const points = useMemo(
    () =>
      Array.from({length: SAMPLES + 1}, (_, index) => {
        const t = index / SAMPLES;
        const x = control.log
          ? 10 ** (Math.log10(low) + (Math.log10(high) - Math.log10(low)) * t)
          : low + (high - low) * t;
        return at(inputs, x);
      }).filter((p) => Number.isFinite(p.y) && (!logTicks || p.y > 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs, input, low, high],
  );

  const margin = {top: 20, right: 20, bottom: 46, left: gutter};
  const plotWidth = Math.max(120, width - margin.left - margin.right);
  const plotHeight = HEIGHT - margin.top - margin.bottom;
  const px = (x: number) => margin.left + along(x) * plotWidth;

  // Vertical scale: from zero, or logarithmic across the given ticks.
  const ys = points.map((p) => p.y);
  let py: (y: number) => number;
  let yTicks: number[];
  if (logTicks) {
    const bottom = Math.min(
      ...ys,
      ...logTicks.filter((t) => t <= Math.min(...ys)).slice(-1),
    );
    const top = Math.max(
      ...ys,
      ...logTicks.filter((t) => t >= Math.max(...ys)).slice(0, 1),
    );
    py = (y) =>
      margin.top +
      (1 -
        (Math.log10(y) - Math.log10(bottom)) /
          (Math.log10(top) - Math.log10(bottom))) *
        plotHeight;
    yTicks = logTicks.filter((t) => t >= bottom && t <= top);
  } else {
    const peak = Math.max(...ys, reference ? reference.value * 2 : 0);
    const ticks = niceTicks(0, peak, false);
    const top =
      ticks[ticks.length - 1] >= peak ? ticks[ticks.length - 1] : peak;
    py = (y) => margin.top + (1 - y / top) * plotHeight;
    yTicks = ticks;
  }

  const xTicks = spaced(niceTicks(low, high, Boolean(control.log)), px, xText);
  const path = points
    .map(
      (p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`,
    )
    .join('');

  // The scenario as it stands, if it falls inside what is drawn.
  const now = at(inputs, inputs[input]);
  const nowShown =
    points.length > 1 &&
    Number.isFinite(now.y) &&
    now.x >= low &&
    now.x <= high &&
    (!logTicks || now.y > 0) &&
    value(outputs) === now.y;
  // The label avoids the curve: above the point on the side where the curve
  // is lower (left of a rising curve, right of a falling one), or, without
  // room there, below the point on the other side.
  const rising =
    points.length > 1 && points[points.length - 1].y >= points[0].y;
  const room = 170;
  const roomOnLowSide = rising
    ? px(now.x) - margin.left > room
    : margin.left + plotWidth - px(now.x) > room;
  const labelLeft = rising === roomOnLowSide;
  const above = nowShown ? py(now.y) - 12 : 0;
  const below = nowShown ? py(now.y) + 22 : 0;
  const hitsReference =
    reference !== undefined && Math.abs(above - py(reference.value)) < 16;
  const labelY =
    roomOnLowSide && !hitsReference ? Math.max(margin.top + 4, above) : below;
  // Keep the label inside the plot: if it would run past an edge, pin it
  // to that edge instead of to the point.
  const labelText = `${now.yText} pada ${now.xText}`;
  const labelWidth = labelText.length * 6.8;
  const right = margin.left + plotWidth;
  const label = labelLeft
    ? px(now.x) - 6 - labelWidth < margin.left
      ? {x: margin.left + 4, anchor: 'start' as const}
      : {x: px(now.x) - 6, anchor: 'end' as const}
    : px(now.x) + 6 + labelWidth > right
      ? {x: right, anchor: 'end' as const}
      : {x: px(now.x) + 6, anchor: 'start' as const};
  const target = pointed === undefined ? undefined : points[pointed];

  const nearest = (clientX: number): number | undefined => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || !points.length) {
      return undefined;
    }
    const offset = clientX - box.left;
    let best = 0;
    points.forEach((p, index) => {
      if (Math.abs(px(p.x) - offset) < Math.abs(px(points[best].x) - offset)) {
        best = index;
      }
    });
    return best;
  };

  return (
    <Figure
      title={title}
      caption={
        points.length > 1 ? (
          <>
            {caption({first: points[0], last: points[points.length - 1]})}
            {(now.x < low || now.x > high) && (
              <>
                {' '}
                Skenario yang sedang dipilih memakai {now.xText}, di luar
                rentang grafik ini.
              </>
            )}
          </>
        ) : undefined
      }
      source="model Orbital AI Datacenter Calculator, untuk skenario yang sedang dipilih"
      footer={
        <TableView
          head={tableHead}
          rows={niceTicks(low, high, Boolean(control.log)).map((x) => {
            const sample = at(inputs, x);
            return [sample.xText, sample.yText];
          })}
        />
      }>
      {sliders && <Sliders ids={sliders} />}
      <div ref={frameRef} className={styles.plotFrame}>
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${title}. ${nowShown ? `Saat ini ${now.yText} pada ${now.xText}.` : ''}`}
          tabIndex={0}
          className={styles.plot}
          onPointerMove={(event) => setPointed(nearest(event.clientX))}
          onPointerLeave={() => setPointed(undefined)}
          onBlur={() => setPointed(undefined)}
          onClick={(event) => {
            const index = nearest(event.clientX);
            if (index !== undefined) {
              setInput(input, points[index].x);
            }
          }}
          onKeyDown={(event) => {
            const move = {ArrowLeft: -1, ArrowRight: 1}[event.key];
            if (move) {
              event.preventDefault();
              setPointed((index) =>
                Math.min(
                  points.length - 1,
                  Math.max(0, (index ?? Math.round(points.length / 2)) + move),
                ),
              );
            } else if (event.key === 'Enter' && target) {
              setInput(input, target.x);
            }
          }}>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={py(tick)}
                y2={py(tick)}
                className={styles.grid}
              />
              <text
                x={margin.left - 8}
                y={py(tick)}
                dy="0.32em"
                textAnchor="end"
                className={styles.tick}>
                {yText(tick)}
              </text>
            </g>
          ))}
          {reference && (
            <>
              <line
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={py(reference.value)}
                y2={py(reference.value)}
                className={styles.parity}
              />
              <text
                x={margin.left + plotWidth}
                y={py(reference.value) - 6}
                textAnchor="end"
                className={`${styles.tick} ${styles.haloed}`}>
                {reference.label}
              </text>
            </>
          )}
          {xTicks.map((tick) => (
            <text
              key={tick}
              x={px(tick)}
              y={HEIGHT - margin.bottom + 18}
              textAnchor={along(tick) > 0.97 ? 'end' : 'middle'}
              className={styles.tick}>
              {xText(tick)}
            </text>
          ))}
          <text
            x={margin.left + plotWidth / 2}
            y={HEIGHT - 6}
            textAnchor="middle"
            className={styles.axisTitle}>
            {xTitle}
            {control.log ? ' (skala logaritmik)' : ''}
          </text>

          <path d={path} className={styles.line} />

          {nowShown && (
            <>
              <circle
                cx={px(now.x)}
                cy={py(now.y)}
                r={5}
                className={styles.dot}
              />
              <text
                x={label.x}
                y={labelY}
                textAnchor={label.anchor}
                className={styles.pointLabel}>
                {labelText}
              </text>
            </>
          )}

          {target && (
            <g>
              <line
                x1={px(target.x)}
                x2={px(target.x)}
                y1={margin.top}
                y2={margin.top + plotHeight}
                className={styles.crosshair}
              />
              <circle
                cx={px(target.x)}
                cy={py(target.y)}
                r={4}
                className={styles.dot}
              />
            </g>
          )}
        </svg>

        {target && (
          <div
            className={styles.tooltip}
            style={{left: px(target.x), top: py(target.y)}}
            role="status">
            <p>
              <i className={`${styles.key} ${styles.orbit}`} />
              <strong>{target.yText}</strong>
            </p>
            <p>pada {target.xText}</p>
          </div>
        )}
      </div>
    </Figure>
  );
}
