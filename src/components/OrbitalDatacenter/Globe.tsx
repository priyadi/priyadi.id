import React, {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {num} from './format';
import {tr} from './id';
import {
  EARTH_ROTATION,
  type OrbitFrame,
  type Vector,
  inShadow,
  satPos,
} from './model';
import styles from './styles.module.css';

// The drawing is the calculator's orbit view, without the observer on the
// ground. Geometry (the frame, satPos, inShadow) is the calculator's own.

const W = 560;
const H = 420;
const CX = W * 0.42;
const CY = H / 2;
const DEG = Math.PI / 180;
/** Points along the orbit, and track points kept per orbit. */
const STEPS = 240;

// The arrow that points at the Sun, in picture units: a shaft and a cone.
const ARROW = {length: 96, shaft: 56, shaftRadius: 7, headRadius: 17};
/** How close to the picture's edge the arrow's centre may come. */
const ARROW_MARGIN = 62;
/** How much larger the end of the arrow nearer the viewer is drawn. */
const ARROW_PERSPECTIVE = 0.3;

type GeoLibrary = typeof import('d3-geo');
type Library = {geo: GeoLibrary; land: object};

/** d3-geo and the land outline, loaded when a globe first appears. */
function useLibrary(): Library | undefined {
  const [library, setLibrary] = useState<Library>();

  useEffect(() => {
    let wanted = true;
    Promise.all([
      import('d3-geo'),
      import('topojson-client'),
      import('./land.generated'),
    ])
      .then(([geo, topojson, {land}]) => {
        if (wanted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const topology = land as any;
          setLibrary({
            geo,
            land: topojson.feature(topology, topology.objects.land),
          });
        }
      })
      .catch((error: unknown) => {
        console.error('Orbit view failed to load', error);
      });
    return () => {
      wanted = false;
    };
  }, []);

  return library;
}

type Props = {
  frame: OrbitFrame;
  /** Orbit radius in Earth radii. */
  radius: number;
  /** Orbital period in seconds. */
  period: number;
  /** How long one orbit takes on screen, in seconds. */
  secondsPerOrbit: number;
  description: string;
};

/**
 * The Earth turning under an orbit, seen from a fixed direction in space. The
 * Sun's side is lit, the far side dark; the orbit is drawn in one colour where
 * the station is in sunlight and another where it is in the Earth's shadow.
 */
export default function Globe({
  frame,
  radius,
  period,
  secondsPerOrbit,
  description,
}: Props): ReactNode {
  const library = useLibrary();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `ocean${uid}`;
  const shadeId = `arrow${uid}`;
  const [playing, setPlaying] = useState(true);

  const svgRef = useRef<SVGSVGElement>(null);
  const arrowBackRef = useRef<SVGGElement>(null);
  const arrowFrontRef = useRef<SVGGElement>(null);
  const arrowShadeRef = useRef<SVGLinearGradientElement>(null);
  const sunLabelRef = useRef<SVGTextElement>(null);
  const hintRef = useRef<SVGTextElement>(null);
  const shadowRef = useRef<SVGGElement>(null);
  const shadowBandRef = useRef<SVGRectElement>(null);
  const litBackRef = useRef<SVGPathElement>(null);
  const darkBackRef = useRef<SVGPathElement>(null);
  const earthRef = useRef<SVGCircleElement>(null);
  const landRef = useRef<SVGPathElement>(null);
  const gridRef = useRef<SVGPathElement>(null);
  const nightRef = useRef<SVGPathElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const belowRef = useRef<SVGCircleElement>(null);
  const litFrontRef = useRef<SVGPathElement>(null);
  const darkFrontRef = useRef<SVGPathElement>(null);
  const panelRef = useRef<SVGLineElement>(null);
  const stationRef = useRef<SVGCircleElement>(null);
  const footRef = useRef<SVGTextElement>(null);
  const statusRef = useRef<SVGTextElement>(null);

  // What the animation reads on every frame. Kept in refs so that a slider
  // move does not restart the loop.
  const live = useRef({frame, radius, period, secondsPerOrbit, playing});
  live.current = {frame, radius, period, secondsPerOrbit, playing};
  const state = useRef({
    time: 0,
    last: undefined as number | undefined,
    camera: {lon: -140, lat: 18},
    track: [] as [number, number, number][],
    drag: undefined as {x: number; y: number} | undefined,
    visible: true,
    stale: true,
  });

  // A different orbit leaves a different track: start it again.
  useEffect(() => {
    state.current.track = [];
    state.current.stale = true;
  }, [frame, radius, period]);

  // Readers who ask for reduced motion get a still picture and a play button.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false);
    }
  }, []);

  // Do no work while the globe is off screen.
  useEffect(() => {
    const element = svgRef.current;
    if (!element) {
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      state.current.visible = entry.isIntersecting;
      state.current.last = undefined;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!library) {
      return undefined;
    }
    const {geo, land} = library;
    const inertial = geo.geoOrthographic().clipAngle(90);
    const earthFixed = geo.geoOrthographic().clipAngle(90);
    const graticule = geo.geoGraticule10();
    const text = {
      behindYou: tr('Sun is behind you — you are looking at the day side'),
      behindEarth: tr(
        'Sun is behind Earth — you are looking at the night side',
      ),
      directlyBehindYou: tr(
        '☀ Sun directly behind you — looking at the day side',
      ),
      directlyBehindEarth: tr(
        'Sun directly behind Earth — looking at the night side',
      ),
      eclipse: tr('● IN ECLIPSE — on batteries'),
      sunlit: tr('☀ SUNLIT — array charging'),
    };
    const set = (
      element: Element | null,
      attributes: Record<string, string | number>,
    ) => {
      if (element) {
        for (const [name, value] of Object.entries(attributes)) {
          element.setAttribute(name, String(value));
        }
      }
    };

    let request = 0;
    const draw = (now: number) => {
      request = window.requestAnimationFrame(draw);
      const s = state.current;
      const {
        frame: f,
        radius: r,
        period: T,
        secondsPerOrbit: pace,
      } = live.current;
      const running = live.current.playing && s.visible;
      if (!running && !s.stale) {
        s.last = undefined;
        return;
      }
      if (running && s.last !== undefined) {
        s.time += ((now - s.last) / 1000) * (T / pace);
      }
      s.last = running ? now : undefined;
      s.stale = false;

      // Where the station is on its orbit, and how far the Earth has turned.
      const theta = (2 * Math.PI * s.time) / T;
      const turned = EARTH_ROTATION * s.time;
      const scale = Math.min((CX - 30) / r, (CY - 26) / r);

      // The camera, as three unit vectors in the inertial frame.
      const lon = s.camera.lon * DEG;
      const lat = s.camera.lat * DEG;
      const view: Vector = [
        Math.cos(lat) * Math.cos(lon),
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
      ];
      const right: Vector = [-Math.sin(lon), Math.cos(lon), 0];
      const up: Vector = [
        -Math.sin(lat) * Math.cos(lon),
        -Math.sin(lat) * Math.sin(lon),
        Math.cos(lat),
      ];
      const dot = (a: Vector, b: Vector) =>
        a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const project = (p: Vector) => ({
        x: CX + scale * dot(p, right),
        y: CY - scale * dot(p, up),
        depth: dot(p, view),
      });
      const hidden = (q: {x: number; y: number; depth: number}) =>
        q.depth < 0 && Math.hypot(q.x - CX, q.y - CY) < scale;

      inertial
        .rotate([-s.camera.lon, -s.camera.lat])
        .scale(scale)
        .translate([CX, CY]);
      earthFixed
        .rotate([turned / DEG - s.camera.lon, -s.camera.lat])
        .scale(scale)
        .translate([CX, CY]);
      const inSpace = geo.geoPath(inertial);
      const onEarth = geo.geoPath(earthFixed);

      set(earthRef.current, {r: scale});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set(landRef.current, {d: onEarth(land as any) ?? ''});
      set(gridRef.current, {d: onEarth(graticule) ?? ''});

      // Night: the half of the globe around the point opposite the Sun.
      const away: Vector = [-f.sun[0], -f.sun[1], -f.sun[2]];
      const night = geo
        .geoCircle()
        .center([Math.atan2(away[1], away[0]) / DEG, Math.asin(away[2]) / DEG])
        .radius(90)();
      set(nightRef.current, {d: inSpace(night) ?? ''});

      // The Sun's direction as the camera sees it: across the screen
      // (sunX, sunY) and toward the viewer (sunDepth).
      const sunDepth = dot(f.sun, view);
      const sunX = dot(f.sun, right);
      const sunY = -dot(f.sun, up);
      const inScreen = Math.hypot(sunX, sunY);
      const ux = inScreen > 1e-4 ? sunX / inScreen : 1;
      const uy = inScreen > 1e-4 ? sunY / inScreen : 0;

      // An arrow pointing at the Sun, drawn as a solid object. It sits out
      // from the Earth in the Sun's direction: at the edge of the picture
      // when the Sun is to one side, over the globe and pointing at the
      // viewer when the Sun is behind them, and hidden behind the globe
      // when the Sun is behind the Earth.
      const reach = Math.min(
        ux > 0
          ? (W - CX - ARROW_MARGIN) / ux
          : ux < 0
            ? (-CX + ARROW_MARGIN) / ux
            : 1e9,
        uy > 0
          ? (H - CY - ARROW_MARGIN) / uy
          : uy < 0
            ? (-CY + ARROW_MARGIN) / uy
            : 1e9,
      );
      const centreX = CX + sunX * reach;
      const centreY = CY + sunY * reach;
      // A point `along` the arrow's axis and `across` it, on screen. The
      // axis is foreshortened by how much it points into the screen.
      const at = (along: number, across = 0) =>
        `${(centreX + along * sunX - across * uy).toFixed(1)},${(centreY + along * sunY + across * ux).toFixed(1)}`;
      const angle = (Math.atan2(uy, ux) / DEG).toFixed(1);
      // A circle around the axis is seen as an ellipse, flattened the same
      // way. It is drawn as two arcs in picture coordinates (not as a rotated
      // <ellipse>), so that it shares the shading of the other parts.
      const disc = (along: number, size: number, fill: string) => {
        const radii = `${(size * Math.abs(sunDepth)).toFixed(2)},${size.toFixed(2)} ${angle}`;
        return `<path fill="${fill}" d="M${at(along, size)}A${radii} 1 0 ${at(along, -size)}A${radii} 1 0 ${at(along, size)}Z"/>`;
      };
      const tail = -ARROW.length / 2;
      const neck = tail + ARROW.shaft;
      const tip = ARROW.length / 2;
      // A little perspective: whatever is nearer the viewer is drawn larger.
      const near = (along: number, size: number) =>
        size * (1 + ARROW_PERSPECTIVE * (along / tip) * sunDepth);
      const shaftTail = near(tail, ARROW.shaftRadius);
      const shaftNeck = near(neck, ARROW.shaftRadius);
      const headNeck = near(neck, ARROW.headRadius);
      const shade = `url(#${shadeId})`;
      const shaft = `<polygon fill="${shade}" points="${at(tail, shaftTail)} ${at(neck, shaftNeck)} ${at(neck, -shaftNeck)} ${at(tail, -shaftTail)}"/>`;
      // The sides of the cone run from its tip to where they touch the rim
      // of its base. Seen nearly end on, the tip falls inside the rim, the
      // base is the whole outline, and a point of light marks the tip.
      const rimDepth = headNeck * Math.abs(sunDepth);
      const tipDistance = (tip - neck) * inScreen;
      let head: string;
      if (tipDistance > rimDepth + 0.5) {
        const touchAlong =
          neck + (rimDepth * rimDepth) / tipDistance / inScreen;
        const touchAcross =
          headNeck *
          Math.sqrt(1 - (rimDepth * rimDepth) / (tipDistance * tipDistance));
        head = `<polygon fill="${shade}" points="${at(tip)} ${at(touchAlong, touchAcross)} ${at(touchAlong, -touchAcross)}"/>`;
      } else {
        head =
          sunDepth >= 0
            ? `<circle r="2" fill="#fff6cf" transform="translate(${at(tip)})"/>`
            : '';
      }
      // Painted far to near. Pointing at the viewer, the head covers the
      // shaft; pointing away, the flat back of the head and the end of the
      // shaft face the viewer and are a shade darker.
      const arrow =
        sunDepth >= 0
          ? disc(tail, shaftTail, shade) +
            shaft +
            disc(neck, headNeck, shade) +
            head
          : head +
            disc(neck, headNeck, '#9c7420') +
            shaft +
            disc(tail, shaftTail, '#dcae48');
      // Behind the Earth it is painted before the globe, which then hides
      // whatever part of it the globe covers.
      if (arrowFrontRef.current && arrowBackRef.current) {
        arrowFrontRef.current.innerHTML = sunDepth >= 0 ? arrow : '';
        arrowBackRef.current.innerHTML = sunDepth >= 0 ? '' : arrow;
      }
      // Light falls across the arrow from one side, which rounds it.
      set(arrowShadeRef.current, {
        x1: (centreX + ARROW.headRadius * uy).toFixed(1),
        y1: (centreY - ARROW.headRadius * ux).toFixed(1),
        x2: (centreX - ARROW.headRadius * uy).toFixed(1),
        y2: (centreY + ARROW.headRadius * ux).toFixed(1),
      });
      // Its label hangs under it (over it near the bottom edge), starting
      // or ending at the arrow so that it never runs off the picture.
      const covered =
        sunDepth < 0 && Math.hypot(centreX - CX, centreY - CY) < scale;
      const onLeft = centreX < W / 2;
      set(sunLabelRef.current, {
        x: (centreX + (onLeft ? -24 : 24)).toFixed(1),
        y: (centreY + (centreY > H - 100 ? -38 : 46)).toFixed(1),
        'text-anchor': onLeft ? 'start' : 'end',
        opacity: covered ? 0 : 1,
      });

      // The Earth's shadow, a band behind it away from the Sun, shown when
      // the Sun is far enough to one side for the band to be seen side on.
      if (inScreen > 0.15) {
        if (hintRef.current) {
          hintRef.current.textContent =
            sunDepth > 0.6
              ? text.behindYou
              : sunDepth < -0.6
                ? text.behindEarth
                : '';
        }
        set(shadowRef.current, {
          transform: `translate(${CX},${CY}) rotate(${(Math.atan2(-uy, -ux) / DEG).toFixed(1)})`,
        });
        set(shadowBandRef.current, {
          x: 0,
          y: -scale,
          width: W,
          height: 2 * scale,
          opacity: Math.max(0, inScreen - 0.5) * 2,
        });
      } else {
        set(shadowBandRef.current, {opacity: 0});
        if (hintRef.current) {
          hintRef.current.textContent =
            sunDepth > 0 ? text.directlyBehindYou : text.directlyBehindEarth;
        }
      }

      // The orbit, in four pieces: sunlit or shadowed, in front of the
      // globe or behind it.
      const arcs = {litFront: '', litBack: '', darkFront: '', darkBack: ''};
      let previous: {x: number; y: number} | undefined;
      for (let step = 0; step <= STEPS; step++) {
        const point = satPos(f, (step / STEPS) * 2 * Math.PI, r);
        const q = project(point);
        if (previous) {
          const piece =
            `${inShadow(point, f.sun) ? 'dark' : 'lit'}${hidden(q) ? 'Back' : 'Front'}` as keyof typeof arcs;
          arcs[piece] +=
            `M${previous.x.toFixed(1)} ${previous.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
        previous = q;
      }
      set(litFrontRef.current, {d: arcs.litFront});
      set(litBackRef.current, {d: arcs.litBack});
      set(darkFrontRef.current, {d: arcs.darkFront});
      set(darkBackRef.current, {d: arcs.darkBack});

      // The station, and its array held square to the Sun.
      const position = satPos(f, theta, r);
      const q = project(position);
      const eclipsed = inShadow(position, f.sun);
      const behind = hidden(q);
      set(stationRef.current, {cx: q.x, cy: q.y, opacity: behind ? 0.25 : 1});
      const towardSun = project(f.sun);
      const vx = towardSun.x - CX;
      const vy = towardSun.y - CY;
      const length = Math.hypot(vx, vy) || 1;
      const px = (-vy / length) * 9;
      const py = (vx / length) * 9;
      set(panelRef.current, {
        x1: q.x - px,
        y1: q.y - py,
        x2: q.x + px,
        y2: q.y + py,
        opacity: behind ? 0.25 : eclipsed ? 0.5 : 1,
      });

      // The track on the ground: it turns with the Earth, so it is kept in
      // latitude and longitude, one point per 1/240 orbit for 2.2 orbits.
      const belowLat = Math.asin(position[2] / r) / DEG;
      const belowLon =
        (((Math.atan2(position[1], position[0]) - turned) / DEG + 540) % 360) -
        180;
      const newest = s.track[s.track.length - 1];
      if (!newest || Math.abs(s.time - newest[2]) >= T / STEPS) {
        s.track.push([belowLon, belowLat, s.time]);
      }
      while (s.track.length && s.time - s.track[0][2] > 2.2 * T) {
        s.track.shift();
      }
      const lines: [number, number][][] = [];
      let line: [number, number][] = [];
      for (const [trackLon, trackLat] of [...s.track, [belowLon, belowLat]]) {
        // Break the line where it crosses the 180th meridian.
        if (
          line.length &&
          Math.abs(trackLon - line[line.length - 1][0]) > 180
        ) {
          lines.push(line);
          line = [];
        }
        line.push([trackLon, trackLat]);
      }
      if (line.length) {
        lines.push(line);
      }
      set(trackRef.current, {
        d: onEarth({type: 'MultiLineString', coordinates: lines}) ?? '',
      });
      const below = earthFixed([belowLon, belowLat]);
      set(belowRef.current, {
        cx: below ? below[0] : -99,
        cy: below ? below[1] : -99,
        opacity: below ? 1 : 0,
      });

      if (statusRef.current) {
        statusRef.current.textContent = eclipsed ? text.eclipse : text.sunlit;
        set(statusRef.current, {
          fill: eclipsed ? 'var(--c-eclipse-on-dark)' : 'var(--c-sunlit)',
        });
      }
      if (footRef.current) {
        const foot =
          `${num(Math.floor(s.time / 3600))} j ${num(Math.floor(((s.time % 86400) % 3600) / 60))} m` +
          ` · ${tr(`orbit ${Math.floor(s.time / T) + 1}`)}` +
          ` · ${num(T / pace)}× waktu nyata`;
        if (footRef.current.textContent !== foot) {
          footRef.current.textContent = foot;
        }
      }
    };
    request = window.requestAnimationFrame(draw);

    return () => window.cancelAnimationFrame(request);
  }, [library]);

  // Dragging turns the camera around the Earth.
  const turn = (dLon: number, dLat: number) => {
    const {camera} = state.current;
    camera.lon -= dLon;
    camera.lat = Math.max(-89, Math.min(89, camera.lat + dLat));
    state.current.stale = true;
  };
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    state.current.drag = {x: event.clientX, y: event.clientY};
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const {drag} = state.current;
    if (drag) {
      turn((event.clientX - drag.x) * 0.5, (event.clientY - drag.y) * 0.5);
      state.current.drag = {x: event.clientX, y: event.clientY};
    }
  };
  const endDrag = () => {
    state.current.drag = undefined;
  };

  return (
    <div className={styles.globeFrame}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={description}
        tabIndex={0}
        className={styles.globe}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          const step = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -5],
            ArrowDown: [0, 5],
          }[event.key];
          if (step) {
            event.preventDefault();
            turn(step[0], step[1]);
          }
        }}>
        <defs>
          <radialGradient id={gradientId} cx="38%" cy="38%" r="70%">
            <stop offset={0} stopColor="#4f96e8" />
            <stop offset={1} stopColor="#0b2a5c" />
          </radialGradient>
          <linearGradient
            ref={arrowShadeRef}
            id={shadeId}
            gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#fff0b0" />
            <stop offset={0.45} stopColor="#ffd66b" />
            <stop offset={1} stopColor="#a8771f" />
          </linearGradient>
        </defs>
        <g ref={arrowBackRef} />
        <text
          ref={hintRef}
          x={W / 2}
          y={18}
          textAnchor="middle"
          className={styles.globeSun}
        />
        <g ref={shadowRef}>
          <rect ref={shadowBandRef} fill="#2b2f3a" fillOpacity={0.35} />
        </g>
        <path ref={litBackRef} className={styles.arcLitBack} />
        <path ref={darkBackRef} className={styles.arcDarkBack} />
        <circle ref={earthRef} cx={CX} cy={CY} fill={`url(#${gradientId})`} />
        <path ref={landRef} className={styles.globeLand} />
        <path ref={gridRef} className={styles.globeGrid} />
        <path ref={nightRef} fill="#000" fillOpacity={0.6} />
        <path ref={trackRef} className={styles.globeTrack} />
        <circle ref={belowRef} r={3} className={styles.globeBelow} />
        <path ref={litFrontRef} className={styles.arcLit} />
        <path ref={darkFrontRef} className={styles.arcDark} />
        <line ref={panelRef} className={styles.globePanel} />
        <circle ref={stationRef} r={5} className={styles.globeStation} />
        <g ref={arrowFrontRef} />
        <text ref={sunLabelRef} className={styles.globeSun}>
          {tr('Sun')}
        </text>
        <text ref={footRef} x={8} y={H - 8} className={styles.globeFoot} />
        <text
          ref={statusRef}
          x={W - 8}
          y={H - 8}
          textAnchor="end"
          className={styles.globeStatus}
        />
      </svg>
      <button
        type="button"
        className={styles.globeToggle}
        aria-pressed={!playing}
        onClick={() => setPlaying((value) => !value)}>
        {playing ? 'Jeda' : 'Putar'}
      </button>
    </div>
  );
}
