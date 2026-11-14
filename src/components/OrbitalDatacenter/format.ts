/** Number formatting for the article, in Indonesian conventions. */
import {tr} from './id';
import {english} from './model';

// Quantities whose unit changes with their size (kg, t, kt...) are printed
// by the calculator's own formatters and then translated.
export const mass = (kilograms: number): string => tr(english.mass(kilograms));
export const area = (squareMetres: number): string =>
  tr(english.area(squareMetres));
export const duration = (seconds: number): string => tr(english.time(seconds));

/** A span within one orbit: in minutes while that reads well, else as above. */
export const orbitTime = (seconds: number): string =>
  seconds < 3 * 3600 ? `${num(seconds / 60)} menit` : duration(seconds);
export const watts = (value: number): string => tr(english.si(value, 'W'));
export const wattHours = (value: number): string => tr(english.si(value, 'Wh'));
export const newtons = (value: number): string => tr(english.si(value, 'N'));

const formatter = (maximum: number, minimum = 0) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: maximum,
    minimumFractionDigits: minimum,
  });

export function num(value: number, digits = 0): string {
  return Number.isFinite(value) ? formatter(digits).format(value) : '∞';
}

/** A dollar amount with fixed decimals: $10,34. */
export function usd(value: number, digits = 2): string {
  return Number.isFinite(value)
    ? `$${formatter(digits, digits).format(value)}`
    : '$∞';
}

/** A large dollar amount in words: $18,5 juta. */
export function money(value: number): string {
  if (!Number.isFinite(value)) {
    return '$∞';
  }
  const size = Math.abs(value);
  if (size >= 1e12) return `$${num(value / 1e12, 2)} triliun`;
  if (size >= 1e9) return `$${num(value / 1e9, 2)} miliar`;
  if (size >= 1e6) return `$${num(value / 1e6, 1)} juta`;
  if (size >= 1e3) return `$${num(value / 1e3, 0)} ribu`;
  return `$${num(value, 0)}`;
}

/** A ratio with as many decimals as its size deserves: 0,38 / 2,7 / 15. */
export function ratio(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return num(value, value < 1 ? 2 : value < 10 ? 1 : 0);
}

export function percent(share: number): string {
  return `${num(share * 100, share < 0.1 ? 1 : 0)}%`;
}

/** Electrical power given in megawatts: 100 kW / 1 MW / 1 GW. */
export function power(megawatts: number): string {
  if (megawatts >= 1000) return `${num(megawatts / 1000, 1)} GW`;
  if (megawatts >= 1) return `${num(megawatts, 1)} MW`;
  return `${num(megawatts * 1000, 0)} kW`;
}
