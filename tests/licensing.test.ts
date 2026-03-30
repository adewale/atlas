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
    // Test a sample of elements to keep test fast
    const sample = ['H', 'He', 'Li', 'C', 'N', 'O', 'Fe', 'Au', 'U', 'Og'];
    for (const sym of sample) {
      const el = await loadElementFile(sym);
      expect(el.sources).toBeDefined();
      expect(el.sources!.structured).toBeDefined();
      expect(el.sources!.identifiers).toBeDefined();
      expect(el.sources!.summary).toBeDefined();
    }
  });

  it('all sources.summary.license === "CC BY-SA 4.0"', async () => {
    const sample = ['H', 'Fe', 'Au', 'Og', 'Na', 'Cl'];
    for (const sym of sample) {
      const el = await loadElementFile(sym);
      expect(el.sources!.summary.license).toBe('CC BY-SA 4.0');
    }
  });

  it('all sources.summary.accessDate is a valid ISO date', async () => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const sample = ['H', 'Fe', 'Au', 'Og', 'Ca', 'Si'];
    for (const sym of sample) {
      const el = await loadElementFile(sym);
      const date = el.sources!.summary.accessDate!;
      expect(date).toMatch(isoDateRegex);
      // Verify it parses as a valid date
      const parsed = new Date(date);
      expect(parsed.getTime()).not.toBeNaN();
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
