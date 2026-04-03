/**
 * Entity types, colours, and search for the Explore page.
 *
 * The entity corpus is built at derivation time (derive-data.ts) and
 * loaded from entity-index.json. This module provides the shared type
 * definitions and client-side search scoring.
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

/* ------------------------------------------------------------------ */
/* Search across all entities                                         */
/* ------------------------------------------------------------------ */

export function searchEntities(entities: Entity[], query: string): Entity[] {
  if (!query.trim()) return entities;
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);

  return entities
    .map((entity) => {
      const nameL = entity.name.toLowerCase();
      const descL = entity.description.toLowerCase();
      const typeL = entity.type;

      // Score: exact name > name starts-with > name contains > description contains > type match
      let score = 0;
      for (const term of terms) {
        if (nameL === term) score += 100;
        else if (nameL.startsWith(term)) score += 50;
        else if (nameL.includes(term)) score += 20;
        else if (descL.includes(term)) score += 5;
        else if (typeL.includes(term)) score += 2;
        else score -= 100; // penalise terms that don't match anything
      }

      // Boost element symbols (short, exact matches are likely intentional)
      if (entity.type === 'element' && entity.elements[0]?.toLowerCase() === q) {
        score += 200;
      }

      return { entity, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entity);
}
