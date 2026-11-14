import React, {type ReactNode, useMemo, useState} from 'react';
import Figure from '@site/src/components/Figure';
import {num, orbitTime} from './format';
import Globe from './Globe';
import {tr} from './id';
import {
  DEFAULT_SECONDS_PER_ORBIT,
  EARTH_ROTATION,
  RE,
  orbitFrame,
} from './model';
import {setInclination, useScenario} from './scenario';
import Slider, {Range} from './Slider';
import styles from './styles.module.css';

/**
 * One trip around the Earth: the orbit animated over a turning globe, and
 * under it the same trip as a bar split into sunlight and shadow.
 */
export default function OrbitFigure(): ReactNode {
  const {inputs, outputs: m, inclination} = useScenario();
  const [secondsPerOrbit, setSecondsPerOrbit] = useState(
    DEFAULT_SECONDS_PER_ORBIT,
  );
  const frame = useMemo(
    () => orbitFrame(inputs, inclination),
    [inputs, inclination],
  );
  const radius = (RE + m.h * 1000) / RE;
  const parts = [
    {key: 'sunlit', name: 'Tersinari matahari', share: m.fd},
    {key: 'eclipse', name: 'Di bayangan Bumi', share: m.fe},
  ] as const;
  // How far the Earth turns under one orbit, as the ground track sees it: a
  // whole turn puts the track back where it was, so only the remainder shows,
  // westward when positive.
  const turned = (m.T * EARTH_ROTATION * 180) / Math.PI;
  const drift = turned - 360 * Math.round(turned / 360);

  return (
    <Figure
      width="wide"
      title="Satu putaran orbit"
      caption={
        <>
          Orbit melingkar pada ketinggian dan sudut β yang dipilih, dilihat dari
          arah yang tetap di antariksa selagi Bumi berputar di bawahnya. Stasiun
          melaju {num(m.v / 1000, 2)} km/detik, dan jejaknya di permukaan{' '}
          {Math.abs(drift) < 0.5
            ? 'praktis kembali ke tempat yang sama'
            : `bergeser ${num(Math.abs(drift), 1)}° ke ${drift > 0 ? 'barat' : 'timur'}`}{' '}
          pada tiap putaran. Panah kuning menunjuk ke arah Matahari. Seret bola
          Bumi untuk melihatnya dari sisi lain.
          {frame.clamped && (
            <>
              {' '}
              Pada inklinasi ini β = {num(inputs.beta)}° tidak tercapai; yang
              digambar adalah β = {num(frame.betaEff)}°.
            </>
          )}
        </>
      }
      source="model Orbital AI Datacenter Calculator, untuk skenario yang sedang dipilih">
      <div className={`${styles.besideLayout} ${styles.narrowControls}`}>
        <div className={styles.controls}>
          <Slider id="h" />
          <Slider id="beta" />
          <Range
            label={tr('Orbital inclination (i)')}
            text={`${num(inclination)}°`}
            min={0}
            max={98}
            step={1}
            value={inclination}
            onChange={setInclination}
            note="Starlink ≈ 53°; ISS 51,6°; sinkron-matahari ≈ 97°. Inklinasi hanya mengubah gambar ini, bukan hitungannya."
          />
          <Range
            label={tr('Animation: seconds per orbit')}
            text={`${num(secondsPerOrbit)} detik`}
            min={3}
            max={120}
            step={1}
            value={secondsPerOrbit}
            onChange={setSecondsPerOrbit}
          />
        </div>

        <div>
          <Globe
            frame={frame}
            radius={radius}
            period={m.T}
            secondsPerOrbit={secondsPerOrbit}
            description={`Animasi stasiun mengelilingi Bumi pada ketinggian ${num(inputs.h)} km. Satu putaran ${orbitTime(m.T)}: ${orbitTime(m.fd * m.T)} tersinari matahari, ${orbitTime(m.fe * m.T)} di bayangan Bumi.`}
          />
          <div
            className={styles.segments}
            role="img"
            aria-label={parts
              .map((part) => `${part.name}: ${orbitTime(part.share * m.T)}`)
              .join(', ')}>
            {parts.map(
              (part) =>
                part.share > 0 && (
                  <div
                    key={part.key}
                    className={styles[part.key]}
                    style={{flexGrow: part.share}}
                    title={`${part.name}: ${orbitTime(part.share * m.T)}`}>
                    {/* A label only where the block is wide enough for it. */}
                    {part.share > 0.2 && (
                      <span>{orbitTime(part.share * m.T)}</span>
                    )}
                  </div>
                ),
            )}
          </div>
          <div className={styles.segmentAxis}>
            <span>0</span>
            <span>{orbitTime(m.T)}, satu putaran</span>
          </div>
          <ul className={styles.legend}>
            {parts.map((part) => (
              <li key={part.key}>
                <i className={styles[part.key]} />
                {part.name}
              </li>
            ))}
            <li>
              <i className={styles.orbit} />
              Stasiun
            </li>
            <li>
              <i className={styles.track} />
              Jejak di permukaan
            </li>
          </ul>
        </div>
      </div>
    </Figure>
  );
}
