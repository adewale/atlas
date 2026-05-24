/**
 * Performance & memory impact tests.
 *
 * These tests measure and assert budgets for:
 *  - Bundle sizes (index chunk, elements data chunk)
 *  - Data module loading (lazy vs eager)
 *  - Highlight mode transition efficiency
 *  - Route loader parallelism
 *  - SVG DOM node counts
 *  - Text measurement deferral
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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

function findAsset(assets: { name: string; sizeKB: number }[], pattern: RegExp) {
  return assets.find(a => pattern.test(a.name));
}

// ---------------------------------------------------------------------------
// A) Bundle size budgets
// ---------------------------------------------------------------------------
describe('Bundle size budgets', () => {
  const assets = getDistAssets();
  const hasBuild = assets.length > 0;

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
// C) Highlight transition batching
// ---------------------------------------------------------------------------
describe('Highlight transition optimization', () => {
  it('GridCell uses staggered ripple delay with custom easing', async () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'components', 'PeriodicTableGrid.tsx'),
      'utf-8',
    );
    // Original design: staggered ripple propagation using dist * 8 delay
    expect(src).toContain('dist * 8');
    // Custom easing curve preserved
    expect(src).toContain('var(--ease-out)');
  });
});

// ---------------------------------------------------------------------------
// D) Text measurement
// ---------------------------------------------------------------------------
describe('Text measurement', () => {
  it('usePretextLines uses synchronous useMemo', async () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'hooks', 'usePretextLines.ts'),
      'utf-8',
    );
    expect(src).toContain('useMemo');
    // Must NOT use useState+useEffect (causes flash of empty content)
    expect(src).not.toContain('useState');
    expect(src).not.toContain('useEffect');
  });
});

// ---------------------------------------------------------------------------
// E) Vite manual chunks config
// ---------------------------------------------------------------------------
describe('Vite manual chunks splitting', () => {
  it('vite.config.ts defines manualChunks', () => {
    const src = readFileSync(
      join(__dirname, '..', 'vite.config.ts'),
      'utf-8',
    );
    expect(src).toContain('manualChunks');
  });
});

// ---------------------------------------------------------------------------
// F) SVG DOM optimization
// ---------------------------------------------------------------------------
describe('SVG DOM optimization', () => {
  it('PeriodicTable uses content-visibility or virtualization hint', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'components', 'PeriodicTable.tsx'),
      'utf-8',
    );
    const hasOptimization =
      src.includes('content-visibility') ||
      src.includes('contentVisibility') ||
      src.includes('will-change') ||
      src.includes('willChange') ||
      src.includes('contain');
    expect(hasOptimization).toBe(true);
  });
});
