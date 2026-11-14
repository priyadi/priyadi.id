import React, {type ReactNode} from 'react';
import {
  area,
  duration,
  mass,
  money,
  newtons,
  num,
  orbitTime,
  percent,
  power,
  ratio,
  usd,
  wattHours,
  watts,
} from './format';
import {carbonLines, costLines, largest, massLines} from './lines';
import {FOOTBALL_PITCH} from './model';
import {scenarioQuery, useScenario} from './scenario';

const STANDALONE = 'https://priyadi.github.io/orbital-ai-datacenter/';

function useOpening(): string {
  const {preset, edited} = useScenario();
  return preset === 0 && !edited ? 'Dengan asumsi dasar' : 'Dalam skenario ini';
}

/** The finding, stated up front, for whatever scenario is selected. */
export function Lede(): ReactNode {
  const {outputs: m} = useScenario();
  const opening = useOpening();
  const orbit = <strong>{usd(m.lcocOrbit)}</strong>;
  const ground = <strong>{usd(m.lcocGround)}</strong>;
  const times = <strong>{ratio(m.commRatio)} kali</strong>;

  const cost = {
    'not viable': (
      <>
        {opening}, setiap kWh komputasi di orbit berbiaya {orbit}, {times} biaya
        di pusat data darat ({ground}).
      </>
    ),
    marginal: (
      <>
        {opening}, setiap kWh komputasi di orbit berbiaya {orbit}, kurang lebih
        sama dengan di pusat data darat ({ground}).
      </>
    ),
    viable: (
      <>
        {opening}, setiap kWh komputasi di orbit berbiaya {orbit}, lebih murah
        daripada di pusat data darat ({ground}): hanya {times} biayanya.
      </>
    ),
  }[m.commVerdict];

  const orbitCarbon = <strong>{num(m.co2OrbitInt)} g</strong>;
  const groundCarbon = <strong>{num(m.co2GroundInt)} g</strong>;
  const carbon = {
    neutralised: (
      <>
        Emisi keduanya nol di atas kertas, karena seluruhnya ditutup dengan
        kredit karbon.
      </>
    ),
    greener: (
      <>
        Jejak karbonnya lebih kecil: {orbitCarbon} CO₂e per kWh, dibanding{' '}
        {groundCarbon} di darat.
      </>
    ),
    comparable: (
      <>
        Jejak karbonnya kurang lebih sama: {orbitCarbon} CO₂e per kWh di orbit,{' '}
        {groundCarbon} di darat.
      </>
    ),
    worse: (
      <>
        Jejak karbonnya lebih besar: {orbitCarbon} CO₂e per kWh, dibanding{' '}
        {groundCarbon} di darat.
      </>
    ),
  }[m.envVerdict];

  return (
    <p>
      {cost} {carbon}
    </p>
  );
}

/** How much sun an orbit gets, and what the array and battery must do. */
export function PowerSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const pitches = m.arrayArea / FOOTBALL_PITCH;
  const array = (
    <>
      <strong>{watts(m.Parray)}</strong>, dari panel seluas{' '}
      <strong>{area(m.arrayArea)}</strong>
      {pitches >= 0.5 && (
        <> ({num(pitches, pitches < 10 ? 1 : 0)} lapangan sepak bola)</>
      )}
    </>
  );

  if (m.fe === 0) {
    return (
      <p>
        Pada ketinggian {num(inputs.h)} km, satu putaran orbit memakan{' '}
        {orbitTime(m.T)}. Di orbit ini stasiun tidak pernah masuk bayangan Bumi,
        jadi tidak perlu baterai. Untuk komputer berdaya {power(inputs.P)},
        panel surya cukup menghasilkan {array}.
      </p>
    );
  }
  return (
    <p>
      Pada ketinggian {num(inputs.h)} km, satu putaran orbit memakan{' '}
      {orbitTime(m.T)}. Selama <strong>{orbitTime(m.fe * m.T)}</strong> di
      antaranya stasiun berada di bayangan Bumi dan hidup dari baterai. Supaya
      komputer berdaya {power(inputs.P)} tetap menyala dan baterai terisi lagi,
      panel surya harus menghasilkan {array}. Baterainya berkapasitas{' '}
      {wattHours(m.battWh)}.
    </p>
  );
}

/** Where the heat goes: the radiator's temperature and size. */
export function HeatSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();

  return (
    <p>
      Semua listrik yang digunakan oleh perangkat komputasi akan berakhir sebagai panas: <strong>{watts(m.Q)}</strong>.
      Dengan perangkat bekerja pada {num(inputs.tchip)} °C, permukaan radiator bersuhu{' '}
      {num(m.trad - 273.15)} °C dan harus seluas{' '}
      <strong>{area(m.radArea)}</strong>, {percent(m.radArea / m.arrayArea)}{' '}
      dari luas panel surya.
    </p>
  );
}

/** What a station weighs and how many launches that takes. */
export function MassSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const heaviest = largest(massLines(inputs, m), 'orbit');

  return (
    <p>
      Satu stasiun {power(inputs.P)} berbobot{' '}
      <strong>{mass(m.totalMass)}</strong> saat diluncurkan, atau{' '}
      {mass(m.totalMass / inputs.P)} per MW. Bagian terberatnya adalah{' '}
      {heaviest.prose} ({percent((heaviest.orbit ?? 0) / m.totalMass)}).{' '}
      {m.perLaunch >= 1 ? (
        <>
          Satu roket bermuatan {num(inputs.payload)} t mengangkut{' '}
          {num(m.perLaunch)} stasiun sekaligus.
        </>
      ) : (
        <>
          Satu stasiun membutuhkan {num(m.launches)} peluncuran roket bermuatan{' '}
          {num(inputs.payload)} t.
        </>
      )}{' '}
      Seluruh armada {num(m.N)} stasiun berbobot {mass(m.fleetMass)} dan
      membutuhkan <strong>{num(m.fleetLaunches)} peluncuran</strong>.
    </p>
  );
}

/**
 * Drag: the thrust it takes to stay up, and what happens without it. High
 * enough there is next to nothing to say, and the sentences say so in words
 * where the figures would all round to zero.
 */
export function DragSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const altitude = `${num(inputs.h)} km`;
  // Less than this a year prints as "0 kg".
  const negligible = m.propYr < 0.5;
  const decays = Number.isFinite(m.lifetime);

  if (negligible && !decays) {
    return (
      <p>
        Pada ketinggian {altitude} praktis tidak ada atmosfer lagi. Hambatannya
        terlalu kecil untuk diperhitungkan: stasiun tidak butuh dorongan untuk
        melawannya, dan tanpa pendorong pun ia <strong>tidak akan turun</strong>{' '}
        dengan sendirinya.
      </p>
    );
  }

  if (negligible) {
    return (
      <p>
        Pada ketinggian {altitude} atmosfer sudah sangat tipis. Hambatan pada
        satu stasiun hanya {newtons(m.F)}, dan melawannya butuh{' '}
        <strong>kurang dari 1 kg</strong> propelan per tahun. Kalau pendorongnya
        mati, stasiun baru turun ke 150 km setelah{' '}
        <strong>{duration(m.lifetime)}</strong>.
      </p>
    );
  }

  return (
    <p>
      Pada ketinggian {altitude}, hambatan atmosfer pada satu stasiun sebesar{' '}
      {newtons(m.F)}. Untuk melawannya, pendorong listrik memakai{' '}
      {watts(m.thrustPower)} (
      {m.boostFrac < 0.0005 ? 'kurang dari 0,1%' : percent(m.boostFrac)} dari
      daya komputer) dan <strong>{mass(m.propYr)}</strong> propelan per tahun.{' '}
      {decays ? (
        <>
          Kalau pendorongnya mati, stasiun turun ke 150 km dalam{' '}
          <strong>{duration(m.lifetime)}</strong>.
        </>
      ) : (
        <>
          Kalau pendorongnya mati pun, stasiun{' '}
          <strong>praktis tidak akan pernah</strong> turun ke 150 km.
        </>
      )}
    </p>
  );
}

/** What the yearly bill is, and which line of it is largest on each side. */
export function CostSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const lines = costLines(inputs, m);
  const orbit = largest(lines, 'orbit');
  const ground = largest(lines, 'ground');
  const orbitShare = percent((orbit.orbit ?? 0) / m.annOrbit);
  const groundShare = percent((ground.ground ?? 0) / m.annGround);

  return (
    <p>
      Satu stasiun {power(inputs.P)} di orbit menghabiskan{' '}
      <strong>{money(m.annOrbit)}</strong> per tahun. Pusat data di darat dengan
      beban yang sama menghabiskan <strong>{money(m.annGround)}</strong>.{' '}
      {orbit.key === ground.key ? (
        <>
          Pos terbesar di keduanya adalah {orbit.prose}: {orbitShare} di orbit
          dan {groundShare} di darat.
        </>
      ) : (
        <>
          Pos terbesar di orbit adalah {orbit.prose} ({orbitShare}), sedangkan
          di darat {ground.prose} ({groundShare}).
        </>
      )}
    </p>
  );
}

/** Why waiting costs what it does: how long each side takes to get power. */
export function WaitingSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();

  return (
    <p>
      Armada {num(m.N)} stasiun membutuhkan{' '}
      <strong>{num(m.fleetLaunches)} peluncuran</strong>. Dengan{' '}
      {num(inputs.cadence)} peluncuran per tahun, ditambah {num(inputs.olic, 2)}{' '}
      tahun mengurus izin, stasiun pertama bekerja begitu diluncurkan dan
      seluruh daya tersedia setelah <strong>{num(m.tOrbit, 1)} tahun</strong>.
      Di darat, antrean izin dan sambungan listrik memakan{' '}
      <strong>{num(m.tGround, 1)} tahun</strong>.
    </p>
  );
}

/** The ground electricity price at which the two would cost the same. */
export function BreakEven(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const price = m.breakevenElec;

  if (!(price > 0)) {
    return (
      <p>
        Dalam skenario ini orbit lebih murah bahkan bila listrik di darat
        gratis.
      </p>
    );
  }
  if (price <= inputs.elec) {
    return (
      <p>
        Orbit tetap lebih murah selama listrik di darat berharga di atas{' '}
        <strong>{usd(price, 3)}</strong> per kWh; yang diasumsikan{' '}
        {usd(inputs.elec, 3)}.
      </p>
    );
  }
  return (
    <p>
      Agar keduanya impas, listrik di darat harus berharga{' '}
      <strong>{usd(price)}</strong> per kWh, {ratio(price / inputs.elec)} kali
      harga yang diasumsikan ({usd(inputs.elec, 3)}).
    </p>
  );
}

/** Lifetime emissions per kWh, and the largest source on each side. */
export function CarbonSummary(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const lines = carbonLines(inputs, m);
  const orbit = largest(lines, 'orbit');
  const ground = largest(lines, 'ground');

  return (
    <p>
      Sepanjang umurnya, setiap kWh komputasi di orbit melepas{' '}
      <strong>{num(m.co2OrbitInt)} g</strong> CO₂e; di darat{' '}
      <strong>{num(m.co2GroundInt)} g</strong>. Sumber terbesar di orbit adalah{' '}
      {orbit.prose} ({percent((orbit.orbit ?? 0) / m.co2OrbitLife)}), sedangkan
      di darat {ground.prose} ({percent((ground.ground ?? 0) / m.co2GroundLife)}
      ).
    </p>
  );
}

/** The grid carbon intensity at which orbit and ground emit the same. */
export function CarbonBreakEven(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const grid = m.ciBreakeven;

  if (!(grid > 0)) {
    return (
      <p>
        Dalam skenario ini orbit lebih bersih bahkan dibanding pusat data yang
        listriknya tanpa emisi.
      </p>
    );
  }
  return (
    <p>
      Keduanya setara bila listrik di darat mengeluarkan{' '}
      <strong>{num(grid)} g</strong> CO₂ per kWh.{' '}
      {grid < inputs.ci ? (
        <>
          Yang diasumsikan {num(inputs.ci)} g, jadi orbit unggul; di jaringan
          yang lebih bersih dari {num(grid)} g, orbit kalah.
        </>
      ) : (
        <>
          Yang diasumsikan hanya {num(inputs.ci)} g, jadi darat unggul; orbit
          baru menang di jaringan yang lebih kotor dari {num(grid)} g.
        </>
      )}
    </p>
  );
}

/** Water per kWh on each side. */
export function WaterSummary(): ReactNode {
  const {outputs: m} = useScenario();

  return (
    <p>
      Untuk air, selisihnya lebih besar:{' '}
      <strong>{num(m.wOrbitInt, 2)} L</strong> per kWh di orbit,{' '}
      <strong>{num(m.wGroundInt, 2)} L</strong> di darat. Di orbit tidak ada
      menara pendingin dan tidak ada pembangkit listrik; yang tersisa hanyalah
      air untuk membuat perangkat kerasnya.
    </p>
  );
}

/** A link that opens the current scenario in the standalone calculator. */
export function CalculatorLink({children}: {children: ReactNode}): ReactNode {
  useScenario();
  const query = scenarioQuery();
  query.set('lang', 'id');

  return <a href={`${STANDALONE}?${query}`}>{children}</a>;
}
