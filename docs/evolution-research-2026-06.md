# Evolution Research — June 2026

How Atlas could evolve, based on four research streams: a competitor landscape
survey, explorable-explanation/design prior art, open-dataset vetting (with
licence verification), and format prior art (games, print, embeds, editions).
Companion to `audit-2026-06.md`.

## 1. The landscape, and the gap Atlas occupies

| Competitor | Strength | Why it isn't Atlas |
|---|---|---|
| ptable.com | Live data dashboard: temperature/year sliders, isotopes, 40+ languages | Instrument panel, not a reading experience; zero narrative; navigation is strictly table → element |
| periodictable.com (Gray/Wolfram) | Best element photography in the genre | Frozen (~2017); a storefront around a photo archive |
| The Elements app (Gray) | Editorial voice + object beauty | Paid, iOS-only, linear book, walled garden |
| RSC periodic table | Richest humanities content (history, podcasts, supply risk) | Stories siloed per element; no lateral navigation by discoverer/era/etymology |
| periodic-table.io | Cleanest indie UI; real compare tool | "Design" = Material cards; encyclopedic stats, no provenance |
| IAEA Live Chart of Nuclides | Gold-standard nuclide data + public API | For nuclear professionals; impenetrable to generalists |
| PubChem table | Authoritative, cited, downloadable | Data source, not a designed experience |
| Periodic Videos / TED-Ed | Unmatched storytelling charm | Video-only; 2008-era web grids |

**Gaps nobody fills (verified):**
1. **Graph navigation** — every competitor is a two-level hierarchy (table →
   element). No site lets you pivot oxygen → "everything Scheele discovered" →
   "elements named from Swedish". Atlas's core philosophy is genuinely novel here.
2. **Editorial/print design** — vacant since Gray's 2010 iPad app. Nobody does
   Byrne/Tufte on the open web.
3. **Consumer-facing provenance** — indie tables hand-copy data (mostly from
   Bowserinator's JSON, 714★, which cites nothing). "Shows its receipts" is unclaimed.
4. **Editorial comparison** — only periodic-table.io has compare, and it's a stat sheet.
5. **Anomalies as a browsable dimension** — the stories live in video/audio,
   never in navigable structure. Atlas's anomaly pages are already unique.

Competitive cautions: don't try to out-data ptable; Wikipedia-sourced snippets
must be curated brilliantly to compete with RSC's depth; SEO incumbency is real.

## 2. Ranked evolution ideas

Ranked by impact × design-philosophy fit ÷ effort. Effort: S/M/L.

### Tier 1 — build these

**1. The isotope/nuclide layer (M).** The single biggest content unlock. IAEA
Livechart API delivers all 3,388 nuclides (half-life, decay modes + branching,
abundance, discovery year) in one CSV GET
(`https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all`, ~900 KB;
NUBASE2020 ASCII as a fallback). Fits the build-time pipeline perfectly. Unlocks:
per-folio isotope strips, a full N–Z chart of nuclides in the Byrne palette
(bridging the gap between generalist tables and the impenetrable IAEA tool), and —
the deep fit — **decay chains as new directed-graph edges between elements**
(uranium → thorium → radium … → lead as navigable links). ⚠️ Verify IAEA terms
of use before shipping (page is JS-rendered; citation is conventionally expected).

**2. Computed emission spectra (M).** True-wavelength SVG spectral strips per
folio from NIST ASD line data (scriptable CGI, tab-delimited; e.g. all 6,024
ionization energies in one GET). Computed, uniform, print-native — far better
than the inconsistent Commons raster images, and exactly the "length IS the
value" ethos. ⚠️ NIST SRD is "all rights reserved"; ship a small derived extract
(strongest visible lines per element) with citation/DOI, and confirm stance with
data@nist.gov for anything bigger.

**3. Provenanced dataset release (S).** Publish the pipeline's generated JSON as
a versioned dataset (GitHub/npm) with per-claim `{value, unit, source, retrieved}`.
No popular elements dataset has per-claim provenance — Bowserinator (714★)
and the npm packages cite essentially nothing. Zero runtime cost, markets Atlas
to developers, and compounds with every dataset added below.

**4. Print pipeline: posters + folio print styles (S–M).** SVG→PDF as a build
step. A Byrne-style periodic table poster appears to be an open market gap —
even Kronecker Wallis (the Byrne's-Euclid publisher) shows no such product.
Free printable PDFs (A4/A3/Letter) serve teachers at zero cost; print-on-demand
is an optional link-out. The aesthetic finally pays off in its native medium.

### Tier 2 — strong, scoped features

**5. Daily featured element, APOD model (S).** One element per day with
date-keyed permalink archive and RSS — assembled from data and sourced excerpts
(no original prose needed). The NASA APOD / Wikipedia-TFA pattern, fully static
(date-index arithmetic over a shuffled list, like Wordle's client-side answers).
Skip the Wordle clone itself: five incumbents (Periodle, Elementle, Elemendle…).

**6. Graph-deduction daily game (M).** *If* a game is wanted, the differentiated
mechanic is Metazooa's: wrong guesses reveal what the guess shares with the
answer — same block/group/period/category/discovery era — so **the periodic
table's own structure is the hint engine**. Nobody does property-deduction;
the incumbents all do letter feedback. Fully client-side.

**7. Scrubbable temperature/pressure (S).** Tangle/Victor-style reactive number:
scrub a temperature, watch phase states flip across the whole table and the
phase-landscape page. Data already exists (melting/boiling points). ptable has a
utilitarian slider; an Atlas version integrated with the phase landscape and the
"10% explosive" animation budget would be the explorable-explanation version.

**8. Data-driven tours (M).** Scrollytelling without violating "no original
prose": a tour is a JSON-defined sequence of graph states (highlight, zoom,
annotate with sourced quotes) over existing SVG views — a guided camera path,
not an essay. Scrollama/react-scrollama is the standard tooling.

**9. Abundance + price + criticality layer (S–M).** USGS Mineral Commodity
Summaries (public domain CSV, DOI 10.5066/P1WKQ63T) for production/price/
criticality on ~60 elements; Lodders 2010 / Asplund 2021 open papers for cosmic
abundances. Unlocks the Oddo–Harkins sawtooth chart, a log-price heatmap, and
EU/US criticality badges — high story-per-byte. Avoid CRC tables (proprietary).

**10. Annual "State of the Elements" edition (M, recurring).** Diff this year's
pipeline output against last year's: CIAAW atomic-weight revisions (biennial),
new nuclides, USGS price moves. Frozen year-stamped builds (`2026.…`), State-of-JS
style. Genuinely unclaimed format; pairs with the poster; compounds reputation.
Risk: a recurring editorial obligation in thin years.

### Tier 3 — cheap garnish or deliberate gimmicks

**11. GHS hazard pictograms (S).** PubChem PUG-View REST (already a source)
returns pictogram codes + H-statements per element compound. A hazard strip per
folio is pure data, sourced.

**12. Spectral sonification (S).** Map NIST emission lines down ~40 octaves to
Web Audio oscillators (the ACS 2023 / SMC 2024 technique) — "press H to hear
hydrogen." Shareable and accessibility-positive (blind/low-vision access is the
academic motivation). Do it cheap; don't lead with it.

**13. Minerals-per-element (M).** Via Wikidata mineral species (CC0) — oxygen
~4,000 species vs zero for noble gases is a great chart. **Avoid Mindat**
(confirmed restrictive: API non-commercial, no redistribution); RRUFF/IMA is
NC-flavoured too.

**14. Alternate "generous" layouts (M).** Re-sortable arrangements of the 118
tiles — piles/streams/clusters by density, discovery year, abundance (the
Coins/UCLAB pattern), or a build-time property-similarity layout (t-SNE-style).
The table is already a generous interface; this leans in.

**15. Embeddable widgets + oEmbed (M).** `/embed/:symbol` mini-folios with
pregenerated oEmbed JSON (118 static files — Datawrapper pattern). Real teacher
utility; the hidden cost is responsive-height scripts and CMS quirks forever.

**Skip:** Wordle-with-symbols clones (crowded), 3D/AR atom gimmicks (Google
Search owns casual AR; Elements 4D died with DAQRI), scraping periodictable.com
or CRC (copyright), Mindat (licence).

## 3. Top three picks

1. **Isotope/nuclide layer** — the largest data unlock that *deepens the core
   thesis*: decay chains literally add new edges to the element graph, and no
   generalist site visualizes nuclides beautifully.
2. **Computed emission spectra** — the highest design-payoff-per-byte; computed,
   print-native colour for every folio, on-brand with "the mark is the value."
3. **Provenanced dataset release + print pipeline** (tie, both S effort) — the
   two cheapest moves that exploit what Atlas already is: a citation-forward
   build pipeline and a print-grade SVG system. One earns developer goodwill and
   inbound links; the other fills a verified market gap (Byrne-style poster).

## 4. Transferable patterns worth keeping in mind

- **Reactive documents / scrubbable numbers** (Bret Victor, Red Blob Games):
  synchronized text↔diagram highlighting is the cheapest high-value explorable
  technique — hover "electronegativity" in a folio, the relevant bar lights up.
- **One persistent model at increasing fidelity** (Ciechanowski): a single
  recurring orbital/lattice SVG model across pages beats one-off illustrations.
- **Expandable inline context** (Nicky Case's Nutshell): layered Wikipedia/
  Wikidata extracts inline keep pages deep without violating no-original-prose.
- **Distill's cautionary tale**: 50+ hand-crafted hours per article burned the
  team out. Atlas's build-time computed approach is the scalable path — prefer
  generated fact panels everywhere plus a handful of flagship explorables.
- **Every Noise at Once's death** (upstream API dependence) validates Atlas's
  snapshot-at-build-time pipeline.

## Licence quick reference (verified this session)

| Source | Licence | Status |
|---|---|---|
| IAEA Livechart / NUBASE2020 | citation expected; exact ToU unread (JS page) | ⚠️ verify |
| NIST ASD | SRD copyright, "all rights reserved" | ⚠️ small cited extracts only |
| USGS MCS | US public domain | ✅ |
| Wikidata (incl. 4,775 isotope items) | CC0 | ✅ |
| PubChem (incl. GHS via PUG-View) | free, attribute annotations | ✅ |
| COD crystal structures | CC0 | ✅ |
| Materials Project | CC BY 4.0 (API key needed) | ✅ with key |
| Lodders/Asplund abundance papers | open papers; facts uncopyrightable | ✅ cite |
| Bowserinator JSON | CC BY-SA 3.0 (ShareAlike!) | ⚠️ |
| Mindat | non-commercial, no redistribution | ❌ avoid |
| RRUFF/IMA | educational/non-commercial flavoured | ⚠️ |
| CRC Handbook, periodictable.com tables | proprietary | ❌ avoid |

Wikidata coverage check (live SPARQL): P61 discoverer 111/118, P138 named-after
111/118, P575 discovery date 113/118 — excellent; **P366 "has use" only 22/118 —
too sparse to build on.**
