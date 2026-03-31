# Architecture

Atlas is an interactive periodic table explorer built with React, react-router, and Vite. It uses SVG-first rendering for data visualization with a Byrne-inspired design aesthetic: geometric shapes, primary colors, minimal ornamentation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, react-router v7 |
| Build | Vite 6, TypeScript 5.8 |
| Text measurement | @chenglou/pretext |
| Unit tests | Vitest + fast-check (property-based) |
| E2E tests | Playwright (5 viewport projects) |
| Deploy | Cloudflare Pages (via wrangler) |

## Directory Structure

```
src/
  pages/          # Route-level components (Home, Element, EtymologyMap, etc.)
  components/     # Shared components (PageShell, PeriodicTable, PretextSvg, VizNav, SiteNav)
  hooks/          # Custom hooks (useViewTransition, usePretextLines, useGridNavigation, useIsMobile)
  lib/            # Pure logic (data.ts, grid.ts, theme.ts, pretext.ts, types.ts)
data/
  generated/      # Static JSON (elements.json, per-element files, groups, anomalies, etymology, etc.)
scripts/          # Build-time data derivation (derive-data.ts, generate-seed.ts)
tests/            # Unit + property-based tests
tests/e2e/        # Playwright specs
```

## Design System

**Color palette** (defined in `src/lib/theme.ts` — single source of truth):

| Token | Hex | Role |
|-------|-----|------|
| `DEEP_BLUE` | `#133e7c` | s-block, primary accent |
| `WARM_RED` | `#9e1c2c` | d-block, active states |
| `MUSTARD` | `#856912` | p-block, secondary accent |
| `BLACK` | `#0f0f0f` | f-block, text, rules |
| `PAPER` | `#f7f2e8` | Background, light fills |

Block-based color coding maps s/p/d/f blocks to `DEEP_BLUE`/`MUSTARD`/`WARM_RED`/`BLACK` respectively (see `blockColor()` in `grid.ts`). All text colors are computed via WCAG relative luminance to guarantee AA contrast (4.5:1 minimum) against their fill — see `contrastTextColor()`.

**Typography**: System font stack (`system-ui, sans-serif`) for body; monospace stack (`SF Mono`, `Cascadia Code`, `Fira Code`) for data labels via `MONO_FONT`.

**Shared style constants** (`theme.ts`):
- `INSCRIPTION_STYLE` — 13px bold uppercase, 0.2em tracking (page h1 headings)
- `SECTION_HEADING_STYLE` — 20px bold, 0.05em tracking (section h2 headings)
- `BACK_LINK_STYLE` — 14px with left arrow affordance

**Wordmark**: The ATLAS wordmark in the left gutter uses alternating letter sizes (A/L/A at 28px, T/S at 22px) with Byrne palette colors for visual rhythm.

## Layout Architecture

`PageShell` (`src/components/PageShell.tsx`) provides the top-level CSS Grid:

```
Desktop: [64px wordmark gutter] [1fr content column]
Mobile:  [1fr full-width]
```

Grid rows: `auto` (header/VizNav) | `1fr` (main content) | `auto` (SiteNav footer). The left gutter renders a vertical "ATLAS" wordmark on desktop and collapses on mobile (breakpoint via `useIsMobile` hook at 768px).

Visualization pages pass `vizNav` to PageShell, which renders the `VizNav` navigation bar in the header slot.

**VizNav tab order**: Table-showing pages come first (Table, Phase, Neighbours, Anomalies) for smooth cross-tab transitions, followed by non-table visualizations (Scatter, Timeline, Etymology, Discoverers).

**Table alignment principle**: Pages that show a periodic table (Home, Phase, Neighbours, Anomalies) keep controls/filters/legend as HTML above the SVG, with the SVG containing only the grid at y=0. This ensures the table appears at the same screen position across tabs.

**Information hierarchy principle**: Controls belong above the content they control (e.g., Timeline's era browse links above the chart).

## Data Layer

Static JSON files live in `data/generated/`, produced at build time by `scripts/derive-data.ts`.

**Core data access** (`src/lib/data.ts`):
- `allElements` — array of all 118 `ElementRecord` objects, imported synchronously at module scope
- `bySymbol` — `Map<string, ElementRecord>` for O(1) lookup via `getElement(symbol)`
- `searchElements(query)` — filtered + relevance-sorted search

**Route loaders** (`src/routes.tsx`) use dynamic `import()` for per-route JSON (element details, groups, anomalies, etymology, discoverers, timeline). Shared datasets are cached in module-level variables (`groupsCache`, `anomaliesCache`, `discoverersCache`, `timelineCache`) to avoid redundant fetches.

All route components are `lazy()` imports for code splitting.

## Rendering Philosophy

SVG-first for all data visualizations. Each visualization page owns its SVG — there is no shared chart abstraction. This keeps each page self-contained and avoids generalization overhead.

**Periodic table grid** (`src/lib/grid.ts`):
- IUPAC 18-column layout with separated lanthanide/actinide rows (rows 9-10)
- Cell positions computed once at module scope: `56×64px` cells, positions stored in `positionsBySymbol` Map
- `adjacencyMap` pre-computed for all 118 elements — enables arrow-key navigation via `useGridNavigation`
- ViewBox: `1008×704px` (18 columns × 56px, 10 rows + gap × 64px)

**Element cells** (`PeriodicTable.tsx`):
- `React.memo` with custom comparator (compares `fill`, `textColor`, `isActive`, `isDimmed`, `hasLoaded`, `dist`)
- Fill and text-color maps pre-computed via `useMemo` keyed on `highlightMode` + `property`
- Property ranges computed once at module scope

## Text Rendering

`@chenglou/pretext` provides canvas-based text measurement for precise SVG text layout. Wrapped in `src/lib/pretext.ts` with three tiers:

1. **`measureLines`** — simple word-wrap into fixed-width lines
2. **`shapeText`** — variable width per line (for flowing text around data plates)
3. **`dropCapLayout`** — large initial character with body text flowing around it

`PretextSvg` (`src/components/PretextSvg.tsx`) renders measured `PositionedLine[]` as SVG `<text>` elements. Supports optional drop caps, inter-line rules, inline sparklines, centered text, and per-line staggered reveal animation.

Hooks in `src/hooks/usePretextLines.ts` memoize measurement results:
- `usePretextLines` — Tier 1 simple lines
- `useShapedText` — Tier 2 variable-width flow (accounts for data plate and identity block indents)
- `useWedgeText` — V-shaped progressive widening
- `useDropCapText` — Tier 3 drop cap layout

## Animation Strategy

"90% still, 10% explosive" — most of the UI is static; animations are reserved for transitions and entry moments.

**CSS keyframe animations** (defined in `globals.css`):
- `folio-line-reveal` — staggered text line entry (opacity + translateY)
- `bar-grow` — horizontal bar reveal via clip-path
- `plate-wipe` — data plate entry
- `rule-draw` — horizontal rule drawing via clip-path
- `anomaly-ripple` — scale pulse on highlighted cells

**View Transitions API** (`src/hooks/useViewTransition.ts`):
- Wraps `document.startViewTransition()` around react-router navigation
- Element symbols get `view-transition-name` for morphing between grid and folio
- Falls back to instant navigation when API unavailable

**Staggered entry**: Cell animations use `atomicNumber * N ms` delay; discoverer rows use `rowIdx * 40ms`; text lines use configurable `animationStagger` prop.

**Reduced motion**: Respected via `prefers-reduced-motion` media query in CSS.

## Performance Patterns

See `PERFORMANCE.md` for detailed analysis. Key patterns in use:

- **`React.memo` with custom comparators** on `ElementCell` — prevents re-render of all 118 cells on hover/highlight changes
- **Pre-computed fill maps** via `useMemo` keyed on `[highlightMode, property]` — avoids per-cell color computation
- **Module-level caching** in route loaders — `groupsCache`, `anomaliesCache`, etc. prevent redundant JSON imports
- **Module-level position computation** — `positionsBySymbol`, `adjacencyMap`, and `PROPERTY_RANGES` computed once on import
- **Lazy route components** — all pages are `lazy()` imports
- **CSS containment** on animated containers (clip-path based reveal)

## Testing Strategy

Property-based testing (PBT) philosophy: tests assert universal properties across all routes and elements rather than spot-checking individual cases. Uses `fast-check` for PBT via Vitest.

**Unit tests** (`tests/`):
- `grid.property.test.ts` — all 118 elements have unique positions within viewBox bounds; adjacency map covers all elements
- `data.property.test.ts` — data integrity invariants across all elements
- `pretext.property.test.ts` — text measurement properties
- `compare.test.ts`, `data.test.ts`, `grid.test.ts` — specific behavior tests

**E2E tests** (`tests/e2e/`):
- 5 Playwright viewport projects (desktop, mobile, iPhone 15/16/17 variants)
- `layout-consistency.spec.ts` — PageShell grid structure, wordmark, anomaly filters, drop cap readability
- `etymology-map.spec.ts` — semantic headings, theme colors, card positions, focus styles, link patterns
- `structural-audit.spec.ts` — VizNav tab order, h1 visibility, console errors, keyboard overlay, roundel design, timeline hierarchy
- `readability-legibility.spec.ts` — WCAG contrast verification
- `navigation.spec.ts` — route transitions and keyboard navigation
- `visualization-pages.spec.ts` — visualization page rendering
- `page-stability.spec.ts` — no layout shifts or JS errors

## Key Invariants

- All 118 elements have unique grid positions within the SVG viewBox (`1008×704`)
- Adjacency map covers all 118 elements; every direction is either a valid symbol or `null`
- Block colors are consistent between `grid.ts` (`blockColor`), `theme.ts` (palette), and `globals.css`
- Every page wraps content in `PageShell`, maintaining consistent grid structure
- WCAG AA contrast ratios (4.5:1) on all text — enforced by `contrastTextColor()` and verified in e2e tests
- Color palette hex values are never hardcoded outside `theme.ts`
- Entity Graph uses roundel design (always-filled nodes with PAPER text) for guaranteed readability
- SVG elements with drop caps or text near edges use `overflow="visible"` to prevent clipping
- VizNav tab order places table-showing pages first for transition coherence

## Alignment Grid

**Base unit**: 4px — all spacing values are multiples of 4px (CSS variables `--sp-1` through `--sp-12`).

**Cell grid**: 56px wide × 64px tall, 18 columns × 10 rows (with f-block gap). ViewBox: 1008×704px.

**PageShell gutter**: 64px (exactly one cell width + 8px padding). Body padding: 24px top/bottom, 16px left/right (mobile: 16/12).

## Faceted Navigation Ideas

Interactive exploration concepts that could enrich Atlas. Each leverages existing element properties but notes where additional data sourcing would unlock richer interactions.

### Interactive Property Sliders

- Mass, electronegativity, ionisation energy, and radius sliders that filter the periodic table in real-time
- As the user drags a slider, elements outside the range dim and elements inside glow
- Multiple sliders can be combined for constraint-based exploration ("show elements where EN > 2.5 AND radius < 150")
- **Caveat:** While we have these 4 properties, richer slider interactions would benefit from sourcing additional numeric data (melting/boiling points, density, abundance) from our three data providers (Wikidata, PubChem, Wikipedia)

### Phase at STP

- Temperature slider showing phase transitions as you drag from 0K to 10,000K
- Pressure dimension could be added for a 2D phase explorer
- Current static phase coloring on PhaseLandscape could become dynamic

### Discovery Year and Discoverer

- Timeline scrubber that builds the periodic table element-by-element as you drag through history
- "Year 1850: 45 elements known" counter that updates in real-time
- Discovery rate histogram showing elements/decade

### Neighbours Array

- Relationship type toggles (group, period, phase, category) with edges appearing/disappearing
- Similarity search: "show elements like Copper" using custom distance metric
- Periodic law proof: click an element, drag down its group, watch properties animate smoothly

### Etymology Origin

- Etymology network graph — nodes are origins (Curie, Mars, Ytterby), edges connect to named elements
- Force-directed layout that clusters elements by naming pattern
- Naming timeline showing how etymology categories shifted over centuries

### Rankings

- Drag-to-reorder the periodic table by any property
- Side-by-side ranking comparison between two properties
- "Where does element X fall?" interactive rank locator
