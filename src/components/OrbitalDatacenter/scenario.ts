/**
 * The scenario the reader is looking at: a preset plus any inputs they moved.
 *
 * It is shared by every component of the article without a wrapping
 * provider, because the pieces sit in different places of an MDX document.
 * The address bar mirrors it, in the same format the calculator uses, so a
 * link opens the same scenario in either place.
 */
import {useEffect, useMemo, useSyncExternalStore} from 'react';
import {
  DEFAULT_INCLINATION,
  type Inputs,
  type Outputs,
  clampInput,
  compute,
  controls,
  defaults,
  inputsOfPreset,
  presets,
  sameValue,
} from './model';

type Scenario = {
  preset: number;
  inputs: Inputs;
  /** Orbital inclination in degrees: it shapes the orbit view, not the model. */
  inclination: number;
};

const inclinationOfPreset = (index: number): number =>
  presets[index]?.incl ?? DEFAULT_INCLINATION;
const clampInclination = (degrees: number): number =>
  Math.min(98, Math.max(0, Math.round(degrees)));

const baseline: Scenario = {
  preset: 0,
  inputs: defaults,
  inclination: DEFAULT_INCLINATION,
};

let current = baseline;
const listeners = new Set<() => void>();

function set(next: Scenario): void {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setInput(id: string, value: number): void {
  set({...current, inputs: {...current.inputs, [id]: clampInput(id, value)}});
}

export function setInclination(degrees: number): void {
  set({...current, inclination: clampInclination(degrees)});
}

export function choosePreset(index: number): void {
  set({
    preset: index,
    inputs: inputsOfPreset(index),
    inclination: inclinationOfPreset(index),
  });
}

/** The query string for the current scenario; only what differs from the defaults. */
export function scenarioQuery(scenario: Scenario = current): URLSearchParams {
  const query = new URLSearchParams();
  if (scenario.preset) {
    query.set('preset', String(scenario.preset));
  }
  for (const {id} of controls) {
    if (!sameValue(scenario.inputs[id], defaults[id])) {
      query.set(id, String(Number(scenario.inputs[id].toPrecision(10))));
    }
  }
  if (scenario.inclination !== DEFAULT_INCLINATION) {
    query.set('incl', String(scenario.inclination));
  }
  return query;
}

function readAddress(): Scenario {
  const query = new URLSearchParams(window.location.search);
  const index = Number.parseInt(query.get('preset') ?? '', 10);
  const preset = index >= 0 && index < presets.length ? index : 0;
  const inputs: Record<string, number> = {...inputsOfPreset(preset)};
  for (const {id} of controls) {
    const value = Number.parseFloat(query.get(id) ?? '');
    if (Number.isFinite(value)) {
      inputs[id] = clampInput(id, value);
    }
  }
  const inclination = Number.parseFloat(query.get('incl') ?? '');
  return {
    preset,
    inputs,
    inclination: Number.isFinite(inclination)
      ? clampInclination(inclination)
      : inclinationOfPreset(preset),
  };
}

function writeAddress(): void {
  // Keep parameters that are not ours (the calculator's own, or the site's).
  const query = new URLSearchParams(window.location.search);
  query.delete('preset');
  query.delete('incl');
  controls.forEach(({id}) => query.delete(id));
  scenarioQuery().forEach((value, key) => query.set(key, value));

  const search = query.toString();
  const address =
    window.location.pathname +
    (search ? `?${search}` : '') +
    window.location.hash;
  if (
    address !==
    window.location.pathname + window.location.search + window.location.hash
  ) {
    window.history.replaceState(window.history.state, '', address);
  }
}

/**
 * Ties the scenario to the address bar for as long as the calling component
 * is mounted. The address decides the scenario on arrival; after that the
 * scenario decides the address.
 */
export function useScenarioAddress(): void {
  useEffect(() => {
    set(readAddress());

    // Debounced: a slider drag fires far more often than browsers allow
    // the address to change.
    let timer: number | undefined;
    const unsubscribe = subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(writeAddress, 150);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}

export type ScenarioView = {
  preset: number;
  inputs: Inputs;
  outputs: Outputs;
  inclination: number;
  /** True once the reader has moved an input away from the chosen preset. */
  edited: boolean;
};

export function useScenario(): ScenarioView {
  // The server and the first client render show the baseline; the address
  // is applied after hydration.
  const scenario = useSyncExternalStore(
    subscribe,
    () => current,
    () => baseline,
  );

  return useMemo(() => {
    const presetInputs = inputsOfPreset(scenario.preset);
    return {
      preset: scenario.preset,
      inputs: scenario.inputs,
      outputs: compute(scenario.inputs),
      inclination: scenario.inclination,
      edited:
        scenario.inclination !== inclinationOfPreset(scenario.preset) ||
        controls.some(
          ({id}) => !sameValue(scenario.inputs[id], presetInputs[id]),
        ),
    };
  }, [scenario]);
}
