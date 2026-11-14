/**
 * Typed access to the calculator's model.
 *
 * model.generated.ts is copied verbatim from the Orbital AI Datacenter
 * Calculator (see scripts/sync-orbital-calculator.mjs), so the article and
 * the calculator cannot disagree about a number.
 */
import * as generated from './model.generated';

/** Every input of the model, keyed by the calculator's control id. */
export type Inputs = Readonly<Record<string, number>>;

/** An input as the calculator defines it. Sliders of `log` controls work in log10. */
export type Control = {
  id: string;
  /** Group, label and note, in English; translate them with tr(). */
  g: string;
  label: string;
  note?: string;
  /** The value as the calculator prints it, in English number format. */
  fmt: (value: number) => string;
  min: number;
  max: number;
  step: number;
  def: number;
  log?: boolean;
  snap?: (value: number) => number;
};

export type Preset = {
  n: string;
  d: string;
  v: Record<string, number>;
  /** Orbital inclination for the orbit view, where the preset sets one. */
  incl?: number;
};

/** The outputs the article uses; the model returns more. */
export type Outputs = {
  // Orbit and power
  P: number;
  N: number;
  h: number;
  v: number;
  T: number;
  fe: number;
  fd: number;
  Pbus: number;
  Parray: number;
  arrayArea: number;
  arrayMass: number;
  battWh: number;
  battMass: number;
  // Heat
  Q: number;
  trad: number;
  radArea: number;
  radMass: number;
  // Mass and launch
  compMass: number;
  structMass: number;
  dryMass: number;
  propLife: number;
  propYr: number;
  totalMass: number;
  launches: number;
  perLaunch: number;
  fleetMass: number;
  fleetLaunches: number;
  // Drag
  F: number;
  thrustPower: number;
  boostFrac: number;
  lifetime: number;
  // Cost
  itkWh: number;
  crf: number;
  capHw: number;
  capBus: number;
  capLaunch: number;
  annProp: number;
  annReplace: number;
  annOps: number;
  annOrbit: number;
  annGround: number;
  gHw: number;
  gFac: number;
  gElec: number;
  gOps: number;
  gReplace: number;
  gPolit: number;
  gDelay: number;
  carbonOrbit: number;
  carbonGround: number;
  offsetOrbit: number;
  offsetGround: number;
  oppOrbit: number;
  oppGround: number;
  lcocOrbit: number;
  lcocGround: number;
  commRatio: number;
  commVerdict: 'viable' | 'marginal' | 'not viable';
  breakevenElec: number;
  tOrbit: number;
  tGround: number;
  // Carbon and water
  co2HwEmb: number;
  co2BusEmb: number;
  co2Launch: number;
  co2PropYr: number;
  co2ReplYr: number;
  co2OrbitLife: number;
  co2OrbitInt: number;
  gco2HwEmb: number;
  gco2FacEmb: number;
  gco2ElecYr: number;
  gco2ReplYr: number;
  co2GroundLife: number;
  co2GroundInt: number;
  ciBreakeven: number;
  wOrbitInt: number;
  wGroundInt: number;
  envRatio: number;
  envVerdict: 'neutralised' | 'greener' | 'comparable' | 'worse';
};

// The generated module is plain JavaScript; these casts are where it gets
// its types.
export const controls = generated.CTLS as unknown as readonly Control[];
export const presets = generated.PRESETS as unknown as readonly Preset[];
const run = generated.model as unknown as (inputs: Inputs) => Outputs;

/** Earth's radius in metres. */
export const RE: number = generated.RE;
/** Seconds in a year, and the reference areas the calculator compares with. */
export const YEAR: number = generated.YEAR;
export const FOOTBALL_PITCH: number = generated.PITCH;
export const ISS_ARRAY: number = generated.ISS_ARRAY;

/** The calculator's formatters. They print English; see format.ts. */
export const english = {
  si: generated.fmtSI as (value: number, unit: string) => string,
  area: generated.fmtArea as (squareMetres: number) => string,
  mass: generated.fmtMass as (kilograms: number) => string,
  time: generated.fmtTime as (seconds: number) => string,
};

const controlById = new Map(controls.map((control) => [control.id, control]));

export function controlOf(id: string): Control {
  const control = controlById.get(id);
  if (!control) {
    throw new Error(`The calculator has no input "${id}".`);
  }
  return control;
}

/** A value as the calculator would store it (it rounds and snaps the same way). */
function settle(control: Control, value: number): number {
  const rounded = Number(value.toPrecision(12));
  return control.snap ? control.snap(rounded) : rounded;
}

export const defaults: Inputs = Object.fromEntries(
  controls.map((control) => [
    control.id,
    settle(control, control.log ? 10 ** control.def : control.def),
  ]),
);

export function inputsOfPreset(index: number): Inputs {
  const values = presets[index]?.v ?? {};
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(values)
        .filter(([id]) => controlById.has(id))
        .map(([id, value]) => [id, settle(controlOf(id), value)]),
    ),
  };
}

/** Keeps a value inside the range its slider allows. */
export function clampInput(id: string, value: number): number {
  const control = controlOf(id);
  const low = control.log ? 10 ** control.min : control.min;
  const high = control.log ? 10 ** control.max : control.max;
  return settle(control, Math.min(high, Math.max(low, value)));
}

export const toSlider = (control: Control, value: number): number =>
  control.log ? Math.log10(value) : value;

export const fromSlider = (control: Control, position: number): number =>
  settle(control, control.log ? 10 ** position : position);

export function sameValue(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

export function compute(inputs: Inputs): Outputs {
  return run(inputs);
}

// --- Orbit view --------------------------------------------------------------

export type Vector = [number, number, number];

/** Where the orbit and the Sun are, in an Earth-centred inertial frame. */
export type OrbitFrame = {
  /** Inclination and right ascension of the ascending node, in radians. */
  i: number;
  O: number;
  /** Unit vector toward the Sun. */
  sun: Vector;
  /** The orbit plane: unit vectors toward the ascending node and 90° on. */
  P: Vector;
  Q: Vector;
  /** True when no geometry reaches the model's β at this inclination. */
  clamped: boolean;
  /** The β angle the view actually shows, in degrees. */
  betaEff: number;
};

/** Earth's rotation rate, in radians per second. */
export const EARTH_ROTATION: number = generated.OMEGA_E;
export const DEFAULT_INCLINATION: number = generated.INCL_DEF;
export const DEFAULT_SECONDS_PER_ORBIT: number = generated.SPEED_DEF;

export const orbitFrame = generated.orbitFrame as unknown as (
  inputs: Inputs,
  inclination: number,
) => OrbitFrame;
/** Position on the orbit at angle `theta`, at `radius` Earth radii. */
export const satPos = generated.satPos as unknown as (
  frame: OrbitFrame,
  theta: number,
  radius: number,
) => Vector;
/** Whether a point (in Earth radii) is in the Earth's shadow. */
export const inShadow = generated.inShadow as unknown as (
  point: Vector,
  sun: Vector,
) => boolean;
