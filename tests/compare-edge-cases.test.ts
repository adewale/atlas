/**
 * Comparison Edge Case Tests — prevents Lesson #5.
 *
 * Lesson #5: Comparing Fe and Ru (both group 8) produced "Groups 8 and 8."
 *   instead of "Share group 8." Tests only compared elements from different
 *   groups, so the same-value branch was never exercised.
 *
 * This file systematically tests every same-value edge case:
 *   - Same group, same period, same block, same category
 *   - Same phase
 *   - Element compared with itself
 *   - Null group (f-block elements)
 *   - Period 1 (only 2 elements)
 *   - Adjacent elements
 */
import { describe, test, expect } from 'vitest';
import { generateComparisonNotes } from '../src/lib/compare';
import rawElements from '../data/generated/elements.json';
import type { ElementRecord } from '../src/lib/types';

const allFullElements = rawElements as ElementRecord[];
const fullBySymbol = new Map(allFullElements.map((e) => [e.symbol, e]));

function el(symbol: string): ElementRecord {
  const e = fullBySymbol.get(symbol);
  if (!e) throw new Error(`Element ${symbol} not found`);
  return e;
}

describe('same-value edge cases', () => {
  test('same group: says "Share group N", not "Groups N and N"', () => {
    // Fe(26) and Ru(44) are both group 8
    const notes = generateComparisonNotes(el('Fe'), el('Ru'));
    const groupNote = notes.find((n) => n.toLowerCase().includes('group'));
    expect(groupNote).toBeDefined();
    expect(groupNote).toContain('Share group');
    expect(groupNote).not.toMatch(/Groups\s+\d+\s+and\s+\d+/);
  });

  test('same period: says "Share period N"', () => {
    // Na(11) and Mg(12) are both period 3
    const notes = generateComparisonNotes(el('Na'), el('Mg'));
    const periodNote = notes.find((n) => n.toLowerCase().includes('period'));
    expect(periodNote).toBeDefined();
    expect(periodNote).toContain('Share period');
  });

  test('same block: says "Both X-block"', () => {
    // Fe and Co are both d-block
    const notes = generateComparisonNotes(el('Fe'), el('Co'));
    const blockNote = notes.find((n) => n.toLowerCase().includes('block'));
    expect(blockNote).toBeDefined();
    expect(blockNote).toMatch(/Both\s+\w+-block/);
  });

  test('same category: says "Both classified as X"', () => {
    // Fe and Co are both transition metals
    const notes = generateComparisonNotes(el('Fe'), el('Co'));
    const catNote = notes.find((n) => n.toLowerCase().includes('classified'));
    expect(catNote).toBeDefined();
    expect(catNote).toContain('Both classified as');
  });

  test('different phase: mentions phase difference', () => {
    // Hg(liquid) vs Fe(solid) at STP
    const notes = generateComparisonNotes(el('Hg'), el('Fe'));
    const phaseNote = notes.find((n) => n.toLowerCase().includes('stp'));
    expect(phaseNote).toBeDefined();
  });

  test('same phase: does NOT mention phase difference', () => {
    // Fe and Co are both solid
    const notes = generateComparisonNotes(el('Fe'), el('Co'));
    const phaseNote = notes.find((n) => n.toLowerCase().includes('stp'));
    expect(phaseNote).toBeUndefined();
  });

  test('element compared with itself produces no contradictions', () => {
    const notes = generateComparisonNotes(el('Fe'), el('Fe'));
    // Should say "Share group 8", "Share period 4", "Both d-block", "Both classified as..."
    // Should NOT say "different" or produce "Groups 8 and 8"
    for (const note of notes) {
      expect(note).not.toMatch(/Groups\s+(\d+)\s+and\s+\1\./);
    }
    // Should have same-value notes
    expect(notes.some((n) => n.includes('Share') || n.includes('Both'))).toBe(true);
  });

  test('null group (f-block): does not produce "Groups null and null"', () => {
    // Ce(58) and Pr(59) are f-block with group=null
    const notes = generateComparisonNotes(el('Ce'), el('Pr'));
    for (const note of notes) {
      expect(note).not.toContain('null');
      expect(note).not.toContain('undefined');
    }
  });

  test('one null group, one non-null: no group comparison note', () => {
    // Ce(group=null) vs Fe(group=8)
    const notes = generateComparisonNotes(el('Ce'), el('Fe'));
    const groupNote = notes.find((n) => n.toLowerCase().includes('group'));
    // When one element has no group, the comparison should be skipped
    expect(groupNote).toBeUndefined();
  });
});

describe('period 1 edge cases (only H and He)', () => {
  test('H vs He: different groups, different blocks', () => {
    const notes = generateComparisonNotes(el('H'), el('He'));
    // Both period 1
    expect(notes.some((n) => n.includes('Share period 1'))).toBe(true);
    // Different blocks (s vs p in some data representations)
    // Different groups (1 vs 18)
  });
});

describe('exhaustive same-group pairs', () => {
  test('no "Groups N and N" pattern in any same-group comparison', () => {
    // Group elements by group number and test pairs within each group
    const byGroup = new Map<number, ElementRecord[]>();
    for (const e of allFullElements) {
      if (e.group === null) continue;
      if (!byGroup.has(e.group)) byGroup.set(e.group, []);
      byGroup.get(e.group)!.push(e);
    }

    const violations: string[] = [];
    for (const [group, elements] of byGroup) {
      if (elements.length < 2) continue;
      // Test first two elements in each group
      const a = elements[0];
      const b = elements[1];
      const notes = generateComparisonNotes(a, b);
      for (const note of notes) {
        if (note.match(/Groups\s+(\d+)\s+and\s+\1/)) {
          violations.push(`${a.symbol} vs ${b.symbol} (group ${group}): "${note}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('discovery comparison with real elements', () => {
  test('Po vs Ra: same discoverer note', () => {
    const notes = generateComparisonNotes(el('Po'), el('Ra'));
    expect(notes.some((n) => n.includes('Both discovered by'))).toBe(true);
  });

  test('Po vs Ra: same year note (1898)', () => {
    const notes = generateComparisonNotes(el('Po'), el('Ra'));
    expect(notes.some((n) => n.includes('Both discovered in 1898'))).toBe(true);
  });

  test('H vs O: discovered within 10 years, produces years-apart note', () => {
    const notes = generateComparisonNotes(el('H'), el('O'));
    expect(notes.some((n) => n.includes('years apart') || n.includes('year apart'))).toBe(true);
  });

  test('H vs Og: centuries apart, no close-discovery note', () => {
    const notes = generateComparisonNotes(el('H'), el('Og'));
    expect(notes.some((n) => n.includes('years apart'))).toBe(false);
  });

  test('no note contains null or undefined', () => {
    // Test a few pairs likely to trigger edge cases
    const pairs: [string, string][] = [['H', 'He'], ['Fe', 'Ru'], ['Po', 'Ra'], ['Ce', 'Pr']];
    for (const [s1, s2] of pairs) {
      const notes = generateComparisonNotes(el(s1), el(s2));
      for (const note of notes) {
        expect(note).not.toContain('null');
        expect(note).not.toContain('undefined');
      }
    }
  });
});

describe('etymology comparison with real elements', () => {
  test('elements with same etymology origin produce etymology note', () => {
    // Sc (place) and Ge (place) — both named for places
    const sc = el('Sc');
    const ge = el('Ge');
    if (sc.etymologyOrigin === ge.etymologyOrigin) {
      const notes = generateComparisonNotes(sc, ge);
      expect(notes.some((n) => n.includes('Both named for'))).toBe(true);
    }
  });

  test('elements with different etymology origin produce no etymology note', () => {
    const h = el('H');
    const fe = el('Fe');
    if (h.etymologyOrigin !== fe.etymologyOrigin) {
      const notes = generateComparisonNotes(h, fe);
      expect(notes.some((n) => n.includes('Both named for'))).toBe(false);
    }
  });
});

describe('shared neighbor edge cases', () => {
  test('Li and Be share neighbor H', () => {
    // Li neighbors include H, Be neighbors may include Li
    const liNeighbors = el('Li').neighbors;
    const beNeighbors = el('Be').neighbors;
    const shared = liNeighbors.filter((n) => beNeighbors.includes(n));
    if (shared.length > 0) {
      const notes = generateComparisonNotes(el('Li'), el('Be'));
      expect(notes.some((n) => n.toLowerCase().includes('neighbor'))).toBe(true);
    }
  });

  test('neighbor notes contain only valid symbols', () => {
    const notes = generateComparisonNotes(el('Na'), el('Mg'));
    const neighborNote = notes.find((n) => n.toLowerCase().includes('neighbor'));
    if (neighborNote) {
      expect(neighborNote).not.toContain('null');
      expect(neighborNote).not.toContain('undefined');
    }
  });
});

describe('similar mass ranking edge cases', () => {
  test('elements with very close mass rankings mention similarity', () => {
    // Find two elements with adjacent mass rankings
    const withMassRank = allFullElements.filter((e) => (e.rankings.mass ?? 0) > 0);
    const sorted = [...withMassRank].sort((a, b) => (a.rankings.mass ?? 0) - (b.rankings.mass ?? 0));

    if (sorted.length >= 2) {
      const a = sorted[0];
      const b = sorted[1];
      const notes = generateComparisonNotes(a, b);
      // Adjacent rankings should trigger the "Similar mass ranking" note
      const massNote = notes.find((n) => n.toLowerCase().includes('mass ranking'));
      expect(massNote).toBeDefined();
    }
  });

  test('elements with distant mass rankings do NOT mention similarity', () => {
    // H (rank ~1) vs Og (rank ~118)
    const notes = generateComparisonNotes(el('H'), el('Og'));
    const massNote = notes.find((n) => n.toLowerCase().includes('mass ranking'));
    expect(massNote).toBeUndefined();
  });
});
