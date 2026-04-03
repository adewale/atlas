/**
 * Derived data integrity tests — ensures build-time generated files
 * have the expected shape and consistency.
 */
import { describe, it, expect } from 'vitest';
import entityIndex from '../data/generated/entity-index.json';
import gridElements from '../data/generated/grid-elements.json';
import folioFe from '../data/generated/folio-Fe.json';
import folioH from '../data/generated/folio-H.json';

describe('entity-index.json', () => {
  it('contains at least 250 entities', () => {
    expect(entityIndex.length).toBeGreaterThanOrEqual(250);
  });

  it('every entity has required fields', () => {
    for (const e of entityIndex) {
      expect(e.id).toBeTruthy();
      expect(e.type).toBeTruthy();
      expect(e.name).toBeTruthy();
      expect(typeof e.description).toBe('string');
      expect(e.colour).toMatch(/^#/);
      expect(Array.isArray(e.elements)).toBe(true);
    }
  });

  it('contains all 9 entity types', () => {
    const types = new Set(entityIndex.map((e: { type: string }) => e.type));
    expect(types).toContain('element');
    expect(types).toContain('category');
    expect(types).toContain('group');
    expect(types).toContain('period');
    expect(types).toContain('block');
    expect(types).toContain('anomaly');
    expect(types).toContain('discoverer');
    expect(types).toContain('era');
    expect(types).toContain('etymology');
  });

  it('contains exactly 118 element entities', () => {
    const elements = entityIndex.filter((e: { type: string }) => e.type === 'element');
    expect(elements).toHaveLength(118);
  });

  it('element entities have correct href pattern', () => {
    const h = entityIndex.find((e: { id: string }) => e.id === 'element-H');
    expect(h).toBeDefined();
    expect(h!.href).toBe('/elements/H');
  });
});

describe('grid-elements.json', () => {
  it('contains 118 elements', () => {
    expect(gridElements).toHaveLength(118);
  });

  it('every element has grid-required fields', () => {
    for (const e of gridElements) {
      expect(e.atomicNumber).toBeGreaterThan(0);
      expect(e.symbol).toBeTruthy();
      expect(e.name).toBeTruthy();
      expect(['s', 'p', 'd', 'f']).toContain(e.block);
      expect(e.period).toBeGreaterThan(0);
    }
  });

  it('does NOT include summary or sources (stripped for size)', () => {
    for (const e of gridElements as any[]) {
      expect(e.summary).toBeUndefined();
      expect(e.sources).toBeUndefined();
      expect(e.rankings).toBeUndefined();
      expect(e.discoverer).toBeUndefined();
    }
  });
});

describe('folio bundles', () => {
  it('Fe bundle has pre-resolved navigation', () => {
    expect(folioFe.element.symbol).toBe('Fe');
    expect(folioFe.nav.nextInGroup).toEqual({ symbol: 'Ru', name: 'Ruthenium' });
    expect(folioFe.nav.prevInPeriod).toEqual({ symbol: 'Mn', name: 'Manganese' });
    expect(folioFe.nav.nextInPeriod).toEqual({ symbol: 'Co', name: 'Cobalt' });
  });

  it('Fe bundle has resolved neighbors', () => {
    expect(folioFe.neighbors).toHaveLength(2);
    expect(folioFe.neighbors[0].symbol).toBe('Mn');
    expect(folioFe.neighbors[0].block).toBe('d');
  });

  it('Fe bundle has group phase data', () => {
    expect(folioFe.groupPhases).toHaveLength(4); // Group 8: Fe, Ru, Os, Hs
    expect(folioFe.group!.elements).toEqual(['Fe', 'Ru', 'Os', 'Hs']);
  });

  it('Fe bundle has sameEtymology links', () => {
    // Fe has etymologyOrigin: "property"
    expect(folioFe.sameEtymology.length).toBeGreaterThan(0);
    expect(folioFe.sameEtymology[0]).toHaveProperty('symbol');
    expect(folioFe.sameEtymology[0]).toHaveProperty('name');
    expect(folioFe.sameEtymology[0]).toHaveProperty('block');
  });

  it('H bundle has sources included', () => {
    expect(folioH.element.sources).toBeDefined();
    expect(folioH.element.sources!.summary.provider).toBe('Wikipedia');
  });

  it('bundle anomalies include elementCount', () => {
    // H may or may not have anomalies, but the shape should be correct
    for (const a of folioH.anomalies) {
      expect(a).toHaveProperty('slug');
      expect(a).toHaveProperty('label');
      expect(a).toHaveProperty('elementCount');
      expect(a.elementCount).toBeGreaterThan(0);
    }
  });
});
