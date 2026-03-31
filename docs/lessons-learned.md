# Lessons Learned

Post-mortem on bugs, testing gaps, and architectural decisions discovered
during the Atlas quality audit. Each section describes what went wrong, why
it was missed, and what spec or process change would have prevented it.

---

## 1. CSS transform overrides SVG transform attribute

**Bug:** All 118 periodic table elements rendered at position (0,0), stacked
on top of each other. Only Oganesson was visible (painted last).

**Root cause:** A single `<g>` element carried both an SVG `transform`
attribute for grid positioning and a CSS `style={{ transform: 'none' }}`
for load animation. Per the SVG/CSS spec, the CSS property wins — it
overrode the positioning attribute, collapsing all cells to the origin.

**Why tests missed it:** Unit tests (jsdom) have no layout engine. Every
DOM assertion passed — 118 elements existed, all had correct `transform`
attributes, all were "visible" according to jsdom. Only a real browser
compositing the SVG could exhibit the conflict.

**What should have been in the spec:**
- "Visual smoke test: H must be at far-left, He at far-right, Og at
  bottom-right. Assert bounding-box separation > 400px."
- "Never mix SVG `transform` attribute and CSS `transform` property on the
  same element. Use nested `<g>` when both are needed."
- A Playwright E2E test with spatial assertions from day one.

---

## 2. computeLineHeight returned zero

**Bug:** Every PretextSvg section on About, Credits, and Folio pages
rendered as zero-height SVG — all text invisible. The Folio summary showed
garbled overlapping fragments because `Math.max(PLATE_HEIGHT, 0)` gave the
SVG a minimum height but all text lines were at y=0.

**Root cause:** `computeLineHeight()` called `layout(ref, 9999, 0)`. The
pretext library's `layout` returns `lineCount * lineHeight`. With
lineHeight=0, the result is always 0.

**Why tests missed it:** Unit tests mock the pretext library (jsdom has no
canvas). The mock returned `{ height: 20 }` — a hardcoded non-zero value
that masked the real behavior. The E2E screenshot test for the Folio only
checked `.folio-symbol` text content, not whether the summary was readable.

**What should have been in the spec:**
- "Every PretextSvg section must have non-zero rendered height. Add an E2E
  assertion: `expect(boundingBox.height).toBeGreaterThan(20)`."
- "Integration test: `computeLineHeight('16px system-ui')` must return a
  value between 15 and 25. Run against the real library, not a mock."
- "When wrapping a library function, write a contract test that verifies
  your assumptions about its return values."

---

## 3. Category page showed no elements

**Bug:** Navigating to `/atlas/category/transition-metal` showed the heading
"Transition Metal" but no element grid. The page was completely broken for
every category.

**Root cause:** The Folio component generates category URLs with hyphens
(`transition-metal`), but the category data JSON uses spaces
(`transition metal`). `categories.find(c => c.slug === slug)` compared
`"transition-metal"` against `"transition metal"` — never matched.

**Why tests missed it:** No E2E test visited any category page. The unit
test for Folio verified the link href was correct
(`/atlas/category/transition-metal`) but never followed it to check the
destination rendered content.

**What should have been in the spec:**
- "Every internal link must be covered by a navigation E2E test that
  verifies the destination page renders content (not just the link href)."
- "Data slug format must be documented: 'slugs use hyphens in URLs and
  spaces in JSON' — with a normalization function used consistently."
- "Canonical slug transform: define `toUrlSlug()` and `fromUrlSlug()` once,
  use everywhere."

---

## 4. Search results not ranked by relevance

**Bug:** Searching "N" returned Hydrogen first (because "hydroge**n**"
contains "n") instead of Nitrogen (exact symbol match).

**Root cause:** `searchElements()` filtered but didn't sort results. Any
element whose name or symbol contained the query appeared in
atomicNumber order.

**Why tests missed it:** The original test used `.some()` — "does Nitrogen
appear somewhere in the results?" — which passed even when Nitrogen was
buried after dozens of irrelevant matches.

**What should have been in the spec:**
- "Search results must be relevance-sorted: exact symbol > exact name >
  starts-with symbol > starts-with name > contains."
- "Test the first result, not just set membership."

---

## 5. Comparison notes for same-group elements

**Bug:** Comparing Fe and Ru (both group 8) produced "Groups 8 and 8."
instead of "Share group 8."

**Root cause:** The comparison logic didn't branch on `a.group === b.group`.

**Why tests missed it:** Tests only compared elements from different groups.

**What should have been in the spec:**
- "Comparison templates must handle same-value edge cases: same group, same
  period, same block, same category."

---

## 6. Orphaned pages with no inbound navigation

**Bug:** About, Credits, Atlas group/period/block/category/rank/anomaly
pages existed in the router but had no navigation links from the homepage
or other pages. Users could only reach them by typing URLs directly.

**Root cause:** Pages were built in isolation. Nobody verified that every
route was reachable through the UI.

**What should have been in the spec:**
- "Every route must be reachable via at least one click path from the
  homepage."
- "Acceptance test: crawl all internal links starting from `/`, verify
  every defined route is visited."

---

## 7. Plain `<a>` tags instead of React Router `<Link>`

**Bug:** Neighbor links and the compare link in Folio used plain `<a>` tags,
causing full page reloads instead of client-side navigation. This broke the
SPA experience — flash of white, lost scroll position, re-fetched all JS.

**Root cause:** Copy-paste from static HTML patterns. No linting rule
enforced Router links.

**What should have been in the spec:**
- "All internal navigation must use `<Link>` from react-router. No plain
  `<a>` tags for internal URLs."
- "Lint rule: warn on `<a href="/">` patterns that should be `<Link to="/">`."

---

## 8. Mock-heavy unit tests masked real failures

**Bug (meta):** The pretext mock returned hardcoded `{ height: 20 }`, which
made every test pass even though the real `computeLineHeight` returned 0.
The Folio test mock returned two fake text lines, so the component rendered
"correctly" in jsdom even though the real browser showed garbled text.

**Root cause:** Mocks are necessary when jsdom lacks canvas, but the mock
contract was never validated against the real library.

**What should have been in the spec:**
- "For every mock, write a contract test that runs in a real browser (E2E)
  verifying the mocked function's actual behavior matches the mock's
  assumptions."
- "Mocked unit tests provide fast feedback on component logic. E2E tests
  validate rendering. Both are required — they test different things."
- "Never trust a test that only asserts against mocked return values."

---

## Summary: What the initial spec should have included

### 1. Visual smoke tests from day one
Every page that renders visual content needs a Playwright E2E test that
verifies bounding boxes, spatial relationships, and non-zero dimensions.
DOM existence is not visual correctness.

### 2. End-to-end route coverage
Every route in the router must have at least one E2E test that visits it
and verifies content renders. Navigation links must be tested by following
them, not just checking href values.

### 3. Canonical data transformations
When the same value appears in URLs (hyphens), data files (spaces), and
display text (title case), define conversion functions once and use them
everywhere. Document the canonical form.

### 4. Contract tests for mocked dependencies
When a dependency must be mocked (e.g., canvas-dependent libraries in
jsdom), write a parallel contract test in a real browser that validates the
mock's assumptions still hold.

### 5. Search result ordering in the spec
Any search or filter feature must specify result ordering, not just
filtering. "Returns matching elements" is insufficient — "returns matching
elements sorted by relevance" is testable.

### 6. Edge case templates
Comparison, grouping, and display logic must handle same-value cases.
The spec should list edge cases: null group, single-element group,
comparing an element with itself, period 1 (only 2 elements), etc.

### 7. Animation completion assertions
Every animation should have an E2E test that waits for completion and
verifies the final visual state. Animations that fail to complete (stuck
at opacity:0, clipped to zero width) are invisible bugs.

### 8. No CSS transform on SVG transform elements
This specific footgun should be in a project CONTRIBUTING.md or linting
rule. SVG elements that use the `transform` attribute must never have a
CSS `transform` property (or `style={{ transform }}`). Use nested elements
to separate concerns.

### 9. Pretext integration strategy
Pretext genuinely adds value for shaped text (Folio summary wrapping around
the data plate) and wedge text (CompareView expanding lines). For simple
paragraph text (About, Credits), plain HTML `<p>` tags would be simpler,
more accessible, and immune to the zero-height bug. The spec should
identify which text measurement tier each page needs.

### 10. Accessibility as a rendering concern
`contrastTextColor()` correctly implements WCAG luminance, but no test
verifies actual contrast ratios meet AA standards. Font sizes below 10px
(7px element names, 8px category labels) should be explicitly justified
in the spec as acceptable for decorative/symbolic contexts.
