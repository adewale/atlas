import { lazy } from 'react';
import { createBrowserRouter, redirect, Outlet, ScrollRestoration } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getElement } from './lib/data';

/** Root layout that provides scroll restoration for all routes. */
function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

/** Factory: creates a loader that lazily imports JSON and caches the result. */
function cachedLoader<T>(importFn: () => Promise<{ default: T }>, key: string) {
  let cache: T | null = null;
  return async () => {
    cache ??= await importFn().then((m) => m.default);
    return { [key]: cache };
  };
}

/** Like cachedLoader but returns the data directly (not wrapped in {key: data}). */
function cachedLoaderRaw<T>(importFn: () => Promise<{ default: T }>) {
  let cache: T | null = null;
  return async () => {
    cache ??= await importFn().then((m) => m.default);
    return cache;
  };
}

const loadGroups = cachedLoader(() => import('../data/generated/groups.json'), 'groups');
const loadPeriods = cachedLoader(() => import('../data/generated/periods.json'), 'periods');
const loadBlocks = cachedLoader(() => import('../data/generated/blocks.json'), 'blocks');
const loadCategories = cachedLoader(() => import('../data/generated/categories.json'), 'categories');
const loadAnomalies = cachedLoader(() => import('../data/generated/anomalies.json'), 'anomalies');
const loadDiscoverers = cachedLoader(() => import('../data/generated/discoverers.json'), 'discoverers');
const loadTimeline = cachedLoaderRaw(() => import('../data/generated/timeline.json'));

const Home = lazy(() => import('./pages/Home'));
const Element = lazy(() => import('./pages/Element'));
const ElementIndex = lazy(() => import('./pages/ElementIndex'));
const AtlasGroup = lazy(() => import('./pages/AtlasGroup'));
const AtlasGroupIndex = lazy(() => import('./pages/AtlasGroupIndex'));
const AtlasPeriod = lazy(() => import('./pages/AtlasPeriod'));
const AtlasPeriodIndex = lazy(() => import('./pages/AtlasPeriodIndex'));
const AtlasBlock = lazy(() => import('./pages/AtlasBlock'));
const AtlasBlockIndex = lazy(() => import('./pages/AtlasBlockIndex'));
const AtlasCategory = lazy(() => import('./pages/AtlasCategory'));
const AtlasCategoryIndex = lazy(() => import('./pages/AtlasCategoryIndex'));
const AtlasProperty = lazy(() => import('./pages/AtlasProperty'));
const PropertyIndex = lazy(() => import('./pages/PropertyIndex'));
const AtlasAnomaly = lazy(() => import('./pages/AtlasAnomaly'));
const AnomalyIndex = lazy(() => import('./pages/AnomalyIndex'));
const Compare = lazy(() => import('./pages/Compare'));
const About = lazy(() => import('./pages/About'));
const Credits = lazy(() => import('./pages/Credits'));
const Design = lazy(() => import('./pages/Design'));
const DiscoveryTimeline = lazy(() => import('./pages/DiscoveryTimeline'));
const PhaseLandscape = lazy(() => import('./pages/PhaseLandscape'));
const PropertyScatter = lazy(() => import('./pages/PropertyScatter'));
const AnomalyExplorer = lazy(() => import('./pages/AnomalyExplorer'));
const NeighbourhoodGraph = lazy(() => import('./pages/NeighbourhoodGraph'));
const EtymologyMap = lazy(() => import('./pages/EtymologyMap'));
const DiscovererNetwork = lazy(() => import('./pages/DiscovererNetwork'));
const DiscovererDetail = lazy(() => import('./pages/DiscovererDetail'));
const DiscovererIndex = lazy(() => import('./pages/DiscovererIndex'));
const TimelineEra = lazy(() => import('./pages/TimelineEra'));
const EraIndex = lazy(() => import('./pages/EraIndex'));
const EntityMap = lazy(() => import('./pages/EntityMap'));
const AnimationPalette = lazy(() => import('./pages/AnimationPalette'));
const Explore = lazy(() => import('./pages/Explore'));

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
  { path: '/', Component: Home },

  /* ── Element ─────────────────────────────── */
  {
    path: '/elements',
    Component: ElementIndex,
    loader: async () => {
      const mod = await import('../data/generated/elements.json');
      return { elements: mod.default };
    },
  },
  {
    path: '/elements/:symbol',
    Component: Element,
    loader: async ({ params }: LoaderFunctionArgs) => {
      if (!params.symbol || !getElement(params.symbol)) return redirect('/');
      const folioBundleMod = await import(`../data/generated/folio-${params.symbol}.json`);
      return { folioBundle: folioBundleMod.default };
    },
  },

  /* ── Group ───────────────────────────────── */
  { path: '/groups', Component: AtlasGroupIndex, loader: loadGroups },
  { path: '/groups/:n', Component: AtlasGroup, loader: loadGroups },

  /* ── Period ──────────────────────────────── */
  { path: '/periods', Component: AtlasPeriodIndex, loader: loadPeriods },
  { path: '/periods/:n', Component: AtlasPeriod, loader: loadPeriods },

  /* ── Block ───────────────────────────────── */
  { path: '/blocks', Component: AtlasBlockIndex, loader: loadBlocks },
  { path: '/blocks/:block', Component: AtlasBlock, loader: loadBlocks },

  /* ── Category ────────────────────────────── */
  { path: '/categories', Component: AtlasCategoryIndex, loader: loadCategories },
  { path: '/categories/:slug', Component: AtlasCategory, loader: loadCategories },

  /* ── Rank ─────────────────────────────────── */
  { path: '/properties', Component: PropertyIndex },
  {
    path: '/properties/:property',
    Component: AtlasProperty,
    loader: async () => {
      const [rankMod, elemMod] = await Promise.all([
        import('../data/generated/rankings.json'),
        import('../data/generated/elements.json'),
      ]);
      return { rankings: rankMod.default, elements: elemMod.default };
    },
  },

  /* ── Anomaly ──────────────────────────────── */
  { path: '/anomalies', Component: AnomalyIndex, loader: loadAnomalies },
  { path: '/anomalies/:slug', Component: AtlasAnomaly, loader: loadAnomalies },

  /* ── Compare (sub-resource of element) ────── */
  { path: '/elements/:symbol/compare/:other', Component: Compare },

  /* ── About & meta pages ──────────────────── */
  { path: '/about', Component: About },
  {
    path: '/about/credits',
    Component: Credits,
    loader: async () => {
      const mod = await import('../data/generated/credits.json');
      return { credits: mod.default };
    },
  },
  { path: '/about/design', Component: Design },
  { path: '/about/animation-palette', Component: AnimationPalette },
  { path: '/about/entity-map', Component: EntityMap },

  /* ── Discoverer ──────────────────────────── */
  { path: '/discoverers', Component: DiscovererIndex, loader: loadDiscoverers },
  { path: '/discoverers/:name', Component: DiscovererDetail, loader: loadDiscoverers },

  /* ── Timeline ────────────────────────────── */
  { path: '/eras', Component: EraIndex, loader: loadTimeline },
  { path: '/eras/:era', Component: TimelineEra, loader: loadTimeline },

  /* ── Explore ─────────────────────────────── */
  {
    path: '/explore',
    Component: Explore,
    loader: async () => {
      const [entityMod, refMod, elementsMod] = await Promise.all([
        import('../data/generated/entity-index.json'),
        import('../data/generated/entity-ref-lookup.json'),
        import('../data/generated/elements.json'),
      ]);
      const { createLocalSearch } = await import('./lib/searchLocal');
      const search = createLocalSearch(entityMod.default, elementsMod.default);
      return { search, refLookup: refMod.default };
    },
  },

  /* ── Visualization pages ─────────────────── */
  { path: '/discovery-timeline', Component: DiscoveryTimeline, loader: loadTimeline },
  { path: '/phase-landscape', Component: PhaseLandscape },
  { path: '/property-scatter', Component: PropertyScatter },
  { path: '/anomaly-explorer', Component: AnomalyExplorer, loader: loadAnomalies },
  { path: '/neighbourhood-graph', Component: NeighbourhoodGraph },
  {
    path: '/etymology-map',
    Component: EtymologyMap,
    loader: async () => {
      const mod = await import('../data/generated/etymology.json');
      return { etymology: mod.default };
    },
  },
  { path: '/discoverer-network', Component: DiscovererNetwork, loader: loadDiscoverers },
    ],
  },
]);
