import React, {type ReactNode} from 'react';
import Disclosure from '@site/src/components/Disclosure';
import Figure from '@site/src/components/Figure';
import {area, duration, mass, money, num, percent, ratio, usd} from './format';
import {carbonLines, costLines, massLines} from './lines';
import {YEAR} from './model';
import PairedBars, {type BarRow, type Side, TableView} from './PairedBars';
import {useScenario} from './scenario';
import {Sliders} from './Slider';
import SweepFigure from './SweepFigure';
import styles from './styles.module.css';

const SOURCE =
  'model Orbital AI Datacenter Calculator, untuk skenario yang sedang dipilih';
const SIDE_PROSE: Record<Side, string> = {orbit: 'orbit', ground: 'darat'};

/** Sliders to the left of a chart on wide screens, above it on narrow ones. */
function WithSliders({
  ids,
  children,
}: {
  ids: readonly string[];
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles.besideLayout}>
      <Sliders ids={ids} />
      {children}
    </div>
  );
}

/** What one station weighs at launch, part by part. */
export function MassFigure(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const total: BarRow = {
    key: 'total',
    label: 'Total diluncurkan',
    orbit: m.totalMass,
    strong: true,
  };
  const rows = [total, ...massLines(inputs, m)];

  return (
    <Figure
      width="wide"
      title="Massa satu stasiun saat diluncurkan"
      caption="Struktur dihitung sebagai tambahan persentase di atas massa subsistem lainnya. Propelan adalah persediaan pemeliharaan orbit untuk seluruh umur desain."
      source={SOURCE}
      footer={
        <TableView
          head={['Bagian', 'Massa', 'Bagian dari total']}
          rows={rows.map((row) => [
            row.label,
            mass(row.orbit ?? 0),
            percent((row.orbit ?? 0) / m.totalMass),
          ])}
        />
      }>
      <WithSliders ids={['kgkw', 'spw', 'struct', 'payload']}>
        <PairedBars
          rows={rows}
          sides={['orbit']}
          format={mass}
          negligible={0.5}
          detail={(row) => (
            <>
              <strong>{mass(row.orbit ?? 0)}</strong>
              {!row.strong && (
                <>, {percent((row.orbit ?? 0) / m.totalMass)} dari total</>
              )}
            </>
          )}
        />
      </WithSliders>
    </Figure>
  );
}

/** Cost per kWh of compute, orbit against ground, line by line. */
export function CostFigure(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  const perKWh = (dollars = 0) => dollars / m.itkWh;
  const lines = costLines(inputs, m);
  const total: BarRow = {
    key: 'total',
    label: 'Total',
    orbit: m.annOrbit,
    ground: m.annGround,
    strong: true,
  };
  const toRate = (row: BarRow): BarRow => ({
    ...row,
    orbit: perKWh(row.orbit),
    ground: perKWh(row.ground),
  });
  const shown = lines.filter(
    (line) => perKWh(line.orbit) > 0.0005 || perKWh(line.ground) > 0.0005,
  );
  const yearly = new Map([total, ...lines].map((row) => [row.key, row]));

  return (
    <Figure
      width="wide"
      title="Biaya setiap kWh komputasi, orbit dan darat"
      caption="Biaya setahun dibagi energi yang dipakai komputer dalam setahun, dalam dolar AS. Angka darat sudah dipotong insentif pajak."
      source={SOURCE}
      footer={
        <>
          <TableView
            head={['Pos biaya, $ per kWh', 'Orbit', 'Darat']}
            rows={[...shown, total].map((row) => [
              row.label,
              usd(perKWh(row.orbit), 3),
              usd(perKWh(row.ground), 3),
            ])}
          />
          <Disclosure className={styles.more} summary="Cara menghitungnya">
            <p>
              Belanja modal (perangkat keras, wahana, peluncuran, gedung)
              dicicil rata per tahun dengan faktor pemulihan modal pada biaya
              modal {num(inputs.wacc * 100, 1)}%: selama umur desain untuk
              perangkat dan wahana, 15 tahun untuk gedung. Ke cicilan itu
              ditambahkan biaya tahunan: listrik, operasi, penggantian perangkat
              yang rusak, dan kiriman propelan.
            </p>
            <p>
              Baris terakhir menghargai waktu. Komputasi yang baru tersedia{' '}
              <i>D</i> tahun lagi dianggap bernilai (1 + {num(inputs.tval, 2)})
              <sup>−D</sup> dari komputasi yang tersedia sekarang, karena
              penghasilannya tertunda selama itu. Perangkat keras dibeli saat
              daya sudah tersedia, jadi menunggu tidak membuatnya ketinggalan
              generasi. Selisihnya dicatat sebagai biaya, di orbit maupun di
              darat. Stasiun di orbit bekerja sejak diluncurkan, sehingga waktu
              tunggunya dirata-ratakan sepanjang masa peluncuran armada.
            </p>
          </Disclosure>
        </>
      }>
      <WithSliders ids={['cost', 'buscost', 'life', 'cadence']}>
        <PairedBars
          rows={[total, ...shown].map(toRate)}
          sides={['orbit', 'ground']}
          format={usd}
          negligible={0.0005}
          detail={(row, side) => {
            const dollars = yearly.get(row.key)?.[side] ?? 0;
            const whole = side === 'orbit' ? m.annOrbit : m.annGround;
            return (
              <>
                <strong>{money(dollars)}</strong> per tahun
                {!row.strong && (
                  <>
                    , {percent(dollars / whole)} dari total {SIDE_PROSE[side]}
                  </>
                )}
              </>
            );
          }}
        />
      </WithSliders>
    </Figure>
  );
}

/** Lifetime emissions per kWh of compute, orbit against ground. */
export function CarbonFigure(): ReactNode {
  const {inputs, outputs: m} = useScenario();
  // kg over the station's life, to grams per kWh of compute.
  const perKWh = (kilograms = 0) =>
    (kilograms / (m.itkWh * inputs.life)) * 1000;
  const grams = (value: number) => `${num(value, value < 10 ? 1 : 0)} g`;
  const lines = carbonLines(inputs, m);
  const total: BarRow = {
    key: 'total',
    label: 'Total',
    orbit: m.co2OrbitLife,
    ground: m.co2GroundLife,
    strong: true,
  };
  const toRate = (row: BarRow): BarRow => ({
    ...row,
    orbit: perKWh(row.orbit),
    ground: perKWh(row.ground),
  });
  const lifetime = new Map([total, ...lines].map((row) => [row.key, row]));

  return (
    <Figure
      width="wide"
      title="Emisi setiap kWh komputasi, orbit dan darat"
      caption="Gram CO₂e per kWh, dihitung sepanjang umur desain: pembuatan, peluncuran, dan pemakaian. Kredit karbon tidak dikurangkan di sini."
      source={SOURCE}
      footer={
        <TableView
          head={['Sumber emisi, g CO₂e per kWh', 'Orbit', 'Darat']}
          rows={[...lines, total].map((row) => [
            row.label,
            num(perKWh(row.orbit), 1),
            num(perKWh(row.ground), 1),
          ])}
        />
      }>
      <WithSliders ids={['ci', 'busco2', 'fuelmult', 'altmult']}>
        <PairedBars
          rows={[total, ...lines].map(toRate)}
          sides={['orbit', 'ground']}
          format={grams}
          negligible={0.05}
          detail={(row, side) => {
            const kilograms = lifetime.get(row.key)?.[side] ?? 0;
            const whole = side === 'orbit' ? m.co2OrbitLife : m.co2GroundLife;
            return (
              <>
                <strong>{mass(kilograms)}</strong> CO₂e selama{' '}
                {num(inputs.life)} tahun
                {!row.strong && (
                  <>
                    , {percent(kilograms / whole)} dari total {SIDE_PROSE[side]}
                  </>
                )}
              </>
            );
          }}
        />
      </WithSliders>
    </Figure>
  );
}

/** How the cost ratio responds to the launch price alone. */
export function LaunchCostFigure(): ReactNode {
  return (
    <SweepFigure
      input="cost"
      value={(m) => m.commRatio}
      yText={(value) => `${ratio(value)}×`}
      reference={{value: 1, label: '1× = setara dengan darat'}}
      xTitle="Biaya peluncuran per kg"
      title="Rasio biaya orbit terhadap darat, menurut biaya peluncuran"
      caption={({first}) => (
        <>
          Asumsi lain mengikuti skenario yang sedang dipilih. Pada biaya
          peluncuran termurah di grafik, {first.xText}, biaya orbit{' '}
          {first.yText.replace('×', '')} kali biaya darat. Klik grafik untuk
          memakai harga di titik itu.
        </>
      )}
      tableHead={['Biaya peluncuran', 'Biaya orbit, kali biaya darat']}
    />
  );
}

/** Radiator area against how hot the chips are allowed to run. */
export function RadiatorFigure(): ReactNode {
  return (
    <SweepFigure
      input="tchip"
      value={(m) => m.radArea}
      yText={area}
      gutter={72}
      xTitle="Suhu kerja cip"
      title="Luas radiator, menurut suhu kerja cip"
      caption={({first, last}) => (
        <>
          Daya yang dipancarkan naik dengan pangkat empat suhu, jadi cip yang
          boleh lebih panas memperkecil radiator: dari {first.yText} pada{' '}
          {first.xText} menjadi {last.yText} pada {last.xText}. Klik grafik
          untuk memakai suhu di titik itu.
        </>
      )}
      tableHead={['Suhu kerja cip', 'Luas radiator']}
      sliders={['tsink', 'dT']}
    />
  );
}

/** How long a station stays up without thrust, against altitude. */
export function LifetimeFigure(): ReactNode {
  return (
    <SweepFigure
      input="h"
      range={[200, 1000]}
      value={(m) => m.lifetime}
      yText={duration}
      logTicks={[
        86400,
        30 * 86400,
        YEAR,
        10 * YEAR,
        100 * YEAR,
        1000 * YEAR,
        10000 * YEAR,
      ]}
      gutter={82}
      xTitle="Ketinggian orbit"
      title="Umur orbit tanpa dorongan, menurut ketinggian"
      caption={({first, last}) => (
        <>
          Waktu sampai stasiun turun ke 150 km bila pendorongnya mati: dari{' '}
          {first.yText} pada {first.xText} sampai {last.yText} pada {last.xText}
          . Sumbu tegak berskala logaritmik. Klik grafik untuk memakai
          ketinggian di titik itu.
        </>
      )}
      tableHead={['Ketinggian orbit', 'Umur tanpa dorongan']}
      sliders={['solar', 'afrac']}
    />
  );
}
