# Atlas Mobile Optimisation — Remaining Work

## Completed

- [x] **SectionedCardList component** — Reusable accordion-enabled sectioned card grid
- [x] **Phase Landscape** — Mobile sectioned view + sparkline temperature ruler
- [x] **Anomaly Explorer** — Mobile sectioned view (by anomaly type)
- [x] **Discovery Timeline** — Mobile sectioned view (by era)
- [x] **Discoverer Network** — Mobile sectioned view (by discoverer)
- [x] **Etymology Map** — Migrated to SectionedCardList (consistent accordion across all pages)
- [x] **Temperature sparkline ruler** — SVG sparkline showing phase-transition density, landmark stops, pointer drag interaction
- [x] Unit tests, property-based tests, e2e tests, screenshot tests, performance tests

---

## Tiny Text on Portrait Mobile — Root Cause & Fix Plan

### Diagnosis

Pages that render wide SVGs (700–1008px) with `minWidth` set to the viewBox width force the content wider than the 375px viewport. The `.pt-scroll-container` CSS enables horizontal scrolling, but the SVG text (sized in viewBox units) becomes unreadably small when the viewport can't fit the full width.

### Affected pages

| Page | SVG Width | Uses `useIsMobile()`? | Has mobile layout? | Status |
|------|-----------|----------------------|--------------------|----|
| **Home (periodic table)** | 1008px | No | No | **Needs fix** |
| **Neighbourhood Graph** | 1008px | No | No | **Needs fix** |
| **Property Scatter** | 700px | No | No | **Needs fix** |
| Phase Landscape | 1008px | Yes | Yes (sectioned) | Fixed |
| Anomaly Explorer | 1008px | Yes | Yes (sectioned) | Fixed |
| Discovery Timeline | 900px | Yes | Yes (sectioned) | Fixed |
| Discoverer Network | 900px | Yes | Yes (sectioned) | Fixed |

### Fix strategy

**Home (periodic table):** The periodic table shape inherently requires width. Keep horizontal scroll with pinch-zoom — this is the one page where the wide SVG is appropriate. Consider adding a "jump to element" search bar above the table on mobile.

**Neighbourhood Graph:** Add `useIsMobile()`. On mobile, replace the SVG graph with a sectioned card list grouped by block, with each element card showing its neighbour count. Neighbour symbols shown as small pills below each card.

**Property Scatter:** Add `useIsMobile()`. On mobile, replace scatter SVG with a sorted element list showing both property values. Keep the axis selector dropdowns. Group by block using SectionedCardList.

---

## Other Mobile Improvements

### AtlasBrowsePage (Group / Period / Block / Category / Rank / Anomaly)
- Description SVG uses fixed `width={600}` — change to `width="100%"` with `maxWidth: 600px`
- Add "Read more" accordion trigger on mobile for long descriptions

### Element Folio
- Increase neighbour chip touch targets to 44px minimum height on mobile
- Consider stacking marginalia below identity block with more spacing

### General
- **View toggle**: Add "Table / List" toggle for pages with both SVG and sectioned views
- **Keyboard nav**: Ensure accordion headers respond to Enter/Space, add arrow key navigation
- **Lighthouse CI**: Add performance budget assertions
- **axe-core**: Add accessibility audits for accordion ARIA compliance
