/**
 * Derived data integrity tests — ensures build-time generated files
 * have the expected shape and consistency.
 */
import { describe, it, expect } from 'vitest';
import entityIndex from '../data/generated/entity-index.json';
import gridElements from '../data/generated/grid-elements.json';
import folioFe from '../data/generated/folio-Fe.json';
import folioH from '../data/generated/folio-H.json';
import entityRefs from '../data/generated/entity-refs.json';
import entityRefLookup from '../data/generated/entity-ref-lookup.json';

describe('entity-index.json', () => {
  it('contains at least 200 entities', () => {
    expect(entityIndex.length).toBeGreaterThanOrEqual(200);
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

  it('contains all 5 result-worthy entity types', () => {
    const types = new Set(entityIndex.map((e: { type: string }) => e.type));
    expect(types).toContain('element');
    expect(types).toContain('anomaly');
    expect(types).toContain('discoverer');
    expect(types).toContain('era');
    expect(types).toContain('etymology');
    // Structural types (category, group, period, block) are facets, not results
    expect(types).not.toContain('category');
    expect(types).not.toContain('group');
    expect(types).not.toContain('period');
    expect(types).not.toContain('block');
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
    for (const a of folioH.anomalies as Array<{ slug: string; label: string; elementCount: number }>) {
      expect(a).toHaveProperty('slug');
      expect(a).toHaveProperty('label');
      expect(a).toHaveProperty('elementCount');
      expect(a.elementCount).toBeGreaterThan(0);
    }
  });
});

describe('entity-refs.json', () => {
  it('contains cross-references', () => {
    expect(entityRefs.length).toBeGreaterThan(500);
  });

  it('every ref has sourceId, targetId, relType', () => {
    for (const ref of entityRefs) {
      expect(ref.sourceId).toBeTruthy();
      expect(ref.targetId).toBeTruthy();
      expect(ref.relType).toBeTruthy();
    }
  });

  it('contains expected relationship types', () => {
    const types = new Set(entityRefs.map((r: { relType: string }) => r.relType));
    expect(types).toContain('discovered');
    expect(types).toContain('member_of');
    expect(types).toContain('belongs_to');
    expect(types).toContain('named_for');
    expect(types).toContain('exhibits');
    expect(types).toContain('active_during');
  });

  it('Fe has outgoing refs to group, period, block, category', () => {
    const feRefs = entityRefs.filter((r: { sourceId: string }) => r.sourceId === 'element-Fe');
    const targets = feRefs.map((r: { targetId: string }) => r.targetId);
    expect(targets).toContain('category-transition metal');
    expect(targets).toContain('group-8');
    expect(targets).toContain('period-4');
    expect(targets).toContain('block-d');
  });
});

describe('entity-ref-lookup.json', () => {
  const lookup = entityRefLookup as Record<string, { out: { id: string; rel: string }[]; in: { id: string; rel: string }[] }>;

  it('has entries for element-Fe', () => {
    expect(lookup['element-Fe']).toBeDefined();
    expect(lookup['element-Fe'].out.length).toBeGreaterThan(0);
    expect(lookup['element-Fe'].in.length).toBeGreaterThan(0);
  });

  it('Fe outgoing includes group-8', () => {
    const out = lookup['element-Fe'].out;
    expect(out.some((r) => r.id === 'group-8')).toBe(true);
  });

  it('group-1 has incoming refs from elements', () => {
    const entry = lookup['group-1'];
    expect(entry).toBeDefined();
    expect(entry.in.length).toBeGreaterThan(0);
    expect(entry.in.some((r) => r.id === 'element-H')).toBe(true);
  });
});
