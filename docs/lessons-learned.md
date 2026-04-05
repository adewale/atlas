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

---
---

# Part 2 — Lessons from Iterative Development

The sections above capture bugs found during the initial quality audit.
The sections below capture lessons that emerged across 13 merged PRs and
130+ commits of iterative development — patterns discovered while building
features, not just while fixing bugs.

---

## 9. Font loading is a hidden measurement dependency

**Context:** PR #14 (fix-numeric-layout-shift)

**Bug:** Pretext SVG text measurements were cached using fallback font
metrics (Georgia) before the custom web font (Cinzel) loaded. Once the
font arrived, previously measured text no longer matched the rendered
glyphs — causing layout shift, text overflow, and dropcap crowding.

**Root cause:** Canvas-based text measurement libraries compute glyph
widths at call time. If the call happens before `document.fonts.ready`
resolves, measurements are based on the fallback font.

**Fix:** A `useFontsReady()` hook that listens for font load events and
calls `clearCache()` on the Pretext library, triggering re-measurement
with correct metrics.

**What should have been in the spec:**
- "Any component that measures text must wait for custom fonts to load
  before caching metrics. Use `useFontsReady()` as a dependency."
- "Pretext cache must be invalidated when fonts transition from
  fallback → loaded."

---

## 10. Responsive SVG requires multiple fallback strategies

**Context:** PRs #13 (mobile-optimization), #14 (layout-shift), #16
(improve-margin-layout)

**Problem:** Wide SVGs designed for desktop (700–1008px coordinate
space) either forced horizontal scroll on mobile or scaled text to
unreadable sizes via viewBox.

**What emerged:** Three distinct strategies were needed, discovered
incrementally across three PRs:
1. **Component replacement:** `SectionedCardList` accordion replaces
   SVG entirely on mobile (PR #13).
2. **Width capping:** Intro SVGs use `maxWidth` to prevent stretching
   beyond their coordinate space (PR #14).
3. **Dynamic measurement:** `ResizeObserver` measures actual container
   width so SVG coordinates match available pixels (PR #16).

**What should have been in the spec:**
- "Every SVG visualization must declare its mobile strategy: replace,
  cap, or measure. CSS media queries alone are insufficient for SVG
  coordinate-space problems."
- "Wide SVGs (>600px) must be tested at 320px, 375px, and 768px
  viewports."

---

## 11. Layout shift from conditional rendering

**Context:** PR #14 (fix-numeric-layout-shift)

**Bug:** The STP reset button on PhaseLandscape was conditionally
rendered (`{show && <button>}`), causing the flex container to reflow
when it appeared. Phase annotation text that wrapped from 1 to 2 lines
during temperature scrubbing also shifted content below.

**Root cause:** Adding/removing DOM elements in a flex layout changes
the layout calculation. Dynamic text that changes line count has the
same effect.

**Fix:** Use `visibility: hidden` instead of conditional rendering to
reserve space. Use `minHeight: 2.4em` for multi-line text regions.

**What should have been in the spec:**
- "Dynamic UI elements in flex layouts must reserve space with
  `visibility: hidden` or `min-width`/`min-height`, not conditional
  DOM insertion."
- "Any text that changes content dynamically must have a minimum height
  equal to its maximum expected line count."

---

## 12. Tabular numerals prevent numeric layout shift

**Context:** PR #14 (fix-numeric-layout-shift)

**Bug:** Dynamic numbers (temperatures, tick labels, atomic numbers)
caused flex reflow as digit count changed — e.g., switching from "99"
to "100" shifted all adjacent elements.

**Root cause:** Proportional numerals have different widths per digit
(1 is narrower than 0). When numbers update, total width changes.

**Fix:** Apply `font-variant-numeric: tabular-nums` to any element
displaying dynamic numbers.

**What should have been in the spec:**
- "All dynamic numeric displays must use `tabular-nums`. This is a
  mandatory style rule, not optional polish."

---

## 13. Animation tokens must be centralized

**Context:** PR #12 (audit-shared-transitions)

**Problem:** 22 raw view-transition name strings were scattered across
files. Easing keywords were inconsistent (`ease-out` vs
`var(--ease-out)`). `fontWeight: 700` and `fontWeight: 'bold'` coexisted.

**Fix:** Consolidated to `transitions.ts` with 11 named constants, a
`vt()` helper for browser-safe view transition names, and unified easing
curves. Added an Animation Palette page as living documentation.

**What should have been in the spec:**
- "All animation timing, easing, and view-transition names must be
  defined in `transitions.ts`. No raw strings in components."
- "An Animation Palette page must exist as living documentation for
  every animation pattern in the app."

---

## 14. URL structure changes ripple everywhere

**Context:** PR #16 (improve-margin-layout)

**Problem:** Removing the `/atlas` prefix from browse routes and
pluralizing collection URLs (`/ranks` → `/properties`, `/timelines` →
`/eras`) required changes in:
- `routeMeta.ts` (route definitions)
- Every page consuming route metadata (VizNav, EntityMap, Design)
- Back-link labels ("← Timeline" not "← Discovery Timeline")
- Stale text from old specs ("property bars" references)
- Route parameter names (`/blocks/:block` not `/blocks/:b`)

**What should have been in the spec:**
- "URL taxonomy must be documented separately (route name, path,
  param names, plural/singular convention). Changes to URLs require
  a checklist: routes, nav links, back-links, labels, and tests."
- "Route parameter names must match the resource name (`/blocks/:block`,
  not `/blocks/:b`)."

---

## 15. Type guards over non-null assertions

**Context:** PR #3 (audit-internal-consistency)

**Problem:** `getElement(symbol)!` was scattered through the codebase,
hiding potential null-dereference bugs. TypeScript's `!` compiles away
silently — it lies to the type checker rather than handling the error.

**Fix:** Replace `!` assertions with type guard filters:
`(e): e is ElementRecord => e != null` so TypeScript narrows correctly.

**What should have been in the spec:**
- "Never use non-null assertions (`!`) on data lookups. Use type guard
  functions so TypeScript can narrow the type safely."
- "Nullable lookups (elements, groups, anomalies) must be handled with
  explicit guards, not assertions."

---

## 16. Theme tokens must be the single source of truth

**Context:** PRs #2 (periodic-table-grid), #3 (audit-internal-consistency)

**Problem:** The MUSTARD color appeared as `#c59b1a` in `grid.ts` and
`globals.css` (incorrect, low WCAG contrast) while `theme.ts` had the
correct `#856912`. Hardcoded `#fff` and `#555` appeared in multiple
files instead of PAPER and GREY_MID tokens.

**Fix:** Centralized all color values in `theme.ts`. Added regression
tests (12 tests, 82 assertions) that verify components import from the
token source rather than using raw hex values.

**What should have been in the spec:**
- "No raw color hex values in components. All colors must be imported
  from `theme.ts`."
- "Regression tests must verify token usage — color consistency is a
  testing concern, not just a style concern."

---

## 17. Test fixtures must track the data model

**Context:** PRs #8 (scatter-configurable-axes), #11 (add-ci)

**Problem:** PR #8 added physical properties (density, melting/boiling
points, half-life) to the element data. PR #11's CI then failed because
test fixtures in the `tests/` directory still used the old schema — they
were manually maintained and silently drifted from reality.

**Fix:** Updated fixtures manually for PR #11. But the structural
problem remains: fixtures should be generated from actual data or
validated against a schema.

**What should have been in the spec:**
- "Test fixtures must be validated against the data pipeline's output
  schema. When the data model changes, CI must fail if fixtures are
  stale."
- "Prefer generating test fixtures from seed data over hand-writing
  them."

---

## 18. Margin notes need explicit mobile degradation

**Context:** PR #16 (improve-margin-layout)

**Problem:** Tufte-style margin notes work at ≥1100px viewport width
where physical margins exist. On mobile, there are no margins — the
content simply overflows or disappears.

**Fix:** `MarginNote` component renders as absolutely-positioned text on
desktop and as a `<details>` accordion (progressive disclosure) on mobile.

**What should have been in the spec:**
- "Any desktop-only layout feature (margins, sidebars, multi-column)
  must declare its mobile degradation strategy before implementation."
- "Progressive disclosure (`<details>`) is the default mobile fallback
  for supplementary content."

---

## 19. View Transitions API requires naming taxonomy and snapshot discipline

**Context:** PR #12 (audit-shared-transitions)

**Problem:** View transitions (element morphing across page navigations)
require explicit `viewTransitionName` on each shared surface. Without a
naming convention, names collided or were missed. Additionally, the
browser snapshot captured white corners on element cells because the
snapshot background was opaque.

**Fix:** Established three naming tiers:
1. **Element surfaces:** `symbol`, `number`, `name`
2. **UI surfaces:** `cell-bg`, `data-plate-group`
3. **Navigation surfaces:** `nav-back`, `viz-title`

Used a `vt()` helper for browser detection fallback and fixed snapshot
backgrounds to transparent.

**What should have been in the spec:**
- "View transition names must follow the three-tier taxonomy: element,
  UI surface, navigation."
- "Test view transitions with transparent snapshot backgrounds to avoid
  opaque-corner artifacts."

---

## 20. Flex + SVG sizing requires three dimensions of thought

**Context:** PR #16 (improve-margin-layout)

**Problem:** The Folio layout went through three failed iterations:
1. Side-by-side flex (identity + plate left, SVG text right) — failed
   on mobile due to line wrapping.
2. Wrapped flex (identity + plate row, text row) — text clipped at
   320px because SVG had hardcoded `width`.
3. ResizeObserver-driven dynamic widths — finally correct, measuring
   actual container width rather than assuming it.

**Root cause:** CSS flex layout and SVG coordinate space use different
sizing models. CSS controls the container; SVG `viewBox` controls
internal coordinates; `width`/`height` attributes control the bridge
between them. All three must agree.

**What should have been in the spec:**
- "SVG inside flex containers must use ResizeObserver or container
  queries to determine available width — never hardcode pixel values."
- "Document the three sizing dimensions: CSS container width, SVG
  `viewBox` coordinate space, and SVG `width`/`height` attributes."

---

## Updated Summary

### Audit-phase lessons (1–8)
Focused on bugs caught after the fact: CSS/SVG transform conflicts,
zero-height measurements, broken category pages, unsorted search,
same-value comparison edge cases, orphaned routes, plain `<a>` tags,
and mock-heavy tests.

### Development-phase lessons (9–20)
Focused on patterns discovered while building features:

| # | Lesson | Key Principle |
|---|--------|---------------|
| 9 | Font loading is a measurement dependency | Invalidate caches when fonts load |
| 10 | Responsive SVG needs multiple strategies | Replace, cap, or measure — not just CSS |
| 11 | Conditional rendering causes layout shift | Reserve space with visibility/min-size |
| 12 | Tabular numerals for dynamic numbers | `tabular-nums` is mandatory, not optional |
| 13 | Centralize animation tokens | One file, one palette page, no raw strings |
| 14 | URL changes ripple everywhere | Document URL taxonomy with a change checklist |
| 15 | Type guards over non-null assertions | Let TypeScript narrow, don't lie to it |
| 16 | Theme tokens as single source of truth | Test for token usage, not just correctness |
| 17 | Test fixtures must track the data model | Validate or generate fixtures from schema |
| 18 | Margin notes need mobile degradation | `<details>` as default mobile fallback |
| 19 | View Transitions need naming taxonomy | Three tiers: element, surface, navigation |
| 20 | Flex + SVG sizing needs three dimensions | Container width, viewBox, and attributes |

### Cross-cutting themes

1. **Measure, don't assume.** Whether it's font metrics, container
   widths, or SVG coordinate space — the recurring failure mode is
   hardcoding values that should be measured at runtime.

2. **Centralize tokens, decentralize usage.** Colors, animations, URLs,
   and view-transition names all suffered from duplication drift.
   Centralizing the definition (and testing that components use it) is
   more reliable than code review alone.

3. **Mobile is a different layout, not a smaller desktop.** CSS media
   queries alone don't solve SVG coordinate-space problems, margin
   layouts, or progressive disclosure. Mobile needs its own component
   strategy per page.

4. **Tests must match reality.** Mocks that lie, fixtures that drift,
   and assertions that check the wrong thing (set membership instead of
   ordering, DOM existence instead of visual position) are worse than
   no tests — they provide false confidence.

---
---

# Part 3 — Lessons from PR Review and Integration

The sections below capture lessons from reviewing, rebasing, and
integrating work across multiple concurrent branches and PRs.

---

## 21. Hardcoded tooltip backgrounds overflow their text

**Context:** Entity Map edge labels, Discovery Timeline tooltips,
Discoverer Network tooltips

**Bug:** SVG tooltip background `<rect>` elements used hardcoded widths
(80px, 120px, 140px) that were too narrow for their dynamic text content.
"classified as (n:1)" overflowed the 80px background. Long discoverer
names overflowed the 120px background.

**Fix:** Use Pretext's `measureLines()` to compute actual text width,
then size the `<rect>` to match. Cost is zero — Pretext is pure JS math
(no DOM, no canvas), synchronous, microsecond-scale.

**What should have been in the spec:**
- "Every SVG background rect behind dynamic text must be sized from
  measured text width, not hardcoded pixel values."
- "Pretext measurement is free — use it everywhere text width matters."

---

## 22. Drop cap font must match the design system

**Context:** Switching drop caps from Helvetica Neue to Cinzel

**Problem:** Drop caps used `PRETEXT_SANS` (Helvetica Neue) while the
ATLAS wordmark used Cinzel. The visual disconnect was subtle but broke
the typographic hierarchy — the most prominent character on each page
didn't match the brand.

**Fix:** Added `DROP_CAP_FONT` constant to `pretext.ts`, updated
`PretextSvg` rendering and all 9 page-level `dropCapFont` measurement
strings. Both the rendering font and the measurement font must agree.

**What should have been in the spec:**
- "The drop cap font must be the same as the wordmark font. This is a
  design-system constraint, not a per-page decision."
- "When changing a font for rendering, the measurement font string
  must be updated in the same commit."

---

## 23. PRs that branch before changes land need rebasing

**Context:** PRs #8, #9, #13, #14 — all branched before uncommitted
work on main

**Problem:** Multiple PRs branched from main before local improvements
(Cinzel drop caps, Pretext-measured tooltips, HeroHeader alignment,
timeline intro placement) were committed. Each PR independently
regressed 5–10 UI improvements because its base didn't include them.

**Fix:** Rebase each PR onto current main before merging. For PRs with
conflicts, merge main into the PR branch and resolve.

**What should have been in the process:**
- "Commit and push local changes to main before branching new work."
- "Before merging any PR, verify it includes all recent main commits
  by checking `git log origin/main..HEAD` for missing work."

---

## 24. Cherry-pick from destructive PRs

**Context:** PR #7 (codex/audit-test-quality)

**Problem:** PR #7 had two genuinely useful changes (shared mock file,
dynamic test dates) buried inside a PR that reverted two merged PRs
worth of data and features. Merging it wholesale would have destroyed
PR #8's physical properties data.

**Fix:** Created a clean PR (#10) with only the useful changes,
cherry-picked onto current main. Closed PR #7 with explanation.

**What should have been in the process:**
- "When a PR contains both useful improvements and destructive
  reverts, extract the useful parts into a new branch. Never merge
  a PR that reverts merged work without explicit approval."

---

## 25. Route renames break tests in three places

**Context:** PR #16 renamed `/element/` → `/elements/`,
`/atlas/group/` → `/groups/`, `/credits` → `/about/credits`, etc.

**Problem:** After merging PR #16, CI failed with 15 test failures
across 3 test files. Every `toHaveAttribute('href', '/element/...')`
assertion broke. The `@testing-library/user-event` package was missing.
The performance test's bundle size budget was stale.

**Fix:** Updated all route assertions, installed missing dependency,
adjusted bundle budget. Required touching 5 test files.

**What should have been in the spec:**
- "Route renames must include a test migration checklist: component
  tests, E2E navigation tests, fixture hrefs, and performance budgets."
- "CI must run before merge, not after. If PR #16 had CI checks as a
  merge requirement, these failures would have been caught pre-merge."

---

## 26. jsdom doesn't have ResizeObserver

**Context:** PR #16 added `ResizeObserver` to Folio for responsive
width measurement

**Problem:** CI failed because jsdom (the test environment) doesn't
provide `ResizeObserver`. The error only appeared in CI — local tests
passed because the developer's Node version may differ.

**Fix:** Added a minimal stub in `tests/setup.ts`:
```ts
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

**What should have been in the spec:**
- "When using browser APIs not available in jsdom (ResizeObserver,
  IntersectionObserver, matchMedia), add stubs to `tests/setup.ts`
  in the same commit."
- "CI is the authoritative test environment, not local dev."

---

## Updated Summary Table

| # | Lesson | Key Principle |
|---|--------|---------------|
| 21 | Tooltip rects must be text-measured | Pretext is free — measure everything |
| 22 | Drop cap font = wordmark font | Design-system constraint, not per-page |
| 23 | Rebase PRs before merging | Commit local work before branching |
| 24 | Cherry-pick from destructive PRs | Extract good, reject reverts |
| 25 | Route renames break tests in 3 places | Include test migration checklist |
| 26 | jsdom lacks browser APIs | Stub in same commit as usage |

### Cross-cutting theme

5. **CI is the source of truth.** Local tests pass with browser APIs
   that jsdom lacks, with packages that happen to be installed, with
   build artifacts from previous runs. CI starts clean every time —
   if it fails, the failure is real.

---
---

# Part 4 — Lessons from Text Overflow Audit

The sections below capture lessons discovered during a comprehensive
text overflow audit across all 34 pages at three viewport sizes.

---

## 27. Text measurement width must never exceed SVG container width

**Context:** Text overflow audit — Folio summary at 812×375 landscape

**Bug:** At landscape mobile (812×375), the Folio summary text overflowed
the SVG container by 77–103px to the right. Text was readable but clipped
by the SVG boundary.

**Root cause:** `useShapedText` received `fullWidth: FULL_WIDTH` (560px
hardcoded constant) on desktop layout, but the actual SVG container was
only ~540px wide (812 viewport − 200 marginalia − 48 gap − 24 padding).
Text measured at 560px rendered in a 540px coordinate space.

**Why tests missed it:** Previous tests only checked desktop (1280px)
and mobile portrait (375px). Landscape mobile (812px) falls into a gap:
wide enough for desktop layout (`useIsMobile(768)` returns false) but
narrow enough for the marginalia column to compress the main content
below the hardcoded text width.

**Fix:** Cap `fullWidth` to `Math.min(FULL_WIDTH, effectiveWidth)` so
text measurement never exceeds the actual SVG container width.

**What should have been in the spec:**
- "Text measurement width must always be ≤ SVG container width. Use
  `Math.min(constant, measuredWidth)` when a hardcoded constant feeds
  into text measurement."
- "Test at landscape mobile (812×375) — it triggers desktop layout in
  a mobile-sized viewport, a combination that catches width mismatches."

---

## 28. SVG height must account for font descenders

**Context:** Text overflow audit — Design page drop cap demo

**Bug:** The Design page's drop cap demonstration SVG had `height={80}`
with the last text line at `y={77}` and `fontSize={16}`. The text
"the universe." was clipped 9px at the bottom on mobile-portrait.

**Root cause:** SVG `y` attribute positions the text baseline, not the
top of the text. With a 16px font, descenders extend approximately
4–5px below the baseline, and the line needs ~16px of total height.
So `y=77` + descenders ≈ 81–82px, exceeding the 80px SVG boundary.

**Fix:** Increased SVG height from 80 to 92px and added a proper
`viewBox` attribute for proportional scaling.

**What should have been in the spec:**
- "SVG text height calculation: last baseline `y` + `fontSize` (not
  `y` + descender). Safe formula: `lastY + fontSize * 1.2` for the
  SVG height."
- "Every fixed-size SVG containing text must have a `viewBox` attribute
  for proportional scaling on smaller viewports."

---

## 29. E2E test architecture must account for cold-start cost

**Context:** Text overflow audit — test redesign from 93 tests to 3

**Bug (meta):** The original overflow test suite created 93 separate
Playwright tests (31 pages × 3 viewports). Each test launched a new
browser context, triggering a ~53-second cold start to parse the JS
bundle. Total runtime: ~82 minutes. Tests timed out at 30s.

**Root cause:** Playwright's test isolation model creates a fresh page
per test. For SPAs with large bundles, the initial JavaScript parse
dominates test time. Subsequent navigations within the same context
are fast (client-side routing), but this advantage is lost when each
test starts cold.

**Fix:** Restructured to 3 tests (one per viewport), each navigating
all 31 pages sequentially within a single browser context. Runtime
dropped to ~21 minutes (4× faster). Also replaced `waitForTimeout`
(anti-pattern) with `waitForSelector` for actual content readiness.

**What should have been in the spec:**
- "For SPA test suites, batch related page visits into a single test
  per configuration to amortize the cold-start cost."
- "Use `waitForSelector` for specific content, not `waitForTimeout`.
  Fixed delays are both too slow (waste time) and too fast (flaky)."
- "Use `waitUntil: 'commit'` for SPA navigations — the server responds
  instantly, and content appears after JavaScript renders."

---

## 30. Linters must match the patterns they're designed to catch

**Context:** Internal links linter — template literal false negatives

**Bug (meta):** The internal links linter (lesson #7) used a regex
that only matched literal string hrefs: `<a href="/path">`. It missed
template literal hrefs: `<a href={`/path/${var}`}>`. Seven violations
in four files went undetected despite the linter passing cleanly.

**Root cause:** The linter was written when all internal links used
string literals. As the codebase evolved to use template literals for
dynamic routes, the linter's regex didn't evolve with it.

**Fix:** Added a second regex to catch template literal patterns:
`<a href={`/...` }` and `<a href={"/..."}`. The linter now reports
all 7 violations.

**What should have been in the spec:**
- "When writing a linter, test it against known violations before
  trusting it. Plant a deliberate violation and verify the linter
  catches it."
- "Linter regexes must be reviewed when the codebase introduces new
  syntax patterns (template literals, tagged templates, etc.)."

---
---

# Part 5 — Lessons from Search, Navigation, and Exploration

The sections below capture lessons from building the Explore page
(faceted navigation, entity cross-references, progressive disclosure)
and the hybrid search Worker (D1 FTS5 + Vectorize + Workers AI).

---

## 31. Drill parameters are a design smell — use facets

**Context:** The initial Explore page used a `drill` URL param to
"drill into" a non-element entity (e.g., `?drill=discoverer-Marie+Curie`),
which triggered client-side filtering. This interacted poorly with search
and other filters.

**Problem:** Drill is a modal state that doesn't compose. Selecting a
discoverer via drill while also filtering by block created ambiguity:
is the drill AND'd with the block filter? Does clearing the block filter
also clear the drill? Projects like Datasette and Olsen don't have this
problem because they use faceted navigation — a well-understood state
machine where dimensions compose with AND across and OR within.

**Fix:** Removed drill entirely. Clicking a non-element card sets its
entity type as a facet filter in the URL. All state lives in URL params,
composing naturally: `?q=curie&type=element&block=d`.

**What should have been in the spec:**
- "Navigation state must compose. If two controls can be active
  simultaneously, they must follow faceted AND/OR semantics."
- "If you're inventing a new URL parameter that acts like a filter but
  doesn't follow the existing filter model, that's a design smell."

---

## 32. Client-side search doesn't scale — design for the server from day one

**Context:** The original `searchEntities()` function lived in
`entities.ts`, did client-side string matching, and was imported
directly by components.

**Problem:** Client-side search can't do synonym expansion, semantic
matching, or stemming. When we needed "Polish scientists" to find Marie
Curie, client-side string matching was fundamentally incapable. The
search contract had to be redesigned to go through an API, requiring
changes to the Explore page, routes, loader, and tests.

**Fix:** Defined a `SearchRequest → SearchResponse` API contract
(`search.ts`), with a local adapter (`searchLocal.ts`) as a stand-in
until the Worker goes live. All components call the same async function
regardless of backend.

**What should have been in the spec:**
- "Search must be defined as an async API contract from day one, even
  if the initial implementation is local. The contract shape
  (request, response, facet counts) must be specified before any UI."
- "Never import a synchronous search function directly into components.
  The indirection of an async API contract costs nothing and enables
  migration to a real backend without UI changes."

---

## 33. Synonym tables must be bidirectional and per-term

**Context:** The D1 `synonyms` table mapped Latin element names to
English (wolfram→tungsten, ferrum→iron) for FTS5 query expansion.

**Problem 1 — One-directional:** Searching "tungsten" didn't expand to
"wolfram," so results mentioning only "wolfram" were missed.

**Problem 2 — Whole-query matching:** `WHERE term = ?` bound the entire
query string. "wolfram alloy" didn't match because "wolfram alloy" isn't
a row in the table — only "wolfram" is. Multi-word queries with one
expandable term silently skipped expansion.

**Fix:** Made all synonym entries bidirectional (both directions as
separate rows). Split queries into terms and expand each independently:
`"wolfram alloy"` → `("wolfram" OR "tungsten") AND "alloy"`.

**What should have been in the spec:**
- "Synonym tables must contain both directions of every mapping. Use
  `(term, synonym)` pairs with a composite primary key."
- "Synonym expansion must operate per-term, not on the full query
  string. Split → expand → reassemble."

---

## 34. Sanitize user input before FTS5 MATCH

**Context:** The search handler passed user queries directly into
SQLite FTS5 MATCH expressions.

**Problem:** FTS5 has its own query syntax: `AND`, `OR`, `NOT`, `NEAR`,
`*`, `"`, `(`, `)`. A query like `iron AND NOT metal` would be
interpreted as FTS5 operators, not as literal text. An unclosed quote
(`"iron`) would cause a parse error. This is the FTS5 equivalent of
SQL injection.

**Fix:** `sanitizeFts5Term()` strips all FTS5 operator characters and
keywords before building MATCH expressions. Each term is double-quoted
in the final query to ensure literal matching.

**What should have been in the spec:**
- "Any user input that becomes part of a FTS5 MATCH expression must be
  sanitized: strip `*\"()^{}[]` and FTS5 keywords (AND, OR, NOT, NEAR)."
- "Treat FTS5 query building with the same discipline as SQL query
  building — parameterize or sanitize, never concatenate raw input."

---

## 35. English-only embedding models have Latin blind spots

**Context:** We use `@cf/baai/bge-base-en-v1.5` (768-dim, English-only)
for semantic search via Cloudflare Vectorize.

**Problem:** "Wolfram" embeds near "tungsten" because both appear
frequently in English Wikipedia. But "ferrum," "natrium," "kalium,"
"stannum," and "hydrargyrum" are rare Latin terms that barely appear in
English text. BGE-base-en-v1.5 treats them as near-OOV tokens with poor
semantic grounding — it will NOT reliably place "ferrum" near "iron."

**Fix:** Belt-and-suspenders: the D1 synonym table provides guaranteed
recall for Latin names the embedding model can't handle. Vectorize
provides semantic coverage for everything else (contextual queries,
common-knowledge synonyms, indirect references). The synonym table adds
~1–5ms — negligible.

**What should have been in the spec:**
- "When using an English-only embedding model for a domain with
  non-English terminology (Latin chemistry names, German mineral names),
  maintain an explicit synonym table as a recall safety net."
- "Don't assume embedding similarity covers specialized vocabulary.
  Test with actual domain terms, not just common English words."

---

## 36. Test stubs must match every SQL path

**Context:** The D1 stub in `worker-search.test.ts` routed queries based
on SQL string content (`sql.includes('search_fts')`, etc.).

**Bug:** The handler's empty-query path runs
`SELECT ... FROM search_entities` (no WHERE clause), but the stub's
routing only recognized `search_entities WHERE ...` (with WHERE). Three
tests failed — block facet, AND composition, and "empty query returns
all" — because the stub returned empty results for the fetch-all query.

**Fix:** Changed stub routing to check `sql.includes('WHERE')` to
distinguish fetch-all from fetch-by-id.

**What should have been in the spec:**
- "When stubbing a database, the stub's routing logic must cover every
  distinct SQL query the handler generates. Add a test for each query
  path: FTS match, fetch-all, fetch-by-id, synonym lookup."
- "If a test fails with 'expected N, got 0,' suspect the stub before
  suspecting the handler. Stubs that silently return empty results are
  the most common cause of false negatives."

---

## 37. Transitive imports create invisible bundle bloat

**Context:** `entities.ts` exported both the `Entity` type and the
`searchEntities()` function. The function imported the 120KB entity
index JSON. Any component importing the `Entity` type transitively
pulled in the entire search corpus — 177KB of dead weight.

**Fix:** Moved types and constants to `entities.ts`, search logic to
`searchLocal.ts` (later replaced by the API contract). The entity index
is now loaded only in the route loader, not at import time.

**What should have been in the spec:**
- "Type-only exports must live in files with no runtime imports. If a
  file exports both types and functions that import large data, the
  types will transitively pull in the data for every consumer."
- "Use `import type { ... }` consistently. TypeScript erases type
  imports at build time, but only if the import is marked as type-only."

---

## 38. Self-exclusion facet counts are essential UX

**Context:** Facet chips (type, block, phase, era, etymologyOrigin)
show counts next to each value.

**Problem:** Naive counting (count after all filters are applied)
causes the active dimension's chips to show misleading counts. If
`type=element` is active, the type chip for "discoverer" shows 0 —
making it look like there are no discoverers matching the query, when
in fact there are. The user can't discover that removing the type
filter would reveal discoverer results.

**Fix:** Self-exclusion counting: for each facet dimension, recompute
counts with that dimension's filter removed. This shows what would
happen if the user toggled each chip. Zero-count chips are disabled
(greyed out, still visible), not hidden.

**What should have been in the spec:**
- "Facet counts must use self-exclusion: count results with all filters
  EXCEPT the current dimension. This lets users see what they'd get by
  changing each filter."
- "Zero-count chips must be disabled, not hidden. Hiding creates the
  impression that the dimension doesn't exist for this query."

---

## 39. View Transitions API callback must resolve synchronously

**Bug:** Navigating from the Table to an Element page caused a 4-second
hang. The page eventually loaded, but felt broken. Console showed:
`TimeoutError: Transition was aborted because of timeout in DOM update`.

**Root cause:** `document.startViewTransition()` holds a screenshot of
the old page until the callback's promise resolves. Our callback used a
double-`requestAnimationFrame` trick to wait for React to flush, but
lazy-loaded routes with data loaders take longer than 2 frames. The
browser's 4-second timeout fired, aborting the transition.

**Fix:** Replace the rAF promise with `flushSync` from `react-dom`.
React commits the new route synchronously inside the callback, so the
transition resolves immediately.

**Why tests missed it:** Unit tests (jsdom) don't have `startViewTransition`
— the hook's early-return fallback ran instead. E2E tests asserted DOM
state after navigation but didn't check console errors or measure time.
The navigation always *succeeded*; it was just 4 seconds slower.

**What should have been in the spec:**
- "E2E: Table → Element navigation must complete in < 2 seconds."
- "E2E: No console errors containing 'Transition was aborted' after any
  navigation."
- "Never return a timing-based promise from startViewTransition. Use
  flushSync or a framework-provided signal that the DOM is ready."

---

## 40. Row-number changes ripple through adjacency, tests, and rendering

**Bug:** Tightening the f-block gap (removing the extra empty row between
the main grid and lanthanides) changed row numbers from 9/10 to 8/9.
This broke three things silently: (1) `findInDirection` still skipped
row 8 (the "gap row" that now held lanthanides), (2) adjacency map
lookups referenced the old row numbers, (3) grid tests asserted the old
row positions.

**Root cause:** The row numbers were hardcoded in four places: position
computation, adjacency skip logic, adjacency cross-references, and tests.
Changing one without updating the others left the grid navigable but with
broken keyboard nav.

**Why tests missed it:** The grid tests caught the row number change
immediately (they failed), but the `findInDirection` skip bug was only
exercised by keyboard navigation, which no unit test covered — the
adjacency map tests passed because the lookups used the *output* of
`computePosition` (which was correct), not the skip logic.

**What should have been in the spec:**
- "f-block row numbers must be defined as named constants, not magic
  numbers scattered across functions."
- "Any change to grid geometry must be accompanied by a keyboard
  navigation smoke test: arrow-key from La to Ce, from Ac to Th."

---

## 41. Inline style duplicates drift silently

**Bug:** 28 inline style objects across About, Credits, and Design pages
duplicated `SECTION_HEADING_STYLE` and `INSCRIPTION_STYLE` properties.
When the theme constants evolved, the inline copies didn't — creating
subtle inconsistencies (e.g. `marginBottom: '12px'` vs the constant's
`'16px'`).

**Root cause:** Copy-paste during initial page development. The theme
constants existed but weren't imported.

**Fix:** Replace all inline duplicates with spread of the theme constant
plus any overrides. Make the Design page a *living style guide* where
specimen text renders via the actual constants.

**What should have been in the spec:**
- "No inline style object may duplicate more than 2 properties from a
  named style constant. Lint for this."
- "The Design page must render specimens using the actual theme constants,
  not copies. If a constant changes, the specimens must change too."

---

## 42. Dead code accumulates when routes are removed

**Bug:** `NeighbourhoodGraph.tsx` (224 lines) was a fully implemented
page component that was never reachable — removed from routes and VizNav
but the file remained, pulling in grid utilities and transitions.

**Root cause:** When the page was removed from the nav, the file deletion
was forgotten. It compiled fine, so no error surfaced.

**Fix:** Delete the file. Verify no imports reference it.

**What should have been in the spec:**
- "Every route removal must include file deletion of the page component."
- "CI should fail on orphan page components — files in `src/pages/` that
  are not imported by `routes.tsx`."

---

## 43. Duplicated grid rendering across pages invites divergence

**Bug:** Three pages (Home, Phase Landscape, Anomaly Explorer) each
implemented their own SVG periodic table grid — same cell positions,
same load animation, same stroke/fill logic, but with small differences
(some showed element names, some didn't; some had hover, some didn't).
When the f-block gap was tightened, all three had to be updated.

**Root cause:** The grid was built incrementally — Home first, then
Phase Landscape copied it with phase-specific fills, then Anomaly
Explorer copied it again. No one extracted the common pattern.

**Fix:** Extract `PeriodicTableGrid` component with `fillFn`, `strokeFn`,
`onClick`, `onHover`, `children` props. Each page provides a callback
for colouring. One component, one set of period rules, one load
animation, one cell layout.

**What should have been in the spec:**
- "Any SVG periodic table must use the shared `PeriodicTableGrid`
  component. Page-specific behaviour goes in callbacks, not forks."
- "When you find yourself copying 50+ lines of rendering code between
  pages, stop and extract."

---

## 44. Async search causes flash-of-loading between facet clicks

**Bug:** Clicking a facet chip on the Explore page showed a brief loading
state (empty results, then results appearing) even though all 193 entities
were already in memory. Each click felt laggy.

**Root cause:** The search function was async (designed for a future
server backend). Each facet change triggered an async call, React
suspended, and the loading fallback flashed before results arrived.

**Fix:** Make `localSearch` synchronous and compute results in `useMemo`.
The dataset is 118 elements + 75 discoverers — no async needed. Results
now appear in the same render frame as the facet change.

**What should have been in the spec:**
- "Client-side search over < 1000 entities must be synchronous. Reserve
  async for network-dependent backends."
- "Facet state changes must never show a loading state if the data is
  already in memory."

---

## Updated Summary Table

| # | Lesson | Key Principle |
|---|--------|---------------|
| 27 | Measurement width ≤ container width | Cap hardcoded constants with measured values |
| 28 | SVG height must include descenders | baseline y + fontSize × 1.2 for safe height |
| 29 | Amortize cold-start in SPA tests | Batch page visits per viewport, not per page |
| 30 | Linters must match evolving patterns | Test linters against known violations |
| 31 | Drill is a design smell — use facets | Navigation state must compose |
| 32 | Design for server search from day one | Async API contract costs nothing |
| 33 | Bidirectional + per-term synonyms | Split → expand → reassemble |
| 34 | Sanitize input before FTS5 MATCH | FTS5 injection is real |
| 35 | English models miss Latin vocabulary | Belt-and-suspenders with synonym tables |
| 36 | Stubs must cover every SQL path | Stubs that return empty are silent killers |
| 37 | Transitive imports cause bundle bloat | Types and runtime must live in separate files |
| 38 | Self-exclusion facet counts are essential | Show what toggling each chip would do |
| 39 | View Transition callbacks must resolve sync | Use flushSync, not timing guesses |
| 40 | Row-number changes ripple everywhere | Named constants, not magic numbers |
| 41 | Inline style duplicates drift silently | Spread theme constants, lint for copies |
| 42 | Dead code accumulates on route removal | Delete files when removing routes |
| 43 | Duplicated grid rendering invites divergence | Extract shared component early |
| 44 | Async search causes flash-of-loading | Sync search for in-memory datasets |

### Cross-cutting themes

6. **Tools must evolve with the codebase.** A linter written for
   string literals doesn't catch template literals. A test written
   for two viewports misses the third. A width constant that worked
   at 1280px fails at 812px. Every assumption encoded in a tool is a
   future false negative if the codebase outgrows it.

7. **Compose, don't invent.** Faceted navigation (AND across, OR within,
   self-exclusion counts) is a solved problem. Drill was a bespoke
   mechanism that didn't compose. When an established pattern exists,
   use it — novel interaction models carry hidden edge cases.

8. **Design for the real backend from the start.** An async API contract
   with a local stand-in adapter costs nothing upfront but makes backend
   migration trivial. Tight coupling to synchronous client-side search
   required rewriting components, routes, and tests.

9. **Domain vocabulary needs explicit coverage.** General-purpose tools
   (embedding models, stemmers, tokenizers) handle common language well
   but fail on domain-specific terminology. When your domain has its
   own vocabulary (Latin chemistry names, German mineral names), maintain
   an explicit mapping as a recall safety net.

10. **Test what the user experiences, not what the code does.** The view
    transition bug passed every unit test and every E2E DOM assertion.
    But no test measured *time to navigate* or checked *console errors*.
    The user experienced a 4-second hang on every first navigation — a
    showstopper that was invisible to our test suite. When a behaviour
    is only observable in a real browser (timing, visual transitions,
    console warnings), write a browser test that asserts on that signal.

11. **Extract before the third copy.** Three pages each had their own
    50-line periodic table grid. Each diverged slightly. When the grid
    geometry changed, all three needed updating. The shared component
    took 30 minutes to extract but would have prevented hours of
    cascading fixes. The rule: two copies is a coincidence; three is
    a pattern that needs a component.
