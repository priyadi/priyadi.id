#!/usr/bin/env python3
"""Generate wordmark options for priyadi.id as outlined SVGs.

Text is shaped with HarfBuzz (hb-shape) and converted to paths with fontTools,
so the resulting SVGs do not depend on any installed font.

    python3 scripts/wordmark.py

Writes every option to design/wordmark/, and the chosen one (CHOSEN) to
src/theme/Navbar/Wordmark.tsx for the masthead.

Requires: fontTools, hb-shape, and the Google Fonts variable TTFs for
Newsreader, Inter and JetBrains Mono (see FONT_DIR).
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'design' / 'wordmark'
FONT_DIR = Path.home() / '.local/share/fonts/google-fonts/ofl'

FONTS = {
    'serif': FONT_DIR / 'newsreader/Newsreader[opsz,wght].ttf',
    'serif-italic': FONT_DIR / 'newsreader/Newsreader-Italic[opsz,wght].ttf',
    'sans': FONT_DIR / 'inter/Inter[opsz,wght].ttf',
    'mono': FONT_DIR / 'jetbrainsmono/JetBrainsMono[wght].ttf',
}

SIZE = 200  # px per em in the generated artwork

# Site palette (src/css/custom.css)
LIGHT = {
    'ink': '#201a1f',
    'soft': '#625a63',
    'accent': '#b3261a',
    'paper': '#ffffff',
    'dots': ['#f7994e', '#f3674a', '#d94a4c', '#93405c'],
    'sun': '#f3674a',
}
DARK = {
    'ink': '#efe9ea',
    'soft': '#aba1ab',
    'accent': '#ff9068',
    'paper': '#17121a',
    'dots': ['#ffb877', '#ff9068', '#f3674a', '#c9648c'],
    'sun': '#ff9068',
}
SUNSET_STOPS = [
    (0, '#f7994e'),
    (30, '#f3674a'),
    (58, '#d94a4c'),
    (82, '#93405c'),
    (100, '#4b3052'),
]

_instances: dict = {}


def instance(font: str, **axes):
    key = (font, tuple(sorted(axes.items())))
    if key not in _instances:
        tt = instantiateVariableFont(TTFont(FONTS[font]), axes)
        _instances[key] = (tt, tt.getGlyphSet())
    return _instances[key]


def shape(font: str, text: str, axes: dict, features: str = '') -> list[dict]:
    cmd = [
        'hb-shape',
        '--output-format=json',
        '--variations=' + ','.join(f'{k}={v}' for k, v in axes.items()),
    ]
    if features:
        cmd.append('--features=' + features)
    cmd += [str(FONTS[font]), text]
    return json.loads(subprocess.check_output(cmd, text=True))


def contours(glyphset, name: str) -> list[list]:
    pen = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(pen)
    out, cur = [], []
    for op, args in pen.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'):
            out.append(cur)
            cur = []
    return out


def replay(contour: list, pen) -> None:
    for op, args in contour:
        getattr(pen, op)(*args)


def bounds(contour: list, t: Transform = Transform()):
    pen = BoundsPen(None)
    replay(contour, TransformPen(pen, t))
    return pen.bounds


@dataclass
class Mark:
    """A wordmark being assembled, in px with the baseline at y=0."""

    x: float = 0.0
    items: list = field(default_factory=list)  # (svg, (x0, y0, x1, y1))
    defs: list = field(default_factory=list)
    glyphs: list = field(default_factory=list)  # (path data, fill)
    dot_index: int = 0

    def add(self, svg: str, box) -> None:
        self.items.append((svg, box))

    def path(self, contour_list: list, t: Transform, fill: str) -> None:
        pen = SVGPathPen(None, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
        tp = TransformPen(pen, t)
        box = None
        for c in contour_list:
            replay(c, tp)
            b = bounds(c, t)
            box = b if box is None else (
                min(box[0], b[0]), min(box[1], b[1]),
                max(box[2], b[2]), max(box[3], b[3]),
            )
        if box:
            self.glyphs.append((pen.getCommands(), fill))
            self.add(f'<path d="{pen.getCommands()}" fill="{fill}"/>', box)

    def text(
        self,
        text: str,
        font: str,
        fill: str,
        *,
        size: float = SIZE,
        tracking: float = 0.0,
        dots: list[str] | None = None,
        period=None,
        features: str = '',
        **axes,
    ) -> None:
        """Set a run of text. `dots` recolours tittles and full stops in
        order; `period` is a callback that draws a replacement full stop."""
        tt, gs = instance(font, **axes)
        s = size / tt['head'].unitsPerEm
        for g in shape(font, text, axes, features):
            name = g['g']
            t = Transform(s, 0, 0, -s, self.x + g.get('dx', 0) * s, -g.get('dy', 0) * s)
            cs = contours(gs, name)
            adv = g['ax'] * s
            if name == 'period' and period is not None:
                adv = period(self, cs, t, adv)
            elif dots is not None and name == 'period':
                self.path(cs, t, dots[self.dot_index % len(dots)])
                self.dot_index += 1
            elif dots is not None and name in ('i', 'j') and len(cs) == 2:
                cs.sort(key=lambda c: bounds(c)[1])
                self.path(cs[:1], t, fill)
                self.path(cs[1:], t, dots[self.dot_index % len(dots)])
                self.dot_index += 1
            else:
                self.path(cs, t, fill)
            self.x += adv + tracking * size

    def box(self):
        xs0, ys0, xs1, ys1 = zip(*(b for _, b in self.items))
        return min(xs0), min(ys0), max(xs1), max(ys1)

    def svg(self, pad: float = 0.0, background: str | None = None) -> str:
        x0, y0, x1, y1 = self.box()
        x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
        w, h = x1 - x0, y1 - y0
        body = ''.join(svg for svg, _ in self.items)
        defs = f'<defs>{"".join(self.defs)}</defs>' if self.defs else ''
        bg = (
            f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{background}"/>'
            if background
            else ''
        )
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {w:.2f} {h:.2f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="priyadi.id">'
            f'{defs}{bg}{body}</svg>\n'
        )


def sunset_gradient(id_: str, x0: float, x1: float) -> str:
    stops = ''.join(f'<stop offset="{o}%" stop-color="{c}"/>' for o, c in SUNSET_STOPS)
    return (
        f'<linearGradient id="{id_}" gradientUnits="userSpaceOnUse" '
        f'x1="{x0:.2f}" y1="0" x2="{x1:.2f}" y2="0">{stops}</linearGradient>'
    )


# --- Options ---------------------------------------------------------------


def editorial(p) -> Mark:
    """Roman name, italic TLD in the accent colour."""
    m = Mark()
    m.text('priyadi', 'serif', p['ink'], tracking=-0.012, wght=600, opsz=72)
    m.x += 0.012 * SIZE
    m.text('.id', 'serif-italic', p['accent'], tracking=-0.005, wght=500, opsz=72)
    return m


def sunset_dots(p) -> Mark:
    """Every dot in the name steps down the logo's sunset."""
    m = Mark()
    m.text('priyadi.id', 'serif', p['ink'], tracking=-0.01, dots=p['dots'], wght=640, opsz=72)
    return m


def sundown(p) -> Mark:
    """Italic, with the full stop as a sun half-set on the baseline."""
    m = Mark()

    def sun(mark: Mark, cs, t, adv):
        # A disc whose centre floats a little above the baseline, cut off
        # flat where it meets the horizon.
        r = 0.125 * SIZE
        lift = 0.35 * r
        hw = (r * r - lift * lift) ** 0.5
        gap = 0.045 * SIZE
        cx = mark.x + gap + r
        mark.add(
            f'<path d="M{cx - hw:.2f} 0A{r:.2f} {r:.2f} 0 1 1 {cx + hw:.2f} 0Z" fill="{p["sun"]}"/>',
            (cx - r, -(r + lift), cx + r, 0),
        )
        return 2 * r + 2 * gap

    m.text('priyadi.id', 'serif-italic', p['ink'], tracking=-0.005, period=sun, wght=560, opsz=72)
    return m


def grotesk(p) -> Mark:
    """Heavy sans name, light TLD."""
    m = Mark()
    m.text('priyadi', 'sans', p['ink'], tracking=-0.035, wght=800, opsz=32)
    m.x += 0.02 * SIZE
    m.text('.id', 'sans', p['accent'], tracking=-0.02, wght=300, opsz=32)
    return m


def terminal(p) -> Mark:
    """Monospace with a block cursor."""
    m = Mark()
    m.text('priyadi.id', 'mono', p['ink'], tracking=-0.03, wght=700)
    x = m.x + 0.06 * SIZE
    w, top, bottom = 0.5 * SIZE, -0.75 * SIZE, 0.04 * SIZE
    m.add(
        f'<rect x="{x:.2f}" y="{top:.2f}" width="{w:.2f}" height="{bottom - top:.2f}" fill="{p["sun"]}"/>',
        (x, top, x + w, bottom),
    )
    return m


def nameplate(p) -> Mark:
    """Letterspaced capitals over a sunset rule, like a newspaper nameplate."""
    m = Mark()
    m.text('PRIYADI.ID', 'serif', p['ink'], tracking=0.11, dots=[p['sun']], wght=560, opsz=40)
    x0, _, x1, _ = m.box()
    y, h = 0.2 * SIZE, 0.035 * SIZE
    m.defs.append(sunset_gradient('sunset', x0, x1))
    m.add(
        f'<rect x="{x0:.2f}" y="{y:.2f}" width="{x1 - x0:.2f}" height="{h:.2f}" fill="url(#sunset)"/>',
        (x0, y, x1, y + h),
    )
    return m


def tile(p) -> Mark:
    """The logo's tile stretched into a lockup: white type over the dusk wave."""
    text = Mark()
    text.text('priyadi.id', 'sans', '#ffffff', tracking=-0.02, wght=620, opsz=32)
    tx0, ty0, tx1, ty1 = text.box()
    padx, top, bottom = 0.42 * SIZE, 0.34 * SIZE, 0.2 * SIZE
    x0, x1 = tx0 - padx, tx1 + padx
    y0, y1 = ty0 - top, ty1 + bottom
    w, h = x1 - x0, y1 - y0
    r = 0.22 * h
    # Wave from static/img/logo.svg (64 wide, crest band 51-54.5, tile bottom 64)
    k = w / 64
    wy = 0.07 * SIZE  # wave centre line, just under the baseline
    amp = h / 64 * 1.9

    def pt(x, y):
        return f'{x0 + x * k:.2f} {wy + (y - 53.2) * amp:.2f}'

    wave = (
        f'M{pt(0, 54.5)}'
        f'C{pt(9, 51.1)} {pt(17, 50.3)} {pt(25, 51.9)}'
        f'C{pt(32.5, 53.4)} {pt(38, 53.1)} {pt(45, 51)}'
        f'C{pt(51.6, 49)} {pt(57.6, 48.7)} {pt(64, 50.4)}'
        f'V{y1:.2f}H{x0:.2f}Z'
    )
    m = Mark()
    m.defs.append(
        f'<clipPath id="tile"><rect x="{x0:.2f}" y="{y0:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{r:.2f}"/></clipPath>'
    )
    m.add(
        f'<g clip-path="url(#tile)">'
        f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{w:.2f}" height="{h:.2f}" fill="#f3674a"/>'
        f'<path d="{wave}" fill="#3a2443"/></g>',
        (x0, y0, x1, y1),
    )
    m.items += text.items
    return m


OPTIONS = [
    ('a-editorial', 'A · Editorial', editorial),
    ('b-sunset-dots', 'B · Sunset dots', sunset_dots),
    ('c-sundown', 'C · Sundown', sundown),
    ('d-grotesk', 'D · Grotesk', grotesk),
    ('e-terminal', 'E · Terminal', terminal),
    ('f-nameplate', 'F · Nameplate', nameplate),
    ('g-tile', 'G · Tile', tile),
]


# --- Site component --------------------------------------------------------

# The option used in the masthead, drawn with the site's CSS colours so it
# follows the colour mode.
CHOSEN = grotesk
COMPONENT = ROOT / 'src/theme/Navbar/Wordmark.tsx'
CSS_PALETTE = {**LIGHT, 'ink': 'currentColor', 'accent': 'var(--c-accent)'}


def component() -> str:
    mark = CHOSEN(CSS_PALETTE)
    x0, y0, x1, y1 = mark.box()
    by_fill: dict[str, list[str]] = {}
    for d, fill in mark.glyphs:
        by_fill.setdefault(fill, []).append(d)
    paths = '\n'.join(
        f'      <path fill="{fill}" d="{"".join(ds)}" />' for fill, ds in by_fill.items()
    )
    return f'''// Generated by scripts/wordmark.py. Do not edit by hand.
import React, {{type ReactNode}} from 'react';

type Props = {{
  className?: string;
  title: string;
}};

export default function Wordmark({{className, title}}: Props): ReactNode {{
  return (
    <svg
      className={{className}}
      viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}"
      width={{{x1 - x0:.0f}}}
      height={{{y1 - y0:.0f}}}
      role="img"
      aria-label={{title}}>
{paths}
    </svg>
  );
}}
'''


# --- Social card -----------------------------------------------------------

# The default Open Graph image (themeConfig.image). It is the logo tile at
# full bleed: the same coral sky and dusk wave, with the wordmark in place of
# the P.
CARD = ROOT / 'static/img/priyadi.id.svg'
CARD_W, CARD_H = 1280, 640
CARD_SKY, CARD_DUSK = '#f3674a', '#3a2443'
CARD_PALETTE = {**LIGHT, 'ink': '#ffffff', 'accent': CARD_DUSK}


def card() -> str:
    mark = CHOSEN(CARD_PALETTE)
    x0, y0, x1, y1 = mark.box()
    # Wave from static/img/logo.svg, which is 64 units wide with its crest
    # band around y=52. Stretched across the card and deepened a little so
    # it still reads as a swell at this aspect ratio.
    kx = CARD_W / 64
    mid, amp = 0.82 * CARD_H, 15.0

    def pt(x, y):
        return f'{x * kx:.1f} {mid + (y - 52) * amp:.1f}'

    wave = (
        f'M{pt(0, 54.5)}'
        f'C{pt(9, 51.1)} {pt(17, 50.3)} {pt(25, 51.9)}'
        f'C{pt(32.5, 53.4)} {pt(38, 53.1)} {pt(45, 51)}'
        f'C{pt(51.6, 49)} {pt(57.6, 48.7)} {pt(64, 50.4)}'
        f'V{CARD_H}H0Z'
    )
    # Wordmark at 56% of the card width, with its x-height band centred in
    # the sky above the wave.
    k = 0.56 * CARD_W / (x1 - x0)
    tx = (CARD_W - (x1 - x0) * k) / 2 - x0 * k
    xheight = 0.546 * SIZE  # Inter
    ty = 0.47 * (mid - amp) + xheight * k / 2
    body = ''.join(svg for svg, _ in mark.items)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CARD_W} {CARD_H}" '
        f'width="{CARD_W}" height="{CARD_H}" role="img" aria-label="priyadi.id">'
        f'<rect width="{CARD_W}" height="{CARD_H}" fill="{CARD_SKY}"/>'
        f'<path d="{wave}" fill="{CARD_DUSK}"/>'
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.5f})">{body}</g>'
        f'</svg>\n'
    )


def write_card(path: Path = CARD) -> None:
    path.write_text(card())
    subprocess.check_call(
        ['rsvg-convert', str(path), '-w', str(CARD_W), '-h', str(CARD_H),
         '-o', str(path.with_suffix('.png'))]
    )


# --- Contact sheet ---------------------------------------------------------


def embed(mark: Mark, x: float, y: float, height: float, prefix: str) -> tuple[str, float]:
    """Place a mark with its top-left at (x, y), scaled to `height`."""
    x0, y0, x1, y1 = mark.box()
    k = height / (y1 - y0)
    defs = ''.join(mark.defs).replace('id="', f'id="{prefix}').replace('url(#', f'url(#{prefix}')
    body = ''.join(s for s, _ in mark.items).replace('url(#', f'url(#{prefix}')
    svg = (
        f'<g transform="translate({x:.2f} {y:.2f}) scale({k:.5f}) translate({-x0:.2f} {-y0:.2f})">'
        f'<defs>{defs}</defs>{body}</g>'
    )
    return svg, (x1 - x0) * k


def sheet() -> str:
    col_w, row_h, head = 860, 250, 0
    width, height = col_w * 2, head + row_h * len(OPTIONS)
    logo = (ROOT / 'static/img/logo.svg').read_text()
    logo_inner = logo[logo.index('>') + 1 : logo.rindex('</svg>')]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">'
    ]
    for col, pal in enumerate((LIGHT, DARK)):
        cx = col * col_w
        parts.append(f'<rect x="{cx}" y="0" width="{col_w}" height="{height}" fill="{pal["paper"]}"/>')
        for row, (slug, label, fn) in enumerate(OPTIONS):
            y = head + row * row_h
            prefix = f'{slug}-{col}-'
            mark = fn(pal)
            cap = 96 if slug != 'g-tile' else 108
            if slug == 'f-nameplate':
                cap = 62
            big, _ = embed(mark, cx + 56, y + 62, cap, prefix + 'big-')
            parts.append(
                f'<text x="{cx + 56}" y="{y + 38}" font-family="Inter, sans-serif" font-size="15" '
                f'font-weight="600" letter-spacing="0.6" fill="{pal["soft"]}">{label.upper()}</text>'
            )
            parts.append(big)
            # Masthead-size lockup next to the logo mark
            mx, my = cx + 56, y + 190
            if slug != 'g-tile':
                parts.append(
                    f'<g transform="translate({mx} {my}) scale({36 / 64})">'
                    f'{logo_inner.replace("tile", prefix + "logo")}</g>'
                )
                h = {'f-nameplate': 20}.get(slug, 28)
                small, _ = embed(mark, mx + 48, my + (36 - h) / 2 + 1, h, prefix + 'sm-')
            else:
                small, _ = embed(mark, mx, my, 36, prefix + 'sm-')
            parts.append(small)
            parts.append(
                f'<line x1="{cx}" y1="{y + row_h}" x2="{cx + col_w}" y2="{y + row_h}" '
                f'stroke="{pal["soft"]}" stroke-opacity="0.25"/>'
            )
    parts.append('</svg>')
    return ''.join(parts)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, _, fn in OPTIONS:
        (OUT / f'{slug}.svg').write_text(fn(LIGHT).svg())
        if slug != 'g-tile':
            (OUT / f'{slug}-dark.svg').write_text(fn(DARK).svg())
    (OUT / 'sheet.svg').write_text(sheet())
    subprocess.check_call(
        ['rsvg-convert', str(OUT / 'sheet.svg'), '-o', str(OUT / 'sheet.png')]
    )
    COMPONENT.write_text(component())
    write_card()
    print(f'wrote {CARD.relative_to(ROOT)} and its PNG')
    print(f'wrote {len(list(OUT.glob("*.svg")))} SVGs and sheet.png to {OUT}')
    print(f'wrote {COMPONENT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
