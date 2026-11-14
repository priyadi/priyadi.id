import React, {type ReactNode, useId} from 'react';
import {plain, tr} from './id';
import {controlOf, fromSlider, toSlider} from './model';
import {setInput, useScenario} from './scenario';
import styles from './styles.module.css';

type RangeProps = {
  label: string;
  /** The current value as text. */
  text: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  note?: string;
};

/** A labelled range input showing its value. */
export function Range({
  label,
  text,
  note,
  onChange,
  ...input
}: RangeProps): ReactNode {
  const inputId = useId();

  return (
    <div className={styles.slider}>
      <div className={styles.sliderHead}>
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId}>{text}</output>
      </div>
      <input
        id={inputId}
        type="range"
        {...input}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {note && <p className={styles.sliderNote}>{note}</p>}
    </div>
  );
}

type Props = {
  /** The calculator's id for this input. */
  id: string;
  /** Leave out the explanatory note under the slider. */
  bare?: boolean;
};

/**
 * One input of the model, placed next to the chart it changes. Label, value
 * and note are the calculator's own, in its Indonesian translation.
 */
export default function Slider({id, bare}: Props): ReactNode {
  const {inputs} = useScenario();
  const control = controlOf(id);

  return (
    <Range
      label={tr(control.label)}
      text={tr(control.fmt(inputs[id]))}
      min={control.min}
      max={control.max}
      step={control.step}
      value={toSlider(control, inputs[id])}
      onChange={(position) => setInput(id, fromSlider(control, position))}
      note={!bare && control.note ? plain(tr(control.note)) : undefined}
    />
  );
}

/** A group of sliders, as they sit beside or above a chart. */
export function Sliders({ids}: {ids: readonly string[]}): ReactNode {
  return (
    <div className={styles.controls}>
      {ids.map((id) => (
        <Slider key={id} id={id} />
      ))}
    </div>
  );
}
