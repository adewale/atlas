/**
 * Tests for the five audit findings fixed in the consistency audit.
 * Each describe block guards against regression of a specific fix.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const SRC = resolve(__dirname, '../src');

// ---------------------------------------------------------------------------
// Fix 1: Route metadata centralization
// VIZ_PAGES and ENTITIES used to be duplicated across VizNav.tsx,
// EntityMap.tsx, and routes.tsx. Now they live in routeMeta.ts.
// ---------------------------------------------------------------------------
describe('Fix 1: Centralized route metadata', () => {
  // Import from the single source of truth
  let VIZ_PAGES: { path: string; label: string; colour: string; entities: string }[];
  let ENTITIES: { id: string; label: string; route: string; colour: string }[];

  it('routeMeta.ts exports VIZ_PAGES and ENTITIES', async () => {
    const mod = await import('../src/lib/routeMeta');
    VIZ_PAGES = mod.VIZ_PAGES;
    ENTITIES = mod.ENTITIES;
    expect(VIZ_PAGES).toBeDefined();
    expect(ENTITIES).toBeDefined();
  });

  it('VIZ_PAGES has 8 visualization pages', async () => {
    const { VIZ_PAGES } = await import('../src/lib/routeMeta');
    expect(VIZ_PAGES).toHaveLength(8);
  });

  it('every VIZ_PAGE has path, label, colour, and entities', async () => {
    const { VIZ_PAGES } = await import('../src/lib/routeMeta');
    for (const page of VIZ_PAGES) {
      expect(page.path).toBeTruthy();
      expect(page.label).toBeTruthy();
      expect(page.colour).toMatch(/^#/);
      expect(page.entities).toBeTruthy();
    }
  });

  it('ENTITIES has 12 entity types', async () => {
    const { ENTITIES } = await import('../src/lib/routeMeta');
    expect(ENTITIES).toHaveLength(12);
  });

  it('every ENTITY has at least one example with name and href', async () => {
    const { ENTITIES } = await import('../src/lib/routeMeta');
    for (const entity of ENTITIES) {
      expect(entity.examples.length).toBeGreaterThan(0);
      for (const ex of entity.examples) {
        expect(ex.name).toBeTruthy();
        expect(ex.href).toBeTruthy();
      }
    }
  });

  it('no unique ENTITY ids are duplicated', async () => {
    const { ENTITIES } = await import('../src/lib/routeMeta');
    const ids = ENTITIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('VizNav.tsx imports from routeMeta, not hardcoded', () => {
    const src = readFileSync(resolve(SRC, 'components/VizNav.tsx'), 'utf-8');
    expect(src).toContain("from '../lib/routeMeta'");
    // Should NOT define its own VIZ_PAGES
    expect(src).not.toMatch(/^const VIZ_PAGES/m);
  });

  it('EntityMap.tsx imports ENTITIES from routeMeta, not hardcoded', () => {
    const src = readFileSync(resolve(SRC, 'pages/EntityMap.tsx'), 'utf-8');
    expect(src).toContain("from '../lib/routeMeta'");
    // Should NOT define its own ENTITIES const
    expect(src).not.toMatch(/^const ENTITIES/m);
  });
});

// ---------------------------------------------------------------------------
// Fix 2: Dead KeyboardHelp.tsx removed
// KeyboardHelp.tsx was never imported — HelpOverlay is the sole implementation.
// ---------------------------------------------------------------------------
describe('Fix 2: KeyboardHelp.tsx deleted (dead code)', () => {
  it('KeyboardHelp.tsx no longer exists', () => {
    expect(existsSync(resolve(SRC, 'components/KeyboardHelp.tsx'))).toBe(false);
  });

  it('no source file imports KeyboardHelp', () => {
    // Read all .tsx/.ts files in src/components and src/pages to check for imports
    const dirs = ['components', 'pages'];
    for (const dir of dirs) {
      const dirPath = resolve(SRC, dir);
      if (!existsSync(dirPath)) continue;
      for (const file of readdirSync(dirPath)) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
        const content = readFileSync(join(dirPath, file), 'utf-8');
        expect(content, `${dir}/${file} should not import KeyboardHelp`).not.toContain('KeyboardHelp');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Fix 3: Typed loader caches
// Route caches were `unknown` — now they use proper types from types.ts.
// ---------------------------------------------------------------------------
describe('Fix 3: Loader caches are properly typed', () => {
  it('routes.tsx does not use unknown for cache variables', () => {
    const src = readFileSync(resolve(SRC, 'routes.tsx'), 'utf-8');
    // Should not have any `Cache: unknown`
    expect(src).not.toMatch(/Cache:\s*unknown/);
  });

  it('routes.tsx imports cache types from types.ts', () => {
    const src = readFileSync(resolve(SRC, 'routes.tsx'), 'utf-8');
    expect(src).toContain('GroupData');
    expect(src).toContain('AnomalyData');
    expect(src).toContain('DiscovererData');
    expect(src).toContain('TimelineData');
  });

  it('types.ts exports DiscovererData and TimelineData', () => {
    const src = readFileSync(resolve(SRC, 'lib/types.ts'), 'utf-8');
    expect(src).toContain('export type DiscovererData');
    expect(src).toContain('export type TimelineData');
  });
});

// ---------------------------------------------------------------------------
// Fix 4: Consistent null-handling (no ! + .filter(Boolean) contradiction)
// getElement() returns ElementRecord | undefined, so we should never use !
// followed by .filter(Boolean) — that's contradictory. Use type guards instead.
// ---------------------------------------------------------------------------
describe('Fix 4: No contradictory non-null assertions with filter(Boolean)', () => {
  const FILES_THAT_HAD_THE_BUG = [
    'components/AtlasBrowsePage.tsx',
    'pages/DiscovererDetail.tsx',
    'pages/TimelineEra.tsx',
  ];

  for (const file of FILES_THAT_HAD_THE_BUG) {
    it(`${file} does not use getElement(...)! pattern`, () => {
      const src = readFileSync(resolve(SRC, file), 'utf-8');
      // Match getElement(anything)! — the non-null assertion after getElement
      expect(src).not.toMatch(/getElement\([^)]*\)!/);
    });
  }

  it('getElement returns ElementRecord | undefined (defensive)', async () => {
    const { getElement } = await import('../src/lib/data');
    // Valid symbol returns a record
    const fe = getElement('Fe');
    expect(fe).toBeDefined();
    expect(fe?.symbol).toBe('Fe');
    // Invalid symbol returns undefined (not throws)
    const nope = getElement('Zz');
    expect(nope).toBeUndefined();
  });

  it('type guard filter produces correct results for mixed input', async () => {
    const { getElement } = await import('../src/lib/data');
    type ElementRecord = NonNullable<ReturnType<typeof getElement>>;
    // Mix of valid and invalid symbols
    const symbols = ['Fe', 'INVALID', 'O', 'NOPE'];
    const elements = symbols
      .map((s) => getElement(s))
      .filter((e): e is ElementRecord => e != null);
    expect(elements).toHaveLength(2);
    expect(elements[0].symbol).toBe('Fe');
    expect(elements[1].symbol).toBe('O');
  });
});

// ---------------------------------------------------------------------------
// Fix 5: Style policy documented
// theme.ts header now documents the boundary between globals.css, theme.ts,
// and inline styles.
// ---------------------------------------------------------------------------
describe('Fix 5: Style policy documented in theme.ts', () => {
  const themeSrc = readFileSync(resolve(SRC, 'lib/theme.ts'), 'utf-8');

  it('theme.ts contains a style policy section', () => {
    expect(themeSrc).toContain('Style policy');
  });

  it('style policy documents globals.css responsibilities', () => {
    expect(themeSrc).toContain('globals.css');
    expect(themeSrc).toContain('Keyframe animations');
  });

  it('style policy documents theme.ts responsibilities', () => {
    expect(themeSrc).toContain('theme.ts');
    expect(themeSrc).toContain('Named style objects');
  });

  it('style policy documents inline style boundaries', () => {
    expect(themeSrc).toContain('Inline styles');
    expect(themeSrc).toContain('should NOT');
  });
});
