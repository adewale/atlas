# Heterophily Research — June 2026

Second-wave evolution research. Where `evolution-research-2026-06.md` mined
*adjacent* territory (other periodic tables, science explorables, open chemistry
data), this round deliberately mined *dissimilar* domains for structural
patterns: collection cultures, deep textual traditions, games-and-statistics
culture, and cartography/place/ritual. Four research streams, all claims
URL-verified by the researchers except where flagged.

## 1. The convergences (the headline)

Independent streams kept arriving at the same four moves from different
directions — strong evidence these are load-bearing patterns, not domain quirks.

**Convergence A — the daily ritual.** Daf Yomi (Talmud: one page a day, everyone
on the same page worldwide, since 1923 — synchrony needs only a fixed canon and
a calendar), first-day covers (philately), sneaker drops, horoscopes, lichess
daily puzzles, and NASA-APOD all reduce to: *a deterministic date-keyed
selection from a fixed set creates ritual, return visits, and communal
simultaneity with zero backend*. For Atlas the entire mechanism is
`(daysSinceEpoch % 118) + 1`.

**Convergence B — the personal collection layer.** eBird life lists (lists as an
automatic *side effect* of activity + "Targets" naming your nearest
completions), the Pokédex (a bounded grid where *absence is rendered*), Ian
Allan's trainspotting ABC booklets (publishing the complete enumeration with a
mark-off ritual *created* a 230,000-member hobby), commonplace books (Locke's
florilegium — the reader's own anthology of excerpts), and speedrun
categories all reduce to: *let the visitor keep a collection, show the gaps,
name the next target*. Atlas currently has zero localStorage usage; this whole
layer is greenfield and needs no backend.

**Convergence C — computed kinship.** Bill James similarity scores
(Baseball-Reference shows "most similar players" on every page — its stickiest
invention), EDHREC synergy (affinity = co-occurrence minus baseline), the
I Ching's hypercube (64 nodes, edges = change exactly one line), and transit-map
interchanges all reduce to: *derive new edge types from the property vectors you
already have, and surface them on every node page*. This deepens Atlas's core
graph thesis with pure build-time math.

**Convergence D — provenance as design language.** Mineral-specimen labels (the
label outranks the rock; locality is unrecoverable if lost), watch "box and
papers", AOC/terroir appellation systems, Ortelius's *Catalogus Auctorum* (the
first modern atlas cited its 87 authorities as front-matter), and museum object
biographies all reduce to: *chain-of-custody, beautifully typeset, is the
product*. Atlas's sources data is already collected — it deserves specimen-label
treatment, not a footer strip.

## 2. Stream digests

### Collection cultures (birding, philately, Pokédex, spirits, trainspotting, minerals, sneakers)
- **eBird**: one log auto-tallies into every list (life/year/region); "Targets"
  shows likeliest next lifers; "spark bird" as identity. → Element life list
  with auto "read" marks, manual "spotted in the wild" log, per-block/period
  targets ("you've read 16/18 of period 4").
- **Pokédex**: render absence (dim unvisited cells); "regional dexes" = blocks;
  completion rewards that deepen the loop (diploma; block completion unlocks an
  alternate palette). Shiny variants = highest gimmick risk, gate or skip.
- **Ian Allan ABC**: a printable Byrne-palette "Spotter's ABC" pocket booklet of
  all 118 with underline rules and date/place columns — the published complete
  enumeration IS the hobby; the marked-up booklet is the trophy.
- **Scott catalogue / PCGS Set Registry**: canonical catalogue numbers
  ("AT-074") and named completable sub-registries ("The Antiquity Seven") —
  these map 1:1 onto Atlas's existing category index pages.
- **Wine aroma wheel (Noble 1984)**: a two-tier radial controlled vocabulary —
  a Property Wheel page where every descriptor ("refractory", "primordial",
  "synthetic-only") is backed by a sortable numeric property, doubling as an
  index. Honors the no-prose rule.
- **Mineral labels**: specimen-label plate per folio (catalogue no., locality =
  discovery place, collected = year, collector = discoverer, pedigree =
  etymology) + provenance strip styled as stacked historical collection labels.

### Textual traditions (Talmud, manuscripts, almanacs, divination, florilegia, field guides, memory arts)
- **Vilna Talmud page**: layered commentary with fixed addressing — a "daf mode"
  folio: data plate center, Wikipedia excerpt as inner commentary, historical
  quotes outer, source/caveat apparatus at the edges. Typographic showpiece (L).
- **Daf Yomi**: the 118-day cycle (Convergence A). A quiet "Siyum" page when a
  cycle completes. RSC covered every element in podcasts but no one has the
  communal-cadence angle — unclaimed.
- **Books of Hours**: graded rubrication ("red-letter elements" for anomalies);
  a calendar of discovery anniversaries as feast days (needs month/day
  enrichment from Wikidata — partial coverage, flagged).
- **Almanac**: one glorious dense printable broadsheet of all 118 — tables as
  the primary reading object, etymology lore in the margins. The most
  Tufte-native tradition surveyed.
- **Tarot spreads**: fixed atomic units + positional grammar = unbounded
  computed "readings". Draw 3 elements into past/present/future positions
  mapped to discovery era; the reading is computed pairwise relationships
  (shared discoverer, Δ density percentile, same etymology). 118³ ≈ 1.6M
  spreads from existing data, zero prose. Date-seeded daily spread.
- **I Ching**: 64 hexagrams = a 6-bit hypercube; edges = change one line. →
  a "one property different" navigation rail on every folio.
- **Peterson field guides**: arrows mark only the *differences* between similar
  species → red differential arrows on /compare highlighting the top-k
  largest percentile gaps (S, static). Dichotomous key: "identify your mystery
  element" via a build-time entropy-optimal decision tree (M).
- **Commonplace book**: press-to-collect any excerpt into a personal anthology
  with user-defined heads, provenance chips auto-attached, printable broadsheet
  export (M, localStorage). The most philosophically aligned feature — Atlas is
  already a florilegium; let readers gather their own flowers.
- **Memory arts**: the table is already a memory palace; a "memory walk" mode
  (guided keyboard journey, one auto-selected most-extreme fact per stop, then
  hide-and-recall). Lehrer's *Elements* song was dedicated to the public domain
  in 2020 — re-verify before quoting lyrics.

### Games & statistics (baseball, Top Trumps, chess, speedrunning, horoscopes, MTG, brackets)
- **Similarity scores** (Bill James / Baseball-Reference): z-score the 8 numeric
  properties at build time, start at 1000, subtract per-property penalties plus
  categorical penalties (different block −40); show top-5 "most similar
  elements" with scores on every folio (S/M, static). Highest wander-value per
  line of code in the entire research program.
- **Era adjustment (OPS+)**: `density+ = 100 × value / period-average` — one
  number answering "is that a lot, *for its row*?" Fixes the generalist's
  no-frame-of-reference problem (S, static).
- **Top Trumps**: a printable `/deck` of all 118 as poker-size cards, 9-up print
  stylesheet, six categories chosen so no card dominates — with a build-time
  test asserting no element wins >2 of 6 categories (M, static). The project's
  best marketing object.
- **ECO codes / lichess explorer**: trail recorder — your navigation path as a
  named "line" (H → He → Li) with edge type per hop, shareable as URL; curated
  famous trails ("The Lanthanide Main Line") in seed data.
- **Speedrunning**: "Atlas any%" — visit all 118 folios via graph links only,
  splits per period, rules page in the community-ruleset spirit, localStorage
  PBs. Teaches the graph structure; optimal routes exploit discoverer edges.
- **Birthstones** (jewelers' list, 1912): an arbitrary-but-*standardized*
  published mapping creates personal ownership. `/birthday/:mm-dd` → your
  element, plus "element discovered nearest your birth year"; shareable card
  ("you're Molybdenum"). 366 pre-rendered routes (S/M, static).
- **MTG**: rarity tiers from existing data (stable=common, synthetic=mythic);
  named table filters as "formats" (*Antiquity* = pre-1700, *Standard* =
  natural, *Vintage* = all 118).
- **Bird of the Year / March Mammal Madness**: an annual "Element of the Year"
  bracket — one round per week, campaign lore, two-year ban after winning,
  embrace the inevitable vote-fraud scandal. The one feature here needing a
  ballot box (GitHub Discussions polls keep the site static). MMM reached
  ~870k learners in 2024; the format is proven for science outreach.

### Place, ritual & material culture (atlases, transit maps, psychogeography, Wunderkammer, long-now, terroir, embodiment)
- **Ortelius's Theatrum (1570)**: an atlas = uniform plates + frontmatter +
  apparatus (index, cited authorities) + consistent projection. Atlas has the
  plates and a Parergon (the viz pages) but lacks the apparatus: a **Gazetteer**
  (one alphabetical index of every entity with plate references), a **Catalogus
  Auctorum** (the sources page as designed frontmatter), and **consistent
  projection = globally locked property-bar scales** across all 118 folios so
  plates are comparable like uniform-scale maps (S, static). The move that
  earns the name.
- **Beck's Tube map**: a `/transit` view — lines = groups/periods/blocks plus
  the four natural decay chains (genuinely linear routes with α/β stops);
  stations = elements; interchanges = multi-line elements. Verified precedent:
  Mark Lorch's 2013 "Underground Map of the Elements". The four-colour
  hard-edge aesthetic is already transit-map language (L; decay chains are the
  only new data).
- **Psychogeography**: a **Dérive button** — random-edge drift through the
  graph with the edge type announced (S, an afternoon). Plus "elements around
  you" tours through *spaces, not places* (Your Kitchen, Your Phone, A Hardware
  Store), waypoints = everyday objects → their elements, facts from Wikipedia
  applications sections (M, curated data).
- **Wunderkammer / object biographies**: `/specimen/:slug` museum-label pages
  for ~20 famous element-bearing objects (Hope Diamond's 0–8 ppm boron,
  Tutankhamun's meteoric-iron dagger, the Pt-Ir prototype kilogram, radium dial
  watches) — provenance-chain timelines linking into folios. A `/cabinet` view
  re-shelving the 118 as naturalia/artificialia/mirabilia/scientifica.
- **Long Now / nuclear semiotics**: ship numbered **editions** with a colophon
  (data snapshot dates, element count); a "Long Data" plate separating what
  will still be true in 2126 (half-lives) from the perishable (production
  figures); a sealed **2126 Edition** — dependency-free single-HTML-file build
  deposited to archive.org (plain HTML is the brick of the web); Sandia
  four-level hazard plates + half-life ladders for radioactive folios.
- **Terroir / appellation**: elements have two terroirs. Cosmic:
  `/cosmic-origins`, the table coloured by forging event (Big Bang, merging
  neutron stars, dying low-mass stars… — Johnson/SDSS 2017, seven categories
  verified; per-element *fractions* are not open data, ship dominant-source
  v1). Folio strip: *"Gold — appellation: merging neutron stars."* Terrestrial:
  `/provenance/:symbol` world production choropleths from public-domain USGS
  MCS (the app named Atlas finally gets actual maps); the commodity→element
  mapping (~90 rows) is unavoidable hand curation. Francium/astatine get a
  designed "not mined anywhere" state — itself a nice plate.

## 3. Consolidated shortlist

Grouping the ~45 raw ideas into seven coherent systems, ranked:

1. **The Apparatus** (S–M, static): gazetteer, Catalogus Auctorum frontmatter,
   globally locked bar scales, specimen-label plates, provenance strips,
   catalogue numbers, edition colophon. Smallest effort, deepest identity
   payoff; makes everything else feel like plates in one book. Do first.
2. **The Kinship Plate** (S–M, static): similarity scores + era-adjusted
   numbers + one-property-different rail on every folio; Peterson arrows on
   /compare. New computed edges for the graph thesis, pure build-time math.
3. **The Daily Office** (S, static + localStorage streaks): Daf Yomi 118-day
   cycle with cycle counter and Siyum page; date-seeded daily spread; FDC-style
   date postmark. One deterministic system, three rituals.
4. **My Atlas** (M, localStorage): life list (auto "read" / manual "spotted"),
   dex-style coverage on the table, targets panel, commonplace book, grail,
   completion diploma. Converts a reference you visit into a collection you keep.
5. **The Press** (M, static): Spotter's ABC booklet, Top Trumps deck, almanac
   broadsheet, birthday-element cards — the print pipeline from
   `evolution-research-2026-06.md` now has four killer artifacts.
6. **Origins** (M–L, new data): cosmic-origins view + USGS terroir maps +
   specimen object biographies + transit map with decay-chain lines.
7. **The Commons** (M–L, GitHub-as-backend): Element of the Year bracket;
   any% speedrun rules page. Community rituals; do after an audience exists.

## 4. Overall top picks

1. **The Apparatus** — Ortelius's lesson: the index, the cited authorities, and
   the uniform scale are what make an atlas an atlas. All static, all from
   existing JSON, and it converts the no-original-prose constraint into a
   visible design virtue (pedigreed data, specimen labels).
2. **The Kinship Plate** — Baseball-Reference's similarity list is the stickiest
   pattern found in any domain; combined with OPS+-style era adjustment it
   gives every number a frame of reference and every folio five new reasons to
   keep wandering.
3. **The Daily Office + My Atlas as one release** — the ritual creates the
   return visit; the collection records it. eBird's loop (auto-tally → visible
   gaps → named targets) plus Daf Yomi's synchrony, entirely in date arithmetic
   and localStorage.

## 5. Verification flags carried forward

Johnson/SDSS nucleosynthesis CC licence promised in blog comments, not
confirmed; per-element nucleosynthesis fractions not published as data; Wikidata
discovery month/day coverage unmeasured (feast-day calendar); Tom Lehrer
public-domain dedication to re-verify before quoting; NIST spectral bulk-export
ergonomics unchecked (sonification); USGS commodity→element mapping is hand
curation; eBird per-species badges unconfirmed; box-and-papers premium figures
are dealer-blog numbers; lichess "Puzzle of the Day" exact label unconfirmed.
