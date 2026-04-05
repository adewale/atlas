# Atlas Code Duplication & Simplification Audit

Date: 2026-04-04

---

## 1. Duplicate Type Definitions Across Client and Worker

**Impact: High — silent contract drift between client and server**

`SearchResult`, `FacetCounts`, and `SearchResponse` are defined identically in two places:

| Type | Client | Worker |
|------|--------|--------|
| `SearchResult` | `src/lib/search.ts:10` | `worker/src/handler.ts:45` |
| `FacetCounts` | `src/lib/search.ts:22` | `worker/src/handler.ts:54` |
| `SearchResponse` | `src/lib/search.ts:24` | `worker/src/handler.ts:56` |

`FACET_KEYS` and `FacetKey` are defined in three places:

| Definition | File | Line |
|------------|------|------|
| `FACET_KEYS` | `src/lib/facets.ts` | 22 |
| `FACET_KEYS` | `worker/src/handler.ts` | 95 |
| Implied in param encoding | `src/lib/search.ts` | 62–67 |

`EntityMeta` is a type name used for three different shapes:

| File | Line | Shape |
|------|------|-------|
| `src/lib/routeMeta.ts` | 27 | Page metadata (label, route, examples) |
| `worker/src/handler.ts` | 98 | DB entity row (entity_type, url_path, metadata) |
| `src/lib/searchLocal.ts` | 44 | Enriched entity (blocks, phases, eras sets) |

**Action:** Extract shared search types into a `shared/search-types.ts` package (or a `types/` directory) that both the client and the worker import. Rename the `EntityMeta` types to be specific: `VizPageEntity`, `SearchEntityRow`, `EnrichedSearchEntity`.

---

## 2. Duplicate Slug Functions (theme.ts vs slugs.ts)

**Impact: High — two parallel slug APIs, callers choose arbitrarily**

`src/lib/theme.ts` exports `toSlug()` (line 143) and `fromSlug()` (line 148).
`src/lib/slugs.ts` exports `toUrlSlug()` (line 15) and `fromUrlSlug()` (line 20).

They do the same thing:

```ts
// theme.ts
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// slugs.ts
export function toUrlSlug(dataSlug: string): string {
  return dataSlug.toLowerCase().replace(/\s+/g, '-');
}
```

Current usage:
- `Folio.tsx` and `AtlasCategory.tsx` import `toSlug`/`fromSlug` from `theme.ts`
- `slugs.ts` also provides `normalizeSlug()` and `slugsEqual()` (richer API)

**Action:** Delete `toSlug`/`fromSlug` from `theme.ts`. Update the two call sites (`Folio.tsx:14`, `AtlasCategory.tsx:2`) to import `toUrlSlug`/`fromUrlSlug` from `slugs.ts`. This consolidates slug logic in one module.

---

## 3. Near-Identical Index Pages (7 files, ~250 lines)

**Impact: High — every new entity type requires copy-pasting a page**

These seven index pages share an identical structure:

| File | Lines |
|------|-------|
| `src/pages/AtlasBlockIndex.tsx` | 41 |
| `src/pages/AtlasGroupIndex.tsx` | 39 |
| `src/pages/AtlasPeriodIndex.tsx` | 35 |
| `src/pages/AtlasCategoryIndex.tsx` | 35 |
| `src/pages/AnomalyIndex.tsx` | 40 |
| `src/pages/DiscovererIndex.tsx` | 39 |
| `src/pages/EraIndex.tsx` | 66 |
| `src/pages/ElementIndex.tsx` | 44 |

All follow this pattern:
1. `<Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK }}>← Table</Link>`
2. `<h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: COLOR }}>TITLE</h1>`
3. `<div style={{ borderTop: '4px solid ${COLOR}', marginBottom: '16px' }} />`
4. `<SectionedCardList sections={sections} accordion defaultCollapsed />`

The only differences are: title string, colour, and how `sections` is derived from loader data.

**Action:** Create a generic `IndexPage` component that accepts `{ title, color, sections }` and renders the boilerplate. Each route's page becomes a thin wrapper that transforms loader data into sections. This eliminates ~200 lines.

---

## 4. Duplicated Scoring Logic in searchLocal.ts

**Impact: Medium — the same scoring block is copy-pasted within one file**

In `src/lib/searchLocal.ts`, the text-scoring block (lines 78–99) is duplicated verbatim inside `computeCounts` (lines 136–154). The same `terms`, `nameL`, `descL`, score calculation, and threshold appear in both places.

**Action:** Extract a `scoreEntity(entity, terms)` helper at the top of `createLocalSearch`. Both the main search pass and the `computeCounts` self-exclusion pass should call it.

---

## 5. Self-Exclusion Facet Filtering — Two Implementations

**Impact: Medium — parallel implementations that could diverge**

Facet filtering with self-exclusion is implemented twice:

1. **Worker** (`worker/src/handler.ts:124–163`): Clean abstraction using `applyFacets()` and `computeFacetCounts()` with `extractFacetValues()`.
2. **Local adapter** (`src/lib/searchLocal.ts:103–191`): Inline imperative code with manual if-chains for each facet dimension.

The worker version is well-factored. The local version is a sprawling 90-line function.

**Action:** Port the worker's `applyFacets`/`computeFacetCounts` pattern into `searchLocal.ts`, or extract a shared facet-filtering module. This also reduces the chance of the two implementations drifting.

---

## 6. Hardcoded Hex Colours Violating Token Policy

**Impact: Medium — contradicts the project's own lint rule in `lint-color-tokens.ts`**

Despite a dedicated linter, hardcoded hex values survive in source:

| File | Line | Value | Should be |
|------|------|-------|-----------|
| `src/pages/Explore.tsx` | 266 | `'#666'` | `GREY_MID` |
| `src/pages/Explore.tsx` | 292, 309 | `'#fff'` | `PAPER` |
| `src/components/ByrneChips.tsx` | 41 | `'#666'` | `GREY_MID` |

**Action:** Replace with token imports. If the linter exits 0 on these, its allowlist or non-strict default is too lenient — tighten it.

---

## 7. Dead / Unused Code

**Impact: Medium — code that exists but serves no purpose**

### 7a. `searchElements()` in `src/lib/data.ts` (line 21)

This function is exported but **never imported by any application code** — only by test files (`tests/data.test.ts`, `tests/data.property.test.ts`, `tests/performance.test.ts`). The Explore page uses `searchLocal.ts` instead, and the search input on Home uses the search API.

**Action:** If it is only a test utility, move it to `tests/helpers/` or remove it. It pulls in a 5-tier scoring algorithm that nothing uses at runtime.

### 7b. `atlasSearch()` in `src/lib/search.ts` (line 54)

The remote search client function is never called in application code. The Explore page loader creates a `localSearch` function from `searchLocal.ts`. The `atlasSearch` function exists only for the eventual Worker deployment.

**Action:** This is intentionally forward-looking per the file's comment ("This will be deleted when the Worker goes live"). Add a `// @future` annotation and exclude from dead-code audits, or remove it until the Worker is deployed. Currently it adds 30 lines of untested-in-production code.

### 7c. `RAW_EASING_RE` in `scripts/lint-animation-tokens.ts` (line 41)

Defined but never used — the linter only checks `RAW_VT_NAME_RE`.

### 7d. `GENERIC_NONNULL_RE` in `scripts/lint-non-null-assertions.ts` (line 32)

Defined but never used in the lint loop — only `DANGEROUS_PATTERNS` is checked.

**Action:** Delete the two unused regex constants.

---

## 8. Repeated Page Header Pattern (not covered by AtlasBrowsePage)

**Impact: Low-Medium — 12+ files repeat the same 3-line header block**

The `AtlasBrowsePage` component already encapsulates this pattern for detail pages (Group, Period, Block, Category, Anomaly). But the index pages and several other pages manually repeat:

```tsx
<Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK }}>← Table</Link>
<h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: COLOR }}>TITLE</h1>
<div style={{ borderTop: `4px solid ${COLOR}`, marginBottom: '16px' }} />
```

This pattern appears in: `AtlasBlockIndex`, `AtlasGroupIndex`, `AtlasPeriodIndex`, `AtlasCategoryIndex`, `AnomalyIndex`, `DiscovererIndex`, `EraIndex`, `ElementIndex`, `PropertyIndex`, `DiscovererDetail`, `TimelineEra`, `Credits`, `About`.

**Action:** Extract a `PageHeader` component (`{ title, color, backLabel?, backTo? }`) that renders these three elements. Use it in both `AtlasBrowsePage` and the index pages.

---

## 9. Duplicate Loader Patterns in routes.tsx

**Impact: Low-Medium — repetitive but functional**

In `src/routes.tsx`, every entity type follows the same caching pattern:

```ts
loader: async () => {
  groupsCache ??= await import('../data/generated/groups.json').then(m => m.default);
  return { groups: groupsCache };
},
```

This is repeated for groups (lines 89, 97), periods (107, 114), blocks (124, 132), categories (142, 150), anomalies (175, 183), discoverers (209, 218), timeline (228, 235, 262), with paired routes (index + detail) loading the same data.

**Action:** Create a `cachedLoader<T>(path, key)` factory:

```ts
function cachedLoader<T>(path: string, key: string) {
  let cache: T | null = null;
  return async () => {
    cache ??= await import(path).then(m => m.default);
    return { [key]: cache };
  };
}
```

This eliminates ~60 lines of repetition.

---

## 10. Inconsistent Naming Conventions

**Impact: Low — cosmetic but creates friction**

### 10a. British vs American spelling

- `colour` in: `entities.ts` (`ENTITY_TYPE_COLOURS`), `EntityCard.tsx`, `Explore.tsx` (`facetChipColour`), `routeMeta.ts`
- `color` in: `theme.ts` (`categoryColor`), `gridColors.ts` (`blockColor`, `contrastTextColor`), component props (`color`, `captionColor`)

Both spellings coexist in the same module (`Explore.tsx` uses `colour` for the variable and `color` for CSS properties).

### 10b. Naming inconsistencies across files

- `entity_type` (snake_case) in `worker/src/handler.ts` vs `entityType` / `type` everywhere else
- `url_path` (snake_case) in `worker/src/handler.ts` vs `path` / `href` elsewhere
- `search_text` in worker vs `description` / `snippet` in client

**Action:** Pick one spelling convention (American `color` matches CSS/React convention) and rename. The snake_case in the worker matches D1 column names — add a mapping layer at the DB boundary rather than leaking it through the type system.

---

## 11. Lint Scripts Share Boilerplate Structure

**Impact: Low — functional but repetitive**

The four lint scripts (`lint-color-tokens.ts`, `lint-font-tokens.ts`, `lint-animation-tokens.ts`, `lint-non-null-assertions.ts`, `lint-internal-links.ts`) all follow the same pattern:

1. Define `TOKEN_SOURCE_FILES`
2. Define violation type
3. Walk files, skip comments/imports, match regex
4. Report violations grouped by file
5. Exit 0 or 1 based on `--strict`

They already share `lint-utils.ts` for `walk`, `relPath`, `groupBy`, `COMMENT_RE`, `IMPORT_RE`. But the reporting / exit-code logic is duplicated across all five.

**Action:** Add a `runLint(violations, options)` function to `lint-utils.ts` that handles the common report-and-exit pattern. Each linter just provides the scan function.

---

## Summary — Prioritised Actions

| # | Finding | Files affected | Est. lines saved |
|---|---------|---------------|-----------------|
| 1 | Extract shared search types | 3 files (search.ts, handler.ts, facets.ts) | ~40 |
| 2 | Consolidate slug functions | 4 files | ~15 |
| 3 | Generic IndexPage component | 8 pages | ~200 |
| 4 | Extract scoring helper in searchLocal | 1 file | ~20 |
| 5 | Unify facet filtering | 2 files | ~60 |
| 6 | Fix hardcoded hex colours | 2 files | ~0 (correctness) |
| 7 | Remove dead code | 4 files | ~50 |
| 8 | PageHeader component | 13 files | ~40 |
| 9 | Cached loader factory | 1 file | ~60 |
| 10 | Naming consistency | ~10 files | ~0 (consistency) |
| 11 | Lint reporting helper | 5 scripts | ~50 |
| **Total** | | | **~535** |
