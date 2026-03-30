Implementation Spec: Atlas v1
==============================
Resolves ambiguities in atlas.spec for a correct, buildable implementation.

1. Pretext (@chenglou/pretext)
------------------------------
Library: https://github.com/chenglou/pretext
Package: @chenglou/pretext (npm, version >=0.0.3)
What it is: A text measurement and layout engine. It does NOT export React
components. Its core API:
  - prepare(text, font) -> PreparedText (one-time measurement pass)
  - layout(prepared, maxWidth, lineHeight) -> { lineCount, height }
  - layoutWithLines(prepared, maxWidth, lineHeight) -> { lines: LayoutLine[] }
  - layoutNextLine(prepared, cursor, maxWidth) -> LayoutLine | null
Each LayoutLine has: text, width, start cursor, end cursor.

Do NOT vendor a fake React wrapper. Install the real package from npm.

Usage in Atlas -- three tiers:

Tier 1: Measured SVG text blocks (all text-bearing views)
  Use prepare() + layoutWithLines() to break text into lines, then render
  each line as a positioned SVG <text> element with exact y offsets.
  This replaces CSS word-wrap with editorially controlled line breaks.
  Used for: atlas plate captions, compare relationship notes, about page,
  credits descriptions, marginalia notes.
  Per-line styling: right-align ragged text, insert thin SVG rules between
  lines, center short terminal lines in captions.

Tier 2: Shaped text in folios (element folio view)
  Use layoutNextLine() with a DIFFERENT maxWidth per line to flow summary
  text around the data plate SVG. Lines beside the plate are narrower;
  lines below it are wider.
  Plate-height coordination: The data plate has a fixed SVG height (180px
  at the folio's rendering scale). The text line height is computed from
  Pretext's measurement of a reference string at the body font. Divide
  plate height by line height to get plateHeightInLines. This must be
  computed at render time after Pretext's prepare() call, not hardcoded.
    const ref = prepare('Xg', '16px system-ui');
    const { height: lineHeight } = layout(ref, 9999, 0); // single line height
    const plateHeightInLines = Math.ceil(180 / lineHeight);

Tier 3: Tufte data integration (structurally positioned)
  Pretext gives exact per-line geometry (width, y-position). We integrate
  data visualizations at structural positions -- NOT triggered by text content.
  - GROUP TREND SPARKLINE: After the summary text block, draw a sparkline
    showing the trend of one key property across this element's group.
    Data source: group members from groups.json + their property values.
    Position: at a fixed y below the last summary line (Pretext tells us
    where that is). Width: full column width.
  - RANK SPARKLINES IN MARGINALIA: Next to each numeric property in the
    marginalia, a tiny 40px sparkline dot showing rank position (element
    #3 of 118 in mass = dot near the high end). Data: rankings.json.
  - SMALL MULTIPLES WITH FITTED LABELS: Atlas plates render grids of mini
    element cards. Use layout() to verify that element name + one property
    value fits within each card's width at the target font size. If it
    doesn't fit, abbreviate the name. No overflow, no ellipsis.

  All sparklines and annotations are driven by structured data (rankings,
  groups, periods). NONE require parsing the meaning of Wikipedia text.

Pretext + CLS prevention:
  For HTML text blocks (marginalia), use layout() to pre-calculate exact
  height before render. Set the container height explicitly to prevent
  cumulative layout shift.

2. Data Strategy
----------------
Approach: Fully static seed dataset, committed to the repo.

Seed generation (one-time script, run manually, results committed):
- Script: scripts/generate-seed.ts
- Sources, merged with explicit field-level priority:
    atomicNumber, symbol, name, period, group, block: hardcoded (IUPAC standard)
    wikidataId: Wikidata SPARQL
    wikipediaTitle, wikipediaUrl: Wikidata sitelinks
    category: Wikidata P31 (instance of) + manual correction for edge cases
    phase: PubChem, fallback to Wikidata
    mass: PubChem standard atomic weight (authoritative for numeric accuracy)
    electronegativity: PubChem Pauling scale value
    ionizationEnergy: PubChem first ionization energy
    radius: PubChem atomic radius (empirical)
    summary: Wikipedia REST API /page/summary/{title} -> extract field
- Conflict resolution: When PubChem and Wikidata disagree on a numeric value,
  PubChem wins (it's the chemistry-specific source). The seed script logs
  all conflicts to stdout so they can be reviewed.
- Output: data/seed/elements.json (single file, all 118 elements, real values)
- The seed file is committed and is the source of truth.
- Re-running generate-seed.ts may produce different Wikipedia summaries (they
  change over time). Diff the output before committing to review changes.

Licensing metadata in seed:
  Each element record in the seed includes a `sources` field:
    sources: {
      structured: { provider: "PubChem", license: "public domain" },
      identifiers: { provider: "Wikidata", license: "CC0 1.0" },
      summary: {
        provider: "Wikipedia",
        title: string,       // article title
        url: string,         // article URL
        license: "CC BY-SA 4.0",
        accessDate: string   // ISO date when summary was fetched
      }
    }
  This metadata flows through to the credits page and source strip.

Build-time derivation (runs on every build via `npm run build:data`):
- Script: scripts/derive-data.ts
- Input: data/seed/elements.json
- Output (all committed to data/generated/):
  - elements.json (full array, sources stripped for bundle size)
  - element-{Symbol}.json (per-element, sources included)
  - groups.json, periods.json, blocks.json, categories.json
  - rankings.json (sorted arrays for mass, electronegativity, ionization energy, radius)
  - anomalies.json (with authored descriptions -- see section 7)
  - credits.json (aggregated licensing for all sources -- see section 20)

Generated files ARE committed to the repo so the app works after clone.

3. Element Schema
-----------------
```typescript
type SourceAttribution = {
  provider: string;
  license: string;
  url?: string;
  title?: string;
  accessDate?: string;
};

type ElementRecord = {
  atomicNumber: number;
  symbol: string;
  name: string;
  wikidataId: string;           // e.g., "Q556" for Hydrogen
  wikipediaTitle: string;
  wikipediaUrl: string;
  period: number;               // 1-7
  group: number | null;         // 1-18, null for lanthanides/actinides
  block: 's' | 'p' | 'd' | 'f';
  category: string;             // e.g., "alkali metal", "noble gas"
  phase: string;                // "solid", "liquid", "gas", "unknown" at STP
  mass: number;                 // atomic mass in Da (real values from PubChem)
  electronegativity: number | null; // Pauling scale
  ionizationEnergy: number | null;  // first ionization, eV
  radius: number | null;        // atomic radius, pm
  summary: string;              // Wikipedia extract, 1-2 paragraphs
  neighbors: string[];          // adjacent elements by atomic number
  rankings: Record<string, number>; // rank position for each numeric property
  sources?: {                   // present in per-element files, stripped from array
    structured: SourceAttribution;
    identifiers: SourceAttribution;
    summary: SourceAttribution;
  };
};
```

All numeric values must be real scientific data. No formulas or fabrication.

4. Periodic Table (Home Page)
-----------------------------
Layout: Standard IUPAC 18-column grid.
- 7 main rows (periods 1-7)
- 2 separated rows below for lanthanides (Z=57-71) and actinides (Z=89-103)
- Gap between period 7 and the f-block rows
- Empty cells where no element exists (e.g., row 1 cols 2-17)

Rendering: SVG with fixed cell positions computed by lib/grid.ts.
Cell content: atomic number (small), symbol (large, bold), name (small).
Default fill: paper (#f7f2e8) with black (#0f0f0f) stroke.

Highlight modes (select dropdown):
- None: default paper fill
- Group: alternating deep blue (#133e7c) / mustard (#c59b1a)
- Period: alternating warm red (#9e1c2c) / deep blue (#133e7c)
- Block: s=#133e7c, p=#c59b1a, d=#9e1c2c, f=#2e2e2e
- Category: metal-containing=#133e7c, nonmetal/noble gas=#9e1c2c, metalloid=#c59b1a
- Numeric property: continuous color scale from paper to deep blue, proportional
  to selected property (mass | electronegativity | ionizationEnergy)

Highlight mode contrast: When a cell has a dark fill (deep blue, warm red,
f-block dark), text color flips to paper (#f7f2e8). lib/grid.ts exports a
contrastTextColor(fillColor) function that returns black or paper based on
relative luminance. This is computed per-cell, not hardcoded per mode.

Search: text input filters visible elements by name or symbol. Non-matching
cells dim to #ece7db.

Keyboard navigation: Spatial grid movement.
- Arrow keys move focus in the visual grid (up/down/left/right)
- Skip empty cells (jump to next occupied cell in that direction)
- Enter/Space navigates to /element/:symbol
- Tab/Shift+Tab for sequential focus order (accessibility)
- Visible focus ring: 2px warm red (#9e1c2c) stroke

Keyboard edge cases (lib/grid.ts must handle):
- Arrow-up from lanthanide row (Ce-Lu): go to the main grid element directly
  above (La for Ce, Hf for Lu, interpolate for middle elements based on
  column alignment)
- Arrow-down from period 6 groups 4-17: go to corresponding lanthanide
- Arrow-up from actinide row: same logic via period 7
- Arrow-up from period 1 or arrow-down from actinide row: no-op (stay put)
- Arrow-left from group 1: no-op. Arrow-right from group 18: no-op.
- The adjacency map is pre-computed as a static lookup table in grid.ts,
  not calculated at navigation time.

5. Element Folio (/element/:symbol)
------------------------------------
Two-column layout: main content (left) + marginalia panel (right).
The entire folio has a block-color identity derived from element.block:
  s-block: deep blue accents. d-block: warm red accents.
  p-block: mustard accents. f-block: black accents.
This color appears in: the giant atomic number, thin rules, the data plate
fields, and the vertical color bar on the left edge of the folio.

Main content:
- Giant atomic number (3-digit zero-padded, e.g., "001") in block color
- Giant symbol in black
- Element name as heading
- Thin rule in block color
- Summary text composed with Pretext shaped text (Tier 2): text flows around
  the data plate using variable-width layoutNextLine(). Lines beside the plate
  are narrower, lines below are full width.
- SVG data plate showing group, period, block with hard color fields
  (group row = deep blue, period row = warm red, block row = block color)
- Below the summary: group trend sparkline (Tier 3) showing this element's
  position within its group for electronegativity. Data-driven from
  groups.json + element property values.
- Below sparkline: property bars -- small horizontal SVG bars for mass,
  electronegativity, ionization energy, radius, each showing where this
  element falls on the 1-118 scale. Colored in block color. Data-driven
  from rankings.json. These are Byrne-style: hard color fields where the
  bar length IS the data.

Marginalia (right panel):
- Category
- Key numeric properties with values, each with a 40px rank dot sparkline
  (from rankings.json, purely structural)
- Neighbor elements (links)
- Thin rule
- Source strip (see section 20 for full licensing requirements):
  * Data: "PubChem (public domain)" with link to PubChem compound page
  * Identifiers: "Wikidata (CC0 1.0)" with link to Wikidata item
  * Text: "{wikipediaTitle}" with link + "Wikipedia excerpt, CC BY-SA 4.0"
  * Media: "No media in v1"
  * Access date shown for Wikipedia summary
- Compare link (to /compare/:symbol/O or nearest neighbor)

Folio entry animation: text lines reveal with stagger, data plate wipes in
via clip-path, property bars grow from zero, sparkline draws. The block-color
accents are already in place (no wipe needed -- they're structural, not
animated). See section 10.

6. Atlas Plates (/atlas/*)
--------------------------
Rendering: SVG card grid. Each element in the set rendered as a mini
folio-style card showing symbol, atomic number, and one key property.
Cards arranged in meaningful order (by group number, period number,
atomic number within category, or ranked by property value).

Small multiples (Tier 3): Pretext measures each card's label to verify
it fits. Cards use consistent sizing. The grid itself is the visualization.

Caption text composed with Pretext (Tier 1). Caption strips on atlas plates
use a solid color band behind the caption, colored by the grouping criterion
(block color for block views, etc.).

Routes:
- /atlas/group/:n -- elements in group n
- /atlas/period/:n -- elements in period n
- /atlas/block/:block -- elements in block (s/p/d/f)
- /atlas/category/:slug -- elements in category
- /atlas/rank/:property -- all 118 elements sorted by property
- /atlas/anomaly/:slug -- curated anomaly sets

7. Anomalies
-------------
Launch set:
- synthetic-heavy: superheavy elements (Z > 103)
- f-block-gap: f-block discontinuity on the main grid
- diagonal-relationships: Li/Mg, Be/Al, B/Si diagonal pairs
- electron-config-anomalies: Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au
- metalloid-boundary: elements on the metal/nonmetal border (B, Si, Ge, As, Sb, Te)

Each anomaly has: slug, label, description, element list.
Descriptions are authored as static strings in derive-data.ts (not fetched,
not generated). They are editorial -- 2-3 sentences explaining why this set
is interesting from a structural/compositional perspective. Example:
  "Superheavy elements beyond lawrencium exist only as synthetic isotopes
   with half-lives measured in milliseconds. Their chemical properties are
   predicted but largely unverified experimentally."
Five descriptions total. Author them once, commit them in the script.

8. Compare View (/compare/:symbolA/:symbolB)
----------------------------------------------
Split-screen dramatic layout:
- Bold vertical split in SVG: left half deep blue, right half warm red
- Each side shows element symbol (giant), name, atomic number
- Below the split: horizontal comparison bands for each shared numeric
  property (mass, electronegativity, ionization energy, radius)
  showing both values on the same scale with visual bars
- Category and block context

Relationship notes -- structured templates, not free text:
  Templates are built from element properties, no NLP required.
  Implemented as a function: generateComparisonNotes(a, b) -> string[]
  Template rules (applied in order, skip if not applicable):
    a.block === b.block       -> "Both {block}-block elements."
    a.period === b.period     -> "Share period {n}."
    a.category === b.category -> "Both classified as {category}."
    a.phase !== b.phase       -> "{a.name} is {a.phase}; {b.name} is {b.phase} at STP."
    a.group && b.group        -> "Groups {a.group} and {b.group}."
    abs(a.rankings.mass - b.rankings.mass) <= 5
                              -> "Similar mass ranking ({a.rankings.mass} vs {b.rankings.mass} of 118)."
  Concatenated into a short paragraph, composed with Pretext (Tier 1).
  If all properties differ, the templates naturally produce a longer note
  listing the contrasts. If elements are very similar, it's shorter.
  No wedge text. Standard Pretext-measured block.

9. Design Language
------------------
Balance: 60% Kronecker-Wallis/Byrne visual drama, 40% Tufte data density.

Palette:
- Paper: #f7f2e8
- Black: #0f0f0f
- Deep blue: #133e7c
- Warm red: #9e1c2c
- Mustard yellow: #c59b1a

Block-color mapping (used throughout):
  s-block -> deep blue (#133e7c)
  p-block -> mustard (#c59b1a)
  d-block -> warm red (#9e1c2c)
  f-block -> black (#0f0f0f)

Visual rules:
- Giant numerals and symbols (hero elements)
- Hard color fields (solid SVG rects, no gradients)
- Thin rules (1px, colored by block identity in folios, black elsewhere)
- Narrow marginalia column
- Generous outer whitespace (page margins)
- Bold geometric color blocks in atlas plates and compare views
- High data-ink ratio in data tables and property displays
- Body text: system sans-serif, 16px base
- Monospace for numeric values and atomic data
- Zero border-radius throughout. Sharp corners. Printed, not digital.
- Animation: 90% still, 10% explosive (see section 10)

Byrne integration (structural, data-driven):
- Every folio has a block-color identity. The giant atomic number, thin rules,
  data plate fields, property bars, and left-edge color bar all use the
  element's block color. You recognise the block before reading a word.
  Flip through Fe (red/d), C (mustard/p), Na (blue/s) — each is visually
  distinct. Color IS structural identity. Driven by element.block.
- Data plate: hard color fields for group (deep blue) and period (warm red).
- Property bars in folios: horizontal bars where length IS the data value,
  filled in block color. Byrne's principle — the colored shape is the fact.
- Atlas plate caption strips: solid color band behind caption.
- Compare split: blue/red halves are color-as-identity at maximum scale.
- Highlight modes: the entire periodic table becomes a Byrne diagram.

Tufte integration (structurally positioned via Pretext):
- Group trend sparkline after folio summary: shows property trend across the
  element's group. Positioned by Pretext (we know where the summary ends).
- Rank dot sparklines in marginalia alongside each property value.
- Small multiples: atlas plate card grids with Pretext-fitted labels.
- High data-ink ratio: property bars carry data without axes or decoration.
- All data visualizations are driven by structured data (rankings.json,
  groups.json, element properties). None require parsing text content.

10. Animation & Motion
----------------------
Philosophy: 90% of the interface is perfectly still. Four specific moments
have dramatic, purposeful motion. The stillness makes the motion land harder.

Animation decision framework (adapted from Emil Kowalski):
  Before animating anything, ask: how often does the user see this?
  - Keyboard navigation, search typing, focus changes: NO animation. Ever.
  - Highlight mode switch: OCCASIONAL. Standard animation (250ms).
  - Folio entry, compare split, first load: RARE/first-time. Full drama.
  Every animation must answer "why does this animate?" Valid answers:
  spatial consistency, state indication, preventing jarring changes.

Easing:
  Custom curves (CSS custom properties):
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);        /* enters/exits */
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen movement */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* playful overshoot */
    --ease-snap: cubic-bezier(0.4, 0, 0.2, 1);        /* quick state toggles */
  Never use ease-in. All entries use --ease-out.

Duration rules:
  - Stagger delays: 30-50ms between items
  - Color transitions: 200-250ms
  - Structural reveals: 250-400ms
  - Total cascade cap: 500ms
  - Individual UI animations never exceed 300ms

Explosive moment 1 -- Folio entry (navigate to /element/:symbol):
  Summary text lines reveal top-to-bottom, ~30ms stagger per line.
  Each line fades from opacity 0 + translateY(6px) using --ease-out.
  Data plate wipes in via clip-path from the right edge.
  Property bars grow from zero width via clip-path, staggered 50ms.
  Group trend sparkline draws left-to-right after summary finishes.
  Block-color accents (number, rules, left bar) are already in place --
  they're structural, not animated. They provide the Byrne visual frame
  that the text and data animate INTO.
  Duration: ~400ms total.

Explosive moment 2 -- Compare view split:
  Color halves expand from center via clip-path. Symbols scale 0.95->1.0.
  Comparison bands stagger in, bars grow from zero, 50ms apart.
  Relationship note reveals as standard Pretext block, line by line.
  Asymmetric: entry 300ms ease-out, exit instant.

Explosive moment 3 -- Highlight mode switch:
  Cell fills transition 250ms, rippling outward from focused cell.
  CSS transitions (interruptible). Text color flips simultaneously.

Explosive moment 4 -- First load:
  Cells cascade by atomic number, ~4ms stagger, opacity 0->1 + translateY(4px).
  Total ~470ms.

Quiet (everything else):
  All instant. No transition. No ease. Stillness is deliberate.

Performance rules:
  - Only animate transform, opacity, clip-path (GPU-composited).
  - CSS animations for predetermined motion. CSS transitions for interactive.
  - contain: layout style paint on animated elements.
  - WAAPI for programmatic control with CSS performance.

Pre-ship animation checklist:
  [ ] Duration under 300ms (unless intentional)
  [ ] Only transform, opacity, clip-path
  [ ] Custom cubic-bezier curve
  [ ] Respects prefers-reduced-motion
  [ ] Interruptible where interactive
  [ ] 60fps on mid-range Android
  [ ] Consistent with other Atlas animations

Accessibility:
  @media (prefers-reduced-motion: reduce): keep opacity/color, remove movement.
  Touch hover gated behind @media (hover: hover) and (pointer: fine).

11. Mobile & Responsive
------------------------
Home page (periodic table):
- Desktop (>1024px): Full 18-column SVG grid.
- Tablet (768-1024px): SVG scales via viewBox. Min 44x44px touch targets.
- Mobile (<768px): Full 18-column grid, horizontally scrollable. Search bar
  above is the primary navigation path. Grid does NOT reflow to a list.
  Pinch-to-zoom: use CSS touch-action: manipulation on the page body, and
  touch-action: pinch-zoom on the SVG container specifically. Test on real
  iOS Safari -- this is a known difficulty.

Element folio:
- Desktop: Two-column (main + marginalia).
- Mobile: Single column. Data plate above summary. Marginalia below.
  Shaped text reverts to full-width layoutWithLines (not variable-width).

Compare view:
- Desktop: Side-by-side split.
- Mobile: Vertical split (top/bottom). Bands remain horizontal.

Atlas plates: Cards 4-across desktop, 2 mobile.

General: 44px min touch targets. SVG viewBox for scaling. System fonts.

12. Images
----------
No images in v1. Source strip says "No media in v1."
Image support is a v2 feature.

13. Accessibility (WCAG AA)
----------------------------
- SVG periodic table: role="img" with aria-label. Individual cells focusable
  with aria-label="[Name], atomic number [N], [category]"
- Keyboard: full spatial grid nav (section 4), with edge case handling
- Focus indicators: 2px warm red ring on all interactive elements
- Color contrast: contrastTextColor() function ensures AA ratio (4.5:1
  normal, 3:1 large) for all highlight mode + text color combinations.
  Property bars in folios use block colors against paper -- verify all
  four block colors meet 3:1 against #f7f2e8.
- Skip link to main content
- Search input: visible label (can be sr-only)
- Semantic HTML: heading hierarchy, landmarks, lists
- Screen reader text for SVG data visualizations
- prefers-reduced-motion: animation disabled

14. Technical Stack
-------------------
- Vite 6 + React 19 + React Router 7
- TypeScript (strict mode)
- @chenglou/pretext from npm (NOT vendored)
- fast-check for property-based testing
- Static site build -- no SSR, no server functions
- Cloudflare Pages for deployment (section 18)
- No additional UI or animation libraries
- Route-level code splitting via React Router lazy()
- React Router data loaders for pre-loading element/atlas data per route

15. Testing
-----------
Framework: Vitest + React Testing Library + Playwright + fast-check

Unit tests (Vitest):
- Data layer: getElement(), searchElements() return correct results
- Seed data validation: 118 elements, no null required fields, real values
- Derivation: groups.json has correct membership
- Rankings correctly sorted
- Compare template function: generateComparisonNotes() produces valid
  strings for same-block, same-period, all-different, and edge cases
- Contrast function: contrastTextColor() returns paper for dark fills,
  black for light fills

Component tests (Vitest + React Testing Library):
- PeriodicTable renders 118 cells
- Search filters correctly
- Highlight modes change fill colors AND text colors for contrast
- Folio renders element data with block-color accents
- Shaped text produces different line widths (narrow vs full)

Property-based tests (Vitest + fast-check):
  Data integrity invariants:
  - forAll(element): atomicNumber in 1..118, period in 1..7
  - forAll(element): if group !== null then group in 1..18
  - forAll(element): block is one of 's','p','d','f'
  - forAll(element): mass > 0
  - forAll(element): neighbors contains only symbols present in dataset
  - forAll(a, adjacent b): neighbor symmetry
  - forAll(ranking): 118 entries, no duplicates
  - forAll(group n): every listed element has group === n
  - forAll(period n): every listed element has period === n
  - forAll(category): slug matches at least one element

  Grid layout invariants:
  - forAll(element): grid position is unique
  - forAll(element): grid position within SVG viewBox
  - forAll(two elements, same period): same y-coordinate
  - forAll(two elements, same group): same x-coordinate
  - forAll(element): all four arrow-key directions from its cell lead to
    a valid cell or no-op (never to an empty/undefined cell)

  Pretext measurement invariants:
  - forAll(text, width): layoutWithLines is deterministic
  - forAll(text, w1 < w2): lineCount at w1 >= lineCount at w2
  - forAll(text, width): concatenating line.text reconstructs original
  - forAll(element summary): shaped lineCount >= full-width lineCount

  Search invariants:
  - forAll(element): searchElements(element.symbol) includes it
  - forAll(element): searchElements(element.name) includes it

  Licensing invariants:
  - forAll(element per-element file): sources field is present
  - forAll(element): sources.summary.license === "CC BY-SA 4.0"
  - forAll(element): sources.summary.accessDate is valid ISO date
  - forAll(element): sources.identifiers.license === "CC0 1.0"

Integration tests (Playwright):
- Home page loads, periodic table visible
- Click element -> navigates to folio with correct block color
- Keyboard: arrow keys move focus spatially, including f-block edge cases
- Search filters table
- Compare view renders both elements with relationship notes
- Source strip shows correct licensing per element
- All routes load without errors

16. Build & Scripts
-------------------
package.json scripts:
- "dev": "vite"
- "build:data": "tsx scripts/derive-data.ts"
- "build:seed": "tsx scripts/generate-seed.ts"  (one-time, manual)
- "build": "npm run build:data && vite build"
- "preview": "vite preview"
- "test": "vitest run"
- "test:e2e": "playwright test"
- "typecheck": "tsc --noEmit"
- "lint": "eslint ."
- "deploy": "npm run build && wrangler pages deploy dist/"

17. File Structure
------------------
atlas/
├── index.html
├── src/
│   ├── main.tsx
│   ├── routes.tsx
│   ├── globals.css
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Element.tsx
│   │   ├── AtlasGroup.tsx
│   │   ├── AtlasPeriod.tsx
│   │   ├── AtlasBlock.tsx
│   │   ├── AtlasCategory.tsx
│   │   ├── AtlasRank.tsx
│   │   ├── AtlasAnomaly.tsx
│   │   ├── Compare.tsx
│   │   ├── About.tsx
│   │   ├── Credits.tsx
│   │   └── Design.tsx
│   ├── components/
│   │   ├── PeriodicTable.tsx          # search, keyboard nav, highlight modes
│   │   ├── Folio.tsx                  # shaped text, data plate, property bars
│   │   ├── AtlasPlate.tsx            # card grid with fitted labels
│   │   ├── CompareView.tsx           # split screen, comparison bars, templates
│   │   ├── PretextSvg.tsx           # renders Pretext-measured lines as SVG
│   │   ├── PropertyBar.tsx          # horizontal bar showing rank/value
│   │   ├── Sparkline.tsx            # group trend + rank dot sparklines
│   │   └── SourceStrip.tsx          # data/text/media provenance with licensing
│   ├── lib/
│   │   ├── data.ts                   # getElement, searchElements, allElements
│   │   ├── types.ts                  # ElementRecord, SourceAttribution, etc.
│   │   ├── pretext.ts                # wrappers: measureLines, shapeText, fitLabel
│   │   ├── grid.ts                   # cell positions, adjacency map, contrastTextColor
│   │   ├── compare.ts               # generateComparisonNotes() templates
│   │   └── licensing.ts             # license display helpers
│   └── hooks/
│       ├── usePretextLines.ts
│       └── useGridNavigation.ts
├── data/
│   ├── seed/
│   │   └── elements.json             # curated real data with sources (committed)
│   └── generated/
│       ├── elements.json
│       ├── element-*.json
│       ├── groups.json
│       ├── periods.json
│       ├── blocks.json
│       ├── categories.json
│       ├── rankings.json
│       ├── anomalies.json
│       └── credits.json              # aggregated licensing
├── scripts/
│   ├── generate-seed.ts              # one-time: PubChem + Wikidata + Wikipedia
│   └── derive-data.ts                # build-time: seed -> generated files
├── tests/
│   ├── data.test.ts
│   ├── licensing.test.ts
│   ├── compare.test.ts
│   ├── grid.test.ts
│   ├── components/
│   │   ├── PeriodicTable.test.tsx
│   │   └── Folio.test.tsx
│   └── e2e/
│       └── navigation.spec.ts
├── public/
│   ├── _headers                      # Cloudflare Pages cache headers
│   └── _redirects                    # SPA fallback routing
├── vite.config.ts
├── tsconfig.json
├── package.json
├── specs/
│   ├── atlas.spec
│   └── atlas.impl.spec
├── docs/
│   └── wireframes.md
└── .agents/skills/

18. Cloudflare Pages Deployment
-------------------------------
Static site. No Workers runtime.
Deployment: `wrangler pages deploy dist/`

public/_headers:
  /assets/*
    Cache-Control: public, max-age=31536000, immutable

public/_redirects:
  /* /index.html 200

CI: Connect repo to Cloudflare Pages. Build command: npm run build.
Output directory: dist/. Auto-deploy on push to main.

19. Web Performance Targets
---------------------------
Core Web Vitals (all "Good"):
- TTFB < 800ms (Cloudflare edge CDN, expect <100ms)
- FCP < 1.8s
- LCP < 2.5s
- INP < 200ms
- TBT < 200ms
- CLS < 0.1

Strategy: static CDN, pre-computed data, SVG viewBox sizing, Pretext
pre-measurement, route-level code splitting, system fonts, no images.

20. Licensing & Credits
------------------------
Atlas reuses content from three sources. Each has distinct licensing
requirements that must be satisfied in the UI and in the repository.

Source 1: PubChem (structured numeric data)
  License: Public domain (US government work, no copyright)
  What we use: atomic mass, electronegativity, ionization energy, radius, phase
  Attribution required: No (public domain). But we credit them anyway because
  it's good practice and helps users verify data.
  UI display: Source strip shows "PubChem (public domain)" with link to the
  PubChem compound page for that element.
  Repo: data/seed/elements.json includes source metadata per element.

Source 2: Wikidata (identifiers, categories, structural data)
  License: CC0 1.0 Universal (public domain dedication)
  What we use: QIDs, Wikipedia sitelinks, category classification, group/period/block
  Attribution required: No (CC0). We credit anyway.
  UI display: Source strip shows "Wikidata (CC0 1.0)" with link to the
  Wikidata item page (e.g., https://www.wikidata.org/wiki/Q556).
  Repo: wikidataId stored per element.

Source 3: Wikipedia (text summaries)
  License: CC BY-SA 4.0
  What we use: Short extract (1-2 paragraphs) from Wikipedia article summary
  Attribution REQUIRED by license. Must provide:
    1. Title of the article
    2. Link to the original article
    3. Name of the license (CC BY-SA 4.0)
    4. Link to the license text
    5. Indication that the text may have been modified (we excerpt, which is
       a modification under CC BY-SA)
  UI display: Source strip on every folio shows:
    "Text: [Article Title] (Wikipedia). Excerpt used under CC BY-SA 4.0.
     Original article may contain additional content."
    With links to: the article URL and https://creativecommons.org/licenses/by-sa/4.0/
  Credits page (/credits): Full table of all 118 elements with:
    Element | Wikipedia Article | Access Date | License
    Each row links to the specific article.
  Repo: Each element record stores wikipediaTitle, wikipediaUrl, and
  sources.summary.accessDate.

Source 4: @chenglou/pretext (software)
  License: Check package.json / LICENSE in the npm package. Credit on /credits.

Source 5: Atlas itself
  The derived data (rankings, groupings, anomaly descriptions) is original
  editorial work. The comparison templates are original. The design and
  layout are original. License for Atlas itself: define in repo LICENSE file
  (recommend MIT or similar for the code, CC BY-SA 4.0 for the editorial
  content if desired — this is a decision for the repo owner).

Credits page (/credits) structure:
  - "Structured Data" section: PubChem attribution with link, public domain note
  - "Identifiers" section: Wikidata attribution with link, CC0 note
  - "Text Summaries" section: Full table (118 rows) with article title, URL,
    access date, CC BY-SA 4.0 with license link. Header note: "Excerpts may
    differ from current Wikipedia content."
  - "Media" section: "No media in v1."
  - "Software" section: Vite, React, React Router, @chenglou/pretext with
    links and license names.
  - "About Atlas" section: Atlas's own license.

Source strip component (SourceStrip.tsx):
  Rendered on every folio. Shows per-element attribution:
    Data: PubChem (public domain) [link]
    Identifiers: Wikidata (CC0) [link to QID page]
    Text: {title} — Wikipedia excerpt (CC BY-SA 4.0) [link] — fetched {date}
    Media: No media in v1

  The source strip must be present on every folio. It is not optional.
  It is a licensing requirement for the Wikipedia content.

Property-based test: every per-element JSON has a valid sources field with
all three providers, correct license strings, and a valid access date.
