PLANTUML=docker run -i --rm plantuml/plantuml
INKSCAPE=inkscape
MAGICK=magick

PUML=$(wildcard *.puml */*.puml */*/*.puml */*/*/*.puml */*/*/*/*.puml)
PUML_LIGHT_SVG=$(patsubst %.puml, %.light.svg, $(PUML))
PUML_DARK_SVG=$(patsubst %.puml, %.dark.svg, $(PUML))

all: diagrams socialcards

.PHONY: start
start:
	npx docusaurus start

.PHONY: clean
clean: clean-diagrams
	npx docusaurus clear

.PHONY: clean-diagrams
clean-diagrams:
	rm -f $(PUML_LIGHT_SVG) $(PUML_DARK_SVG)

.PHONY: diagrams
diagrams: $(PUML_LIGHT_SVG) $(PUML_DARK_SVG)

%.light.svg: %.puml
	$(PLANTUML) -pipe -tsvg -SbackgroundColor=transparent < $< > $@

%.dark.svg: %.puml
	$(PLANTUML) -pipe -tsvg -darkmode -SbackgroundColor=transparent < $< > $@

# Draws socialcard.png for every post with a `socialcard` block in its front
# matter (see README).
.PHONY: socialcards
socialcards:
	node scripts/socialcards.mjs

# A card drawn by hand in Inkscape, for a post without that block. Not part of
# `make`; ask for the file:
#   make blog/2026-01/01-some-post/socialcard.jpeg
%/socialcard.png: %/socialcard.svg
	# $(INKSCAPE) -o - $< | $(MAGICK) - -dither FloydSteinberg -colors 10 $@
	$(INKSCAPE) -o $@ $<

%/socialcard.jpeg: %/socialcard.png
	$(MAGICK) $< -quality 88 $@
