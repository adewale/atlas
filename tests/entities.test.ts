import { describe, it, expect } from 'vitest';
import {
  buildEntities,
  searchEntities,
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLOURS,
  type Entity,
} from '../src/lib/entities';

/* ------------------------------------------------------------------ */
/* Minimal fixture data — just enough to exercise each entity builder  */
/* ------------------------------------------------------------------ */

const FIXTURE = {
  elements: [
    {
      symbol: 'H',
      name: 'Hydrogen',
      atomicNumber: 1,
      summary: 'Lightest element.',
      block: 's',
      group: 1,
      period: 1,
      category: 'nonmetal',
    },
    {
      symbol: 'He',
      name: 'Helium',
      atomicNumber: 2,
      summary: 'Noble gas.',
      block: 's',
      group: 18,
      period: 1,
      category: 'noble gas',
    },
  ],
  categories: [
    { slug: 'nonmetal', label: 'Nonmetal', description: 'Reactive nonmetals.', elements: ['H', 'C', 'N'] },
  ],
  groups: [
    { n: 1, description: 'Alkali metals and hydrogen.', elements: ['H', 'Li', 'Na'] },
  ],
  periods: [
    { n: 1, description: 'First period.', elements: ['H', 'He'] },
  ],
  blocks: [
    { block: 's', label: 's-block', description: 'Electropositive metals and hydrogen.', elements: ['H', 'He', 'Li'] },
  ],
  anomalies: [
    { slug: 'helium-placement', label: 'Helium placement', description: 'He in s-block despite noble gas.', elements: ['He'] },
  ],
  discoverers: [
    { name: 'Henry Cavendish', elements: ['H'] },
  ],
  timeline: {
    antiquity: [{ symbol: 'Cu', year: null, name: 'Copper' }],
    timeline: [
      { symbol: 'H', year: 1766, name: 'Hydrogen', discoverer: 'Cavendish' },
      { symbol: 'He', year: 1895, name: 'Helium', discoverer: 'Ramsay' },
    ],
  },
  etymology: [
    { origin: 'property', elements: [{ symbol: 'H', description: 'water-former' }] },
  ],
} as any;

describe('ENTITY_TYPES', () => {
  it('contains 9 entity types', () => {
    expect(ENTITY_TYPES).toHaveLength(9);
  });

  it('every type has a label', () => {
    for (const type of ENTITY_TYPES) {
      expect(ENTITY_TYPE_LABELS[type]).toBeDefined();
      expect(typeof ENTITY_TYPE_LABELS[type]).toBe('string');
    }
  });

  it('every type has a colour', () => {
    for (const type of ENTITY_TYPES) {
      expect(ENTITY_TYPE_COLOURS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('buildEntities', () => {
  const entities = buildEntities(FIXTURE);

  it('builds entities from all source types', () => {
    const types = new Set(entities.map((e) => e.type));
    // Should have element, category, group, period, block, anomaly, discoverer, era, etymology
    expect(types.size).toBe(9);
  });

  it('creates element entities with correct href', () => {
    const h = entities.find((e) => e.id === 'element-H');
    expect(h).toBeDefined();
    expect(h!.href).toBe('/elements/H');
    expect(h!.elements).toEqual(['H']);
    expect(h!.name).toContain('Hydrogen');
  });

  it('creates category entities', () => {
    const cat = entities.find((e) => e.id === 'category-nonmetal');
    expect(cat).toBeDefined();
    expect(cat!.elements).toEqual(['H', 'C', 'N']);
    expect(cat!.href).toBe('/categories/nonmetal');
  });

  it('creates group entities', () => {
    const g = entities.find((e) => e.id === 'group-1');
    expect(g).toBeDefined();
    expect(g!.name).toBe('Group 1');
  });

  it('creates period entities', () => {
    const p = entities.find((e) => e.id === 'period-1');
    expect(p).toBeDefined();
    expect(p!.elements).toEqual(['H', 'He']);
  });

  it('creates block entities', () => {
    const b = entities.find((e) => e.id === 'block-s');
    expect(b).toBeDefined();
    expect(b!.name).toBe('s-block');
  });

  it('creates anomaly entities', () => {
    const a = entities.find((e) => e.id === 'anomaly-helium-placement');
    expect(a).toBeDefined();
    expect(a!.elements).toEqual(['He']);
  });

  it('creates discoverer entities', () => {
    const d = entities.find((e) => e.id === 'discoverer-Henry Cavendish');
    expect(d).toBeDefined();
    expect(d!.elements).toEqual(['H']);
    expect(d!.description).toContain('1 element');
  });

  it('creates era entities from timeline data', () => {
    const eras = entities.filter((e) => e.type === 'era');
    expect(eras.length).toBeGreaterThanOrEqual(2); // Antiquity + 1760s + 1890s
    const antiquity = eras.find((e) => e.name === 'Antiquity');
    expect(antiquity).toBeDefined();
    expect(antiquity!.elements).toContain('Cu');
  });

  it('creates etymology entities', () => {
    const ety = entities.find((e) => e.id === 'etymology-property');
    expect(ety).toBeDefined();
    expect(ety!.name).toBe('Property names');
    expect(ety!.elements).toEqual(['H']);
  });

  it('every entity has required fields', () => {
    for (const e of entities) {
      expect(e.id).toBeTruthy();
      expect(e.type).toBeTruthy();
      expect(e.name).toBeTruthy();
      expect(typeof e.description).toBe('string');
      expect(e.colour).toMatch(/^#/);
      expect(Array.isArray(e.elements)).toBe(true);
    }
  });
});

describe('searchEntities', () => {
  const entities = buildEntities(FIXTURE);

  it('empty query returns all entities', () => {
    expect(searchEntities(entities, '')).toEqual(entities);
    expect(searchEntities(entities, '  ')).toEqual(entities);
  });

  it('finds entities by name', () => {
    const results = searchEntities(entities, 'Hydrogen');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Hydrogen');
  });

  it('finds entities by description', () => {
    const results = searchEntities(entities, 'Noble gas');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds entities by type keyword', () => {
    const results = searchEntities(entities, 'anomaly');
    expect(results.length).toBeGreaterThan(0);
  });

  it('ranks exact name matches highest', () => {
    // "H" should match the element H more strongly than other entities
    const results = searchEntities(entities, 'H');
    // Element-H should be boosted because symbol matches exactly
    const topIds = results.slice(0, 3).map((r) => r.id);
    expect(topIds).toContain('element-H');
  });

  it('returns empty for nonsense', () => {
    const results = searchEntities(entities, 'xyzzyplugh');
    expect(results).toHaveLength(0);
  });

  it('handles multi-term queries', () => {
    const results = searchEntities(entities, 'Helium noble');
    // Should find the He element since both terms match
    expect(results.length).toBeGreaterThan(0);
  });

  it('penalises terms that miss all fields', () => {
    // "Hydrogen xyzzy" — one term matches, one doesn't
    const results = searchEntities(entities, 'Hydrogen xyzzy');
    // The penalty for missing "xyzzy" should outweigh the match for "Hydrogen"
    expect(results).toHaveLength(0);
  });
});
