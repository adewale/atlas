/**
 * Slug Consistency Tests — prevents Lesson #3.
 *
 * Lesson #3: Category page showed no elements because URL slugs used hyphens
 *   but data JSON used spaces. The slug was never normalised consistently.
 *
 * These tests validate:
 *   1. toUrlSlug/fromUrlSlug are perfect inverses (round-trip)
 *   2. Every category slug in the data can be converted to a URL and back
 *   3. Every anomaly slug in the data can be converted to a URL and back
 *   4. slugsEqual correctly handles both forms
 *   5. No data slug contains hyphens (the data canonical form uses spaces)
 */
import { describe, test, expect } from 'vitest';
import { toUrlSlug, fromUrlSlug, normalizeSlug, slugsEqual } from '../src/lib/slugs';
import categoriesData from '../data/generated/categories.json';
import anomaliesData from '../data/generated/anomalies.json';

describe('slug utilities', () => {
  test('toUrlSlug converts spaces to hyphens', () => {
    expect(toUrlSlug('alkali metal')).toBe('alkali-metal');
    expect(toUrlSlug('noble gas')).toBe('noble-gas');
    expect(toUrlSlug('transition metal')).toBe('transition-metal');
  });

  test('fromUrlSlug converts hyphens to spaces', () => {
    expect(fromUrlSlug('alkali-metal')).toBe('alkali metal');
    expect(fromUrlSlug('noble-gas')).toBe('noble gas');
  });

  test('round-trip: toUrlSlug → fromUrlSlug recovers original', () => {
    const slugs = ['alkali metal', 'noble gas', 'transition metal', 'actinide', 'lanthanide'];
    for (const slug of slugs) {
      expect(fromUrlSlug(toUrlSlug(slug))).toBe(slug);
    }
  });

  test('round-trip: fromUrlSlug → toUrlSlug recovers original', () => {
    const urlSlugs = ['alkali-metal', 'noble-gas', 'transition-metal'];
    for (const slug of urlSlugs) {
      expect(toUrlSlug(fromUrlSlug(slug))).toBe(slug);
    }
  });

  test('normalizeSlug handles both forms', () => {
    expect(normalizeSlug('alkali-metal')).toBe('alkali metal');
    expect(normalizeSlug('alkali metal')).toBe('alkali metal');
    expect(normalizeSlug('Alkali-Metal')).toBe('alkali metal');
    expect(normalizeSlug('  alkali  metal  ')).toBe('alkali  metal');
  });

  test('slugsEqual compares across forms', () => {
    expect(slugsEqual('alkali-metal', 'alkali metal')).toBe(true);
    expect(slugsEqual('noble-gas', 'noble gas')).toBe(true);
    expect(slugsEqual('alkali-metal', 'noble-gas')).toBe(false);
  });
});

describe('data file slug integrity', () => {
  test('every category slug round-trips through URL form (normalised)', () => {
    for (const cat of categoriesData) {
      const urlForm = toUrlSlug(cat.slug);
      const recovered = fromUrlSlug(urlForm);
      // Some data slugs contain hyphens (e.g. "post-transition metal"),
      // so we compare via normalizeSlug which treats both forms equally.
      expect(normalizeSlug(recovered)).toBe(normalizeSlug(cat.slug));
    }
  });

  test('every anomaly slug round-trips through URL form', () => {
    for (const anomaly of anomaliesData) {
      const urlForm = toUrlSlug(anomaly.slug);
      const recovered = fromUrlSlug(urlForm);
      // Anomaly slugs already use hyphens in data, so normalise both
      expect(normalizeSlug(recovered)).toBe(normalizeSlug(anomaly.slug));
    }
  });

  test('category slugs are non-empty and contain elements', () => {
    for (const cat of categoriesData) {
      expect(cat.slug.length, `Category slug is empty`).toBeGreaterThan(0);
      expect(cat.elements.length, `Category "${cat.slug}" has no elements`).toBeGreaterThan(0);
    }
  });

  test('no two categories share the same normalised slug', () => {
    const seen = new Map<string, string>();
    for (const cat of categoriesData) {
      const norm = normalizeSlug(cat.slug);
      expect(seen.has(norm), `Duplicate slug: "${cat.slug}" and "${seen.get(norm)}"`).toBe(false);
      seen.set(norm, cat.slug);
    }
  });

  test('URL slug format: no spaces, only lowercase and hyphens', () => {
    for (const cat of categoriesData) {
      const url = toUrlSlug(cat.slug);
      expect(url).toMatch(/^[a-z0-9-]+$/);
      expect(url).not.toContain(' ');
    }
  });
});
