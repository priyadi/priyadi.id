import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Disclosure from '@site/src/components/Disclosure';
import {tr} from './id';
import {controls} from './model';
import Slider from './Slider';
import styles from './styles.module.css';

/**
 * Every input of the model, grouped as in the calculator. This is the
 * article's methodology section and its full control panel in one.
 */
export default function Assumptions(): ReactNode {
  const groups = [...new Set(controls.map((control) => control.g))];

  return (
    <div className={clsx('bleed-wide', styles.assumptions)}>
      {groups.map((group) => (
        <Disclosure
          key={group}
          summary={
            <>
              {tr(group)}
              <span>
                {controls.filter((control) => control.g === group).length}{' '}
                asumsi
              </span>
            </>
          }>
          <div className={styles.assumptionGrid}>
            {controls
              .filter((control) => control.g === group)
              .map((control) => (
                <Slider key={control.id} id={control.id} />
              ))}
          </div>
        </Disclosure>
      ))}
    </div>
  );
}
