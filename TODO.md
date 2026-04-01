# Atlas Mobile Optimisation — Remaining Work

## Completed (this PR)

- [x] **SectionedCardList component** — Reusable accordion-enabled sectioned card grid extracted from Etymology Map pattern
- [x] **Phase Landscape** — Mobile sectioned view (solid/liquid/gas sections), desktop SVG preserved
- [x] **Anomaly Explorer** — Mobile sectioned view (one section per anomaly type), desktop SVG preserved
- [x] **Discovery Timeline** — Mobile sectioned view (sections by era: Antiquity, 1700s, 1800s, 1900s, 2000s), desktop SVG preserved
- [x] **Discoverer Network** — Mobile sectioned view (one section per discoverer), desktop SVG preserved
- [x] Unit tests (Vitest + Testing Library), property-based tests (fast-check), e2e tests (Playwright)
- [x] Screenshot tests across iPhone 15 Pro Max, iPhone 16 Pro Max, iPhone 17 viewports
- [x] Performance budget tests for page load and accordion toggle latency

---

## Phase Landscape — Temperature Slider

### Design
- Add `useState<number>(273)` for temperature in Kelvin (default = STP = 0°C)
- `<input type="range" min={0} max={6000} step={10}>` styled in Byrne aesthetic (black track, WARM_RED thumb)
- `useMemo` recomputes phase per element at current temperature:
  ```
  if (temp < meltingPoint)  → solid
  if (temp >= meltingPoint && temp < boilingPoint) → liquid
  if (temp >= boilingPoint) → gas
  if (both null) → unknown (4th section)
  ```
- Display temperature in both K and °C: `{temp} K ({temp - 273}°C)`
- Key temperature tick marks on slider: 0K, 273K (STP), 373K (water boils), 1811K (iron melts), 5778K (sun surface)
- Section counts update live as slider moves

### Mobile implications
- Slider is natural touch control — thumb drag works well
- Sectioned card layout reflows as elements shift between sections
- **Performance concern**: Debounce re-render — use `onPointerUp` or `requestAnimationFrame` throttle to avoid jank during drag
- **Touch target**: Slider thumb needs `min-height: 44px` (enforced globally)
- **Visual continuity**: Skip stagger animation on re-sort; only animate on initial load

### Estimated scope
- ~80 lines of new code in PhaseLandscape.tsx
- New test: slider interaction changes section counts
- New e2e test: screenshot at different temperatures

---

## Property Scatter

### Current issues on mobile
- 700×500 SVG is dense and hard to read on 375px screens
- `<select>` dropdowns are small touch targets
- Hover tooltip card (180×72px) can overflow viewport

### Recommendations
- **Stack axis selectors vertically** on mobile via `useIsMobile()` + `flex-direction: column`
- **Consider a sorted card list view** as mobile alternative: show elements in a vertical list with both property values displayed, grouped by block
- **Increase select padding** to `8px 12px` on mobile for larger touch targets
- **Tooltip repositioning**: Detect right/bottom edge overflow and flip card position

---

## Neighbourhood Graph

### Current issues on mobile
- Full periodic table SVG (960px wide) with dense edge lines requires horizontal scroll
- Edge lines become unreadable at small sizes
- Hover is the primary interaction (no touch equivalent beyond toggle)

### Recommendations
- **List view on mobile**: For each element, show symbol card + inline row of neighbour pills (NavigationPill component)
- **Group by block or period** to create natural sections using SectionedCardList
- **Alternative**: Keep SVG but use viewBox scaling with reduced NODE_RADIUS and hidden edge labels
- **Touch**: Already has `onPointerDown` toggle — good foundation

---

## AtlasBrowsePage (Group / Period / Block / Category / Rank / Anomaly)

### Current issues
- Description SVG uses fixed `width={600}` which can overflow on narrow screens
- No accordion behaviour on description text

### Recommendations
- Change description SVG to `width="100%"` with `maxWidth: 600px`
- Add "Read more" accordion trigger on mobile to collapse long descriptions
- AtlasPlate already handles 2-column mobile layout — no change needed there

---

## Element Folio

### Current state
- Already has mobile layout (single column, scaled-down hero)
- Neighbour chips are small

### Recommendations
- Increase neighbour chip touch targets to 44px minimum height on mobile
- Consider stacking the marginalia below the identity block with more spacing

---

## Home / Periodic Table

### Current state
- Horizontal scroll SVG with pinch-zoom — appropriate for the table shape

### Recommendation
- No change needed — the `pt-scroll-container` pattern is correct here
- Possible enhancement: add a "jump to element" search bar above the table on mobile

---

## Etymology Map

### Current state
- Already uses the sectioned card pattern (this is the reference implementation)

### Possible enhancement
- Add accordion behaviour on mobile (start collapsed) using the new `SectionedCardList` component
- Currently uses custom inline styles — could be migrated to SectionedCardList for consistency

---

## General Mobile Improvements

### Accordion defaults
- **Mobile**: Start sections collapsed by default to reduce initial scroll depth
- **Desktop**: Start sections expanded (current behaviour)
- Toggle via `useIsMobile()` hook feeding `defaultCollapsed` prop

### View toggle
- Add a "Table / List" toggle on pages that have both SVG and sectioned views
- Persist preference in `localStorage`
- Animate transition between views with CSS `opacity` fade

### Keyboard navigation
- Ensure accordion headers are focusable and respond to Enter/Space
- Add arrow key navigation between sections (Up/Down to move between headers)

### Testing
- Add visual regression baseline snapshots for all new mobile views
- Add Lighthouse CI performance budget assertions
- Add axe-core accessibility audits for accordion ARIA compliance
