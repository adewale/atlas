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
    density: 0.09,
    meltingPoint: 14,
    boilingPoint: 20,
    halfLife: null,
    discoveryYear: null,
    discoverer: 'Unknown',
    etymologyOrigin: 'unknown',
    etymologyDescription: '',
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
    expect(notes).not.toContain('Both s-block elements.');
    expect(notes).not.toContain('Both p-block elements.');
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
    expect(notes.join(' ')).not.toContain('Similar mass');
  });

  it('all-different elements produce phase and groups notes', () => {
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
    expect(notes).toContain('Hydrogen is gas; Iron is solid at STP.');
    expect(notes).toContain('Groups 1 and 8.');
    // block, period, category all differ so those notes should be absent
    expect(notes.join(' ')).not.toContain('-block elements');
    expect(notes.join(' ')).not.toContain('Share period');
    expect(notes.join(' ')).not.toContain('Both classified as');
  });

  it('same-everything elements produce exact expected notes', () => {
    const a = makeElement({ rankings: { mass: 50 } });
    const b = makeElement({ rankings: { mass: 50 } });
    const notes = generateComparisonNotes(a, b);
    // block, period, category, groups, mass ranking, discoverer, etymology all match.
    // Phase is same so no phase note. Neighbors are empty so no neighbor note.
    expect(notes).toEqual([
      'Both s-block elements.',
      'Share period 1.',
      'Both classified as nonmetal.',
      'Share group 1.',
      'Similar mass ranking (50 vs 50 of 118).',
      'Both discovered by Unknown.',
      'Both named for an unknown.',
    ]);
  });

  it('same-phase elements do not produce phase note', () => {
    const a = makeElement({ name: 'Alpha', phase: 'solid' });
    const b = makeElement({ name: 'Beta', phase: 'solid' });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('at STP');
  });

  it('same-group elements produce "Share group" note', () => {
    const a = makeElement({ group: 8 });
    const b = makeElement({ group: 8 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Share group 8.');
  });

  it('mass ranking boundary: diff of 5 is similar', () => {
    const a = makeElement({ rankings: { mass: 50 } });
    const b = makeElement({ rankings: { mass: 55 } });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Similar mass ranking (50 vs 55 of 118).');
  });

  it('mass ranking boundary: diff of 6 is not similar', () => {
    const a = makeElement({ rankings: { mass: 50 } });
    const b = makeElement({ rankings: { mass: 56 } });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('Similar mass');
  });

  // --- Discovery: same discoverer ---

  it('same discoverer produces "Both discovered by" note', () => {
    const a = makeElement({ discoverer: 'Marie Curie' });
    const b = makeElement({ discoverer: 'Marie Curie' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both discovered by Marie Curie.');
  });

  it('different discoverers do not produce shared discoverer note', () => {
    const a = makeElement({ discoverer: 'Marie Curie' });
    const b = makeElement({ discoverer: 'Henry Cavendish' });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('Both discovered by');
  });

  // --- Discovery: year proximity ---

  it('same discovery year produces "Both discovered in" note', () => {
    const a = makeElement({ discoveryYear: 1898 });
    const b = makeElement({ discoveryYear: 1898 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both discovered in 1898.');
  });

  it('close discovery years (<=10) produce "years apart" note', () => {
    const a = makeElement({ name: 'Alpha', discoveryYear: 1766 });
    const b = makeElement({ name: 'Beta', discoveryYear: 1774 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Discovered 8 years apart — Alpha in 1766, Beta in 1774.');
  });

  it('1-year gap uses singular "year apart"', () => {
    const a = makeElement({ name: 'Aa', discoveryYear: 1800 });
    const b = makeElement({ name: 'Bb', discoveryYear: 1801 });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Discovered 1 year apart — Aa in 1800, Bb in 1801.');
  });

  it('distant discovery years do not produce years-apart note', () => {
    const a = makeElement({ discoveryYear: 1766 });
    const b = makeElement({ discoveryYear: 1898 });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('years apart');
    expect(notes.join(' ')).not.toContain('year apart');
  });

  it('null discovery years do not produce discovery year note', () => {
    const a = makeElement({ discoveryYear: null });
    const b = makeElement({ discoveryYear: 1898 });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('discovered in');
    expect(notes.join(' ')).not.toContain('years apart');
  });

  // --- Etymology ---

  it('same etymology origin "place" produces named-for note', () => {
    const a = makeElement({ etymologyOrigin: 'place' });
    const b = makeElement({ etymologyOrigin: 'place' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for a place.');
  });

  it('same etymology origin "person" produces "a person"', () => {
    const a = makeElement({ etymologyOrigin: 'person' });
    const b = makeElement({ etymologyOrigin: 'person' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for a person.');
  });

  it('same etymology origin "astronomical" produces "an astronomical body"', () => {
    const a = makeElement({ etymologyOrigin: 'astronomical' });
    const b = makeElement({ etymologyOrigin: 'astronomical' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for an astronomical body.');
  });

  it('same etymology origin "property" produces "a property"', () => {
    const a = makeElement({ etymologyOrigin: 'property' });
    const b = makeElement({ etymologyOrigin: 'property' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for a property.');
  });

  it('same etymology origin "mythological" produces "a mythological reference"', () => {
    const a = makeElement({ etymologyOrigin: 'mythological' });
    const b = makeElement({ etymologyOrigin: 'mythological' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for a mythological reference.');
  });

  it('vowel-initial etymology origin uses "an"', () => {
    const a = makeElement({ etymologyOrigin: 'obscure' });
    const b = makeElement({ etymologyOrigin: 'obscure' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both named for an obscure.');
  });

  it('different etymology origins do not produce etymology note', () => {
    const a = makeElement({ etymologyOrigin: 'place' });
    const b = makeElement({ etymologyOrigin: 'person' });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('Both named for');
  });

  // --- Shared neighbors ---

  it('one shared neighbor produces singular note', () => {
    const a = makeElement({ neighbors: ['He', 'Li'] });
    const b = makeElement({ neighbors: ['He', 'Be'] });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Share a neighbor: He.');
  });

  it('multiple shared neighbors lists all', () => {
    const a = makeElement({ neighbors: ['He', 'Li', 'Be'] });
    const b = makeElement({ neighbors: ['He', 'Be', 'Na'] });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Share neighbors: He, Be.');
  });

  it('no shared neighbors produces no neighbor note', () => {
    const a = makeElement({ neighbors: ['He'] });
    const b = makeElement({ neighbors: ['Na'] });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('neighbor');
  });

  it('empty neighbors produces no neighbor note', () => {
    const a = makeElement({ neighbors: [] });
    const b = makeElement({ neighbors: ['Na'] });
    const notes = generateComparisonNotes(a, b);
    expect(notes.join(' ')).not.toContain('neighbor');
  });

  // --- Same-everything now includes new notes ---

  it('same-everything elements include discoverer and etymology notes', () => {
    const a = makeElement({ rankings: { mass: 50 }, discoverer: 'X', etymologyOrigin: 'place' });
    const b = makeElement({ rankings: { mass: 50 }, discoverer: 'X', etymologyOrigin: 'place' });
    const notes = generateComparisonNotes(a, b);
    expect(notes).toContain('Both discovered by X.');
    expect(notes).toContain('Both named for a place.');
  });
});
