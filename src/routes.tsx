import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';

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
  { path: '/element/:symbol', Component: Element },
  { path: '/atlas/group/:n', Component: AtlasGroup },
  { path: '/atlas/period/:n', Component: AtlasPeriod },
  { path: '/atlas/block/:block', Component: AtlasBlock },
  { path: '/atlas/category/:slug', Component: AtlasCategory },
  { path: '/atlas/rank/:property', Component: AtlasRank },
  { path: '/atlas/anomaly/:slug', Component: AtlasAnomaly },
  { path: '/compare/:symbolA/:symbolB', Component: Compare },
  { path: '/about', Component: About },
  { path: '/credits', Component: Credits },
  { path: '/design', Component: Design },
]);
