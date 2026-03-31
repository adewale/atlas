/**
 * Centralized route metadata — single source of truth for visualization
 * page labels, colours, and entity descriptions used by VizNav, EntityMap,
 * and anywhere else that needs to enumerate pages or entity types.
 */
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK } from './theme';

export type VizPage = {
  path: string;
  label: string;
  colour: string;
  entities: string;
};

export const VIZ_PAGES: VizPage[] = [
  { path: '/', label: 'Table', colour: BLACK, entities: 'Element, Group, Period, Block, Category' },
  { path: '/phase-landscape', label: 'Phase', colour: WARM_RED, entities: 'Element, Block (colour)' },
  { path: '/neighborhood-graph', label: 'Neighbours', colour: BLACK, entities: 'Element, Neighbour (edges)' },
  { path: '/anomaly-explorer', label: 'Anomalies', colour: MUSTARD, entities: 'Element, Anomaly' },
  { path: '/property-scatter', label: 'Scatter', colour: DEEP_BLUE, entities: 'Element, Block (colour), Ranking (axes)' },
  { path: '/discovery-timeline', label: 'Timeline', colour: WARM_RED, entities: 'Element, Era, Discoverer' },
  { path: '/etymology-map', label: 'Etymology', colour: DEEP_BLUE, entities: 'Element, Etymology Origin' },
  { path: '/discoverer-network', label: 'Discoverers', colour: MUSTARD, entities: 'Element, Discoverer' },
];

export type EntityMeta = {
  id: string;
  label: string;
  route: string;
  examples: { name: string; href: string }[];
  count: string;
  colour: string;
  description: string;
};

export const ENTITIES: EntityMeta[] = [
  { id: 'element', label: 'Element', route: '/element/:symbol', count: '118', colour: WARM_RED, description: 'Central entity. Every element is a folio page with properties, neighbours, discoverer, etymology, and rankings.', examples: [
    { name: 'Fe — Iron', href: '/element/Fe' },
    { name: 'O — Oxygen', href: '/element/O' },
    { name: 'Au — Gold', href: '/element/Au' },
    { name: 'Og — Oganesson', href: '/element/Og' },
  ]},
  { id: 'group', label: 'Group', route: '/atlas/group/:n', count: '18', colour: DEEP_BLUE, description: 'IUPAC vertical column (1–18). Elements in a group share valence electron configuration.', examples: [
    { name: 'Group 1 (Alkali)', href: '/atlas/group/1' },
    { name: 'Group 8', href: '/atlas/group/8' },
    { name: 'Group 17 (Halogens)', href: '/atlas/group/17' },
    { name: 'Group 18 (Noble gases)', href: '/atlas/group/18' },
  ]},
  { id: 'period', label: 'Period', route: '/atlas/period/:n', count: '7', colour: WARM_RED, description: 'Horizontal row (1–7). Elements in a period share the same highest energy level.', examples: [
    { name: 'Period 1 (H, He)', href: '/atlas/period/1' },
    { name: 'Period 4', href: '/atlas/period/4' },
    { name: 'Period 7 (actinides+)', href: '/atlas/period/7' },
  ]},
  { id: 'block', label: 'Block', route: '/atlas/block/:b', count: '4', colour: MUSTARD, description: 'Orbital family (s/p/d/f). The block determines the element\'s colour identity throughout Atlas.', examples: [
    { name: 's-block', href: '/atlas/block/s' },
    { name: 'p-block', href: '/atlas/block/p' },
    { name: 'd-block', href: '/atlas/block/d' },
    { name: 'f-block', href: '/atlas/block/f' },
  ]},
  { id: 'category', label: 'Category', route: '/atlas/category/:slug', count: '10', colour: DEEP_BLUE, description: 'Chemical family (alkali metal, halogen, noble gas, etc.). Cross-cuts block boundaries.', examples: [
    { name: 'Transition metal', href: '/atlas/category/transition-metal' },
    { name: 'Noble gas', href: '/atlas/category/noble-gas' },
    { name: 'Alkali metal', href: '/atlas/category/alkali-metal' },
    { name: 'Metalloid', href: '/atlas/category/metalloid' },
  ]},
  { id: 'ranking', label: 'Ranking', route: '/atlas/rank/:property', count: '4', colour: MUSTARD, description: 'Elements ordered by a numeric property: mass, electronegativity, ionisation energy, or radius.', examples: [
    { name: 'Ranked by mass', href: '/atlas/rank/mass' },
    { name: 'By electronegativity', href: '/atlas/rank/electronegativity' },
    { name: 'By ionisation energy', href: '/atlas/rank/ionizationEnergy' },
    { name: 'By atomic radius', href: '/atlas/rank/radius' },
  ]},
  { id: 'anomaly', label: 'Anomaly', route: '/atlas/anomaly/:slug', count: '5', colour: WARM_RED, description: 'Periodic table rule-breakers: aufbau deviations, diagonal relationships, metalloid boundary.', examples: [
    { name: 'Electron config anomalies', href: '/atlas/anomaly/electron-configuration-anomalies' },
    { name: 'Diagonal relationships', href: '/atlas/anomaly/diagonal-relationships' },
    { name: 'Synthetic heavyweights', href: '/atlas/anomaly/synthetic-heavy' },
  ]},
  { id: 'discoverer', label: 'Discoverer', route: '/discoverer/:name', count: '50+', colour: MUSTARD, description: 'Person or group who discovered elements. Graph-navigable with related discoverers by era or block.', examples: [
    { name: 'Humphry Davy', href: '/discoverer/Humphry%20Davy' },
    { name: 'Marie Curie & Pierre Curie', href: '/discoverer/Marie%20Curie%20%26%20Pierre%20Curie' },
    { name: 'Carl Wilhelm Scheele', href: '/discoverer/Carl%20Wilhelm%20Scheele' },
  ]},
  { id: 'era', label: 'Timeline Era', route: '/timeline/:era', count: '30+', colour: DEEP_BLUE, description: 'Decade or "antiquity". Groups discoveries by when they happened. Links to discoverers.', examples: [
    { name: 'Antiquity', href: '/timeline/antiquity' },
    { name: '1770s', href: '/timeline/1770' },
    { name: '1890s', href: '/timeline/1890' },
    { name: '1940s', href: '/timeline/1940' },
  ]},
  { id: 'etymology', label: 'Etymology Origin', route: '/etymology-map#:origin', count: '7', colour: WARM_RED, description: 'Why elements are named: place, person, mythology, property, mineral, astronomical, unknown.', examples: [
    { name: 'Place names', href: '/etymology-map#place' },
    { name: 'Mythology', href: '/etymology-map#mythology' },
    { name: 'Properties', href: '/etymology-map#property' },
  ]},
  { id: 'comparison', label: 'Comparison', route: '/compare/:a/:b', count: '6903', colour: BLACK, description: 'Side-by-side element pair. Any two of 118 elements can be compared.', examples: [
    { name: 'Fe vs Cu', href: '/compare/Fe/Cu' },
    { name: 'Na vs K', href: '/compare/Na/K' },
    { name: 'C vs Si', href: '/compare/C/Si' },
  ]},
  { id: 'neighbour', label: 'Neighbour', route: '—', count: '~236', colour: BLACK, description: 'Positional adjacency in the periodic table grid. Implicit, computed from grid coordinates.', examples: [
    { name: 'Fe ↔ Mn, Co', href: '/element/Fe' },
    { name: 'O ↔ N, F', href: '/element/O' },
  ]},
];
