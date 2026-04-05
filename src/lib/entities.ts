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

/**
 * Result entity types — things worth finding, not just filtering by.
 *
 * Elements: the core objects. Discoverers: people with stories.
 * Anomalies: concepts explaining unusual elements. Eras: historical
 * periods with narrative. Etymology origins: thematic cultural groupings.
 *
 * Groups, periods, blocks, categories are structural labels — useful
 * as facets to filter by, but not independent results.
 */
export const ENTITY_TYPES = [
  'element',
  'discoverer',
  'anomaly',
  'era',
  'etymology',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  element: 'Element',
  discoverer: 'Discoverer',
  anomaly: 'Anomaly',
  era: 'Era',
  etymology: 'Etymology',
};

/** Byrne colour per entity type — used for card headers and chips. */
export const ENTITY_TYPE_COLOURS: Record<EntityType, string> = {
  element: DEEP_BLUE,
  discoverer: MUSTARD,
  anomaly: WARM_RED,
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
