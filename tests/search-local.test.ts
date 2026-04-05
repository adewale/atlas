/**
 * Tests for the local search adapter (stand-in for the Worker).
 *
 * Validates:
 *  - Text search scoring
 *  - Facet filtering (AND across, OR within)
 *  - Self-exclusion facet counts
 *  - Empty queries return all entities
 */
import { describe, it, expect } from 'vitest';
import { createLocalSearch } from '../src/lib/searchLocal';

const ENTITIES = [
  { id: 'element-H', type: 'element', name: 'H — Hydrogen', description: 'Lightest element.', colour: '#133e7c', elements: ['H'], href: '/elements/H' },
  { id: 'element-Fe', type: 'element', name: 'Fe — Iron', description: 'Most common metal.', colour: '#133e7c', elements: ['Fe'], href: '/elements/Fe' },
  { id: 'element-Cu', type: 'element', name: 'Cu — Copper', description: 'Coinage metal.', colour: '#133e7c', elements: ['Cu'], href: '/elements/Cu' },
  { id: 'category-nonmetal', type: 'category', name: 'Nonmetal', description: 'Reactive nonmetals.', colour: '#133e7c', elements: ['H', 'C', 'N'], href: '/categories/nonmetal' },
  { id: 'group-1', type: 'group', name: 'Group 1', description: 'Alkali metals and hydrogen.', colour: '#133e7c', elements: ['H', 'Li', 'Na'], href: '/groups/1' },
  { id: 'discoverer-Cavendish', type: 'discoverer', name: 'Henry Cavendish', description: 'Discovered hydrogen.', colour: '#856912', elements: ['H'], href: '/discoverers/Cavendish' },
];

const ELEMENTS = [
  { symbol: 'H', block: 's', phase: 'gas', etymologyOrigin: 'property', discoveryYear: 1766 },
  { symbol: 'Fe', block: 'd', phase: 'solid', etymologyOrigin: 'property', discoveryYear: null },
  { symbol: 'Cu', block: 'd', phase: 'solid', etymologyOrigin: 'property', discoveryYear: null },
  { symbol: 'C', block: 'p', phase: 'solid', etymologyOrigin: 'property', discoveryYear: null },
  { symbol: 'N', block: 'p', phase: 'gas', etymologyOrigin: 'property', discoveryYear: 1772 },
  { symbol: 'Li', block: 's', phase: 'solid', etymologyOrigin: 'mineral', discoveryYear: 1817 },
  { symbol: 'Na', block: 's', phase: 'solid', etymologyOrigin: 'place', discoveryYear: 1807 },
];

const search = createLocalSearch(ENTITIES, ELEMENTS);

describe('createLocalSearch', () => {
  it('returns all entities for empty query', async () => {
    const { results, total } = await search({ q: '' });
    expect(total).toBe(ENTITIES.length);
    expect(results).toHaveLength(ENTITIES.length);
  });

  it('searches by name', async () => {
    const { results } = await search({ q: 'Hydrogen' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Hydrogen');
  });

  it('searches by description', async () => {
    const { results } = await search({ q: 'coinage' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('element-Cu');
  });

  it('filters by type facet', async () => {
    const { results } = await search({ q: '', type: ['element'] });
    expect(results.every((r) => r.type === 'element')).toBe(true);
    expect(results).toHaveLength(3);
  });

  it('filters by block facet', async () => {
    const { results } = await search({ q: '', block: ['d'] });
    // Fe and Cu are d-block elements, plus any entities containing d-block elements
    expect(results.some((r) => r.id === 'element-Fe')).toBe(true);
    expect(results.some((r) => r.id === 'element-Cu')).toBe(true);
  });

  it('filters by phase facet', async () => {
    const { results } = await search({ q: '', phase: ['gas'] });
    expect(results.some((r) => r.id === 'element-H')).toBe(true);
  });

  it('composes type and block facets with AND', async () => {
    const { results } = await search({ q: '', type: ['element'], block: ['s'] });
    // Only H is both element type and s-block
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('element-H');
  });

  it('returns self-exclusion facet counts', async () => {
    const { facets } = await search({ q: '', type: ['element'] });
    // Type counts should be computed WITHOUT the type filter (self-exclusion)
    expect(facets?.type).toBeDefined();
    // All entity types should be counted
    expect(facets!.type.element).toBe(3);
    expect(facets!.type.category).toBe(1);
    expect(facets!.type.group).toBe(1);
    expect(facets!.type.discoverer).toBe(1);
  });

  it('block facet counts respect type filter but not block filter', async () => {
    const { facets } = await search({ q: '', type: ['element'], block: ['d'] });
    // Block counts should be computed with type=element applied but block excluded
    expect(facets?.block).toBeDefined();
    // H is s-block, Fe and Cu are d-block
    expect(facets!.block.s).toBe(1);
    expect(facets!.block.d).toBe(2);
  });

  it('returns empty results for nonsense query', async () => {
    const { results, total } = await search({ q: 'xyzzyplugh' });
    expect(results).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('penalises terms that miss all fields', async () => {
    const { results } = await search({ q: 'Hydrogen xyzzy' });
    expect(results).toHaveLength(0);
  });
});
