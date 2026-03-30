#!/bin/bash
# Atlas overnight build script
# Runs 4 sequential Claude Code invocations, each building on the previous.
# Usage: bash scripts/build-overnight.sh
set -e

cd "$(dirname "$0")/.."
echo "=== Atlas overnight build ==="
echo "Started: $(date)"
echo "Working directory: $(pwd)"
echo ""

# ──────────────────────────────────────────────────────────
# Step 1: Periodic table + grid logic
# ──────────────────────────────────────────────────────────
echo "=== STEP 1/4: Periodic table + grid logic ==="
echo "Started: $(date)"

claude -p "$(cat <<'PROMPT'
Read ALL of specs/atlas.impl.spec before writing any code. Pay special attention
to sections 1, 4, 9, 10, 13, 15.
Read data/generated/elements.json to understand the data shape.
Read src/lib/types.ts for the TypeScript types.
Read src/globals.css for the CSS custom properties.

Implement ONLY the following (do not implement other sections):

1. src/lib/data.ts
   - Import elements from data/generated/elements.json
   - Export: allElements, getElement(symbol), searchElements(query)
   - bySymbol Map for O(1) lookup

2. src/lib/grid.ts
   - IUPAC 18-column cell position calculator
   - Standard layout: 7 main rows, 2 separated lanthanide/actinide rows below
   - Export: getCellPosition(element) -> {x, y, col, row}
   - Export: adjacencyMap - pre-computed static lookup table for keyboard nav
     Handle edge cases: f-block gaps, arrow-up from lanthanide row -> main grid,
     arrow-down from period 6 groups 4-17 -> lanthanides, no-op at grid edges
   - Export: contrastTextColor(fillHex) -> '#0f0f0f' or '#f7f2e8' based on
     relative luminance (WCAG formula)
   - Export: blockColor(block) -> hex color string

3. src/hooks/useGridNavigation.ts
   - Spatial keyboard navigation hook using the adjacency map
   - Arrow keys move in grid, skip empty cells
   - Enter/Space triggers navigation callback
   - Returns: activeIndex, onKeyDown handler

4. src/components/PeriodicTable.tsx
   - Full SVG periodic table rendering all 118 elements
   - Search input + highlight mode dropdown + property selector
   - 6 highlight modes with correct contrast text colors using contrastTextColor()
   - Search filtering (non-matching cells dim to #ece7db)
   - Keyboard navigation using useGridNavigation
   - Focus ring: 2px warm red stroke on active cell
   - Animations:
     * First load: cells cascade by atomic number, ~4ms stagger, opacity 0->1
       + translateY(4px), using --ease-spring
     * Highlight mode switch: CSS transitions (interruptible) 250ms, ripple
       outward from focused cell using transition-delay from grid distance

5. src/pages/Home.tsx
   - Wire up PeriodicTable with data from lib/data.ts
   - Navigation to /element/:symbol on Enter/click

6. tests/grid.test.ts
   - contrastTextColor returns paper for dark fills, black for light fills
   - getCellPosition returns unique positions for all 118 elements
   - adjacencyMap edge cases: up from Ce goes to main grid, no-op at edges
   - All elements have positions within viewBox bounds

7. tests/components/PeriodicTable.test.tsx
   - Renders 118 cells
   - Search filters correctly (search "iron" shows Fe)
   - Highlight modes change fill colors

8. Property-based tests (using fast-check):
   - forAll(element): grid position is unique
   - forAll(element): position within viewBox
   - forAll(two elements same period): same y
   - forAll(two elements same group): same x
   - forAll(element): all arrow directions lead to valid cell or no-op

After writing all code:
- Run: npm run typecheck
- Fix ALL type errors
- Run: npm run test
- Fix ALL failing tests
- Repeat until both pass clean

Do NOT implement folio, atlas plates, compare, or any other sections.
PROMPT
" --allowedTools "Read,Write,Edit,Bash,Glob,Grep"

echo "Step 1 complete: $(date)"
echo ""

# ──────────────────────────────────────────────────────────
# Step 2: Folio + Pretext integration
# ──────────────────────────────────────────────────────────
echo "=== STEP 2/4: Folio + Pretext integration ==="
echo "Started: $(date)"

claude -p "$(cat <<'PROMPT'
Read ALL of specs/atlas.impl.spec before writing any code. Pay special attention
to sections 1, 5, 9, 10, 20.

Read the existing code in src/ to understand what step 1 built.
Read data/generated/element-Fe.json to understand per-element data with sources.

CRITICAL: @chenglou/pretext is a text MEASUREMENT library. Its API:
  - prepare(text, font) -> PreparedText
  - layout(prepared, maxWidth, lineHeight) -> { lineCount, height }
  - layoutWithLines(prepared, maxWidth, lineHeight) -> { lines: LayoutLine[] }
  - layoutNextLine(prepared, cursor, maxWidth) -> LayoutLine | null
  Each LayoutLine has: text, width, start, end
Do NOT create a <Pretext> React component. Do NOT vendor it. Import from the package.

Implement ONLY the following:

1. src/lib/pretext.ts
   - Wrappers around prepare/layout/layoutWithLines/layoutNextLine
   - measureLines(text, font, maxWidth, lineHeight): returns positioned lines
   - shapeText(text, font, widthPerLine[], lineHeight): variable-width layout
     for shaped text around data plate
   - fitLabel(text, font, maxWidth): returns whether text fits, for card labels

2. src/hooks/usePretextLines.ts
   - React hook that calls measureLines/shapeText and returns positioned SVG data
   - Handles the plate-height coordination: compute plateHeightInLines from
     Pretext font measurement at render time (see section 1, Tier 2)

3. src/components/PretextSvg.tsx
   - Renders Pretext-measured lines as positioned SVG <text> elements
   - Supports per-line styling (right-align ragged, thin rules between lines)

4. src/components/Folio.tsx
   Full folio implementation per section 5:
   - Block-color identity from element.block (giant number, thin rules, left bar)
   - Shaped text (Tier 2) flowing around data plate using variable-width layout
   - SVG data plate with hard color fields (group=blue, period=red)
   - Property bars: horizontal SVG bars showing rank, filled in block color
     Data from element.rankings
   - Group trend sparkline below summary (data from groups.json + element values)

5. src/components/PropertyBar.tsx
   - Horizontal bar component: shows value position on 1-118 scale
   - Filled in block color against paper background

6. src/components/Sparkline.tsx
   - Tiny SVG sparkline for group trends and rank dots
   - Group trend: polyline of property values across the group
   - Rank dot: single dot positioned on a 1-118 scale

7. src/components/SourceStrip.tsx
   - MANDATORY on every folio (CC BY-SA requirement)
   - Shows per-element attribution:
     Data: PubChem (public domain) [link]
     Identifiers: Wikidata (CC0) [link to QID]
     Text: {title} — Wikipedia excerpt (CC BY-SA 4.0) [link] — fetched {date}
     Media: No media in v1
   - Reads from per-element JSON sources field

8. src/pages/Element.tsx
   - Load per-element JSON (with sources) for the :symbol param
   - Render Folio component
   - Folio entry animation (section 10, explosive moment 1):
     Text lines stagger with 30ms delay, opacity 0->1 + translateY(6px)
     Data plate wipes via clip-path from right
     Property bars grow from zero
     All using --ease-out

9. tests/components/Folio.test.tsx
   - Renders element data with block-color accents
   - Source strip shows correct licensing text
   - Shaped text produces narrower lines beside plate

10. Pretext property-based tests (fast-check):
    - forAll(text, width): layoutWithLines is deterministic
    - forAll(text, w1 < w2): lineCount at w1 >= lineCount at w2
    - forAll(text, width): concatenating line.text reconstructs original

After writing all code:
- Run: npm run typecheck && npm run test
- Fix ALL errors until both pass clean
PROMPT
" --allowedTools "Read,Write,Edit,Bash,Glob,Grep,WebFetch"

echo "Step 2 complete: $(date)"
echo ""

# ──────────────────────────────────────────────────────────
# Step 3: Atlas plates + compare + remaining pages
# ──────────────────────────────────────────────────────────
echo "=== STEP 3/4: Atlas plates + compare + pages ==="
echo "Started: $(date)"

claude -p "$(cat <<'PROMPT'
Read specs/atlas.impl.spec sections 6, 7, 8, 20.
Read src/ to understand existing code from steps 1-2.

Implement ONLY:

1. src/lib/compare.ts
   - generateComparisonNotes(a, b) -> string[]
   - Template rules from section 8:
     same block -> "Both {block}-block elements."
     same period -> "Share period {n}."
     same category -> "Both classified as {category}."
     different phase -> "{a.name} is {a.phase}; {b.name} is {b.phase} at STP."
     both have group -> "Groups {a.group} and {b.group}."
     similar mass ranking (diff <= 5) -> "Similar mass ranking..."
   - Concatenate applicable templates into array

2. src/components/AtlasPlate.tsx
   - SVG card grid for element sets
   - Each card: symbol, atomic number, one property value
   - Pretext fitLabel() to verify text fits cards
   - Solid color caption strip behind Pretext-measured caption

3. src/components/CompareView.tsx
   - Split-screen SVG: left deep blue, right warm red
   - Giant symbols and names on each side
   - Comparison bands below: horizontal bars per property
   - Relationship notes from generateComparisonNotes, composed with PretextSvg
   - Compare split animation (section 10, explosive moment 2)

4. All atlas page implementations:
   - AtlasGroup, AtlasPeriod, AtlasBlock, AtlasCategory, AtlasRank, AtlasAnomaly
   - Each loads relevant JSON, renders AtlasPlate with appropriate caption

5. src/pages/Compare.tsx - wire up CompareView

6. src/pages/About.tsx - Pretext-composed description, design principles, credits summary

7. src/pages/Credits.tsx
   - Full 118-row attribution table from credits.json
   - Sections: Structured Data, Identifiers, Text Summaries, Media, Software
   - CC BY-SA 4.0 license link for Wikipedia content

8. src/pages/Design.tsx - living design language reference showing palette, typography,
   element cells, data plate, property bars, spacing, animation moments

9. tests/compare.test.ts
   - Same-block elements produce "Both {block}-block" note
   - Same-period elements produce "Share period" note
   - All-different elements produce longer note
   - Template handles edge cases (null group, unknown phase)

10. tests/licensing.test.ts
    - Every per-element JSON has sources field
    - All sources.summary.license === "CC BY-SA 4.0"
    - All sources.summary.accessDate is valid ISO date

After writing all code:
- Run: npm run typecheck && npm run test
- Fix ALL errors until both pass clean
PROMPT
" --allowedTools "Read,Write,Edit,Bash,Glob,Grep"

echo "Step 3 complete: $(date)"
echo ""

# ──────────────────────────────────────────────────────────
# Step 4: Mobile, accessibility, e2e, polish
# ──────────────────────────────────────────────────────────
echo "=== STEP 4/4: Mobile, a11y, e2e, polish ==="
echo "Started: $(date)"

claude -p "$(cat <<'PROMPT'
Read specs/atlas.impl.spec sections 11, 13, 15, 19.
Read src/ to understand all existing code.

Implement:

1. Responsive CSS in src/globals.css and component styles:
   - Mobile folio: single column, data plate above summary, marginalia below
   - Mobile compare: vertical split (top/bottom)
   - Mobile table: horizontal scroll with search bar above
   - Cards: 4-across desktop, 2 mobile
   - Touch targets: 44px minimum on all interactive elements
   - Touch hover gated: @media (hover: hover) and (pointer: fine)

2. WCAG AA accessibility across all components:
   - ARIA labels on all SVG elements
   - Individual periodic table cells: aria-label="[Name], atomic number [N], [category]"
   - Skip link to main content in main.tsx
   - Screen reader text for data visualizations (compare bands, property bars)
   - prefers-reduced-motion: keep opacity, remove transform/clip-path motion
   - Verify focus indicators are visible on all interactive elements

3. Remaining property-based tests (fast-check):
   Data integrity:
   - forAll(element): atomicNumber in 1..118, period in 1..7
   - forAll(element): block in ['s','p','d','f']
   - forAll(element): mass > 0
   - forAll(element): neighbors only contain valid symbols
   - forAll(a,b adjacent): neighbor symmetry
   - forAll(ranking): 118 entries, no duplicates
   - forAll(group n): listed elements have group === n
   Search:
   - forAll(element): searchElements(symbol) includes it
   - forAll(element): searchElements(name) includes it
   Licensing:
   - forAll(per-element file): sources present with correct licenses

4. Playwright e2e tests in tests/e2e/navigation.spec.ts:
   - Home page loads, 118 cells visible
   - Click element -> navigates to folio with correct data
   - Folio shows source strip with licensing
   - Keyboard nav: arrow keys move focus
   - Search filters periodic table
   - Compare view renders both elements
   - All routes return without errors
   - Mobile (375px viewport): search bar visible, table scrolls

5. Final build verification:
   - npm run typecheck (must pass)
   - npm run test (must pass)
   - npm run build (must produce dist/)
   - Check that dist/ contains index.html and hashed assets

Fix any issues found. The build MUST succeed clean.
PROMPT
" --allowedTools "Read,Write,Edit,Bash,Glob,Grep"

echo "Step 4 complete: $(date)"
echo ""

# ──────────────────────────────────────────────────────────
echo "=== Atlas overnight build complete ==="
echo "Finished: $(date)"
echo ""
echo "Next steps:"
echo "  1. Review the code: git diff HEAD~4"
echo "  2. Run the audit: /audit"
echo "  3. Test locally: npm run dev"
echo "  4. Deploy: npm run deploy"
