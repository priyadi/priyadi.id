PLANTUML=docker run -i --rm plantuml/plantuml
INKSCAPE=inkscape
MAGICK=magick

PUML=$(wildcard *.puml */*.puml */*/*.puml */*/*/*.puml */*/*/*/*.puml)
PUML_LIGHT_SVG=$(patsubst %.puml, %.light.svg, $(PUML))
PUML_DARK_SVG=$(patsubst %.puml, %.dark.svg, $(PUML))
SOCIALCARD_SVG=$(wildcard blog/*/*/socialcard.svg)
SOCIALCARD_PNG=$(patsubst blog/%/socialcard.svg, blog/%/socialcard.png, $(SOCIALCARD_SVG))
SOCIALCARD_JPEG=$(patsubst blog/%/socialcard.svg, blog/%/socialcard.jpeg, $(SOCIALCARD_SVG))

all: diagrams socialcards

.PHONY: start
start:
	npx docusaurus start

.PHONY: build
build:
	npx docusaurus build

.PHONY: serve
serve:
	npx docusaurus serve

.PHONY: clean
clean: clean-diagrams
	npx docusaurus clear

.PHONY: clean-diagrams
clean-diagrams:
	rm -f $(PUML_LIGHT_SVG) $(PUML_DARK_SVG)

.PHONY: rekapager
rekapager: $(REKAPAGER_DST)

.PHONY: static/rekapager/%.png
static/rekapager/%.png: static-src/rekapager/%.png
	convert $< -alpha set -fuzz 3% -transparent '#ffffff' -shave 60x60 -resize 25% $@

.PHONY: diagrams
diagrams: $(PUML_LIGHT_SVG) $(PUML_DARK_SVG)

%.light.svg: %.puml
	$(PLANTUML) -pipe -tsvg -SbackgroundColor=transparent < $< > $@

%.dark.svg: %.puml
	$(PLANTUML) -pipe -tsvg -darkmode -SbackgroundColor=transparent < $< > $@

.PHONY: socialcards
socialcards: $(SOCIALCARD_JPEG)

%/socialcard.png: %/socialcard.svg
	# $(INKSCAPE) -o - $< | $(MAGICK) - -dither FloydSteinberg -colors 10 $@
	$(INKSCAPE) -o $@ $<

%/socialcard.jpeg: %/socialcard.png
	$(MAGICK) $< -quality 88 $@
