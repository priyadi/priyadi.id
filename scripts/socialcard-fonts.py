#!/usr/bin/env python3
"""Cut the static fonts that scripts/socialcards.mjs needs.

satori, which lays out the social cards, cannot read variable fonts or WOFF2,
so this pins the site's three typefaces to the instances the card uses and
writes them as plain TTFs to scripts/socialcard-fonts/.

    python3 scripts/socialcard-fonts.py

Only needs to run again when the card starts using another weight.

Requires: fontTools and the Google Fonts variable TTFs (see FONT_DIR), the
same ones scripts/wordmark.py uses.
"""

import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'scripts' / 'socialcard-fonts'
FONT_DIR = Path.home() / '.local/share/fonts/google-fonts/ofl'

# output name: (source, axes)
INSTANCES = {
    # Headlines and big numbers: the display cut, at the site's heading weight.
    'Newsreader-Display-SemiBold': (
        'newsreader/Newsreader[opsz,wght].ttf',
        {'opsz': 72, 'wght': 600},
    ),
    # *Emphasis* in headlines.
    'Newsreader-Display-SemiBoldItalic': (
        'newsreader/Newsreader-Italic[opsz,wght].ttf',
        {'opsz': 72, 'wght': 600},
    ),
    'Inter-Regular': ('inter/Inter[opsz,wght].ttf', {'opsz': 24, 'wght': 400}),
    'Inter-SemiBold': ('inter/Inter[opsz,wght].ttf', {'opsz': 24, 'wght': 600}),
    # *Emphasis* in descriptions, and emphasis inside **strong**.
    'Inter-Italic': (
        'inter/Inter-Italic[opsz,wght].ttf',
        {'opsz': 24, 'wght': 400},
    ),
    'Inter-SemiBoldItalic': (
        'inter/Inter-Italic[opsz,wght].ttf',
        {'opsz': 24, 'wght': 600},
    ),
    'JetBrainsMono-Medium': (
        'jetbrainsmono/JetBrainsMono[wght].ttf',
        {'wght': 500},
    ),
}


# Static faces that a post's `style` can ask for (POST_FONTS in
# src/lib/postStyle.ts), copied as they are. Pricedown is not a Google Font;
# its web version, static/fonts/pricedown-black.woff, is a Latin subset:
#   pyftsubset 'pricedown bl.ttf' --flavor=woff --layout-features='*' \
#     --unicodes='U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20AC,U+2122,U+2212' \
#     --output-file=static/fonts/pricedown-black.woff
COPIES = {
    'Pricedown-Black': Path.home() / '.local/share/fonts/gta/pricedown bl.ttf',
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, source in COPIES.items():
        target = OUT / f'{name}.ttf'
        shutil.copyfile(FONT_DIR / source, target)
        print(f'{target.relative_to(ROOT)}  {target.stat().st_size // 1024} KB')
    for name, (source, axes) in INSTANCES.items():
        font = instantiateVariableFont(TTFont(FONT_DIR / source), axes)
        target = OUT / f'{name}.ttf'
        font.save(target)
        print(f'{target.relative_to(ROOT)}  {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
