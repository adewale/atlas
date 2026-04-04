/**
 * Entity types, colours, and type definitions for the Explore page.
 *
 * The entity corpus is built at derivation time (derive-data.ts) and
 * loaded from entity-index.json. All querying goes through the search
 * API — no client-side scoring in this module.
 */
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK } from './theme';

/* ------------------------------------------------------------------ */
/* Entity types & colours                                             */
/* ------------------------------------------------------------------ */

export const ENTITY_TYPES = [
  'element',
  'category',
  'group',
  'period',
  'block',
  'anomaly',
  'discoverer',
  'era',
  'etymology',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  element: 'Element',
  category: 'Category',
  group: 'Group',
  period: 'Period',
  block: 'Block',
  anomaly: 'Anomaly',
  discoverer: 'Discoverer',
  era: 'Era',
  etymology: 'Etymology',
};

/** Byrne colour per entity type — used for card headers and chips. */
export const ENTITY_TYPE_COLOURS: Record<EntityType, string> = {
  element: DEEP_BLUE,
  category: DEEP_BLUE,
  group: DEEP_BLUE,
  period: WARM_RED,
  block: MUSTARD,
  anomaly: WARM_RED,
  discoverer: MUSTARD,
  era: WARM_RED,
  etymology: BLACK,
};

/* ------------------------------------------------------------------ */
/* Entity record                                                      */
/* ------------------------------------------------------------------ */

export type Entity = {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  colour: string;
  /** Element symbols belonging to this entity. */
  elements: string[];
  /** Route to the existing detail page, if any. */
  href: string | null;
};
