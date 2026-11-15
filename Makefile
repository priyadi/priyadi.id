PLANTUML=docker run -i --rm plantuml/plantuml
INKSCAPE=inkscape
MAGICK=magick

PUML=$(wildcard *.puml */*.puml */*/*.puml */*/*/*.puml */*/*/*/*.puml)
PUML_LIGHT_SVG=$(patsubst %.puml, %.light.svg, $(PUML))
PUML_DARK_SVG=$(patsubst %.puml, %.dark.svg, $(PUML))

all: diagrams socialcards posttexts

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
# matter (see README). A card is drawn again only when it is older than its
# post, an image beside the post (where a `figure` comes from) or the drawing
# code, so `make -B socialcards` redraws them all.
SOCIALCARD_POSTS := $(shell awk ' \
	FNR == 1 { fm = ($$0 == "---"); next } \
	fm && /^---$$/ { nextfile } \
	fm && /^socialcard:/ { print FILENAME; nextfile }' \
	$(wildcard blog/*/*/index.md blog/*/*/index.mdx))
SOCIALCARDS := $(patsubst %/,%/socialcard.png,$(dir $(SOCIALCARD_POSTS)))
SOCIALCARD_CODE := scripts/socialcards.mjs src/lib/inlineMarkdown.ts \
	src/theme/Navbar/Wordmark.tsx $(wildcard scripts/socialcard-fonts/*.ttf)
SOCIALCARD_IMAGES = $(filter-out $*/socialcard.%,$(wildcard \
	$(addprefix $*/*.,png jpg jpeg webp gif svg)))

.PHONY: socialcards
socialcards: $(SOCIALCARDS)

.SECONDEXPANSION:
$(SOCIALCARDS): %/socialcard.png: $$(wildcard $$*/index.md $$*/index.mdx) \
		$$(SOCIALCARD_IMAGES) $(SOCIALCARD_CODE)
	node scripts/socialcards.mjs $*

# A card drawn by hand in Inkscape, for a post without that block. Not part of
# `make`; ask for the file:
#   make blog/2026-01/01-some-post/socialcard.jpeg
%/socialcard.png: %/socialcard.svg
	# $(INKSCAPE) -o - $< | $(MAGICK) - -dither FloydSteinberg -colors 10 $@
	$(INKSCAPE) -o $@ $<

%/socialcard.jpeg: %/socialcard.png
	$(MAGICK) $< -quality 88 $@

# Writes index.txt next to every post: the post as plain text, to paste into
# Facebook instead of a link (see README).
POSTTEXTS := $(patsubst %/,%/index.txt,$(dir \
	$(wildcard blog/*/*/index.md blog/*/*/index.mdx)))

.PHONY: posttexts
posttexts: $(POSTTEXTS)

$(POSTTEXTS): %/index.txt: $$(wildcard $$*/index.md $$*/index.mdx) \
		scripts/posttexts.mjs
	node scripts/posttexts.mjs $*
