import { lazy } from 'react';
import { createBrowserRouter, redirect, Outlet, ScrollRestoration } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { GroupData, AnomalyData, DiscovererData, TimelineData, PeriodData, BlockData, CategoryData } from './lib/types';
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

let groupsCache: GroupData[] | null = null;
let anomaliesCache: AnomalyData[] | null = null;
let discoverersCache: DiscovererData[] | null = null;
let timelineCache: TimelineData | null = null;
let periodsCache: PeriodData[] | null = null;
let blocksCache: BlockData[] | null = null;
let categoriesCache: CategoryData[] | null = null;

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
const NeighborhoodGraph = lazy(() => import('./pages/NeighborhoodGraph'));
const EtymologyMap = lazy(() => import('./pages/EtymologyMap'));
const DiscovererNetwork = lazy(() => import('./pages/DiscovererNetwork'));
const DiscovererDetail = lazy(() => import('./pages/DiscovererDetail'));
const DiscovererIndex = lazy(() => import('./pages/DiscovererIndex'));
const TimelineEra = lazy(() => import('./pages/TimelineEra'));
const EraIndex = lazy(() => import('./pages/EraIndex'));
const EntityMap = lazy(() => import('./pages/EntityMap'));
const AnimationPalette = lazy(() => import('./pages/AnimationPalette'));

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
      const [elementMod, groupsMod, anomaliesMod] = await Promise.all([
        import(`../data/generated/element-${params.symbol}.json`),
        groupsCache
          ? Promise.resolve(groupsCache)
          : import('../data/generated/groups.json').then(m => { groupsCache = m.default; return groupsCache; }),
        anomaliesCache
          ? Promise.resolve(anomaliesCache)
          : import('../data/generated/anomalies.json').then(m => { anomaliesCache = m.default; return anomaliesCache; }),
      ]);
      return { element: elementMod.default, groups: groupsMod, anomalies: anomaliesMod };
    },
  },

  /* ── Group ───────────────────────────────── */
  {
    path: '/groups',
    Component: AtlasGroupIndex,
    loader: async () => {
      groupsCache ??= await import('../data/generated/groups.json').then(m => m.default);
      return { groups: groupsCache };
    },
  },
  {
    path: '/groups/:n',
    Component: AtlasGroup,
    loader: async () => {
      groupsCache ??= await import('../data/generated/groups.json').then(m => m.default);
      return { groups: groupsCache };
    },
  },

  /* ── Period ──────────────────────────────── */
  {
    path: '/periods',
    Component: AtlasPeriodIndex,
    loader: async () => {
      periodsCache ??= await import('../data/generated/periods.json').then(m => m.default);
      return { periods: periodsCache };
    },
  },
  {
    path: '/periods/:n',
    Component: AtlasPeriod,
    loader: async () => {
      periodsCache ??= await import('../data/generated/periods.json').then(m => m.default);
      return { periods: periodsCache };
    },
  },

  /* ── Block ───────────────────────────────── */
  {
    path: '/blocks',
    Component: AtlasBlockIndex,
    loader: async () => {
      blocksCache ??= await import('../data/generated/blocks.json').then(m => m.default);
      return { blocks: blocksCache };
    },
  },
  {
    path: '/blocks/:block',
    Component: AtlasBlock,
    loader: async () => {
      blocksCache ??= await import('../data/generated/blocks.json').then(m => m.default);
      return { blocks: blocksCache };
    },
  },

  /* ── Category ────────────────────────────── */
  {
    path: '/categories',
    Component: AtlasCategoryIndex,
    loader: async () => {
      categoriesCache ??= await import('../data/generated/categories.json').then(m => m.default);
      return { categories: categoriesCache };
    },
  },
  {
    path: '/categories/:slug',
    Component: AtlasCategory,
    loader: async () => {
      categoriesCache ??= await import('../data/generated/categories.json').then(m => m.default);
      return { categories: categoriesCache };
    },
  },

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
  {
    path: '/anomalies',
    Component: AnomalyIndex,
    loader: async () => {
      anomaliesCache ??= await import('../data/generated/anomalies.json').then(m => m.default);
      return { anomalies: anomaliesCache };
    },
  },
  {
    path: '/anomalies/:slug',
    Component: AtlasAnomaly,
    loader: async () => {
      anomaliesCache ??= await import('../data/generated/anomalies.json').then(m => m.default);
      return { anomalies: anomaliesCache };
    },
  },

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
  {
    path: '/discoverers',
    Component: DiscovererIndex,
    loader: async () => {
      discoverersCache ??= await import('../data/generated/discoverers.json').then(m => m.default);
      return { discoverers: discoverersCache };
    },
  },
  {
    path: '/discoverers/:name',
    Component: DiscovererDetail,
    loader: async () => {
      discoverersCache ??= await import('../data/generated/discoverers.json').then(m => m.default);
      return { discoverers: discoverersCache };
    },
  },

  /* ── Timeline ────────────────────────────── */
  {
    path: '/eras',
    Component: EraIndex,
    loader: async () => {
      timelineCache ??= await import('../data/generated/timeline.json').then(m => m.default);
      return timelineCache;
    },
  },
  {
    path: '/eras/:era',
    Component: TimelineEra,
    loader: async () => {
      timelineCache ??= await import('../data/generated/timeline.json').then(m => m.default);
      return timelineCache;
    },
  },

  /* ── Visualization pages ─────────────────── */
  {
    path: '/discovery-timeline',
    Component: DiscoveryTimeline,
    loader: async () => {
      timelineCache ??= await import('../data/generated/timeline.json').then(m => m.default);
      return timelineCache;
    },
  },
  { path: '/phase-landscape', Component: PhaseLandscape },
  { path: '/property-scatter', Component: PropertyScatter },
  {
    path: '/anomaly-explorer',
    Component: AnomalyExplorer,
    loader: async () => {
      anomaliesCache ??= await import('../data/generated/anomalies.json').then(m => m.default);
      return { anomalies: anomaliesCache };
    },
  },
  { path: '/neighborhood-graph', Component: NeighborhoodGraph },
  {
    path: '/etymology-map',
    Component: EtymologyMap,
    loader: async () => {
      const mod = await import('../data/generated/etymology.json');
      return { etymology: mod.default };
    },
  },
  {
    path: '/discoverer-network',
    Component: DiscovererNetwork,
    loader: async () => {
      discoverersCache ??= await import('../data/generated/discoverers.json').then(m => m.default);
      return { discoverers: discoverersCache };
    },
  },
    ],
  },
]);
