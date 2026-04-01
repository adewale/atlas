# Data Pipeline and Performance

How data flows from external sources to rendered screens, and the performance
characteristics at each stage.

## Data Sources

Atlas draws from three public data sources, merged into a single seed file
at authoring time:

| Source | License | What it provides |
|--------|---------|-----------------|
| PubChem | Public domain | mass, electronegativity, ionisation energy, radius, density, melting/boiling points, half-life |
| Wikidata | CC0 1.0 | identifiers (wikidataId), classification (group, period, block, category, phase) |
| Wikipedia | CC BY-SA 4.0 | text summaries, etymology descriptions, discoverer names, discovery years |

## Build Pipeline

```
data/seed/elements.json        (human-curated, committed)
        │
        │  npm run build:data
        │  scripts/derive-data.ts (deterministic)
        ▼
data/generated/                 (131 files, 497KB total)
  ├── elements.json             176KB  118 elements, sources stripped
  ├── element-{Sym}.json ×118   ~2KB each, WITH sources
  ├── groups.json               4.5KB  18 groups
  ├── periods.json              5.7KB  7 periods
  ├── blocks.json               4KB    4 blocks
  ├── categories.json           4.2KB  9 categories
  ├── rankings.json             8KB    8 property rankings
  ├── anomalies.json            2.6KB  5 anomaly types
  ├── timeline.json             12KB   discovery chronology
  ├── etymology.json            16KB   etymology origins
  ├── discoverers.json          8KB    discoverers index
  └── credits.json              28KB   attribution
        │
        │  vite build (code-splitting via manualChunks)
        ▼
dist/assets/                    (168 JS chunks)
```

## Code-Splitting Strategy

Vite splits the output into three tiers based on when data is needed:

### Tier 1: Critical Path (loaded on every page visit)

```
index-*.js          230KB (66KB gz)    App code
react-vendor-*.js     4KB  (2KB gz)    React + ReactDOM
react-router-*.js    96KB (33KB gz)    Router
pretext-*.js         29KB  (9KB gz)    Text measurement
Home-*.js             8KB  (3KB gz)    Home page component
PageShell-*.js        9KB  (3KB gz)    Layout shell
grid-*.js             2KB  (1KB gz)    Grid utilities
index-*.css           4KB  (2KB gz)    Styles

Total first paint: ~117KB gzipped
```

### Tier 2: Idle Prefetch (background, after home page paints)

```
groups-*.js          4.5KB             Prefetched via requestIdleCallback
anomalies-*.js         2KB             Prefetched via requestIdleCallback
Element-*.js          17KB             Prefetched via requestIdleCallback
```

These are warmed into the ES module cache during idle so the first element
click resolves instantly instead of waiting for network.

### Tier 3: On Demand (loaded when navigating to specific routes)

```
element-Fe-*.js        2KB             Per-element detail (118 chunks)
elements-*.js        148KB (35KB gz)   Full dataset (rankings page only)
timeline-*.js          8KB             Discovery timeline
etymology-*.js         9KB             Etymology map
discoverers-*.js       5KB             Discoverer network
credits-*.js          18KB             Credits page
... (15 page components)
```

## Runtime Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RUNTIME                                     │
│                                                                     │
│  HOME PAGE                                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ data.ts <── elements.json (static import, Vite code-splits) │   │
│  │   ├── allElements (118 records, sync, module scope)          │   │
│  │   ├── bySymbol Map (O(1) lookup)                             │   │
│  │   └── searchElements()                                       │   │
│  │                    │                                          │   │
│  │  ┌────────────────┼────────────────────────┐                 │   │
│  │  │ grid.ts         │  PeriodicTable.tsx     │                 │   │
│  │  │ CELL_POSITIONS  │  118 x ElementCell     │                 │   │
│  │  │ PROPERTY_RANGES │  833 SVG DOM nodes     │                 │   │
│  │  │ (computed once  │  useDropCapText (1x)   │                 │   │
│  │  │  at module load)│                        │                 │   │
│  │  └─────────────────┴────────────────────────┘                 │   │
│  │                                                               │   │
│  │  After paint: prefetch groups + anomalies + Element component │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ELEMENT DETAIL (/element/:symbol)                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Route loader (parallel):                                     │   │
│  │   element-Fe.json ── 2KB, dynamic import (on-demand)         │   │
│  │   groups.json ────── already in module cache (prefetched)    │   │
│  │   anomalies.json ─── already in module cache (prefetched)    │   │
│  │                                                               │   │
│  │ Element.tsx -> Folio.tsx                                      │   │
│  │   getElement('Fe') ── O(1) from bySymbol Map (already loaded)│   │
│  │   sources ── from loader (per-element file)                   │   │
│  │   groups ── from loader cache                                 │   │
│  │   anomalies ── from loader cache                              │   │
│  │   useShapedText (1x), usePretextLines (2x)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  VISUALIZATION PAGES                                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ PropertyScatter ── allElements (already loaded)              │   │
│  │ PhaseLandscape ─── allElements (already loaded)              │   │
│  │ AnomalyExplorer ── allElements + anomalies.json (prefetched) │   │
│  │ DiscoveryTimeline ── timeline.json (on-demand, 8KB)          │   │
│  │ EtymologyMap ────── etymology.json (on-demand, 9KB)          │   │
│  │ DiscovererNetwork ─ discoverers.json (on-demand, 5KB)        │   │
│  │ NeighborhoodGraph ─ allElements (already loaded)             │   │
│  │ Rankings ────────── elements.json + rankings.json (on-demand)│   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Performance by Network Condition

### Page Load (Home)

| Network | Transfer | Time to Interactive |
|---------|----------|---------------------|
| Desktop (50 Mbps) | ~117KB gz | ~100ms |
| 4G (10 Mbps) | ~117KB gz | ~370ms |
| 3G (1.6 Mbps) | ~117KB gz | ~1.3s |

### First Element Click

| Network | Before prefetch | After prefetch |
|---------|-----------------|----------------|
| Desktop (50 Mbps) | ~150ms (3 fetches) | ~30ms (1 fetch, 2KB) |
| 4G (10 Mbps) | ~400ms (3 fetches) | ~80ms (1 fetch, 2KB) |
| 3G (1.6 Mbps) | ~1.2s (3 fetches) | ~250ms (1 fetch, 2KB) |

### Subsequent Element Clicks

Groups and anomalies are cached in memory. Only the 2KB per-element file
loads on each navigation. ~20ms on desktop, ~60ms on 4G, ~200ms on 3G.

## Performance by Viewport

### SVG Rendering

All viewports render the same 833 SVG DOM nodes (118 cells x 7 elements
each, plus 7 structural lines). No viewport-specific rendering
optimizations exist at the component level.

| Viewport | SVG min-width | Horizontal scroll | Notes |
|----------|---------------|-------------------|-------|
| Desktop (1280px) | 1008px | No | Table fits naturally |
| Mobile landscape (844px) | 600px | No | Table fits viewport |
| Mobile portrait (390px) | 600px | ~210px | Single-finger scroll enabled via `pan-x pan-y pinch-zoom` |

### Transition Cost

The highlight-mode ripple transitions `fill` on 118 `<rect>` elements over
~450ms. `fill` is not GPU-compositable and triggers repaint per frame.

| Viewport | Paint ops per frame | Concern |
|----------|-------------------|---------|
| Desktop | 118 rects | Fine |
| Mobile | 118 rects | Moderate (mobile GPUs have 3-6x lower fill rates) |

Text elements (354 total) do NOT transition fill. Their colour snaps
instantly, reducing paint ops by 75% vs animating all elements.

### Entrance Animation

The entrance animation uses `opacity` and `transform` (GPU-compositable),
staggered by `atomicNumber * 4ms`. Total duration: 672ms. This performs
well on all viewports.

## Caching Strategy

| Cache layer | What | Lifetime |
|-------------|------|----------|
| Content-hashed filenames | All JS/CSS chunks | Until content changes (effectively forever for vendor chunks) |
| ES module cache | `import()` calls | Browser session |
| In-memory cache (routes.tsx) | groups, anomalies, discoverers, timeline | Browser session |
| Idle prefetch | groups + anomalies + Element component | Warmed on every home page visit |

## Key Design Decisions

1. **Static JSON, not a database.** 118 elements change on the timescale of
   years. All data ships as immutable, edge-cached JS chunks. Zero runtime
   API calls, full offline capability.

2. **Eager allElements, lazy per-element.** The 118-element array (176KB raw,
   35KB gz) loads eagerly because grid positions and property ranges are
   computed at module scope. Per-element files with sources (2KB each) load
   on demand.

3. **Idle prefetch, not eager preload.** Groups and anomalies are prefetched
   via `requestIdleCallback` after the home page paints, not blocking first
   paint. The Element page component is also prefetched.

4. **Synchronous text measurement.** `useMemo` with `@chenglou/pretext`
   (OffscreenCanvas). No flash of empty content, no CLS. Measurement cost
   is sub-millisecond per call.

5. **CSS containment on wrapper div.** `contain: layout style paint` on the
   scroll container prevents reflow propagation during interactions.

6. **Fill transition on rects only.** Text colour snaps instantly. Reduces
   paint operations from 472 to 118 during highlight mode changes.
