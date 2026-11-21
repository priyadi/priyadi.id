import React, {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {presets} from './model';
import {ratio} from './format';
import {tr} from './id';
import {choosePreset, useScenario, useScenarioAddress} from './scenario';
import styles from './styles.module.css';

/**
 * True once the element has scrolled above the viewport while the article
 * around it is still on screen. (Sticky positioning cannot do this here: the
 * bar is a grid item, and a grid item only sticks within its own row.)
 */
function usePinned(ref: React.RefObject<HTMLElement | null>): boolean {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const element = ref.current;
    const article = element?.closest('article');
    if (!element || !article) {
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      setPinned(
        element.getBoundingClientRect().top < 0 &&
          article.getBoundingClientRect().bottom > 160,
      );
    };
    const schedule = () => {
      frame ||= window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref]);

  return pinned;
}

/**
 * The scenario switch and the two verdicts. It stays at the top of the
 * window while the article is being read, so the effect of any change is
 * always in view.
 */
export default function ScenarioBar(): ReactNode {
  useScenarioAddress();
  const {preset, outputs, edited} = useScenario();
  const slotRef = useRef<HTMLDivElement>(null);
  const pinned = usePinned(slotRef);
  const [height, setHeight] = useState<number>();

  // The slot keeps the bar's place in the text while the bar is pinned.
  useEffect(() => {
    const bar = slotRef.current?.firstElementChild;
    if (bar) {
      setHeight(bar.getBoundingClientRect().height);
    }
  }, [pinned, edited]);

  // Every heading comes after the bar, so wherever a link leads, the bar is
  // pinned over the top of the window: links stop below it.
  useEffect(() => {
    const bar = slotRef.current?.firstElementChild;
    const root = document.documentElement;
    if (!bar) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      root.style.scrollPaddingTop = `${bar.getBoundingClientRect().height}px`;
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingTop = '';
    };
  }, []);

  return (
    <div
      ref={slotRef}
      className="bleed-full"
      style={pinned ? {height} : undefined}>
      <div className={clsx(styles.bar, pinned && styles.barPinned)}>
        <div className={styles.barInner}>
          <label className={styles.scenario}>
            <span>Skenario</span>
            <select
              aria-label="Skenario"
              value={preset}
              onChange={(event) => choosePreset(Number(event.target.value))}>
              {presets.map((item, index) => (
                <option key={item.n} value={index}>
                  {tr(item.n)}
                </option>
              ))}
            </select>
          </label>
          <dl className={styles.verdicts}>
            <div>
              <dt>Biaya</dt>
              <dd>{ratio(outputs.commRatio)}× darat</dd>
            </div>
            <div>
              <dt>Karbon</dt>
              <dd>
                {outputs.envVerdict === 'neutralised'
                  ? 'nol di atas kertas'
                  : `${ratio(outputs.envRatio)}× darat`}
              </dd>
            </div>
          </dl>
          {edited && (
            <button
              type="button"
              className={styles.reset}
              title="Kembalikan asumsi ke skenario yang dipilih"
              onClick={() => choosePreset(preset)}>
              Kembalikan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
