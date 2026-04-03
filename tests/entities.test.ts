import { describe, it, expect } from 'vitest';
import {
  searchEntities,
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLOURS,
  type Entity,
} from '../src/lib/entities';

/* ------------------------------------------------------------------ */
/* Minimal fixture entities for searchEntities tests                   */
/* ------------------------------------------------------------------ */

const FIXTURE_ENTITIES: Entity[] = [
  {
    id: 'element-H',
    type: 'element',
    name: 'H — Hydrogen',
    description: 'Lightest element.',
    colour: '#1B3A4B',
    elements: ['H'],
    href: '/elements/H',
  },
  {
    id: 'element-He',
    type: 'element',
    name: 'He — Helium',
    description: 'Noble gas.',
    colour: '#1B3A4B',
    elements: ['He'],
    href: '/elements/He',
  },
  {
    id: 'category-nonmetal',
    type: 'category',
    name: 'Nonmetal',
    description: 'Reactive nonmetals.',
    colour: '#1B3A4B',
    elements: ['H', 'C', 'N'],
    href: '/categories/nonmetal',
  },
  {
    id: 'anomaly-helium-placement',
    type: 'anomaly',
    name: 'Helium placement',
    description: 'He in s-block despite noble gas.',
    colour: '#C03A2B',
    elements: ['He'],
    href: '/anomalies/helium-placement',
  },
  {
    id: 'group-1',
    type: 'group',
    name: 'Group 1',
    description: 'Alkali metals and hydrogen.',
    colour: '#1B3A4B',
    elements: ['H', 'Li', 'Na'],
    href: '/groups/1',
  },
];

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

describe('searchEntities', () => {
  it('empty query returns all entities', () => {
    expect(searchEntities(FIXTURE_ENTITIES, '')).toEqual(FIXTURE_ENTITIES);
    expect(searchEntities(FIXTURE_ENTITIES, '  ')).toEqual(FIXTURE_ENTITIES);
  });

  it('finds entities by name', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'Hydrogen');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Hydrogen');
  });

  it('finds entities by description', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'Noble gas');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds entities by type keyword', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'anomaly');
    expect(results.length).toBeGreaterThan(0);
  });

  it('ranks exact name matches highest', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'H');
    const topIds = results.slice(0, 3).map((r) => r.id);
    expect(topIds).toContain('element-H');
  });

  it('returns empty for nonsense', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'xyzzyplugh');
    expect(results).toHaveLength(0);
  });

  it('handles multi-term queries', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'Helium noble');
    expect(results.length).toBeGreaterThan(0);
  });

  it('penalises terms that miss all fields', () => {
    const results = searchEntities(FIXTURE_ENTITIES, 'Hydrogen xyzzy');
    expect(results).toHaveLength(0);
  });
});
