import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

const Home = lazy(() => import('./pages/Home'));
const Element = lazy(() => import('./pages/Element'));
const AtlasGroup = lazy(() => import('./pages/AtlasGroup'));
const AtlasPeriod = lazy(() => import('./pages/AtlasPeriod'));
const AtlasBlock = lazy(() => import('./pages/AtlasBlock'));
const AtlasCategory = lazy(() => import('./pages/AtlasCategory'));
const AtlasRank = lazy(() => import('./pages/AtlasRank'));
const AtlasAnomaly = lazy(() => import('./pages/AtlasAnomaly'));
const Compare = lazy(() => import('./pages/Compare'));
const About = lazy(() => import('./pages/About'));
const Credits = lazy(() => import('./pages/Credits'));
const Design = lazy(() => import('./pages/Design'));

export const router = createBrowserRouter([
  { path: '/', Component: Home },
  {
    path: '/element/:symbol',
    Component: Element,
    loader: async ({ params }: LoaderFunctionArgs) => {
      const [elementMod, groupsMod] = await Promise.all([
        import(`../data/generated/element-${params.symbol}.json`),
        import('../data/generated/groups.json'),
      ]);
      return { element: elementMod.default, groups: groupsMod.default };
    },
  },
  {
    path: '/atlas/group/:n',
    Component: AtlasGroup,
    loader: async () => {
      const mod = await import('../data/generated/groups.json');
      return { groups: mod.default };
    },
  },
  {
    path: '/atlas/period/:n',
    Component: AtlasPeriod,
    loader: async () => {
      const mod = await import('../data/generated/periods.json');
      return { periods: mod.default };
    },
  },
  {
    path: '/atlas/block/:block',
    Component: AtlasBlock,
    loader: async () => {
      const mod = await import('../data/generated/blocks.json');
      return { blocks: mod.default };
    },
  },
  {
    path: '/atlas/category/:slug',
    Component: AtlasCategory,
    loader: async () => {
      const mod = await import('../data/generated/categories.json');
      return { categories: mod.default };
    },
  },
  {
    path: '/atlas/rank/:property',
    Component: AtlasRank,
    loader: async () => {
      const [rankMod, elemMod] = await Promise.all([
        import('../data/generated/rankings.json'),
        import('../data/generated/elements.json'),
      ]);
      return { rankings: rankMod.default, elements: elemMod.default };
    },
  },
  {
    path: '/atlas/anomaly/:slug',
    Component: AtlasAnomaly,
    loader: async () => {
      const mod = await import('../data/generated/anomalies.json');
      return { anomalies: mod.default };
    },
  },
  {
    path: '/compare/:symbolA/:symbolB',
    Component: Compare,
    loader: async ({ params }: LoaderFunctionArgs) => {
      const [elA, elB] = await Promise.all([
        import(`../data/generated/element-${params.symbolA}.json`),
        import(`../data/generated/element-${params.symbolB}.json`),
      ]);
      return { elementA: elA.default, elementB: elB.default };
    },
  },
  { path: '/about', Component: About },
  {
    path: '/credits',
    Component: Credits,
    loader: async () => {
      const mod = await import('../data/generated/credits.json');
      return { credits: mod.default };
    },
  },
  { path: '/design', Component: Design },
]);
