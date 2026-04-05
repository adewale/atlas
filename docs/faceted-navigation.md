# Faceted Navigation — Research & Design

## Sources

- [Simon Willison — Facets Understood (2002)](https://simonwillison.net/2002/Jul/28/facetsUnderstood/)
- [IAWiki — Faceted Classification (archived 2007)](https://web.archive.org/web/20070221033831/http://www.iawiki.net/FacetedClassification)
- [Olsen — Photo indexing with state-machine facets](https://github.com/adewale/olsen/)
- [William Denton — How to Make a Faceted Classification and Put It On the Web](https://www.miskatonic.org/library/facet-web-howto.html)

---

## Core theory: Ranganathan

S.R. Ranganathan created the first faceted classification — the Colon
Classification — in 1933.  The core insight: **"there is more than one
way to view the world."**  Instead of forcing items into a single
hierarchy, you describe each item along multiple independent dimensions.

His five fundamental categories (PMEST):

| Facet | Meaning | Atlas mapping |
|-------|---------|---------------|
| **P**ersonality | The primary subject | Entity type (element, discoverer, era…) |
| **M**atter | Substance / material | Block (s, p, d, f) |
| **E**nergy | Process / activity | Phase (solid, liquid, gas) |
| **S**pace | Geographic location | Etymology origin (place, person, mythology…) |
| **T**ime | Temporal dimension | Discovery era (Antiquity, 1770s, 1800s…) |

### Design rules (Spiteri's codification)

1. Facets must be **mutually exclusive** within a dimension
2. Facets must be **jointly exhaustive** — every item belongs to one value
3. Facets must be **hospitable** — you can add new values or new dimensions
   without restructuring
4. Values must be **ascertainable** — definite, not ambiguous
5. 3–7 facets work best; each should apply broadly across the collection

### Hierarchical vs faceted

Hierarchical classification (Dewey, Yahoo! Directory) is top-down — every
item must be slotted into one branch.  Faceted classification is bottom-up —
items are described by values across multiple independent flat dimensions.
There is no single "correct" place for an item.

As Willison puts it: facets are **flat**, classification is **bottom-up**.

This maps naturally to the periodic table: Oxygen belongs simultaneously to
period 2, group 16, p-block, nonmetal, gas, 1770s, Priestley, and
property-named.  No hierarchy can capture that.  Facets can.

---

## Olsen's state machine model

Olsen (a photo indexing system) implements faceted navigation as a
**deterministic state machine**.  Three governing principles:

### 1. No dead ends

> Users cannot transition from a state with results to one with zero results.

Every facet value displays a live count.  Values with count = 0 are visible
but **disabled** (not hidden).  The user always sees the full vocabulary of
a facet, but can only select values that produce results.

### 2. Self-exclusion counting

When computing counts for facet F, apply all active filters **except** F
itself.  This means:

- Selecting "s-block" doesn't change the counts shown for other blocks
- You always see how many results each block value would produce, regardless
  of which block is currently selected
- This encourages exploration: "what if I switched to d-block?"

### 3. URL as source of truth

All filter state lives in the query string.  AND logic across facets,
OR logic within a facet.  Enables deep linking and reproducibility.
No hidden state.

### 4. No hardcoded hierarchy

Relationships between facets are not assumed.  Changing year does not
auto-clear month — the month filter persists if that year+month
combination has data.  Valid transitions emerge from the data, not
from coded rules.

---

## Faceted navigation vs entity traversal

These are two different interaction models that serve different purposes.

### Faceted navigation

Faceted navigation **narrows a result set** by constraining independent
dimensions.  Every action is a filter.  The user moves from a broad
set to a narrow one.  The result set is always a flat list of entities
that satisfy ALL active constraints.

```
  All 300 entities
    → filter Entity Type = Discoverer    (50 results)
    → filter Era = 1800s                 (14 results)
    → filter Block = s                   (3 results: Davy, Bunsen, Arfwedson)
```

At every step, the user sees counts, can remove filters, and can
change direction.  The path is non-linear — you can remove "Era = 1800s"
and add "Block = d" without backtracking.

### Entity traversal

Entity traversal **follows a relationship** from one entity to its
connected entities.  It's graph navigation.  The user moves from a
node to its neighbours.

```
  Humphry Davy (discoverer)
    → shows: Na, K, Ca, Ba, B  (his elements)
      → click Na
        → shows Na folio page
```

This is inherently hierarchical and directional.  The breadcrumb trail
records the path.  Backtracking means popping the stack.

### The key difference

Faceted navigation is **set-based**: "show me all entities that are
discoverers AND from the 1800s AND related to s-block elements."

Entity traversal is **graph-based**: "show me Humphry Davy, then show
me his elements, then show me Sodium."

### Can facets subsume drill-down?

**Yes, largely.**  If Discoverer is a facet dimension (not just an entity
type filter), then narrowing to "Discoverer = Humphry Davy" produces
the same 5 elements as drilling into his card.  The difference is:

- With facets, those 5 elements still show all other facet dimensions
  (block, era, phase, etymology) with live counts.  You can further
  narrow: "Davy's elements that are in s-block" (4 of 5).
- With drill-down, you get a flat list of children with no further
  filtering affordance.

Facets are strictly more powerful.  Drill-down is simpler to understand
on first encounter.  A good design uses facets as the engine and offers
drill-down as a shortcut: clicking "Humphry Davy" pre-fills the
Discoverer facet rather than entering a separate navigation mode.

---

## Implications for Atlas

### What the current Explore page does

- One facet: entity type (Byrne chips with live counts)
- Text search across all ~300 entities
- Breadcrumb drill-down into entity children (graph traversal)

### What it should do

1. **Multiple orthogonal facets**, matching the domain's natural dimensions:
   - Entity type (element, discoverer, era, category, group, block, anomaly, etymology)
   - Block (s, p, d, f) — applies to elements and groups
   - Phase (solid, liquid, gas) — applies to elements
   - Discovery era (Antiquity, 1770s, 1800s…) — applies to elements and discoverers
   - Etymology origin (place, person, mythology…) — applies to elements

2. **State-machine counting** (Olsen model):
   - Compute counts for each facet value using all active filters except that facet
   - Disable (don't hide) values with count = 0
   - Persist all filters across interactions

3. **Drill-down as facet pre-fill**, not a separate mode:
   - Clicking a discoverer card sets "Discoverer = Humphry Davy" as a facet
   - The result set narrows to his elements, but other facets remain active
   - The user can further filter by block, era, etc.

4. **Integration with hybrid search**:
   - Text search (client-side now, D1+Vectorize later) produces a candidate set
   - Facets narrow that candidate set
   - Live counts update to reflect the search-narrowed pool
   - The search spec's "facets as refinement chips below the results header"
     (line 346) becomes the full multi-dimensional facet bar

### How this connects to the search spec

The existing search-spec.md (lines 346–484) already describes:
- Entity-type filter chips below search results
- Block and era as additional facet rows
- Property-range histograms
- Byrne-style chips (filled/outlined)
- Live counts

What it doesn't describe:
- Self-exclusion counting (Olsen's key insight)
- Dead-end prevention (disabling zero-result values)
- Facet state persistence across page navigation
- Drill-down as facet pre-fill rather than separate mode
- The theoretical foundation (Ranganathan, PMEST)

The search spec should be updated to incorporate these principles.

---

## Design principles (synthesis)

1. **Facets are flat, not hierarchical** (Willison / Ranganathan)
2. **No dead ends** — disable, don't hide, zero-result values (Olsen)
3. **Self-exclusion counting** — counts for facet F ignore F's own selection (Olsen)
4. **Drill-down is a facet shortcut**, not a separate mode
5. **Colour is structural identity** — facet chips use Byrne palette (search spec)
6. **The table is always visible** — facets are a lens, not a mode change (search spec)
7. **3–7 facets**, progressively disclosed (Ranganathan / search spec Tier 1/2/3)
8. **URL as source of truth** — all filter state in query params (Olsen)
