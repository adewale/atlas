# Entity Enrichment — Technical Specification

## Overview

Atlas entities currently carry a 1-2 sentence `description` field. This spec
adds structured long-form content (discovery narratives, biographical sketches,
trend analyses) to each entity type, stored in Cloudflare D1 and indexed in
Vectorize at section granularity. The enriched content feeds the existing
hybrid search (see `search-spec.md`) and drives a progressive-disclosure UI
from card to expanded card to full folio page.

---

## 1. Data Model

### 1.1 Enrichment sections by entity type

Each entity gets a set of named **sections**. A section is a titled block of
prose (200-800 words) with an optional source URL.

| Entity type | Section slug | Section title | Typical length |
|-------------|-------------|---------------|----------------|
| **Element** | `biography` | Biography | 400-600 words |
| | `discovery-narrative` | Discovery Narrative | 300-500 words |
| | `key-compounds` | Key Compounds | 200-400 words |
| | `industrial-uses` | Industrial Uses | 200-400 words |
| | `isotope-highlights` | Isotope Highlights | 200-300 words |
| **Discoverer** | `biographical-sketch` | Biographical Sketch | 400-600 words |
| | `contributions` | Other Contributions | 200-400 words |
| | `historical-context` | Historical Context | 200-300 words |
| | `institutions` | Institutions | 100-200 words |
| **Era** | `scientific-context` | Scientific Context | 300-500 words |
| | `concurrent-discoveries` | Concurrent Discoveries | 200-400 words |
| | `key-publications` | Key Publications | 200-300 words |
| **Category** | `bonding-behaviour` | Bonding Behaviour | 200-400 words |
| | `reactivity-patterns` | Reactivity Patterns | 200-400 words |
| | `industrial-significance` | Industrial Significance | 200-400 words |
| **Group** | `trend-description` | Trends | 200-400 words |
| | `notable-exceptions` | Notable Exceptions | 100-300 words |
| **Period** | `trend-description` | Trends | 200-400 words |
| | `notable-exceptions` | Notable Exceptions | 100-300 words |
| **Block** | `trend-description` | Trends | 200-400 words |
| | `notable-exceptions` | Notable Exceptions | 100-300 words |
| **Anomaly** | `theoretical-explanation` | Theoretical Explanation | 300-500 words |
| | `experimental-evidence` | Experimental Evidence | 200-400 words |
| **Etymology** | `linguistic-history` | Linguistic History | 300-500 words |
| | `naming-controversies` | Naming Controversies | 200-400 words |

**Total sections:** ~700 across ~300 entities.

### 1.2 TypeScript types

```ts
/** A single enrichment section returned from the API. */
export type EnrichedSection = {
  entityId: string;        // e.g. "element-Fe"
  sectionSlug: string;     // e.g. "discovery-narrative"
  sectionTitle: string;    // e.g. "Discovery Narrative"
  bodyText: string;        // Markdown prose
  sourceUrl: string | null;
  license: string | null;
};
```

The existing `Entity` type is unchanged. Enriched content is fetched
separately and never bundled into the static client build.

---

## 2. Storage Architecture

### 2.1 D1 schema

```sql
CREATE TABLE enriched_sections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id   TEXT NOT NULL,       -- matches Entity.id (e.g. "element-Fe")
  section_slug TEXT NOT NULL,
  section_title TEXT NOT NULL,
  body_text   TEXT NOT NULL,
  source_url  TEXT,
  license     TEXT DEFAULT 'CC BY-SA 4.0',
  updated_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(entity_id, section_slug)
);

CREATE INDEX idx_enriched_entity ON enriched_sections(entity_id);
```

**FTS5 extension** for full-text search across enriched content:

```sql
CREATE VIRTUAL TABLE enriched_fts USING fts5(
  section_title,
  body_text,
  content='enriched_sections',
  content_rowid='id',
  tokenize='porter unicode61'
);
```

### 2.2 Vectorize index

- **Name:** `atlas-enriched`
- **Dimensions:** 768 (bge-base-en-v1.5, same model as `atlas-search`)
- **Metric:** cosine
- **~700 vectors** — one per section, not per entity

Each vector ID encodes both entity and section: `element-Fe::discovery-narrative`.

**Why per-section, not per-entity:** A search for "Haber process" should
surface the `industrial-uses` section of Nitrogen, not the full Nitrogen
entity with a generic relevance score. Section-level embeddings enable
snippet-precise semantic search.

### 2.3 Integration with existing hybrid search

The search Worker (described in `search-spec.md`) gains a third parallel leg:

```
  User types "Haber process"
         |
    +----+----+----------+
    |         |          |
    v         v          v
  D1 FTS5   Vectorize   D1 FTS5
  search_fts atlas-search enriched_fts
  (entities) (entities)  (sections)
    |         |          |
    v         v          v
  Vectorize              |
  atlas-enriched         |
  (sections)             |
    |                    |
    +----+----+----------+
         |
    RRF fusion (k=60)
         |
    Return top 10 results
    { type, name, path, snippet, matchedSection? }
```

Results from the enriched index carry a `matchedSection` field so the UI
can deep-link to the relevant section in the expanded view.

**Scoring adjustments:**

| Source | RRF weight | Rationale |
|--------|-----------|-----------|
| `search_fts` (entity BM25) | 1.0 | Primary entity match |
| `atlas-search` (entity vector) | 1.0 | Semantic entity match |
| `enriched_fts` (section BM25) | 0.7 | Section match boosts parent entity |
| `atlas-enriched` (section vector) | 0.7 | Avoid enriched content dominating |

Results are deduplicated by `entity_id` — if both the entity and one of its
sections match, they merge into a single result with the section noted as
the matched snippet.

---

## 3. Cross-References

### 3.1 Relationship types

| Relationship | Example | Stored on |
|-------------|---------|-----------|
| discoverer -> elements | Marie Curie -> Po, Ra | `entity_refs` |
| element -> discoverer | Po -> Marie Curie | `entity_refs` (reverse) |
| element -> anomalies | Cu -> d-block-exception | `entity_refs` |
| element -> category | Fe -> transition-metal | Existing `ElementRecord` |
| era -> discoverers | 1890s -> Marie Curie | `entity_refs` |
| discoverer -> era | Marie Curie -> 1890s | `entity_refs` (reverse) |
| element -> etymology | He -> mythology | Existing `ElementRecord` |
| category -> elements | alkali-metal -> Li, Na... | Existing `CategoryData` |

### 3.2 D1 cross-reference table

```sql
CREATE TABLE entity_refs (
  source_id   TEXT NOT NULL,    -- e.g. "discoverer-Marie Curie"
  target_id   TEXT NOT NULL,    -- e.g. "element-Po"
  rel_type    TEXT NOT NULL,    -- e.g. "discovered", "exhibits", "active_during"
  PRIMARY KEY (source_id, target_id, rel_type)
);

CREATE INDEX idx_refs_target ON entity_refs(target_id);
```

### 3.3 Detection and linking strategy

**Phase 1 — Structural extraction (build time).** Parse existing data to
generate refs automatically:

- `DiscovererData.elements` -> `discoverer-X discovered element-Y`
- `AnomalyData.elements` -> `anomaly-X exhibits element-Y`
- `TimelineData` -> `era-X active_during discoverer-Y`
- `ElementRecord.category` -> `element-X member_of category-Y`

**Phase 2 — NLP extraction (enrichment pipeline).** When enriched content
is written, scan `body_text` for entity name mentions using a trie built
from all entity names. Detected mentions become candidate refs, reviewed
before insertion.

### 3.4 Bidirectional display

Every entity page shows two ref sections:

1. **Outgoing refs** — "Marie Curie discovered Polonium, Radium"
2. **Incoming refs** — "Referenced by: Curium (named after), 1890s (era)"

Both are rendered as Byrne chip rows using existing `EntityChip` /
`ByrneChips` components. The query is a single SQL union:

```sql
SELECT target_id AS ref_id, rel_type, 'outgoing' AS dir
  FROM entity_refs WHERE source_id = ?
UNION ALL
SELECT source_id AS ref_id, rel_type, 'incoming' AS dir
  FROM entity_refs WHERE target_id = ?
```

---

## 4. UI Integration

### 4.1 Progressive disclosure

Three levels of detail, each loading progressively:

| Level | What the user sees | Data source | Load trigger |
|-------|-------------------|-------------|-------------|
| **Card** | Name, 1-2 sentence description, element chips | Static bundle (`Entity`) | Page load |
| **Expanded card** | Card + first enriched section + cross-refs | Worker API (`/api/entity/:id/preview`) | User clicks card |
| **Full folio** | All sections, all cross-refs, source citations | Worker API (`/api/entity/:id`) | User clicks "Read more" or navigates to `/entity/:id` |

### 4.2 Expanded card layout

When a user clicks an entity card on the Explore page, it expands in-place
(no route change). The expansion uses CSS `grid-row: span` to push
neighbouring cards down.

```
+----------------------------------------------------------+
|  [DISCOVERER]  Marie Curie                               |
+----------------------------------------------------------+
|  Discovered 2 elements: Po, Ra                           |
|                                                          |
|  --- Biographical Sketch (preview) ---------------------  |
|  Marie Sklodowska Curie (1867-1934) was a Polish-French  |
|  physicist and chemist who conducted pioneering research  |
|  on radioactivity. She was the first woman to win a      |
|  Nobel Prize...                                          |
|                                          [Read more ->]  |
|                                                          |
|  --- Related ------------------------------------------- |
|  [Po] [Ra]  [1890s]  [Curium]                           |
+----------------------------------------------------------+
```

- Section preview is truncated to ~150 words with CSS line clamp.
- Cross-ref chips use existing `EntityChip` styling.
- Expand/collapse animates with `height: auto` via CSS `interpolate-size`.
- The expand animation follows the existing `card-enter` easing
  (250ms, `var(--ease-out)`).

### 4.3 Full folio page

Route: `/entity/:type/:slug` (e.g. `/entity/discoverer/marie-curie`)

Layout follows the existing `Folio` component pattern:

- **Left column (160px):** Identity plate with entity colour, type badge,
  element count. Same `DataPlateRow` pattern as element folios.
- **Right column (400px):** Sections rendered sequentially as Pretext-measured
  prose blocks. Each section has a hairline rule separator and a small
  section title in 10px uppercase (matching the type label style in
  `EntityCard`).
- **Source strip** at the bottom using existing `SourceStrip` component.

On mobile (<768px), single-column layout: identity plate stacks above
section content at full width.

### 4.4 Byrne design integration

- Section titles: 10px uppercase, `letter-spacing: 0.12em`, entity type
  colour. Same treatment as the type label in `EntityCard` header.
- Body text: 13px, `line-height: 18px`, `PRETEXT_SANS` font, `BLACK` on
  `PAPER`. Same as Folio prose.
- Cross-ref chips: Block-coloured squares for elements, type-coloured
  pills for other entities (existing `EntityChip` + `ByrneChips` patterns).
- Pull quotes from enriched content rendered as Byrne margin notes using
  existing `MarginNote` component.

---

## 5. Performance Budget

### 5.1 Load time targets

| Interaction | Target | Strategy |
|------------|--------|----------|
| Explore page (cards) | <1s FCP | Static bundle, no enriched data |
| Card expand | <200ms | Single API call, preview endpoint |
| Full folio page | <500ms | Parallel fetch of all sections |
| Search with enriched results | <50ms | Parallel D1 + Vectorize (see search-spec) |

### 5.2 Bundle size constraints

| Asset | Budget | Notes |
|-------|--------|-------|
| Static entity data (JSON) | <80KB gzip | Current ~300 entities, no enriched text |
| Enriched section (single) | <2KB gzip | 200-800 words of prose |
| Full entity enrichment | <10KB gzip | All sections for one entity |
| Folio page JS chunk | <15KB gzip | Lazy-loaded route chunk |

Enriched content is never included in the static build. It is always
fetched from the Worker API on demand.

### 5.3 Caching strategy

| Resource | Cache | TTL |
|----------|-------|-----|
| `/api/entity/:id/preview` | CF edge + `stale-while-revalidate` | 1 hour |
| `/api/entity/:id` | CF edge + `stale-while-revalidate` | 1 hour |
| `/api/search?q=...` | No cache (dynamic) | -- |
| Vectorize embeddings | Computed at build time | Indefinite |

Client-side: `React.cache` or a simple `Map<string, Promise>` keyed by
entity ID prevents duplicate in-flight requests when expanding/collapsing
cards rapidly.

### 5.4 Lazy loading strategy

```
Explore page loads
  |
  v
Static entity corpus (~300 Entity objects, in bundle)
  |
  User clicks card
  |
  v
fetch("/api/entity/element-Fe/preview")
  -> Returns: first section + cross-refs
  -> Cached in memory for session
  |
  User clicks "Read more"
  |
  v
navigate("/entity/element/Fe")
  -> Route chunk lazy-loaded (React.lazy)
  -> fetch("/api/entity/element-Fe")
  -> Returns: all sections + all cross-refs + sources
```

No prefetching. The ~300-entity corpus is small enough that the card grid
itself is fast; enriched content is only fetched on explicit user action.

---

## 6. API Endpoints

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/entity/:id/preview` | `{ sections: [first], refs: EntityRef[] }` |
| GET | `/api/entity/:id` | `{ sections: EnrichedSection[], refs: EntityRef[] }` |
| GET | `/api/search?q=:query` | Extended search results with `matchedSection` |

All endpoints are Cloudflare Workers reading from D1. Responses are JSON
with standard `Cache-Control` headers.

---

## 7. Migration Path

1. **Phase 1 — Schema + API.** Create D1 tables, deploy Worker endpoints
   returning empty section arrays. Folio pages render gracefully with no
   enriched content (show only existing `description`).

2. **Phase 2 — Structural refs.** Run build-time script to populate
   `entity_refs` from existing data files. Cross-ref chips appear on
   entity pages.

3. **Phase 3 — Content authoring.** Populate `enriched_sections` for
   elements first (highest value), then discoverers and anomalies.
   Each batch triggers Vectorize re-indexing.

4. **Phase 4 — Search integration.** Add enriched FTS5 and Vectorize
   legs to the search Worker. Deploy updated RRF weights.
