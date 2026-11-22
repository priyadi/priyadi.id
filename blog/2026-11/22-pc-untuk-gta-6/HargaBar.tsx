import React, {type ReactNode} from 'react';
import styles from './HargaBar.module.css';

export type Bar = {
  label: string;
  /** Rupiah. */
  value: number;
  /** A console, set apart from the PC builds. */
  console?: boolean;
  note?: string;
};

const rupiah = (n: number) =>
  `Rp${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;

/**
 * Prices as horizontal bars, consoles and PCs in their own colour. Drawn with
 * the page's colour tokens, so it follows the light and dark mode.
 */
export default function HargaBar({bars}: {bars: Bar[]}): ReactNode {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className={styles.chart}>
      <ul className={styles.legend} aria-hidden="true">
        <li className={styles.console}>Konsol</li>
        <li className={styles.pc}>PC rakitan</li>
      </ul>
      <table className={styles.bars}>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label} className={bar.console ? styles.console : styles.pc}>
              <th scope="row">
                {bar.label}
                {bar.note && <span>{bar.note}</span>}
              </th>
              <td>
                <span
                  className={styles.bar}
                  // Room is kept on the right for the value.
                  style={{width: `calc((100% - 6.5rem) * ${bar.value / max})`}}
                />
                <span className={styles.value}>{rupiah(bar.value)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
