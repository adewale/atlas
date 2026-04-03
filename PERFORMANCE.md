# Performance Analysis: Why Browsing 118 Elements Feels Slow

## Executive Summary

Atlas feels slow primarily because of **three compounding factors**: a 350KB (108KB gzipped) monolithic React+react-router bundle that blocks first paint, 118 per-element route chunks that create a waterfall of dynamic imports on navigation, and staggered CSS/SVG animations across hundreds of DOM nodes that compete with layout recalculation. The data itself (155KB JSON for all elements) is not the bottleneck — the rendering pipeline is.

## 1. Bundle Analysis

| Asset | Raw | Gzipped | Notes |
|-------|-----|---------|-------|
| `index-*.js` (React + react-router + shared) | 350 KB | 108 KB | **Blocks first paint** — contains React, react-router, pretext, all shared components |
| `elements-*.js` (all 118 element records) | 132 KB | 32 KB | Loaded eagerly by `data.ts` — imported at module scope |
| 118 × `element-{Sym}.js` | ~1.7 KB each | ~0.5 KB | One chunk per element, loaded on navigation via route `loader` |
| Page chunks (Home, Timeline, etc.) | 3–18 KB each | 1–5 KB | Lazy-loaded per route |
| **Total JS** | **~850 KB** | **~280 KB** | Dominated by index bundle + element data |

**Key insight**: The `elements-*.js` (132KB) is imported synchronously in `data.ts` at the top level:
```ts
import rawElements from '../../data/generated/elements.json';
export const allElements: ElementRecord[] = rawElements as ElementRecord[];
```
This means *every* page loads all 118 element records upfront, even pages that don't need them. The `bySymbol` Map is also built eagerly.

## 2. Data Loading Pattern

The route loaders use `import()` for per-element JSON:
```ts
loader: async ({ params }) => {
  const [elementMod, groupsMod, anomaliesMod] = await Promise.all([
    import(`../data/generated/element-${params.symbol}.json`),
    import('../data/generated/groups.json'),
    import('../data/generated/anomalies.json'),
  ]);
}
```

**Problem**: Each element folio triggers 3 dynamic imports. With Vite's code splitting, these are separate HTTP requests. The `groups.json` and `anomalies.json` are loaded repeatedly for every element visit — they aren't cached between navigations by the loader.

Additionally, 15 routes have loaders, each performing their own set of dynamic imports. Navigating between visualization pages triggers a new set of chunk downloads every time.

## 3. Rendering Bottlenecks

### Home page: 118 SVG cells
The `PeriodicTable` component renders all 118 elements as SVG `<g>` elements, each containing:
- 1 `<rect>` (cell background)
- 1 `<text>` (atomic number)
- 1 `<text>` (symbol)
- 1 `<text>` (element name)

That's **472 SVG DOM nodes** just for the grid, plus filter buttons, search input, VizNav, SiteNav, and the PageShell wrapper. Total DOM nodes on the home page likely exceeds **700**.

### Element folio: complex SVG composition
Each element folio (`Element.tsx` at 16KB) renders:
- Hero section with giant numeral + symbol
- Data plate with 3 navigable blocks (group/period/block)
- 4 PropertyBar SVGs
- Summary text via PretextSvg (multiple `<text>` elements)
- Neighbour grid
- Related links

### Neighbourhood graph: O(n²) edge rendering
`NeighbourhoodGraph.tsx` pre-computes edges between all 118 elements and their neighbours. Each edge is an SVG `<line>`. With hundreds of edges plus 118 node circles and 118 labels, this page creates **~500+ SVG elements** with individual CSS transitions on hover.

## 4. Animation Impact

Atlas uses a "90% still, 10% explosive" animation philosophy, but the 10% is expensive:

### Staggered entry animations
- **Home page**: Each of 118 cells animates via `folio-line-reveal` with `atomicNumber * 6ms` delay = up to **708ms** of stagger. During this window, the browser runs 118 concurrent CSS animations.
- **Discovery timeline**: Each square animates with `(year - minYear) * 2ms` delay — potentially **700+ ms** of overlapping CSS transitions.
- **Anomaly explorer**: `anomaly-ripple` animation runs on all highlighted cells with computed `delay` up to 300ms.
- **Discoverer network**: `bar-grow` animation on each row with `rowIdx * 40ms` delay.

### CSS transition overhead
Many components use per-element `transition` properties:
```tsx
style={{ transition: 'fill 250ms var(--ease-out), stroke 250ms var(--ease-out)' }}
```
When the highlight mode changes on the periodic table, all 118 cells simultaneously transition their `fill`, `stroke`, `opacity`, and `transform` properties. Each transition triggers a compositor layer promotion or paint.

### `@chenglou/pretext` text measurement
The `usePretextLines` hook calls into `shapeText()` which measures text widths. This happens on every render of components with intro text (timeline, etymology, discoverer). If the component re-renders (e.g., window resize triggers `useIsMobile` change), text re-measurement runs synchronously.

## 5. Specific Slow Paths

1. **Home → Element folio**: Requires downloading `element-{Sym}.json` + `groups.json` + `anomalies.json` (3 requests), then rendering a complex SVG layout. The `Suspense` boundary shows nothing during this load.

2. **Highlight mode switching**: Changing from "None" to "Block" triggers a React re-render of all 118 cells. Each cell recalculates its fill colour, and CSS transitions kick in for all of them simultaneously.

3. **Anomaly Explorer filter click**: All 118 `<rect>` elements transition their fill colour. Highlighted elements also run the `anomaly-ripple` keyframe animation with `transform: scale()`, which forces compositor work.

4. **Neighbourhood graph hover**: Hovering an element triggers `setHoveredSymbol`, which causes React to re-render all ~500 SVG lines (to update their `stroke`, `strokeWidth`, and `opacity`) plus 118 circles. Every one of these has a 200ms CSS transition.

## 6. Recommendations (Prioritized)

### High Impact
1. **Virtualize the neighbourhood graph**: Only render edges and nodes within the viewport. The full graph renders ~500+ lines even when most are off-screen.

2. **Memoize element cells**: Wrap each periodic table cell in `React.memo` with a custom comparator that only re-renders when that cell's highlight state actually changes. Currently, changing highlight mode re-renders all 118 cells.

3. **Cache shared loader data**: `groups.json` and `anomalies.json` are fetched on every element folio visit. Cache them in a module-level variable after first load.

4. **Defer element data import**: Move `elements.json` from a synchronous top-level import to a lazy import. Pages that don't need the full element list (About, Credits, Design) shouldn't pay for it.

### Medium Impact
5. **Reduce concurrent animations**: Instead of 118 individual staggered animations, consider animating groups/blocks as batches (e.g., animate all s-block cells together, then p-block). This reduces the number of concurrent animation timelines from 118 to ~7.

6. **Use `will-change` sparingly**: Add `will-change: transform` only to elements that are about to animate, then remove it after. Currently, CSS transitions on hundreds of elements can cause the browser to promote too many layers.

7. **Split the index bundle**: The 350KB index bundle contains react-router's full runtime. Consider splitting route definitions to reduce the critical path.

### Lower Impact
8. **Preload adjacent element data**: When viewing element N, preload elements N-1 and N+1 for faster neighbour navigation.

9. **Use CSS `content-visibility: auto`** on off-screen sections of long pages (Credits table with 118 rows, Design page sections).

10. **Replace SVG text stagger with CSS `@starting-style`**: Modern browsers support `@starting-style` for entry animations without JavaScript timing, reducing JS overhead.
