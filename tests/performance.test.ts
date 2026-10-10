/**
 * Performance & memory impact tests.
 *
 * These tests measure and assert budgets for:
 *  - Bundle sizes (index chunk, elements data chunk)
 *  - Data module loading (lazy vs eager)
 *  - Text measurement deferral
 *
 * The dist/ checks skip when there is no build, so a plain local `npm test`
 * works before `npm run build`. CI runs this file only through
 * `npm run lint:budgets`, after the build; in that lane a missing build fails.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { usePretextLines } from '../src/hooks/usePretextLines';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDistAssets(): { name: string; sizeKB: number }[] {
  const distDir = join(__dirname, '..', 'dist', 'assets');
  try {
    return readdirSync(distDir)
      .filter(f => f.endsWith('.js'))
      .map(f => ({
        name: f,
        sizeKB: statSync(join(distDir, f)).size / 1024,
      }));
  } catch {
    return [];
  }
}

const BUDGETS_LANE = process.env.npm_lifecycle_event === 'lint:budgets';

function findAsset(assets: { name: string; sizeKB: number }[], pattern: RegExp) {
  return assets.find(a => pattern.test(a.name));
}

// ---------------------------------------------------------------------------
// A) Bundle size budgets
// ---------------------------------------------------------------------------
describe('Bundle size budgets', () => {
  const assets = getDistAssets();
  const hasBuild = assets.length > 0;

  it.runIf(BUDGETS_LANE)('npm run lint:budgets has a dist/ build to measure', () => {
    expect(hasBuild, 'run `npm run build` before `npm run lint:budgets`').toBe(true);
  });

  it.skipIf(!hasBuild)('index bundle is under 400 KB', () => {
    const index = findAsset(assets, /^index-/);
    expect(index).toBeDefined();
    expect(index!.sizeKB).toBeLessThan(400);
  });

  it.skipIf(!hasBuild)('pretext chunk is split out from index', () => {
    const pretext = findAsset(assets, /pretext/i);
    expect(pretext).toBeDefined();
  });

  it.skipIf(!hasBuild)('react-router chunk is split out from index', () => {
    const router = findAsset(assets, /react-router|router/i);
    expect(router).toBeDefined();
  });

  it.skipIf(!hasBuild)('elements data is included in index bundle (statically imported)', () => {
    const index = findAsset(assets, /^index-/);
    expect(index).toBeDefined();
    expect(index!.sizeKB).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// A2) Lighthouse CI performance budgets
// ---------------------------------------------------------------------------
//
// Mirrors the resource-size budgets declared in lighthouse-budgets.json so
// that local builds catch regressions before they reach CI.  The Lighthouse
// schema expresses budgets in KiB, so we read the file and convert.
//
// Update lighthouse-budgets.json (and rerun `npm run build`) to relax limits.
describe('Lighthouse CI budgets', () => {
  const assets = getDistAssets();
  const hasBuild = assets.length > 0;

  type ResourceBudget = { resourceType: string; budget: number };
  type Budget = { path: string; resourceSizes?: ResourceBudget[]; resourceCounts?: ResourceBudget[] };

  function loadBudgets(): Budget[] | null {
    const path = join(__dirname, '..', 'lighthouse-budgets.json');
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as Budget[];
    } catch {
      return null;
    }
  }

  function getBudget(type: string, kind: 'resourceSizes' | 'resourceCounts'): number | null {
    const budgets = loadBudgets();
    const entry = budgets?.[0]?.[kind]?.find((b) => b.resourceType === type);
    return entry?.budget ?? null;
  }

  /**
   * Initial-load chunks: scripts referenced directly from dist/index.html
   * (the index entry plus its preloaded modules). Per-element and per-page
   * chunks are excluded from these budgets because they're lazily fetched.
   */
  function getInitialAssets(): { name: string; sizeKB: number }[] {
    const html = readFileSync(join(__dirname, '..', 'dist', 'index.html'), 'utf-8');
    const referenced = new Set<string>();
    for (const match of html.matchAll(/(?:href|src)=["']\/assets\/([^"']+\.js)["']/g)) {
      referenced.add(match[1]);
    }
    return assets.filter((a) => referenced.has(a.name));
  }

  function initialScriptKB(): number {
    return getInitialAssets().reduce((sum, a) => sum + a.sizeKB, 0);
  }

  it('lighthouse-budgets.json exists and parses as JSON', () => {
    const budgets = loadBudgets();
    expect(budgets).not.toBeNull();
    expect(budgets!.length).toBeGreaterThan(0);
  });

  it.skipIf(!hasBuild)('initial script payload is under the script size budget', () => {
    const limit = getBudget('script', 'resourceSizes');
    expect(limit).not.toBeNull();
    const total = initialScriptKB();
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(limit!);
  });

  it.skipIf(!hasBuild)('initial script chunk count is under the script-count budget', () => {
    const limit = getBudget('script', 'resourceCounts');
    expect(limit).not.toBeNull();
    const initial = getInitialAssets();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial.length).toBeLessThan(limit!);
  });

  it.skipIf(!hasBuild)('no third-party scripts are bundled', () => {
    // Vite hashes asset filenames; any asset originating from node_modules ends
    // up in the same dist/assets folder. We use the absence of CDN-injected
    // tags in dist/index.html as the third-party signal.
    const html = readFileSync(join(__dirname, '..', 'dist', 'index.html'), 'utf-8');
    const hasThirdParty = /<script[^>]+src=["']https?:\/\//.test(html);
    expect(hasThirdParty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// B) Data module — lazy loading architecture
// ---------------------------------------------------------------------------
describe('Data module', () => {
  it('allElements is available synchronously', async () => {
    const { allElements } = await import('../src/lib/data');
    expect(allElements).toHaveLength(118);
  });

  it('getElement works', async () => {
    const { getElement } = await import('../src/lib/data');
    const fe = getElement('Fe');
    expect(fe).toBeDefined();
    expect(fe!.name).toBe('Iron');
  });

  it('searchElements works', async () => {
    const { searchElements } = await import('../src/lib/data');
    const results = searchElements('Iron');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toBe('Fe');
  });
});

// ---------------------------------------------------------------------------
// C) Text measurement
// ---------------------------------------------------------------------------
// The highlight ripple and table containment are asserted on rendered
// components in tests/components/PeriodicTableGrid.test.tsx and
// PeriodicTable.test.tsx; chunk splitting is asserted on dist/ above.
describe('Text measurement', () => {
  it('usePretextLines returns measured lines on the first render (no empty flash)', () => {
    const firstRenderLineCounts: number[] = [];
    renderHook(() => {
      const result = usePretextLines({
        text: 'Iron is a chemical element with symbol Fe and atomic number twenty-six.',
        maxWidth: 120,
      });
      firstRenderLineCounts.push(result.lines.length);
      return result;
    });
    expect(firstRenderLineCounts[0]).toBeGreaterThan(1);
  });
});
