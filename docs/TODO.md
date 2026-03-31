# Atlas — TODO

## Data Enrichment

### Melting & Boiling Points
- Source melting point (Tm) and boiling point (Tb) in Kelvin from Wikidata/PubChem
- Freezing point is the same phase boundary as melting point but approached from the liquid side — for pure elements at 1 atm they are identical, so a single Tm value suffices; note this equivalence in the UI
- Build a **temperature slider** (0 K – 10,000 K) that recolours the periodic table by phase at the selected temperature
- Add a **pressure dimension** for a 2D phase-state explorer (requires sourcing pressure–temperature phase diagrams, which are sparse for many elements)

### Electron Configuration & Aufbau Principle
- Research how to represent electron configuration strings (e.g. `[Ar] 3d⁵ 4s¹`) compactly in our data model
- Investigate an **orbital-filling animation** that builds the periodic table row by row, showing electrons entering orbitals in aufbau order
- Highlight anomalies where the aufbau prediction is wrong (Cr, Cu, etc.) and explain the half-filled / fully-filled subshell stability preference
- Consider how this fits alongside the existing Anomaly Explorer — could the aufbau visualiser *be* the anomaly explanation?

### Interactive Oxidation State Filters
- Source common oxidation states (list of integers per element) from Wikidata
- Add a filter/slider to the periodic table: "Show elements that can have oxidation state +3"
- Visualise how oxidation state variety correlates with position in the table (transition metals have many; s-block has few)

### Isotope Data
- Source isotope count, most stable isotope mass, and half-life of longest-lived radioactive isotope
- Build an **isotope abundance** pie chart or bar for each element
- Create a **radioactive decay timeline** — slider showing which isotopes remain after N years
- Flag synthetic/short-lived elements distinctly

### Density
- Source density (g/cm³) at STP from PubChem
- Add as a fifth numeric property alongside mass, electronegativity, ionisation energy, and radius
- Enables property scatter plots that bridge phase and mass
- Density gradient colouring on the periodic table would reveal why metals cluster at the bottom-left

### Abundance & Crystal Structure
- Research **cosmic abundance** (solar system), **crustal abundance** (Earth's crust), and **oceanic abundance** — these are relative phenomena measured on log scales
- Abundance data would power a "rarity slider" showing which elements are common vs. vanishingly rare
- Source **crystal structure** type (bcc, fcc, hcp, diamond cubic, etc.) from Wikidata
- Research how to render unit cells as small 3D or isometric SVG diagrams
- Crystal structure correlates with material properties (ductility, hardness) — visualise these relationships

---

## Search

### Hybrid Search: Vectorize + D1 BM25
- [ ] Set up Cloudflare Worker with D1, Vectorize, and Workers AI bindings
- [ ] Create `search_entities` table in D1 with id, entity_type, name, symbol, url_path, search_text, metadata_json
- [ ] Create `search_fts` FTS5 virtual table (lowercase `fts5`, `content=` pattern, `porter unicode61` tokeniser)
- [ ] Create `synonyms` table with chemistry-specific term pairs (wolfram/tungsten, noble gas/inert gas, Latin element names)
- [ ] Build seed script to populate ~300 searchable entities from existing data
- [ ] Generate embeddings for all entities using `@cf/baai/bge-base-en-v1.5` (cls pooling, 768 dimensions)
- [ ] Create `atlas-search` Vectorize index (768 dims, cosine metric)
- [ ] Implement Worker search endpoint: synonym expansion, parallel D1 FTS5 + Vectorize fan-out, Reciprocal Rank Fusion (k=60)
- [ ] Verify "Curie" query returns Marie Curie, Pierre Curie, Curium, 1890s era, Radium, Polonium

### Search UI
- [ ] Build search results overlay panel (appears below filter bar when 3+ characters typed)
- [ ] Byrne-style type badges: DEEP_BLUE (element), WARM_RED (discoverer), MUSTARD (era), BLACK (group), MINERAL_BROWN (etymology)
- [ ] Pretext-measured result snippets for precise text flow
- [ ] Keyboard navigation: / to focus, arrows to navigate results, Enter to open, Esc to clear
- [ ] Mobile: full-width results panel, hide periodic table during active search
- [ ] Empty state: "No results" message with search suggestions
- [ ] Simultaneous periodic table highlighting: matching elements glow, non-matching fade to 0.15 opacity

See `docs/search-spec.md` for full technical specification and ASCII UI mocks.

---

## Faceted Navigation

### Core Facets (Tier 1 — always visible)
- [ ] Category multi-select chips (~10 values)
- [ ] Block multi-select chips (s, p, d, f)
- [ ] State of matter chips (Solid, Liquid, Gas, Unknown)
- [ ] Radioactivity toggle (Stable / Radioactive)

### Secondary Facets (Tier 2 — collapsed by default)
- [ ] Period chips (1–7)
- [ ] Group compact number row (1–18)
- [ ] Discovery era buckets (Ancient, 1700s, 1800s, 1900s, 2000s)
- [ ] Natural vs Synthetic toggle
- [ ] Etymology origin multi-select

### Property Range Facets (Tier 3 — behind "More filters")
- [ ] Atomic mass range slider with histogram
- [ ] Electronegativity range slider with histogram
- [ ] Ionisation energy range slider with histogram
- [ ] Atomic radius range slider with histogram

### Facet UX
- [ ] Active filter bar with removable pills and "Clear all"
- [ ] Live count feedback on every facet option ("Noble Gas (6)")
- [ ] Dim non-matching elements on table (don't remove them)
- [ ] Result count indicator: "Showing N of 118 elements"
- [ ] Facet state persists across visualisation pages (global lens)
- [ ] Smart suggestions: when filtering by Block, suggest colouring by Period
- [ ] Curated entry points: "Humphry Davy's Elements", "Room-Temperature Liquids", "Elements Named After Places"

### Design Principles
- [ ] "Explore" language, not "Search" language ("Focus on" not "Filter to")
- [ ] Facets as inline chips in the filter bar, not sidebar checkboxes
- [ ] Three-tier progressive disclosure: default (no facets) -> quick chips -> full panel

---

## Byrne/Pretext Design Enhancements

### Search as Visual Drama
- [ ] Type badges as solid colour chips (colour IS the type, not text labels)
- [ ] Periodic table as search result visualisation: matching elements pulse, non-matching fade
- [ ] No chrome around results: hairline rules and whitespace, not bordered containers
- [ ] Search reveal animation (5th explosive moment): results cascade in, table elements pulse

### Pretext Integration
- [ ] Pretext-measured result snippets fitting exactly within card widths
- [ ] Drop cap element symbols in search result cards (miniature folios)
- [ ] Inline sparklines in element results showing current property rank

### Animation Choreography
- [ ] Search reveal: filter bar expands, results wipe down, items stagger, table pulses
- [ ] Search clear: results wipe up, table elements fade back in ripple from centre
- [ ] Facet activation: smooth element dim/glow transitions (250ms ease-out)
- [ ] Property histogram: bars grow on facet panel expand

---

## Infrastructure

- [ ] Cloudflare Workers Paid plan ($5/month) for Vectorize access
- [ ] D1 database provisioning and migration scripts
- [ ] Vectorize index creation and seeding pipeline
- [ ] CI integration: re-seed search index on data changes
