/**
 * Unified entity system for the Explore page.
 *
 * Aggregates ~300 entities from all generated JSON sources into a single
 * searchable, filterable collection.  Each entity carries enough data to
 * render a Byrne-style card and to drill into its children.
 */
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK } from './theme';
import type {
  ElementRecord,
  GroupData,
  PeriodData,
  BlockData,
  CategoryData,
  AnomalyData,
  DiscovererData,
  TimelineData,
} from './types';

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
/* Build the entity corpus from raw data                              */
/* ------------------------------------------------------------------ */

export function buildEntities(data: {
  elements: ElementRecord[];
  categories: CategoryData[];
  groups: GroupData[];
  periods: PeriodData[];
  blocks: BlockData[];
  anomalies: AnomalyData[];
  discoverers: DiscovererData[];
  timeline: TimelineData;
  etymology: { origin: string; elements: { symbol: string; description: string }[] }[];
}): Entity[] {
  const entities: Entity[] = [];

  // Elements
  for (const el of data.elements) {
    entities.push({
      id: `element-${el.symbol}`,
      type: 'element',
      name: `${el.symbol} — ${el.name}`,
      description: el.summary,
      colour: ENTITY_TYPE_COLOURS.element,
      elements: [el.symbol],
      href: `/elements/${el.symbol}`,
    });
  }

  // Categories
  for (const cat of data.categories) {
    entities.push({
      id: `category-${cat.slug}`,
      type: 'category',
      name: cat.label,
      description: cat.description,
      colour: ENTITY_TYPE_COLOURS.category,
      elements: cat.elements,
      href: `/categories/${cat.slug}`,
    });
  }

  // Groups
  for (const g of data.groups) {
    entities.push({
      id: `group-${g.n}`,
      type: 'group',
      name: `Group ${g.n}`,
      description: g.description,
      colour: ENTITY_TYPE_COLOURS.group,
      elements: g.elements,
      href: `/groups/${g.n}`,
    });
  }

  // Periods
  for (const p of data.periods) {
    entities.push({
      id: `period-${p.n}`,
      type: 'period',
      name: `Period ${p.n}`,
      description: p.description,
      colour: ENTITY_TYPE_COLOURS.period,
      elements: p.elements,
      href: `/periods/${p.n}`,
    });
  }

  // Blocks
  for (const b of data.blocks) {
    entities.push({
      id: `block-${b.block}`,
      type: 'block',
      name: b.label,
      description: b.description,
      colour: ENTITY_TYPE_COLOURS.block,
      elements: b.elements,
      href: `/blocks/${b.block}`,
    });
  }

  // Anomalies
  for (const a of data.anomalies) {
    entities.push({
      id: `anomaly-${a.slug}`,
      type: 'anomaly',
      name: a.label,
      description: a.description,
      colour: ENTITY_TYPE_COLOURS.anomaly,
      elements: a.elements,
      href: `/anomalies/${a.slug}`,
    });
  }

  // Discoverers
  for (const d of data.discoverers) {
    entities.push({
      id: `discoverer-${d.name}`,
      type: 'discoverer',
      name: d.name,
      description: `Discovered ${d.elements.length} element${d.elements.length === 1 ? '' : 's'}: ${d.elements.join(', ')}`,
      colour: ENTITY_TYPE_COLOURS.discoverer,
      elements: d.elements,
      href: `/discoverers/${encodeURIComponent(d.name)}`,
    });
  }

  // Eras (from timeline data)
  const eraBuckets = new Map<string, string[]>();
  for (const entry of data.timeline.antiquity) {
    const era = 'Antiquity';
    if (!eraBuckets.has(era)) eraBuckets.set(era, []);
    eraBuckets.get(era)!.push(entry.symbol);
  }
  for (const entry of data.timeline.timeline) {
    if (entry.year == null) continue;
    const decade = Math.floor(entry.year / 10) * 10;
    const era = `${decade}s`;
    if (!eraBuckets.has(era)) eraBuckets.set(era, []);
    eraBuckets.get(era)!.push(entry.symbol);
  }
  for (const [era, symbols] of eraBuckets) {
    const unique = [...new Set(symbols)];
    const eraParam = era === 'Antiquity' ? 'antiquity' : era.replace('s', '');
    entities.push({
      id: `era-${era}`,
      type: 'era',
      name: era === 'Antiquity' ? 'Antiquity' : `${era}`,
      description: `${unique.length} element${unique.length === 1 ? '' : 's'} discovered in ${era === 'Antiquity' ? 'antiquity' : `the ${era}`}.`,
      colour: ENTITY_TYPE_COLOURS.era,
      elements: unique,
      href: `/eras/${eraParam}`,
    });
  }

  // Etymology origins
  for (const ety of data.etymology) {
    const symbols = ety.elements.map((e) => e.symbol);
    const capitalised = ety.origin.charAt(0).toUpperCase() + ety.origin.slice(1);
    entities.push({
      id: `etymology-${ety.origin}`,
      type: 'etymology',
      name: `${capitalised} names`,
      description: `${symbols.length} elements named for ${ety.origin === 'property' ? 'their properties' : ety.origin === 'place' ? 'places' : ety.origin === 'person' ? 'people' : ety.origin === 'mythology' ? 'mythological figures' : ety.origin === 'mineral' ? 'minerals' : ety.origin === 'astronomical' ? 'celestial bodies' : ety.origin}.`,
      colour: ENTITY_TYPE_COLOURS.etymology,
      elements: symbols,
      href: `/etymology-map#${ety.origin}`,
    });
  }

  return entities;
}

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
