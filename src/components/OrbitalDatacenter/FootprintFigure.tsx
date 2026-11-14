import React, {type ReactNode, useRef} from 'react';
import clsx from 'clsx';
import Figure from '@site/src/components/Figure';
import {area} from './format';
import {FOOTBALL_PITCH, ISS_ARRAY} from './model';
import {useScenario} from './scenario';
import styles from './styles.module.css';
import {useWidth} from './useWidth';

const MAX_HEIGHT = 280;
const GAP = 24;

/**
 * The station's solar array and radiator drawn to scale beside two things of
 * known size. The station's parts are filled; the references are outlines.
 */
export default function FootprintFigure(): ReactNode {
  const {outputs: m} = useScenario();
  const rowRef = useRef<HTMLDivElement>(null);
  const width = useWidth(rowRef, 1080);

  // Width and height in metres. A football pitch is 105 m by 68 m; the
  // others are drawn as squares of their true area.
  const shapes = [
    {key: 'array', name: 'Panel surya', size: m.arrayArea, own: true},
    {key: 'radiator', name: 'Radiator', size: m.radArea, own: true},
    {
      key: 'pitch',
      name: 'Lapangan sepak bola',
      size: FOOTBALL_PITCH,
      own: false,
    },
    {key: 'iss', name: 'Panel surya ISS', size: ISS_ARRAY, own: false},
  ].map((shape) => {
    const w = shape.key === 'pitch' ? 105 : Math.sqrt(shape.size);
    return {...shape, w, h: shape.size / w};
  });

  // Four across, or two across on a narrow screen. One scale for all four:
  // the widest must fit its cell and the tallest the height allowed.
  const columns = width >= 560 ? 4 : 2;
  const cell = (width - GAP * (columns - 1)) / columns;
  const scale = Math.min(
    cell / Math.max(...shapes.map((shape) => shape.w)),
    MAX_HEIGHT / Math.max(...shapes.map((shape) => shape.h)),
  );
  const tallest = Math.max(...shapes.map((shape) => shape.h)) * scale;

  return (
    <Figure
      width="wide"
      title="Luas panel surya dan radiator satu stasiun, sesuai skala"
      caption="Keempat bentuk digambar dengan skala yang sama. Panel surya dan radiator digambar sebagai bujur sangkar seluas aslinya."
      source="model Orbital AI Datacenter Calculator, untuk skenario yang sedang dipilih">
      <div
        ref={rowRef}
        className={styles.footprint}
        style={{gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`}}>
        {shapes.map((shape) => (
          <div key={shape.key}>
            <div className={styles.shapeArea} style={{height: tallest}}>
              <div
                className={clsx(
                  shape.own ? styles.ownShape : styles.referenceShape,
                )}
                style={{
                  width: Math.max(2, shape.w * scale),
                  height: Math.max(2, shape.h * scale),
                }}
              />
            </div>
            <p className={styles.shapeName}>{shape.name}</p>
            <p className={styles.shapeSize}>{area(shape.size)}</p>
          </div>
        ))}
      </div>
    </Figure>
  );
}
