# Animation Palette

Living reference for the Atlas animation system.

> "90% still, 10% explosive" — most of the UI is static; animations are reserved
> for transitions and entry moments.

See the interactive exemplars at `/animation-palette`.

---

## Design Principles

1. **Spatial continuity.** Elements don't disappear and reappear — they morph.
   The symbol, number, name, and cell background transform in place so users
   understand the relationship between pages.
2. **Two tiers, not ten.** All view transitions use either 150ms (chrome) or
   250ms (identity morphs). No ad-hoc durations.
3. **Two curves, not four.** `--ease-out` is the default. `--ease-spring` is
   reserved for the hero symbol bounce. Other easing variables exist for
   interactive states (hover, toggle) but are never used in view transitions.
4. **Colour is a character.** Block colour flows from grid cell rect through the
   Folio accent bar, colour rule, and data plate — the surface morph carries the
   colour automatically.
5. **Accessibility first.** All animations honour `prefers-reduced-motion: reduce`.
   Durations collapse to 0.01ms — transitions still fire but complete instantly.

---

## Easing Curves

| Token | Curve | Role |
|-------|-------|------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default — all view transitions, all entry animations |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Hero accent — `element-symbol` only (bounce) |

`--ease-snap` and `--ease-in-out` remain defined for interactive hover/toggle
states but are never used in view transitions or entry animations.

---

## Duration Tiers

| Tier | Duration | Used For |
|------|----------|----------|
| **Fast** | 150ms | Persistent chrome: `viz-nav`, `nav-back`, `color-rule`, `viz-title`, root cross-fade |
| **Standard** | 250ms | Identity morphs: `element-symbol`, `element-number`, `element-name`, `element-cell-bg`, `data-plate-*` |

---

## View Transition Names

11 named shared elements defined in `src/lib/transitions.ts` as the `VT` constant object.

### Text Morphs (4)

| Name | What Morphs | Source Surfaces | Target |
|------|-------------|----------------|--------|
| `element-symbol` | Symbol text (Fe, Au) | PeriodicTable, AtlasPlate, EtymologyMap, PhaseLandscape, AnomalyExplorer | Folio hero |
| `element-number` | Atomic number (026) | PeriodicTable, AtlasPlate, AnomalyExplorer | Folio hero |
| `element-name` | Element name (Iron) | PeriodicTable | Folio `<h2>` |
| `viz-title` | Page heading | All viz pages | Next viz page |

### Surface Morphs (5)

| Name | What Morphs | From / To |
|------|-------------|-----------|
| `element-cell-bg` | Coloured cell rect | Grid/card rect → Folio 4px vertical accent bar |
| `data-plate-group` | Group row | Folio SVG row ↔ AtlasBrowsePage coloured badge |
| `data-plate-period` | Period row | Folio SVG row ↔ AtlasBrowsePage coloured badge |
| `data-plate-block` | Block row | Folio SVG row ↔ AtlasBrowsePage coloured badge |
| `color-rule` | 4px coloured rule | Folio, AtlasBrowsePage, TimelineEra, DiscovererDetail |

### Chrome Morphs (2)

| Name | What Morphs | Where |
|------|-------------|-------|
| `viz-nav` | Navigation bar | All viz pages |
| `nav-back` | Back link (← Table) | All pages with back links |

### Colour Morphs (free)

Colour carries automatically through surface morphs:

- **Block colour** flows from the cell `<rect>` fill through `element-cell-bg`
  to the Folio accent bar.
- **Data plate fill** (deep blue, warm red, block colour) flows from the Folio
  SVG row through `data-plate-*` to the browse page coloured badge.
- **Inline fill** on all grid cell rects uses
  `transition: fill 250ms var(--ease-out)` for consistent interactive colour
  changes on hover/selection.

---

## Entry Keyframes

Five canonical keyframes for on-page entry animations.

| Keyframe | Animation | Typical Duration |
|----------|-----------|-----------------|
| `folio-line-reveal` | `opacity 0→1, translateY 6px→0` | 400ms |
| `card-enter` | `opacity 0→1, translateY 8px→0` | 250ms |
| `wipe-left` | `clip-path: inset(0 100% 0 0) → inset(0)` | 350ms |
| `sparkline-draw` | `stroke-dashoffset → 0` | 400ms |
| `svg-fade-in` | `opacity 0→1` (SVG-safe, no transform) | 300ms |

### Aliases

Three keyframes share the `wipe-left` implementation (identical `clip-path`
animation). They exist as separate names so call-sites read clearly:

- `plate-wipe` — data plate horizontal reveal
- `bar-grow` — property bar expansion
- `rule-draw` — horizontal rule drawing

### Stagger & Ripple Patterns

Two categories of staggered animation exist in Atlas:

#### Spatial ripple (fill transitions — cells change colour in place)

Cells are always visible. Colour changes propagate outward from an origin
point using Manhattan distance. The cell *stains* rather than appearing.

| Surface | Trigger | Origin | Delay | Duration | Easing |
|---------|---------|--------|-------|----------|--------|
| PeriodicTable highlight | Mode/property change | Last hovered cell | `dist * 8ms` (Manhattan) | 250ms | `--ease-out` |
| AnomalyExplorer stain | Anomaly category selection | First highlighted element | `dist * 8ms` (Manhattan) | 250ms | `--ease-out` |

Both use the same mechanism: `transition: fill 250ms var(--ease-out) ${dist * 8}ms`.
The `dist` is Manhattan distance (|Δcol| + |Δrow|) from the origin cell.

#### Sequential cascade (entry animations — elements appear on page load)

Elements are initially invisible. They fade/slide/wipe in with index-based
delays, creating a top-to-bottom or first-to-last cascade.

| Surface | Keyframe | Delay | Duration | Easing |
|---------|----------|-------|----------|--------|
| PeriodicTable cells | opacity + translateY | `atomicNumber * 4ms` | 200ms | `--ease-spring` |
| PhaseLandscape cells | opacity + translateY | `atomicNumber * 4ms` | 200ms | `--ease-spring` |
| AtlasPlate cards | `card-enter` | `index * 15ms` | 250ms | `--ease-out` |
| PretextSvg text lines | `folio-line-reveal` | `i * animationStagger` (25-60ms) | 300-400ms | `--ease-out` |
| PropertyBar / CompareView | `bar-grow` | index-based | 300ms | `--ease-out` |
| DiscovererNetwork rows | `bar-grow` | `rowIdx * 40ms` | 500ms | `--ease-out` |
| DiscoveryTimeline squares | opacity | `sq.delay` | 300ms | `--ease-out` |
| NeighborhoodGraph edges | `rule-draw` | `atomicNumber * 6ms` | 400ms | `--ease-out` |

---

## Root Transition

All page changes use a directional cross-fade:

| Phase | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| Old (exit) | `opacity 1→0, translateY 0→3px` | 150ms | `--ease-out` |
| New (enter) | `opacity 0→1, translateY -3px→0` | 150ms | `--ease-out` |

The old page sinks slightly as the new one rises — a subtle directional cue.

---

## Constants & Helpers

All transition name strings live in `src/lib/transitions.ts`:

```typescript
import { VT, vt } from '../lib/transitions';

// Use constants instead of raw strings
viewTransitionName: VT.SYMBOL

// Conditional helper replaces the repeated ternary
viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL)
```

This catches typos at build time and provides a single inventory.

---

## File Map

| File | Role |
|------|------|
| `src/lib/transitions.ts` | `VT` constants and `vt()` helper |
| `src/globals.css` | Keyframes, view transition CSS rules, easing variables |
| `src/hooks/useViewTransition.ts` | `useViewTransitionNavigate()` hook |
| `src/pages/AnimationPalette.tsx` | Interactive exemplar page |
| `docs/animation-palette.md` | This document |

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations and transitions complete instantly. View transitions still fire
(maintaining navigation semantics) but are imperceptible.
