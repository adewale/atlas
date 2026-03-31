# Internal Consistency Audit — Atlas

Date: 2026-03-31
Scope: Entire project (`src`, `tests`, `docs`, config)

## Executive verdict

**Minor** — The project is generally coherent and test-stable, but there are several consistency drifts that increase maintenance risk:

1. duplicated navigation/content registries that can diverge,
2. duplicated keyboard-help UI/content,
3. inconsistent type-safety strategy around route loader caches,
4. repeated non-null assertion pattern that contradicts defensive filtering,
5. mixed styling strategy (global CSS + heavy inline styles) without a clear boundary.

None are immediate runtime blockers today, but they create future inconsistency hazards.

---

## Methodology

- Ran static checks that are available in this repo.
- Reviewed architecture and key UI/data-routing modules.
- Looked specifically for: duplication, naming/pattern drift, contradictory abstractions, and dead/suspicious patterns.

Commands used:

- `npm run -s typecheck` ✅
- `npm run -s lint` ⚠️ (tooling config mismatch: ESLint v9 requires flat config, repo appears not migrated)
- `npm test` ✅
- `rg -n "TODO|FIXME|HACK|XXX|console\.log|debugger" src docs tests`
- targeted source inspection with `sed` in `src/routes.tsx`, `src/components/*`, and `src/pages/*`.

---

## Findings by theme

### 1) Source-of-truth drift in navigation and route metadata

**What is inconsistent**

The app keeps user-facing route catalogs in multiple places with overlapping concerns:

- route registration in `src/routes.tsx`,
- visualization nav list in `src/components/VizNav.tsx`,
- entity/route catalog in `src/pages/EntityMap.tsx`.

These are manually maintained and not derived from a shared schema, so labels/paths/descriptions can drift.

**Evidence**

- `VIZ_PAGES` hardcodes viz routes/labels in one place.
- `ENTITIES` separately hardcodes route templates and examples.
- actual router paths are independently defined in `createBrowserRouter`.

**Risk**

- Silent UX inconsistency (a route present in one place but absent/misnamed elsewhere).
- Increased cost for adding/removing pages.

**Recommended action**

Introduce a centralized route metadata module (e.g., `src/lib/routeMeta.ts`) and have `routes.tsx`, `VizNav`, and `EntityMap` consume it.

---

### 2) Duplicated keyboard-help implementation with content drift

**What is inconsistent**

`KeyboardHelp.tsx` and `HelpOverlay.tsx` implement nearly the same panel layout and mostly the same shortcut content, but not exactly the same text.

**Evidence**

- Both define `PANEL_WIDTH`, `INTRO_FONT`, `SHORTCUTS`, and intro text independently.
- Shortcut strings differ (`"Close overlay or clear search"` vs `"Clear search or close panel"`; `"Toggle this overlay"` vs `"Toggle this panel"`).
- Intro text differs in included detail (one includes the "118 elements / 7 periods / 18 groups / 4 blocks" sentence, one does not).

**Risk**

- Documentation-in-UI inconsistency for keyboard behavior.
- Bug fixes and wording updates must be done in two places.

**Recommended action**

Extract shared constants and shared panel renderer (or one component with display mode props).

---

### 3) Type-safety inconsistency in loader caches

**What is inconsistent**

`src/routes.tsx` uses module-level caches typed as `unknown`, then returns cached values through typed loaders.

**Evidence**

- `let groupsCache: unknown = null;` (and similar for anomalies/discoverers/timeline).
- Later loaders return objects assuming concrete shapes.

**Risk**

- TypeScript cannot protect cache usage, so schema mismatches will surface at runtime only.
- Contradicts otherwise strong typing in the rest of the codebase.

**Recommended action**

Type each cache with the actual data contract (e.g., `GroupData[] | null`, etc.) and/or parse/validate imports at load boundaries.

---

### 4) Contradictory null-handling pattern (`!` + `filter(Boolean)`)

**What is inconsistent**

Several pages/components use `getElement(s)!` and then `.filter(Boolean)`.

**Evidence**

- Example pattern: `symbols.map((s) => getElement(s)!).filter(Boolean)`.
- `getElement` itself returns `ElementRecord | undefined`, so non-null assertion and runtime filtering express conflicting assumptions.

**Risk**

- Signals uncertainty to readers and reviewers.
- If data ever becomes inconsistent, `!` prevents static warnings while runtime logic depends on optionality.

**Recommended action**

Pick one strategy:

- strict assumption: keep `!`, remove filter, and enforce data invariant upstream, or
- defensive strategy: drop `!` and use a typed predicate filter.

---

### 5) Styling architecture is mixed without explicit policy

**What is inconsistent**

The project uses both global stylesheet patterns and large inline-style objects across many components/pages.

**Evidence**

- `src/globals.css` defines shared layout/animation tokens.
- many components/pages define extensive inline style objects and repeated typography/layout declarations.

**Risk**

- Design changes require touching many files.
- Slight typography/spacing drifts are easy to introduce.

**Recommended action**

Document a style boundary (e.g., "tokens/animations in CSS, component layout via classes, dynamic one-off via inline style") and progressively extract repeated inline blocks into shared style helpers or classes.

---

## Positive consistency signals

- Test suite is broad and currently passing.
- Route structure is conceptually coherent and page naming is mostly systematic.
- No obvious debug artifacts or FIXME/HACK sprawl in source files.

---

## Suggested priority order

1. Consolidate keyboard-help duplication (small, high-confidence win).
2. Type route caches and clean `!` + filter patterns.
3. Centralize route metadata to remove multi-file drift.
4. Define and enforce styling architecture guidelines.
