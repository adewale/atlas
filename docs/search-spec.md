# Atlas Search — Technical Specification

## Overview

Atlas search combines **Cloudflare D1 FTS5** (keyword/BM25 ranking) with
**Cloudflare Vectorize** (semantic similarity via embeddings) to deliver
intelligent cross-entity search. A single Cloudflare Worker fans out to
both systems in parallel, then merges results using Reciprocal Rank Fusion.

**Key design decision:** Vectorize handles synonym resolution implicitly.
Because embeddings encode semantic proximity, "wolfram" and "tungsten"
naturally cluster together without an explicit synonym table. We still
maintain a small explicit synonym table for guaranteed coverage of
chemistry-specific terms (Latin element names, historical nomenclature),
but the vector leg is the primary synonym engine.

---

## Architecture

```
  User types "Curie"
         |
         v
  +-----------------------+
  | Cloudflare Worker     |
  | (edge, nearest PoP)   |
  +---------+-------------+
            |
    +-------+-------+
    |               |
    v               v
+--------+    +----------+
| D1     |    | Workers  |
| FTS5   |    | AI embed |
| BM25   |    | query    |
+---+----+    +----+-----+
    |              |
    |              v
    |         +----------+
    |         | Vectorize|
    |         | top-K    |
    |         +----+-----+
    |              |
    +------+-------+
           |
           v
    +------+------+
    | RRF fusion  |
    | k=60        |
    +------+------+
           |
           v
    Return top 10 results
    { type, name, path, snippet }
```

### What the "Curie" query returns

1. **Marie Curie** (discoverer) — exact BM25 match on name
2. **Pierre Curie** (discoverer) — exact BM25 match on name
3. **Curium** (element Cm) — BM25 match on etymology text mentioning "Curie"
4. **1890s** (era) — BM25 match on associated discoverers
5. **Radium** (element Ra) — Vectorize semantic match (Curie-adjacent)
6. **Polonium** (element Po) — Vectorize semantic match (discovered by Curies)

---

## Data Model

### D1 Tables

**`search_entities`** — source of truth

| Column        | Type     | Example                                |
|---------------|----------|----------------------------------------|
| id            | TEXT PK  | `element:Cm`                           |
| entity_type   | TEXT     | `element`                              |
| name          | TEXT     | `Curium`                               |
| symbol        | TEXT?    | `Cm`                                   |
| url_path      | TEXT     | `/element/Cm`                          |
| search_text   | TEXT     | Concatenated searchable prose          |
| metadata_json | TEXT     | `{"Z":96,"category":"actinide"}`       |

**`search_fts`** — FTS5 virtual table

```sql
CREATE VIRTUAL TABLE search_fts USING fts5(
  name,
  symbol,
  search_text,
  content='search_entities',
  content_rowid='rowid',
  tokenize='porter unicode61'
);
```

Note: must use lowercase `fts5` on D1 (case-sensitive).

**`synonyms`** — explicit fallback for critical terms

| term         | synonym      |
|--------------|--------------|
| wolfram      | tungsten     |
| noble gas    | inert gas    |
| quicksilver  | mercury      |
| natrium      | sodium       |
| kalium       | potassium    |
| plumbum      | lead         |
| stannum      | tin          |
| aurum        | gold         |
| argentum     | silver       |
| ferrum       | iron         |
| cuprum       | copper       |
| hydrargyrum  | mercury      |

### Vectorize Index

- **Name:** `atlas-search`
- **Dimensions:** 768 (bge-base-en-v1.5)
- **Metric:** cosine
- **~300 vectors** (one per searchable entity)

### Why Vectorize handles synonyms

Traditional search requires an explicit synonym table mapping every alternate
name. Vectorize eliminates most of this work because embeddings naturally
encode semantic relationships:

- "wolfram" and "tungsten" have nearby vectors (they co-occur in training data)
- "noble gas" and "inert gas" cluster together
- "radioactivity pioneer" is semantically close to Curie-related documents

The explicit synonym table only exists as a safety net for domain-specific
terms that might not be well-represented in the embedding model's training data.

---

## Entity Corpus (~300 documents)

| Type        | Count | search_text includes                        |
|-------------|-------|---------------------------------------------|
| Elements    | 118   | Name, symbol, category, etymology, summary  |
| Groups      | 18    | Group number, member names, common name      |
| Periods     | 7     | Period number, member elements               |
| Blocks      | 4     | Block letter, member descriptions            |
| Categories  | ~10   | Category name, member elements               |
| Rankings    | 4     | Property name, top/bottom elements           |
| Discoverers | ~50   | Name, elements discovered, dates             |
| Eras        | ~30   | Decade, discoverers, elements                |
| Etymology   | 7     | Origin type, element examples                |
| Anomalies   | ~6    | Anomaly description, affected elements       |

---

## Embedding Generation

- **Model:** `@cf/baai/bge-base-en-v1.5` via Workers AI
- **Pooling:** `cls` (not mean — better for longer inputs)
- **When:** At build time. ~300 docs takes seconds.
- **Cost:** Free tier (well within 10K neurons/day)

---

## Query Flow (pseudocode)

```
async function search(query: string): SearchResult[] {
  // 1. Expand synonyms
  const synonyms = await db.prepare(
    'SELECT synonym FROM synonyms WHERE term = ?'
  ).bind(query.toLowerCase()).all();
  const expandedQuery = [query, ...synonyms].join(' OR ');

  // 2. Fan out in parallel
  const [bm25Results, embedding] = await Promise.all([
    db.prepare(`
      SELECT id, name, entity_type, url_path, bm25(search_fts, 10, 5, 1) as score
      FROM search_fts JOIN search_entities ON search_fts.rowid = search_entities.rowid
      WHERE search_fts MATCH ?
      ORDER BY score LIMIT 20
    `).bind(expandedQuery).all(),
    ai.run('@cf/baai/bge-base-en-v1.5', { text: [query] }),
  ]);

  const vectorResults = await vectorIndex.query(embedding[0], { topK: 20 });

  // 3. Reciprocal Rank Fusion
  return reciprocalRankFusion(bm25Results, vectorResults, k=60);
}
```

---

## Performance Budget

| Step                  | Latency   |
|-----------------------|-----------|
| Synonym lookup (D1)   | 1–5ms     |
| D1 FTS5 BM25 query    | 1–5ms     |
| Workers AI embedding   | 10–20ms   |
| Vectorize query        | 5–10ms    |
| RRF fusion (JS)        | <1ms      |
| **Total (parallel)**   | **~20–30ms** |

---

## Cost Estimate (1,000 searches/day)

| Component           | Monthly  |
|---------------------|----------|
| Workers Paid plan   | $5.00    |
| Workers AI (embed)  | Free     |
| Vectorize (stored)  | Free     |
| Vectorize (queried) | Free     |
| D1 reads            | Free     |
| **Total**           | **~$5**  |

---

## UI Design

### Resting state — filter bar (current)

The existing filter bar doubles as the search entry point.
No search is visible until the user starts typing.

```
+------------------------------------------------------------------+
|                                                                    |
|  [ Filter _________________________ ]  NONE GROUP PERIOD BLOCK ... |
|                                                                    |
|  +----+----+----+----+----+----+----+----+----+----+----+----+    |
|  | H  |    |                                       |    | He |    |
|  +----+    +                                       +    +----+    |
|  | Li | Be |                                       | B  | C  |    |
|  +----+----+                                       +----+----+    |
|  :         :              periodic table            :         :    |
```

### Active search — results overlay

When the user types 3+ characters, the periodic table dims and
a results panel appears below the filter bar. Results are grouped
by entity type with Byrne-style coloured type badges.

```
+------------------------------------------------------------------+
|                                                                    |
|  [ Curie________________________x ]   NONE GROUP PERIOD BLOCK ...  |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  RESULTS FOR "CURIE"                                    6 hits| |
|  |                                                               | |
|  |  [DISCOVERER]  Marie Curie                                    | |
|  |                Polonium, Radium · 1890s                       | |
|  |                                                               | |
|  |  [DISCOVERER]  Pierre Curie                                   | |
|  |                Polonium, Radium · 1890s                       | |
|  |                                                               | |
|  |  [ELEMENT]     Curium  Cm  96                                 | |
|  |                Actinide · named after Marie and Pierre Curie   | |
|  |                                                               | |
|  |  [ERA]         1890s                                          | |
|  |                Marie Curie, Pierre Curie, Wilhelm Rontgen     | |
|  |                                                               | |
|  |  [ELEMENT]     Radium  Ra  88                                 | |
|  |                Discovered by Marie Curie                      | |
|  |                                                               | |
|  |  [ELEMENT]     Polonium  Po  84                               | |
|  |                Discovered by Marie and Pierre Curie           | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +----+----+----+----+----+----+----+----+----+----+----+----+    |
|  | H  |    |              (dimmed)                  |    | He |    |
```

### Result card anatomy

Each result is a horizontal strip. The type badge uses our palette:

```
  [ELEMENT]     Curium  Cm  96
  ^             ^       ^   ^
  |             |       |   atomic number (mono)
  |             |       symbol (bold)
  |             name (16px)
  type badge: 10px uppercase, Byrne chip
  - ELEMENT    = DEEP_BLUE background, PAPER text
  - DISCOVERER = WARM_RED background, PAPER text
  - ERA        = MUSTARD background, BLACK text
  - GROUP      = BLACK background, PAPER text
  - ETYMOLOGY  = MINERAL_BROWN background, PAPER text
```

### Keyboard interaction

```
  /           → Focus filter input
  ↓ ↑         → Navigate results list
  Enter       → Open selected result
  Esc         → Clear search, return to table
```

### Mobile layout

On mobile (<768px), the results panel becomes full-width
and the periodic table is fully hidden during active search:

```
+------------------------------+
| [ Curie________________x ]   |
|                               |
| RESULTS FOR "CURIE"    6 hits |
|                               |
| [DISCOVERER] Marie Curie     |
| Polonium, Radium · 1890s     |
|                               |
| [DISCOVERER] Pierre Curie    |
| Polonium, Radium · 1890s     |
|                               |
| [ELEMENT] Curium  Cm  96     |
| Actinide · named after the   |
| Curies                        |
|                               |
| [ERA] 1890s                  |
| Marie Curie, Pierre Curie    |
+------------------------------+
```

### Empty state

When no results match, show a gentle message:

```
+--------------------------------------------------------------+
|  NO RESULTS FOR "XYZZY"                                      |
|                                                               |
|  Try a different term. You can search for element names,      |
|  symbols, discoverers, time periods, or properties.           |
+--------------------------------------------------------------+
```

---

## Faceted Navigation

### Theoretical foundation

Faceted classification (Ranganathan, 1933) describes items along multiple
independent dimensions rather than forcing them into a single hierarchy.
See `docs/faceted-navigation.md` for the full research background.

Atlas maps Ranganathan's PMEST framework to the periodic table domain:

| Facet | Dimension | Values | Applies to |
|-------|-----------|--------|------------|
| Entity type | Personality | element, discoverer, era, category, group, block, anomaly, etymology | All entities |
| Block | Matter | s, p, d, f | Elements, groups |
| Phase | Energy | solid, liquid, gas | Elements |
| Etymology origin | Space | place, person, mythology, property, mineral, astronomical | Elements |
| Discovery era | Time | Antiquity, 1770s, 1800s, … | Elements, discoverers |

### How search and facets compose

Search and facets are two layers of the same system:

1. **Search produces a candidate set.** "Curie" → 6 entities
   (via client-side scoring now; D1 FTS5 + Vectorize later).
   This is the recall phase.

2. **Facets narrow that candidate set.** Entity type, block, era,
   etc. each constrain the results. This is the precision phase.
   Entirely client-side regardless of search backend.

```
  User types "curie"
         |
         v
  Search engine (client or D1+Vectorize)
         |
         v
  Candidate set: 6 entities
         |
    +----+----+----+
    |    |    |    |
    v    v    v    v
  Entity Block Era  Etymology   ← facet filters (AND across, OR within)
    |    |    |    |
    +----+----+----+
         |
         v
  Filtered results → entity cards
         |
         v
  Recompute counts for all facet values
  (self-exclusion: counts for facet F ignore F's selection)
```

### State machine model (from Olsen)

Faceted navigation is a deterministic state machine. Three rules:

1. **No dead ends.** Users cannot transition from a state with results
   to one with zero results. Values with count = 0 are visible but
   **disabled** (greyed out, not clickable). Never hidden.

2. **Self-exclusion counting.** When computing counts for facet F,
   apply all active filters except F itself. This means selecting
   "s-block" doesn't change the counts shown for other blocks — the
   user always sees "what if I switched?" without deselecting first.

3. **URL as source of truth.** All filter state lives in the query
   string: `/explore?q=curie&type=element&block=s&era=1800`.
   AND logic across facets. Enables deep linking and reproducibility.

### Drill-down as facet pre-fill

Clicking a discoverer card (e.g. "Humphry Davy") does **not** enter a
separate drill-down mode. It sets `Discoverer = Humphry Davy` as a
facet value. The result set narrows to his elements, but all other
facets remain active and their counts update. The user can further
filter by block, era, etc. — or remove the discoverer filter to return
to the broader set without losing other active facets.

This is strictly more powerful than breadcrumb drill-down: removing one
filter does not reset the others.

### Facet bar layout

Facets are inline Byrne chip rows, not a sidebar. Primary facets are
always visible; secondary facets appear when relevant (e.g. Block and
Era rows appear after a discoverer is selected):

```
  🔍 curie                                                      ×

  Entity   ██ Element(3)  ░░ Discoverer(2)  ░░ Era(1)
           ░░ Category(2)  ░░ Group(2)  ░░ Block(1)
           ░░ Anomaly(0)  ░░ Etymology(1)

  Block    ░░ s(1)  ░░ p(1)  ░░ d(1)  ░░ f(0)

  Era      ░░ 1800s(0)  ░░ 1890s(2)  ░░ 1940s(1)

  6 entities                                          × Clear all
```

Each row is a facet dimension. Each chip follows the Byrne pattern:
filled (██) when active, outlined (░░) when inactive, greyed when
disabled (count = 0). Counts update live as the user types or
toggles facets.

---

## Byrne, Pretext, and the Drama of Search

### How would Byrne think about this?

Oliver Byrne's genius was making abstract mathematics *visible*. His
coloured Euclid replaced verbal propositions with geometric colour —
the proof wasn't described, it was shown. Atlas search should follow
the same principle: **the results should be self-evident, not described.**

This means:

1. **Type badges as colour, not labels.** Instead of writing "[ELEMENT]"
   in text, the badge should be a solid colour chip — DEEP_BLUE for elements,
   WARM_RED for discoverers, MUSTARD for eras. The colour *is* the type.
   Users learn the mapping through repetition, not legend-reading.

2. **The table speaks during search.** When the user types "Curie", the
   periodic table doesn't just dim — the matching elements (Cm, Ra, Po)
   should *glow* in their block colours while everything else fades to
   near-invisible. The table becomes a result visualisation. The user
   sees spatial relationships: all three Curie-related elements are
   in the f-block/actinide region. That's information a list cannot convey.

3. **No chrome around results.** Byrne wouldn't draw a box around a
   theorem. Results should breathe — separated by hairline rules and
   whitespace, not bordered containers. The content boundary is implicit.

4. **Facets as colour chips, not checkboxes.** The facet bar uses the
   same Byrne-style chip pattern as the VizNav and AnomalyExplorer
   buttons. Active = filled, inactive = outlined, disabled = greyed.
   Consistency across the entire app.

### How does Pretext change search?

Pretext (our SVG text measurement system) enables things standard HTML
search cannot do:

1. **Measured result snippets.** Each result's descriptive text can be
   Pretext-measured to fit exactly within the result card width. No
   CSS text-overflow hacks, no truncation artifacts — the text is
   measured and flowed precisely, like a typeset book.

2. **Drop cap entity names.** For element results, the element symbol
   could render as a Pretext drop cap in the block colour:

   ```
     R                          P
     ADIUM — Alkaline earth     OLONIUM — Metalloid
     metal, discovered by       discovered by Marie
     Marie Curie in 1898.       and Pierre Curie.
   ```

   This is the same pattern used in the element folio. Search results
   become miniature folios. Visual continuity.

3. **Inline sparklines in results.** A result for an element could include
   a tiny sparkline showing where it falls on the currently-selected
   property scale. Searching for "Curie" while in "Ionisation Energy"
   colour mode? Each element result shows a rank dot. Data density
   without visual noise.

### How does animation change search?

Atlas has four "explosive moments" defined in the design language. Search
introduces a fifth:

**5. Search reveal: results cascade in, table elements pulse.**

The sequence:

1. User types 3rd character → filter bar expands
2. Results panel wipes down from the filter bar (200ms, ease-out)
3. Individual results stagger in (folio-line-reveal, 30ms apart)
4. Simultaneously, matching elements on the table pulse once
   (scale 1.0 → 1.15 → 1.0, 300ms, ease-spring) while non-matching
   elements fade to 0.15 opacity
5. Type badges slide in from the left (rule-draw animation on the
   coloured chip background)

When the user clears search:
1. Results panel wipes up (reverse of entry)
2. All table elements fade back to full opacity in a ripple outward
   from the centre (same pattern as highlight switch)

The critical principle: **search is not a mode change, it's a lens.**
The periodic table is always visible (at least on desktop). The results
overlay is translucent to the structure beneath. The user never feels
they've left the table — they've focused it.

### Faceted navigation through a Byrne lens

Traditional faceted navigation is visually heavy: sidebar panels,
checkbox lists, accordion sections. For Atlas, facets should be
**inline with the data**, not beside it.

Proposed pattern: **facet chips live in the filter bar itself.**
The Explore page always shows the search box and primary facet row.
Secondary facet rows appear contextually. Entity cards fill the
space below. See the Faceted Navigation section above for the state
machine model and composition rules.

```
  🔍 curie                                                      ×

  Entity   ██ Element(3)  ░░ Discoverer(2)  ░░ Era(1)
           ░░ Category(2)  ░░ Group(2)  ░░ Block(1)
           ░░ Anomaly(0)  ░░ Etymology(1)

  Block    ░░ s(1)  ░░ p(1)  ░░ d(1)  ░░ f(0)
  Era      ░░ 1800s(0)  ░░ 1890s(2)  ░░ 1940s(1)

  6 entities                                          × Clear all
```

Each row is a facet dimension. Each chip is a Byrne-style button
(filled when active, outlined when inactive, greyed when disabled).
Counts update live using self-exclusion: counts for facet F are
computed with all active filters except F. The entire facet system
occupies 2–4 lines of chips — no sidebar, no modal, no accordion.

Clicking a non-element card (e.g. a discoverer) pre-fills that
entity as a facet value rather than entering a drill-down mode.
This keeps all other facets active and their counts meaningful.

For property-range facets (atomic mass, electronegativity), a tiny
SVG histogram replaces the chip row:

```
  Mass: ▁▂▃▅▇▆▅▃▂▁  [====50=======200====]
```

The histogram is drawn with Pretext-measured axis labels. The range
handles snap to meaningful boundaries. The whole thing is 24px tall.

This is how Byrne would do faceted search: **make the controls as
information-dense and visually precise as the data they filter.**

---

## Gotchas

1. **FTS5 case sensitivity on D1** — must use lowercase `fts5`
2. **No custom tokenisers** — synonym expansion happens in Worker JS
3. **No virtual table export** — drop FTS tables before `wrangler d1 export`
4. **Embedding model lock-in** — choosing bge-base-en-v1.5 means all vectors
   must be regenerated if we switch models
5. **Vectorize requires paid plan** — $5/month minimum
6. **Small corpus** — with 300 docs, client-side fuzzy search (Fuse.js) is a
   viable alternative. The D1+Vectorize approach is justified by the semantic
   understanding it provides (the "Curie" → Radium/Polonium connection).
