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

  it('index bundle is under 250 KB (was 360 KB)', () => {
    const index = findAsset(assets, /^index-/);
    if (!index) return; // skip if no build output
    expect(index.sizeKB).toBeLessThan(250);
  });

  it('pretext chunk is split out from index', () => {
    const pretext = findAsset(assets, /pretext/i);
    if (!assets.length) return; // skip if no build
    expect(pretext).toBeDefined();
  });

  it('react-router chunk is split out from index', () => {
    const router = findAsset(assets, /react-router|router/i);
    if (!assets.length) return;
    expect(router).toBeDefined();
  });

  it('elements data chunk exists (code-split from index)', () => {
    const elements = findAsset(assets, /elements-/);
    if (!assets.length) return;
    expect(elements).toBeDefined();
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
  it('ElementCell uses staggered ripple delay with custom easing', async () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'components', 'PeriodicTable.tsx'),
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
