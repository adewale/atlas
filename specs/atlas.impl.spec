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

Usage in Atlas -- four tiers of increasing sophistication:

Tier 1: Measured SVG text blocks (all text-bearing views)
  Use prepare() + layoutWithLines() to break text into lines, then render
  each line as a positioned SVG <text> element with exact y offsets.
  This replaces CSS word-wrap with editorially controlled line breaks.
  Used for: atlas plate captions, compare relationship notes, about page,
  credits descriptions, marginalia notes.

Tier 2: Shaped text in folios (element folio view)
  Use layoutNextLine() with a DIFFERENT maxWidth per line to flow summary
  text around the data plate SVG. Lines beside the plate are narrower;
  lines below it are wider. This creates visible shaped text -- the hallmark
  of editorial composition.
  Implementation:
    const prepared = prepare(summary, '16px system-ui');
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    const lines = [];
    let lineIndex = 0;
    while (true) {
      // Narrower width for lines next to the data plate, full width below
      const width = lineIndex < plateHeightInLines ? narrowWidth : fullWidth;
      const line = layoutNextLine(prepared, cursor, width);
      if (!line) break;
      lines.push({ ...line, y: baseY + lineIndex * lineHeight });
      cursor = line.end;
      lineIndex++;
    }
  The visual result: text that clearly wraps around the element's data plate,
  not just a rectangle of text next to a rectangle of data.

Tier 3: Per-line styling
  layoutWithLines() returns per-line width. Use this for:
  - Right-align ragged text by offsetting each line's x by (maxWidth - line.width)
  - Insert thin SVG rules between specific lines (e.g., after the first sentence)
  - Center short terminal lines in atlas plate captions
  - Apply different opacity to individual lines for emphasis

Tier 4: Tufte data integration
  Because Pretext gives exact per-line geometry (width, position), we can
  integrate data directly into text -- Tufte's core principle.
  - INLINE SPARKLINES: After measuring a line's width, the remaining horizontal
    space (maxWidth - line.width) can hold a tiny SVG sparkline. E.g., next to
    "electronegativity increases across the period" draw the actual trend as a
    12px-tall sparkline in the remaining space. Data and text share the same line.
  - MARGINAL ANNOTATIONS: Use line cursors to know which text line mentions
    a property, then place the numeric value in the margin at the exact
    y-position of that line. Tufte sidenotes, programmatically positioned.
  - SMALL MULTIPLES WITH FITTED LABELS: Atlas plates render grids of mini
    element cards. Use layout() to verify that element name + one property
    value fits within each card's width, and adjust font size or abbreviate
    accordingly. No overflow, no ellipsis -- the text is measured to the space.

Pretext + CLS prevention:
  For HTML text blocks (marginalia), use layout() to pre-calculate exact
  height before render. Set the container height explicitly to prevent
  cumulative layout shift. This is Pretext's simplest use case.

2. Data Strategy
----------------
Approach: Fully static seed dataset, committed to the repo.

Seed generation (one-time script, run manually, results committed):
- Script: scripts/generate-seed.ts
- Sources, merged with priority:
  1. PubChem -- primary source for numeric accuracy (atomic mass,
     electronegativity, ionization energy, atomic radius, phase at STP)
  2. Wikidata -- identifiers (QID), categories, group/period/block,
     Wikipedia page titles, Wikimedia Commons links
  3. Wikipedia REST API -- short summary extract per element (1-2 paragraphs)
- Output: data/seed/elements.json (single file, all 118 elements, real values)
- The seed file is committed and is the source of truth.

Build-time derivation (runs on every build via `npm run build:data`):
- Script: scripts/derive-data.ts
- Input: data/seed/elements.json
- Output (all committed to data/generated/):
  - elements.json (full array)
  - element-{Symbol}.json (per-element)
  - groups.json, periods.json, blocks.json, categories.json
  - rankings.json (sorted arrays for mass, electronegativity, ionization energy, radius)
  - anomalies.json
  - text-credits.json (Wikipedia attribution index)
  - image-credits.json (placeholder -- no images in v1)

Generated files ARE committed to the repo so the app works after clone.

3. Element Schema
-----------------
```typescript
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
  phase: string;                // "solid", "liquid", "gas" at STP
  mass: number;                 // atomic mass in Da (real values from PubChem)
  electronegativity: number | null; // Pauling scale
  ionizationEnergy: number | null;  // first ionization, eV
  radius: number | null;        // atomic radius, pm
  summary: string;              // Wikipedia extract, 1-2 paragraphs
  neighbors: string[];          // adjacent elements by atomic number
  rankings: Record<string, number>; // rank position for each numeric property
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

Rendering: SVG with fixed cell positions.
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

Search: text input filters visible elements by name or symbol. Non-matching
cells dim to #ece7db.

Keyboard navigation: Spatial grid movement.
- Arrow keys move focus in the visual grid (up/down/left/right)
- Skip empty cells (jump to next occupied cell in that direction)
- Enter/Space navigates to /element/:symbol
- Tab/Shift+Tab for sequential focus order (accessibility)
- Visible focus ring: 2px warm red (#9e1c2c) stroke

5. Element Folio (/element/:symbol)
------------------------------------
Two-column layout: main content (left) + marginalia panel (right).

Main content:
- Giant atomic number (3-digit zero-padded, e.g., "001")
- Giant symbol
- Element name as heading
- Thin rule
- Summary text composed with Pretext shaped text (Tier 2): text flows around
  the data plate using variable-width layoutNextLine(). Lines beside the plate
  are narrower, lines below are full width.
- Inline sparklines (Tier 4): where a line mentions a trend (e.g., "increases
  across the period"), a tiny sparkline appears in the remaining line space.
- SVG data plate showing group, period, block with hard color fields
  (Byrne color drama lives here — in structural elements like the data plate,
  compare split, and highlight modes, NOT in per-line text classification)

Marginalia (right panel):
- Category
- Key numeric properties with values
- Marginal annotations (Tier 4): property values positioned at the exact
  y-position of the summary line that mentions each property
- Neighbor elements (links)
- Thin rule
- Source strip:
  * Data: "Wikidata (CC0)" with link
  * Text: Wikipedia article title with link + "(Wikipedia excerpt, CC BY-SA)"
  * Media: "No media in v1" (placeholder)
- Compare link (to /compare/:symbol/O or nearest neighbor)

6. Atlas Plates (/atlas/*)
--------------------------
Rendering: SVG card grid. Each element in the set rendered as a mini
folio-style card showing symbol, atomic number, and one key property.
Cards arranged in meaningful order (by group number, period number,
atomic number within category, or ranked by property value).

Small multiples (Tier 4): Pretext measures each card's label to verify
it fits. Cards use consistent sizing. The grid itself is the visualization --
Tufte's small multiples principle.

Caption text composed with Pretext (Tier 1). Caption strips on atlas plates
use a solid color band behind the caption to tie the text visually to the
color-coded element cards below.

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
  (elements with unexpected electron configurations)
- metalloid-boundary: elements on the metal/nonmetal border (B, Si, Ge, As, Sb, Te)

Each anomaly has: slug, label, description, element list.

8. Compare View (/compare/:symbolA/:symbolB)
----------------------------------------------
Split-screen dramatic layout:
- Bold vertical split in SVG: left half deep blue, right half warm red
- Each side shows element symbol (giant), name, atomic number
- Below the split: horizontal comparison bands for each shared numeric
  property (mass, electronegativity, ionization energy, radius)
  showing both values on the same scale with visual bars
- Category and block context
- Relationship notes composed with Pretext wedge text (Tier 3):
  layoutNextLine() with V-shaped width profile so the text forms a
  triangular wedge between the two halves. The shape of the text
  echoes the dramatic split above it.

9. Design Language
------------------
Balance: 60% Kronecker-Wallis/Byrne visual drama, 40% Tufte data density.

Palette:
- Paper: #f7f2e8
- Black: #0f0f0f
- Deep blue: #133e7c
- Warm red: #9e1c2c
- Mustard yellow: #c59b1a

Visual rules:
- Giant numerals and symbols (hero elements)
- Hard color fields (solid SVG rects, no gradients)
- Thin rules (1px #0f0f0f dividers)
- Narrow marginalia column
- Generous outer whitespace (page margins)
- Bold geometric color blocks in atlas plates and compare views
- High data-ink ratio in data tables and property displays
- Body text: system sans-serif, 16px base
- Monospace for numeric values and atomic data
- Animation: 90% still, 10% explosive (see section 10)

Byrne integration (structural, not per-line):
- Data plate in folios: hard color fields for group (deep blue) and period
  (warm red). Color IS the structural identity of the element.
- Atlas plate caption strips: solid color band behind Pretext-measured caption,
  matching the highlight color of the plate below.
- Compare split: the two hard color fields (blue/red) are Byrne's boldest
  move -- color as identity, not decoration.
- Highlight modes: the entire periodic table becomes a Byrne diagram when
  a mode is active. Every cell's fill carries meaning.
- NOT per-line text classification. Classifying individual summary lines
  as "physical" vs "chemical" requires NLP or manual annotation on 118
  Wikipedia extracts — fragile, error-prone, and not worth the complexity.
  Byrne drama belongs in structural elements, not inline text.

Tufte integration (via Pretext):
- Inline sparklines placed in remaining line space after Pretext measurement.
  Data and explanation occupy the same line -- no separate chart + caption.
- Marginal annotations aligned to exact y-positions of text lines.
  Property values sit beside the sentence that discusses them.
- Small multiples: atlas plate card grids with Pretext-fitted labels.
  The grid is the visualization. No legend needed.
- High data-ink ratio: every pixel of color carries data.
  Highlight modes turn the periodic table into a data visualization.

10. Animation & Motion
----------------------
Philosophy: 90% of the interface is perfectly still. Four specific moments
have dramatic, purposeful motion. The stillness makes the motion land harder.

Animation decision framework (adapted from Emil Kowalski):
  Before animating anything, ask: how often does the user see this?
  - Keyboard navigation, search typing, focus changes: NO animation. Ever.
    These happen 100+ times per session. Animation makes them feel slow.
  - Highlight mode switch: OCCASIONAL. Standard animation (250ms).
  - Folio entry, compare split, first load: RARE/first-time. Full drama.
  Every animation must answer "why does this animate?" Valid answers:
  spatial consistency, state indication, preventing jarring changes.
  "It looks cool" is not valid for frequently-seen interactions.

Easing:
  Never use browser default easings — they lack punch.
  Three custom curves for Atlas (as CSS custom properties):
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);        /* enters/exits: gentle decel */
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen movement */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* playful: slight overshoot */
    --ease-snap: cubic-bezier(0.4, 0, 0.2, 1);        /* quick state toggles */
  Never use ease-in for UI. It starts slow, making the interface feel sluggish.
  All entry animations use --ease-out (starts fast, feels responsive).
  --ease-spring used only for the compare split overshoot and first-load cascade.
  Resource: easing.dev for exploring curve variants.

Duration rules:
  - Stagger delays: 30-50ms between items (never longer — feels slow)
  - Color transitions: 200-250ms
  - Structural reveals (split open, bar grow): 250-400ms
  - Total cascade duration cap: 500ms (even for 118 cells)
  - UI animations never exceed 300ms individually

Explosive moment 1 -- Folio entry (navigate to /element/:symbol):
  Summary text lines reveal top-to-bottom, ~30ms stagger per line.
  Each line fades from opacity 0 + translateY(6px) using --ease-out.
  Never animate from scale(0) — start from scale(0.97) minimum.
  Inline sparklines draw left-to-right after their parent line appears.
  Shaped text around the data plate reveals the editorial composition as the
  lines cascade: narrow lines first, then the full-width lines below the plate.
  The data plate wipes in via clip-path from the right edge simultaneously.
  Duration: ~400ms total.

Explosive moment 2 -- Compare view split (navigate to /compare/:a/:b):
  The two color halves (deep blue / warm red) expand from center outward
  via clip-path, like opening a book. Symbols scale up from 0.95->1.0
  (never from 0) with opacity 0->1 using --ease-out.
  Comparison bands below stagger in, each bar growing via clip-path
  inset(0 100% 0 0) -> inset(0 0 0 0) over 300ms, staggered 50ms apart.
  The wedge-shaped relationship note reveals line by line, narrowest lines first.
  Asymmetric timing: entry is deliberate (300ms ease-out), but if user
  navigates away mid-animation, exit is instant.

Explosive moment 3 -- Highlight mode switch (on home periodic table):
  Cell fills transition over 250ms with a staggered wave that ripples outward
  from the currently focused cell. Cells closer to focus transition first.
  This uses CSS transition-delay computed from grid distance.
  Use CSS transitions (not keyframes) so the animation is interruptible —
  switching modes rapidly retargets smoothly instead of restarting.
  Text color (for contrast against new fill) transitions simultaneously.

Explosive moment 4 -- First load / table appear:
  Periodic table cells appear in atomic-number order with a fast stagger
  (~4ms per cell, ~470ms total for 118 elements). Each cell fades from
  opacity 0 + translateY(4px) to final position. Keep stagger very tight —
  long staggers feel slow. The effect is a quick cascade, not a slow reveal.

Quiet (everything else):
  Route transitions, search filtering, keyboard focus movement, scrolling,
  navigation between atlas plates -- all instant. No transition. No ease.
  Focus ring appears immediately. Search dimming is immediate.
  This is deliberate. The stillness makes the four explosive moments feel earned.

Pretext enables moments 1 and 2: because all line positions are pre-calculated,
we animate individual lines without triggering reflow. The animation is CSS
transforms + opacity on already-positioned SVG elements.

Performance rules:
  - Only animate transform, opacity, and clip-path. These skip layout/paint
    and run on the GPU. Never animate height, width, padding, or margin.
  - Use CSS animations for predetermined motion (staggers, reveals). They run
    off the main thread and stay smooth even when the browser is busy loading.
  - Use CSS transitions for interactive/interruptible motion (highlight mode
    switch). Transitions retarget mid-animation; keyframes restart from zero.
  - Avoid animating CSS custom properties on parent elements — changing a
    variable on a parent recalculates styles for all children. Update
    transform directly on each element instead.
  - For programmatic control with CSS performance, use Web Animations API
    (WAAPI): element.animate([...], { duration, easing, fill: 'forwards' })

Accessibility:
  @media (prefers-reduced-motion: reduce) {
    /* Keep opacity/color transitions for comprehension */
    /* Remove all transform-based motion and clip-path reveals */
    /* Stagger delays become 0 — everything appears at once */
  }
  Reduced motion means fewer and gentler animations, not zero.
  Touch hover states gated behind @media (hover: hover) and (pointer: fine).

CSS containment:
  Animated elements should use `contain: layout style paint` to isolate their
  rendering from the rest of the page. This tells the browser that changes
  inside the element won't affect anything outside it.

Pre-ship animation checklist:
  [ ] Duration under 300ms (unless intentionally slow for drama)
  [ ] Only animates transform, opacity, and/or clip-path
  [ ] Uses custom cubic-bezier curve (no `linear` or default `ease`)
  [ ] Respects prefers-reduced-motion
  [ ] Interruptible (CSS transitions for interactive, keyframes for predetermined)
  [ ] Runs at 60fps on mid-range Android (not just MacBook)
  [ ] Easing and duration match similar animations elsewhere in Atlas
  [ ] Animation adds genuine value — not motion for motion's sake

Debug protocol:
  - Play all animations at 5x duration during development to spot timing issues
  - Step through frame-by-frame in Chrome DevTools Animations panel
  - Check that coordinated properties (opacity, transform, clip-path) are in sync
  - Enable paint flashing in DevTools to verify no unexpected repaints
  - Review with fresh eyes the next day — imperfections become visible overnight
  - Test on real mobile devices for gesture/touch interactions

11. Mobile & Responsive
------------------------
The periodic table is the hardest view on mobile. Strategy:

Home page (periodic table):
- Desktop (>1024px): Full 18-column SVG grid as designed.
- Tablet (768-1024px): SVG scales down via viewBox. Cells remain tappable
  (min 44x44px touch target). Legend and controls stack vertically.
- Mobile (<768px): The SVG remains the full 18-column grid but is horizontally
  scrollable within a viewport-width container. Pinch-to-zoom enabled.
  A "jump to element" search bar sits above the scrollable area as the
  primary mobile navigation path. The grid does NOT reflow into a list --
  spatial relationships between elements are the point of the table.

Element folio:
- Desktop: Two-column (main + marginalia) as designed.
- Mobile: Single column. Marginalia panel moves below main content.
  Shaped text reverts to full-width (no variable-width wrapping on small
  screens -- layoutWithLines at one consistent width). Data plate sits
  above the summary text instead of beside it.

Compare view:
- Desktop: Side-by-side split as designed.
- Mobile: Vertical split (top/bottom instead of left/right). Deep blue on top,
  warm red on bottom. Comparison bands remain horizontal.

Atlas plates:
- Cards reflow naturally. 4 across on desktop, 2 on mobile.

General:
- Touch targets: minimum 44x44px on all interactive elements.
- SVG viewBox handles scaling; no media-query-based SVG changes.
- System fonts eliminate loading delays on any device.

12. Images
----------
No images in v1. Schema supports optional image metadata but all image
fields are null/empty. Source strip says "No media in v1."
Image support is a v2 feature.

13. Accessibility (WCAG AA)
----------------------------
- All SVG elements have appropriate ARIA roles and labels
- SVG periodic table: role="img" with aria-label, individual cells
  are focusable with aria-label="[Name], atomic number [N], [category]"
- Keyboard navigation: full spatial grid nav (see section 4)
- Focus indicators: visible 2px warm red ring on all interactive elements
- Color contrast: all text meets AA ratio (4.5:1 normal, 3:1 large)
  -- verify highlight mode colors against text
- Skip link to main content
- Search input has visible label (can be sr-only)
- Semantic HTML: proper heading hierarchy, landmarks, lists
- Screen reader text for SVG data visualizations in compare/atlas views
- prefers-reduced-motion: all animation disabled when OS setting is on

14. Technical Stack
-------------------
- Vite 6 + React 19 + React Router 7
- TypeScript (strict mode)
- @chenglou/pretext from npm (NOT vendored)
- Static site build -- no SSR, no server functions, no API routes
- Cloudflare Pages for deployment (see section 17)
- No additional UI libraries
- Route-level code splitting via React Router lazy()
- React Router data loaders for pre-loading element/atlas data per route

Why Vite + React instead of Next.js:
- Atlas is a fully static site with client-side interactivity. No SSR needed.
- Pretext needs a browser canvas context for font measurement -- no SSR benefit.
- Cloudflare Pages serves static files free and unmetered. No Workers runtime.
- Next.js on Cloudflare is fragile (@cloudflare/next-on-pages is deprecated,
  @opennextjs/cloudflare is community-maintained). Vite static build is trivial.
- Smaller bundle. Faster builds. Simpler deployment. Zero vendor lock-in.

15. Testing
-----------
Framework: Vitest + React Testing Library + Playwright

Unit tests (Vitest):
- Data layer: getElement(), searchElements() return correct results
- Seed data validation: 118 elements, no null required fields, real values
  (e.g., Hydrogen mass ~ 1.008, not 2.01)
- Derivation: groups.json has correct element membership
  (e.g., Lu is NOT in group 17)
- Rankings are correctly sorted
- Pretext integration: prepare() + layoutWithLines() returns expected line
  count for a known string at a known width

Component tests (Vitest + React Testing Library):
- PeriodicTable renders 118 cells
- Search filters correctly
- Highlight modes change fill colors
- Folio renders element data
- Shaped text produces different line widths (narrow vs full)

Property-based tests (Vitest + fast-check):
  Library: fast-check (https://github.com/dubzzz/fast-check)

  Data integrity invariants:
  - forAll(element): atomicNumber in 1..118, period in 1..7
  - forAll(element): if group !== null then group in 1..18
  - forAll(element): block is one of 's','p','d','f'
  - forAll(element): mass > 0 (no zero/negative masses)
  - forAll(element): neighbors contains only symbols present in dataset
  - forAll(element a, adjacent element b): a.neighbors.includes(b.symbol)
    implies b.neighbors.includes(a.symbol) (neighbor symmetry)
  - forAll(ranking property): ranking array has exactly 118 entries, no duplicates
  - forAll(group n): every element listed in group n has group === n
    (catches the Lu/group-17 bug from the Codex PR)
  - forAll(period n): every element listed in period n has period === n
  - forAll(category): category slug matches at least one element

  Grid layout invariants:
  - forAll(element): grid position is unique (no two elements share a cell)
  - forAll(element): grid position is within SVG viewBox bounds
  - forAll(two elements in same period): they share the same y-coordinate
  - forAll(two elements in same group): they share the same x-coordinate

  Pretext measurement invariants:
  - forAll(text, width): layoutWithLines result is deterministic (same input
    always produces same lineCount and same line texts)
  - forAll(text, width1 < width2): lineCount at width1 >= lineCount at width2
    (narrower container means same or more lines, never fewer)
  - forAll(text, width): concatenating all line.text values reconstructs
    the original text (no characters lost or added during line breaking)
  - forAll(element summary): shaped text (narrow then wide) produces
    lineCount >= standard full-width lineCount

  Search invariants:
  - forAll(element): searchElements(element.symbol) includes that element
  - forAll(element): searchElements(element.name) includes that element
  - forAll(random string not matching any name/symbol): searchElements
    returns empty array

Integration tests (Playwright):
- Home page loads, periodic table is visible
- Click element -> navigates to folio
- Keyboard navigation: arrow keys move focus spatially
- Search filters table
- Compare view renders both elements
- All routes load without errors
- Mobile: search bar is primary navigation, table scrolls horizontally

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
├── index.html                          # Vite entry point
├── src/
│   ├── main.tsx                        # React root + router setup
│   ├── routes.tsx                      # React Router route definitions
│   ├── globals.css
│   ├── pages/
│   │   ├── Home.tsx                    # periodic table
│   │   ├── Element.tsx                 # folio
│   │   ├── AtlasGroup.tsx
│   │   ├── AtlasPeriod.tsx
│   │   ├── AtlasBlock.tsx
│   │   ├── AtlasCategory.tsx
│   │   ├── AtlasRank.tsx
│   │   ├── AtlasAnomaly.tsx
│   │   ├── Compare.tsx
│   │   ├── About.tsx
│   │   ├── Credits.tsx
│   │   └── Design.tsx                 # design language reference page
│   ├── components/
│   │   ├── PeriodicTable.tsx           # search, keyboard nav, highlight modes
│   │   ├── Folio.tsx                   # shaped text, data plate, sparklines
│   │   ├── AtlasPlate.tsx             # card grid with fitted labels
│   │   ├── CompareView.tsx            # split screen, comparison bars
│   │   ├── PretextSvg.tsx            # renders Pretext-measured lines as SVG
│   │   ├── Sparkline.tsx             # inline SVG sparkline
│   │   └── SourceStrip.tsx           # data/text/media provenance
│   ├── lib/
│   │   ├── data.ts                    # getElement, searchElements, allElements
│   │   ├── types.ts                   # ElementRecord and related types
│   │   ├── pretext.ts                 # wrappers: measureLines, shapeText, fitLabel
│   │   └── grid.ts                    # periodic table cell position calculations
│   └── hooks/
│       ├── usePretextLines.ts         # React hook for Pretext measurement
│       └── useGridNavigation.ts       # spatial keyboard navigation state
├── data/
│   ├── seed/
│   │   └── elements.json              # curated real data (committed)
│   └── generated/                     # derived files (committed)
│       ├── elements.json
│       ├── element-*.json
│       ├── groups.json
│       ├── periods.json
│       ├── blocks.json
│       ├── categories.json
│       ├── rankings.json
│       ├── anomalies.json
│       ├── text-credits.json
│       └── image-credits.json
├── scripts/
│   ├── generate-seed.ts               # one-time: PubChem + Wikidata + Wikipedia -> seed
│   └── derive-data.ts                 # build-time: seed -> generated files
├── tests/
│   ├── data.test.ts
│   ├── components/
│   │   ├── PeriodicTable.test.tsx
│   │   └── Folio.test.tsx
│   └── e2e/
│       └── navigation.spec.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── specs/
│   ├── atlas.spec                     # product spec
│   └── atlas.impl.spec               # this file
├── docs/
│   └── wireframes.md                  # ASCII mockups
└── .agents/skills/                    # Cloudflare skills (committed)

18. Cloudflare Pages Deployment
-------------------------------
Atlas is a static site. No Workers runtime, no server functions, no edge compute.

Deployment: `wrangler pages deploy dist/`
The Vite build outputs a static dist/ folder. Cloudflare Pages serves it globally.

Why Cloudflare Pages instead of Workers:
- Atlas has no server-side logic. All data is pre-generated static JSON.
- Pretext measurement happens in the browser (needs canvas context).
- Pages serves static assets free and unmetered. No CPU time limits.
- No @opennextjs/cloudflare adapter risk. No framework compatibility issues.
- Just HTML, CSS, JS, and JSON served from Cloudflare's edge CDN.

Configuration:
- No wrangler.jsonc needed for basic Pages static deployment.
- For custom headers/redirects, use _headers and _redirects files in public/:

  public/_headers:
    /assets/*
      Cache-Control: public, max-age=31536000, immutable

  public/_redirects:
    /* /index.html 200

  The /* -> /index.html redirect is essential for client-side routing with
  React Router (all routes resolve to the SPA entry point).

Deploy commands:
- Build:     npm run build
- Deploy:    wrangler pages deploy dist/
- Preview:   wrangler pages deploy dist/ --branch preview

CI deployment (GitHub integration):
- Connect repo to Cloudflare Pages dashboard
- Build command: npm run build
- Build output directory: dist/
- Automatic deploys on push to main
- Preview deploys on pull requests

19. Web Performance Targets
---------------------------
Core Web Vitals targets (all "Good" thresholds):
- TTFB:  < 800ms  (static files from Cloudflare edge CDN -- should be <100ms)
- FCP:   < 1.8s
- LCP:   < 2.5s   (largest SVG render)
- INP:   < 200ms  (highlight mode switches, search input)
- TBT:   < 200ms
- CLS:   < 0.1    (Pretext pre-measurement prevents layout shift)

Performance strategy:
- Static site on global CDN (Cloudflare Pages) -- near-zero TTFB
- Pre-computed data (no runtime computation of rankings, groupings, etc.)
- SVG viewBox sizing prevents CLS (dimensions known at render time)
- Pretext measures text before render -- no reflow-based layout
- Route-level code splitting via React Router lazy() -- only load
  the page component needed for the current route
- System fonts (no web font loading delay)
- No images in v1 (eliminates LCP image concerns)
- Vite produces optimized, tree-shaken, hashed bundles with code splitting
