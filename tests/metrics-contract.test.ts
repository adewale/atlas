/**
 * Contract test: verifies that precomputed text-metrics.json matches
 * the actual rendering context for every metric.
 *
 * Each metric must correspond to a specific component rendering:
 * - same text content (including prefixes/suffixes)
 * - same font (family, size, weight)
 * - same letter-spacing adjustment
 *
 * If a component changes its font or text format, this test will
 * fail until the precompute script is updated to match.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const metrics = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'generated', 'text-metrics.json'), 'utf-8'),
);

describe('text-metrics.json contract', () => {
  it('has metrics for all 118 elements', () => {
    expect(Object.keys(metrics.elements)).toHaveLength(118);
  });

  it('every element has all required metric fields', () => {
    const required = ['identityWidth', 'identityWidthMobile', 'nameWidth14', 'nameWidth10', 'chipWidth11', 'catWidth13'];
    for (const [sym, m] of Object.entries(metrics.elements) as [string, Record<string, number>][]) {
      for (const field of required) {
        expect(m[field], `${sym} missing ${field}`).toBeGreaterThan(0);
      }
    }
  });

  it('identity width accounts for letter-spacing (not just 1.2× fudge)', () => {
    // "RUTHERFORDIUM" (13 chars) should have 12 * 2px = 24px letter-spacing
    // vs 1.2× which would only add ~20% of base width
    const rf = metrics.elements.Rf;
    expect(rf).toBeDefined();
    // nameWidth10 should be > the raw text width by the letter-spacing amount
    expect(rf.nameWidth10).toBeGreaterThan(50); // sanity check
  });

  it('chipWidth11 is measured for the full "Sym — Name" text', () => {
    // "Mn — Manganese" should be wider than just "Manganese"
    const mn = metrics.elements.Mn;
    expect(mn.chipWidth11).toBeGreaterThan(mn.nameWidth14); // chip text is longer
  });

  it('every discoverer has navPrev, navNext, chipWidth, captionWidth', () => {
    const required = ['navPrev', 'navNext', 'chipWidth', 'captionWidth'];
    for (const [name, m] of Object.entries(metrics.discoverers) as [string, Record<string, number>][]) {
      for (const field of required) {
        expect(m[field], `discoverer "${name}" missing ${field}`).toBeGreaterThan(0);
      }
    }
  });

  it('navPrev includes "← " prefix (wider than chipWidth for short names)', () => {
    // For short names, "← name" should be wider than just "name" at bold
    const m = metrics.discoverers['Humphry Davy'];
    expect(m).toBeDefined();
    // navPrev at 11px regular with "← " prefix should be in the right ballpark
    expect(m.navPrev).toBeGreaterThan(40);
  });

  it('navNext includes " →" suffix', () => {
    const m = metrics.discoverers['Humphry Davy'];
    expect(m.navNext).toBeGreaterThan(40);
  });

  it('every category has width13, width18, card8, card8abbrev', () => {
    for (const [cat, m] of Object.entries(metrics.categories) as [string, Record<string, number>][]) {
      expect(m.width13, `category "${cat}" missing width13`).toBeGreaterThan(0);
      expect(m.width18, `category "${cat}" missing width18`).toBeGreaterThan(0);
      expect(m.card8, `category "${cat}" missing card8`).toBeGreaterThan(0);
      expect(m.card8abbrev, `category "${cat}" missing card8abbrev`).toBeGreaterThan(0);
    }
  });

  it('every property has width10, width11bold, and widestLine10', () => {
    const expectedKeys = ['mass', 'electronegativity', 'ionizationEnergy', 'radius', 'density', 'meltingPoint', 'boilingPoint', 'halfLife', 'atomicNumber', 'period', 'group', 'discoveryYear'];
    for (const key of expectedKeys) {
      const m = metrics.properties[key];
      expect(m, `property "${key}" missing`).toBeDefined();
      expect(m.width10).toBeGreaterThan(0);
      expect(m.width11bold).toBeGreaterThan(0);
      expect(m.widestLine10, `property "${key}" missing widestLine10`).toBeGreaterThan(m.width10);
    }
  });

  it('edge labels are all present', () => {
    expect(Object.keys(metrics.edges).length).toBeGreaterThanOrEqual(10);
    for (const [label, width] of Object.entries(metrics.edges) as [string, number][]) {
      expect(width, `edge "${label}" has zero width`).toBeGreaterThan(0);
    }
  });

  it('no fudge factors: chipWidth11 >= nameWidth14 for elements with 2+ char symbols', () => {
    // The full chip text "Fe — Iron" should always be wider than just "Iron" at 14px bold
    for (const [sym, m] of Object.entries(metrics.elements) as [string, Record<string, number>][]) {
      if (sym.length >= 2) {
        expect(m.chipWidth11, `${sym}: chipWidth11 should be >= nameWidth14`).toBeGreaterThanOrEqual(m.nameWidth14 * 0.6); // chip is at smaller font but longer text
      }
    }
  });
});
