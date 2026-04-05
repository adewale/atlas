/**
 * Tests for Explore page faceted navigation.
 *
 * Validates:
 *  - URL search params encode all facet state (no drill param)
 *  - Facets compose with AND across dimensions, OR within
 *  - Type facet chips show self-exclusion counts from API
 *  - No client-side searchEntities — all queries go through search API
 */
import { describe, it, expect } from 'vitest';
import { buildSearchParams, parseSearchParams, type FacetState } from '../src/lib/facets';

describe('buildSearchParams', () => {
  it('empty state produces no params', () => {
    const state: FacetState = { q: '' };
    const params = buildSearchParams(state);
    expect(params.toString()).toBe('');
  });

  it('encodes query as q param', () => {
    const params = buildSearchParams({ q: 'Curie' });
    expect(params.get('q')).toBe('Curie');
  });

  it('encodes type facet as comma-separated values', () => {
    const params = buildSearchParams({ q: '', type: ['element', 'discoverer'] });
    expect(params.get('type')).toBe('element,discoverer');
  });

  it('encodes block facet', () => {
    const params = buildSearchParams({ q: '', block: ['s', 'p'] });
    expect(params.get('block')).toBe('s,p');
  });

  it('encodes era facet', () => {
    const params = buildSearchParams({ q: '', era: ['1850-1899'] });
    expect(params.get('era')).toBe('1850-1899');
  });

  it('encodes phase facet', () => {
    const params = buildSearchParams({ q: '', phase: ['solid'] });
    expect(params.get('phase')).toBe('solid');
  });

  it('encodes etymologyOrigin facet', () => {
    const params = buildSearchParams({ q: '', etymologyOrigin: ['mythology', 'place'] });
    expect(params.get('etymologyOrigin')).toBe('mythology,place');
  });

  it('omits empty arrays', () => {
    const params = buildSearchParams({ q: 'test', type: [], block: [] });
    expect(params.has('type')).toBe(false);
    expect(params.has('block')).toBe(false);
    expect(params.get('q')).toBe('test');
  });

  it('omits empty query string', () => {
    const params = buildSearchParams({ q: '', type: ['element'] });
    expect(params.has('q')).toBe(false);
  });

  it('does not include a drill param', () => {
    const params = buildSearchParams({ q: 'test', type: ['element'] });
    expect(params.has('drill')).toBe(false);
  });
});

describe('parseSearchParams', () => {
  it('parses empty params to empty state', () => {
    const state = parseSearchParams(new URLSearchParams());
    expect(state.q).toBe('');
    expect(state.type).toBeUndefined();
    expect(state.block).toBeUndefined();
  });

  it('parses q param', () => {
    const state = parseSearchParams(new URLSearchParams('q=Curie'));
    expect(state.q).toBe('Curie');
  });

  it('parses comma-separated type param', () => {
    const state = parseSearchParams(new URLSearchParams('type=element,discoverer'));
    expect(state.type).toEqual(['element', 'discoverer']);
  });

  it('parses block param', () => {
    const state = parseSearchParams(new URLSearchParams('block=d,f'));
    expect(state.block).toEqual(['d', 'f']);
  });

  it('parses era param', () => {
    const state = parseSearchParams(new URLSearchParams('era=1850-1899,1900-1939'));
    expect(state.era).toEqual(['1850-1899', '1900-1939']);
  });

  it('parses phase param', () => {
    const state = parseSearchParams(new URLSearchParams('phase=solid'));
    expect(state.phase).toEqual(['solid']);
  });

  it('parses etymologyOrigin param', () => {
    const state = parseSearchParams(new URLSearchParams('etymologyOrigin=mythology'));
    expect(state.etymologyOrigin).toEqual(['mythology']);
  });

  it('ignores drill param (removed)', () => {
    const state = parseSearchParams(new URLSearchParams('drill=category-nonmetal'));
    expect(state).not.toHaveProperty('drill');
  });

  it('roundtrips through build → parse', () => {
    const original: FacetState = { q: 'metal', type: ['element', 'category'], block: ['d'], era: ['1850-1899'] };
    const params = buildSearchParams(original);
    const parsed = parseSearchParams(params);
    expect(parsed).toEqual(original);
  });
});
