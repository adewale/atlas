import { describe, it, expect } from 'vitest';
import { allElements } from '../src/lib/data';
import type { ElementRecord } from '../src/lib/types';

// Load all per-element JSON files to check sources
async function loadElementFile(symbol: string): Promise<ElementRecord> {
  const mod = await import(`../data/generated/element-${symbol}.json`);
  return mod.default as ElementRecord;
}

describe('Licensing: per-element sources', () => {
  it('every per-element JSON has a sources field', async () => {
    for (const { symbol } of allElements) {
      const el = await loadElementFile(symbol);
      expect(el.sources, `${symbol} missing sources`).toBeDefined();
      expect(el.sources!.structured, `${symbol} missing sources.structured`).toBeDefined();
      expect(el.sources!.identifiers, `${symbol} missing sources.identifiers`).toBeDefined();
      expect(el.sources!.summary, `${symbol} missing sources.summary`).toBeDefined();
    }
  });

  it('all 118 elements have sources.summary.license === "CC BY-SA 4.0"', async () => {
    for (const { symbol } of allElements) {
      const el = await loadElementFile(symbol);
      expect(el.sources!.summary.license, `${symbol} summary license`).toBe('CC BY-SA 4.0');
    }
  });

  it('all 118 elements have sources.identifiers.license === "CC0 1.0"', async () => {
    for (const { symbol } of allElements) {
      const el = await loadElementFile(symbol);
      expect(el.sources!.identifiers.license, `${symbol} identifiers license`).toBe('CC0 1.0');
    }
  });

  it('all sources.summary.accessDate is a valid ISO date in reasonable range', async () => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const earliestAllowed = new Date('2000-01-01T00:00:00.000Z');
    const today = new Date();
    const currentYear = new Date().getUTCFullYear();
    for (const { symbol } of allElements) {
      const el = await loadElementFile(symbol);
      const date = el.sources!.summary.accessDate!;
      expect(date, `${symbol} accessDate format`).toMatch(isoDateRegex);
      const parsed = new Date(date);
      expect(parsed.getTime(), `${symbol} accessDate parse`).not.toBeNaN();
      expect(parsed.getTime(), `${symbol} accessDate not too old`).toBeGreaterThanOrEqual(
        earliestAllowed.getTime(),
      );
      expect(parsed.getTime(), `${symbol} accessDate not in the future`).toBeLessThanOrEqual(
        today.getTime(),
      );
      const year = parsed.getFullYear();
      expect(year, `${symbol} accessDate year`).toBeLessThanOrEqual(currentYear);
    }
  });

  it('sources.structured.provider is PubChem', async () => {
    const el = await loadElementFile('Fe');
    expect(el.sources!.structured.provider).toBe('PubChem');
    expect(el.sources!.structured.license).toBe('public domain');
  });

  it('sources.identifiers.provider is Wikidata with CC0', async () => {
    const el = await loadElementFile('Fe');
    expect(el.sources!.identifiers.provider).toBe('Wikidata');
    expect(el.sources!.identifiers.license).toBe('CC0 1.0');
  });

  it('all 118 elements exist in the dataset', () => {
    expect(allElements.length).toBe(118);
  });
});
