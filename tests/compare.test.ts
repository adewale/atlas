import { describe, it, expect } from 'vitest';
import { generateComparisonNotes } from '../src/lib/compare';
import type { ElementRecord } from '../src/lib/types';

function makeElement(overrides: Partial<ElementRecord>): ElementRecord {
  return {
    atomicNumber: 1,
    symbol: 'X',
    name: 'Test',
    wikidataId: 'Q1',
    wikipediaTitle: 'Test',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Test',
    period: 1,
    group: 1,
    block: 's',
    category: 'nonmetal',
    phase: 'gas',
    mass: 1,
    electronegativity: 2.2,
    ionizationEnergy: 13.6,
    radius: 120,
    summary: 'Test element.',
    neighbors: [],
    rankings: { mass: 118, electronegativity: 17, ionizationEnergy: 8, radius: 99 },
    ...overrides,
  };
}

describe('generateComparisonNotes', () => {
  it('same-block elements produce "Both {block}-block" note', () => {
    const a = makeElement({ symbol: 'A', block: 'd' });
    const b = makeElement({ symbol: 'B', block: 'd' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both d-block elements.');
  });

  it('different-block elements do not produce block note', () => {
    const a = makeElement({ block: 's' });
    const b = makeElement({ block: 'p' });
    const notes = generateComparisonNotes(a, b);
    expect(notes.some((n) => n.includes('-block elements'))).toBe(false);
  });

  it('same-period elements produce "Share period" note', () => {
    const a = makeElement({ period: 4 });
    const b = makeElement({ period: 4 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Share period 4.');
  });

  it('same-category elements produce "Both classified as" note', () => {
    const a = makeElement({ category: 'noble gas' });
    const b = makeElement({ category: 'noble gas' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both classified as noble gas.');
  });

  it('different-phase elements produce phase comparison', () => {
    const a = makeElement({ name: 'Iron', phase: 'solid' });
    const b = makeElement({ name: 'Mercury', phase: 'liquid' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Iron is solid; Mercury is liquid at STP.');
  });

  it('both having groups produces "Groups X and Y" note', () => {
    const a = makeElement({ group: 1 });
    const b = makeElement({ group: 18 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Groups 1 and 18.');
  });

  it('handles null group — does not produce groups note', () => {
    const a = makeElement({ group: null });
    const b = makeElement({ group: 8 });
    const notes = generateComparisonNotes(a, b);
    expect(notes.some((n) => n.startsWith('Groups'))).toBe(false);
  });

  it('similar mass ranking produces ranking note', () => {
    const a = makeElement({ rankings: { mass: 50 } });
    const b = makeElement({ rankings: { mass: 53 } });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Similar mass ranking (50 vs 53 of 118).');
  });

  it('dissimilar mass ranking does not produce ranking note', () => {
    const a = makeElement({ rankings: { mass: 1 } });
    const b = makeElement({ rankings: { mass: 100 } });
    const notes = generateComparisonNotes(a, b);
    expect(notes.some((n) => n.includes('Similar mass'))).toBe(false);
  });

  it('all-different elements produce longer note (more templates)', () => {
    const a = makeElement({
      name: 'Hydrogen',
      block: 's',
      period: 1,
      group: 1,
      category: 'nonmetal',
      phase: 'gas',
      rankings: { mass: 118 },
    });
    const b = makeElement({
      name: 'Iron',
      block: 'd',
      period: 4,
      group: 8,
      category: 'transition metal',
      phase: 'solid',
      rankings: { mass: 50 },
    });
    const notes = generateComparisonNotes(a, b);
    // Should have at least phase difference + groups note
    expect(notes.length).toBeGreaterThanOrEqual(2);
    expect(notes.some((n) => n.includes('at STP'))).toBe(true);
    expect(notes.some((n) => n.startsWith('Groups'))).toBe(true);
  });

  it('same-everything elements produce maximum notes', () => {
    const a = makeElement({ rankings: { mass: 50 } });
    const b = makeElement({ rankings: { mass: 50 } });
    const notes = generateComparisonNotes(a, b);
    // block, period, category, groups, mass ranking all match. Phase is same so no phase note.
    expect(notes.length).toBeGreaterThanOrEqual(4);
  });
});
