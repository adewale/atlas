# Atlas

A periodic table as a navigable atlas — every element a folio, every property a visual mark.

Atlas treats the periodic table as a directed graph of 118 elements connected by position, category, discovery, etymology, and measurable properties. The web app exposes that graph through an interactive periodic table, individual element folios, and seven visualization pages — all rendered with precise SVG text layout via [@chenglou/pretext](https://github.com/chenglou/pretext).

## Design

60% [Oliver Byrne](https://www.c82.net/euclid/) visual drama, 40% [Edward Tufte](https://www.edwardtufte.com/) data density:

- **Hard color fields** — solid rects, no gradients, no border-radius
- **Four colors** — paper `#f7f2e8`, deep blue `#133e7c`, warm red `#9e1c2c`, mustard `#c59b1a`
- **Block identity** — s/p/d/f blocks map to blue/mustard/red/black so you recognise the block before reading a word
- **Giant numerals** — atomic number and symbol are hero elements, not labels
- **High data-ink ratio** — property bars where length IS the value, inline sparklines, no chartjunk
- **Pretext typography** — all body text measured and positioned with `@chenglou/pretext`, rendered as SVG `<text>` elements with thin rules between lines
- **90% still, 10% explosive** — text staggers in line-by-line, data plates wipe, bars grow, symbols morph via the View Transitions API

## Quick Start

```bash
npm install
npm run build:data   # derive element data from seed
npm run dev          # http://localhost:5173
```

## Pages

| Route | What it shows |
|---|---|
| `/` | Interactive periodic table with keyboard navigation (arrow keys + Enter) |
| `/element/:symbol` | Folio — one element's full story with shaped text flowing around a data plate |
| `/compare/:a/:b` | Side-by-side element comparison with split-screen animation |
| `/phase-landscape` | Elements arranged by melting and boiling points |
| `/property-scatter` | Scatter plot of any two numeric properties |
| `/anomaly-explorer` | Interactive exploration of periodic table rule-breakers |
| `/neighborhood-graph` | Force-directed graph of element relationships |
| `/discovery-timeline` | When every element was discovered, from antiquity to 2010s |
| `/etymology-map` | Elements grouped by the origin of their names |
| `/discoverer-network` | Who discovered what, with lateral navigation between co-discoveries |
| `/atlas/group/:n` | Elements in a specific IUPAC group |
| `/atlas/period/:n` | Elements in a specific period |
| `/atlas/block/:b` | Elements in an electron block (s/p/d/f) |
| `/atlas/category/:slug` | Elements by category (alkali metal, halogen, etc.) |
| `/atlas/rank/:property` | Elements ranked by a numeric property |
| `/atlas/anomaly/:slug` | Elements involved in a specific anomaly |

## Graph Navigation

Every element folio connects to its neighbors in the directed graph:

- **Positional** — prev/next by atomic number
- **Categorical** — group, period, block, category index pages
- **Historical** — other elements by the same discoverer, link to discovery timeline
- **Etymological** — other elements sharing a name origin, link to etymology map
- **Property-based** — rankings, anomalies, scatter plots

## Architecture

```
src/
  components/    React components (PeriodicTable, Folio, PretextSvg, ...)
  pages/         Route-level page components (lazy-loaded)
  hooks/         usePretextLines, useShapedText, useViewTransition, ...
  lib/           data access, pretext wrapper, theme, grid layout
data/
  seed/          Source element data (committed)
  generated/     Derived JSON files (built from seed via scripts/)
scripts/         Data derivation and enrichment scripts
tests/
  unit/          Vitest unit tests
  e2e/           Playwright end-to-end tests (desktop + mobile)
```

**Key dependencies:**

- **React 19** + **React Router 7** — routing with lazy loading and data loaders
- **@chenglou/pretext** — precise text measurement for SVG layout (three tiers: simple lines, shaped text around plates, label fitting)
- **Vite 6** — build tooling with ES2022 target
- **Playwright** — e2e tests covering all visualization pages, readability, and no-overlap assertions

## Data Pipeline

```bash
npm run build:data
```

Reads `data/seed/elements.json` (118 elements with properties from PubChem, identifiers from Wikidata, summaries from Wikipedia) and derives:

- `elements.json` — full array
- `element-*.json` — one file per element (for route-level code splitting)
- `groups.json`, `periods.json`, `blocks.json`, `categories.json` — structural indices
- `rankings.json` — elements sorted by mass, electronegativity, ionization energy, radius
- `anomalies.json`, `discoverers.json`, `etymology.json`, `timeline.json` — visualization data

## Testing

```bash
npm test              # unit tests (Vitest)
npm run test:e2e      # e2e tests (Playwright, desktop + mobile)
```

The e2e suite includes:

- **Navigation tests** — every route loads, keyboard nav works, transitions complete
- **Visualization page tests** — element counts, corner separation, hover tooltips, click navigation
- **Readability/legibility tests** — bounding-box overlap detection (`assertNoOverlap`), visible text assertions, mobile layout checks, page transition roundtrips

## Deploy

```bash
npm run deploy   # builds and deploys to Cloudflare Pages
```

## License

Data: PubChem (public domain), Wikidata (CC0 1.0), Wikipedia excerpts (CC BY-SA 4.0).
