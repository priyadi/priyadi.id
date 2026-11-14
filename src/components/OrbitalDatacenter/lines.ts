import type {BarRow} from './PairedBars';
import type {Inputs, Outputs} from './model';

/** A line item, with the name it takes in the middle of a sentence. */
export type Line = BarRow & {prose: string};

/**
 * The yearly bill of one station and of its ground equivalent, in dollars,
 * split into lines that can be compared side by side. Each side adds up to
 * the model's own total (annOrbit, annGround).
 *
 * Ground tax incentives are a discount on hardware, facility and electricity,
 * so they are taken off those three lines instead of shown as a negative one.
 */
export function costLines(inputs: Inputs, m: Outputs): Line[] {
  const afterIncentives = 1 - inputs.subsidy;

  return [
    {
      key: 'hardware',
      label: 'Perangkat keras komputasi',
      prose: 'perangkat keras komputasi',
      orbit: m.capHw * m.crf,
      ground: m.gHw * afterIncentives,
    },
    {
      key: 'spacecraft',
      label: 'Wahana: panel surya, radiator, baterai, struktur',
      prose: 'wahana antariksanya',
      orbit: m.capBus * m.crf,
      ground: 0,
    },
    {
      key: 'facility',
      label: 'Gedung, kelistrikan, dan pendingin',
      prose: 'gedung dan fasilitas',
      orbit: 0,
      ground: m.gFac * afterIncentives,
    },
    {
      key: 'launch',
      label: 'Peluncuran, termasuk kiriman propelan',
      prose: 'peluncuran',
      orbit: m.capLaunch * m.crf + m.annProp,
      ground: 0,
    },
    {
      key: 'electricity',
      label: 'Listrik',
      prose: 'listrik',
      orbit: 0,
      ground: m.gElec * afterIncentives,
    },
    {
      key: 'upkeep',
      label: 'Operasi dan penggantian perangkat',
      prose: 'operasi dan penggantian perangkat',
      orbit: m.annOps + m.annReplace,
      ground: m.gOps + m.gReplace,
    },
    {
      key: 'permitting',
      label: 'Perizinan dan ongkos politik',
      prose: 'perizinan dan ongkos politik',
      orbit: 0,
      ground: m.gPolit + m.gDelay,
    },
    {
      key: 'carbon',
      label: 'Harga karbon dan kredit karbon',
      prose: 'harga karbon',
      orbit: m.carbonOrbit + m.offsetOrbit,
      ground: m.carbonGround + m.offsetGround,
    },
    {
      key: 'waiting',
      label: 'Nilai yang hilang selama menunggu daya',
      prose: 'nilai yang hilang selama menunggu daya',
      orbit: m.oppOrbit,
      ground: m.oppGround,
    },
  ];
}

/**
 * Lifetime emissions of one station and of its ground equivalent, in kg of
 * CO₂e. Each side adds up to the model's total (co2OrbitLife, co2GroundLife).
 */
export function carbonLines(inputs: Inputs, m: Outputs): Line[] {
  return [
    {
      key: 'hardware',
      label: 'Pembuatan perangkat keras komputasi',
      prose: 'pembuatan perangkat keras komputasi',
      orbit: m.co2HwEmb,
      ground: m.gco2HwEmb,
    },
    {
      key: 'spacecraft',
      label: 'Pembuatan wahana antariksa',
      prose: 'pembuatan wahana antariksa',
      orbit: m.co2BusEmb,
      ground: 0,
    },
    {
      key: 'facility',
      label: 'Pembangunan gedung dan fasilitas',
      prose: 'pembangunan gedung',
      orbit: 0,
      ground: m.gco2FacEmb,
    },
    {
      key: 'launch',
      label: 'Peluncuran, termasuk kiriman propelan',
      prose: 'peluncuran',
      orbit: m.co2Launch + inputs.life * m.co2PropYr,
      ground: 0,
    },
    {
      key: 'electricity',
      label: 'Listrik dari jaringan',
      prose: 'listrik dari jaringan',
      orbit: 0,
      ground: inputs.life * m.gco2ElecYr,
    },
    {
      key: 'replacement',
      label: 'Penggantian perangkat yang rusak',
      prose: 'penggantian perangkat yang rusak',
      orbit: inputs.life * m.co2ReplYr,
      ground: inputs.life * m.gco2ReplYr,
    },
  ];
}

/** What one station weighs at launch, in kg, part by part. */
export function massLines(inputs: Inputs, m: Outputs): Line[] {
  return [
    {
      key: 'compute',
      label: 'Perangkat keras komputasi',
      prose: 'perangkat keras komputasi',
      orbit: m.compMass,
    },
    {
      key: 'array',
      label: 'Panel surya',
      prose: 'panel surya',
      orbit: m.arrayMass,
    },
    {
      key: 'battery',
      label: 'Baterai',
      prose: 'baterai',
      orbit: m.battMass,
    },
    {
      key: 'radiator',
      label: 'Radiator',
      prose: 'radiator',
      orbit: m.radMass,
    },
    {
      key: 'structure',
      label: 'Struktur, kabel, avionik, perisai',
      prose: 'struktur',
      orbit: m.structMass,
    },
    {
      key: 'propellant',
      label: `Propelan untuk ${inputs.life} tahun`,
      prose: 'propelan',
      orbit: m.propLife,
    },
  ];
}

export function largest(
  lines: readonly Line[],
  side: 'orbit' | 'ground',
): Line {
  return lines.reduce((top, line) =>
    (line[side] ?? 0) > (top[side] ?? 0) ? line : top,
  );
}
