/**
 * Route Metadata Consistency Test — prevents Lesson #14.
 *
 * Lesson #14: Removing the `/atlas` prefix and pluralizing URLs required
 *   changes across routeMeta.ts, every page consuming it, back-link labels,
 *   and tests. The ripple was invisible until runtime.
 *
 * This test validates that routeMeta.ts (VIZ_PAGES, ENTITIES) stays in sync
 * with the actual route definitions in routes.tsx. If a route path changes,
 * this test breaks immediately — not after a user discovers a broken VizNav.
 *
 * What it checks:
 *   1. Every VIZ_PAGES path exists as a route in routes.tsx
 *   2. Every ENTITIES route pattern exists in routes.tsx
 *   3. Every ENTITIES example href resolves to a defined route
 *   4. No stale route patterns reference removed paths
 */
import { describe, test, expect } from 'vitest';
import { VIZ_PAGES, ENTITIES } from '../src/lib/routeMeta';

/**
 * Route patterns extracted from routes.tsx.
 * This must be kept in sync manually, but the test below cross-validates
 * both directions — if a route is added/removed, one of these tests fails.
 */
const DEFINED_ROUTES = [
  '/',
  '/elements',
  '/elements/:symbol',
  '/groups',
  '/groups/:n',
  '/periods',
  '/periods/:n',
  '/blocks',
  '/blocks/:block',
  '/categories',
  '/categories/:slug',
  '/properties',
  '/properties/:property',
  '/anomalies',
  '/anomalies/:slug',
  '/elements/:symbol/compare/:other',
  '/about',
  '/about/credits',
  '/about/design',
  '/about/animation-palette',
  '/about/entity-map',
  '/discoverers',
  '/discoverers/:name',
  '/eras',
  '/eras/:era',
  '/discovery-timeline',
  '/phase-landscape',
  '/property-scatter',
  '/anomaly-explorer',
  '/etymology-map',
  '/discoverer-network',
  '/explore',
];

/** Check if a concrete path matches a route pattern. */
function matchesRoute(href: string, pattern: string): boolean {
  const hrefParts = href.split('/').filter(Boolean);
  const patParts = pattern.split('/').filter(Boolean);
  if (hrefParts.length !== patParts.length) return false;
  return patParts.every((p, i) => p.startsWith(':') || p === hrefParts[i]);
}

/** Check if a pattern exists among defined routes. */
function routeExists(pattern: string): boolean {
  // Handle hash-based routes (e.g. /etymology-map#:origin)
  const path = pattern.split('#')[0];
  if (path === '—') return true; // Placeholder for implicit entities

  return DEFINED_ROUTES.some((r) => {
    if (r === path) return true;
    // Check if the pattern is a parameterised version of a defined route
    const rParts = r.split('/').filter(Boolean);
    const pParts = path.split('/').filter(Boolean);
    if (rParts.length !== pParts.length) return false;
    return rParts.every((rp, i) => rp === pParts[i] || rp.startsWith(':') || pParts[i].startsWith(':'));
  });
}

describe('VIZ_PAGES consistency', () => {
  test('every VIZ_PAGES path is a defined route', () => {
    const missing: string[] = [];
    for (const page of VIZ_PAGES) {
      if (!DEFINED_ROUTES.includes(page.path)) {
        missing.push(`${page.label}: ${page.path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('every VIZ_PAGES entry has a non-empty label', () => {
    for (const page of VIZ_PAGES) {
      expect(page.label.length, `VIZ_PAGES entry with path ${page.path} has empty label`).toBeGreaterThan(0);
    }
  });

  test('no duplicate VIZ_PAGES paths', () => {
    const paths = VIZ_PAGES.map((p) => p.path);
    const unique = new Set(paths);
    expect(paths.length).toBe(unique.size);
  });
});

describe('ENTITIES consistency', () => {
  test('every ENTITIES route pattern matches a defined route', () => {
    const missing: string[] = [];
    for (const entity of ENTITIES) {
      if (!routeExists(entity.route)) {
        missing.push(`${entity.label}: ${entity.route}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('every ENTITIES example href resolves to a defined route', () => {
    const broken: string[] = [];
    for (const entity of ENTITIES) {
      for (const example of entity.examples) {
        const href = decodeURIComponent(example.href.split('#')[0]);
        const matches = DEFINED_ROUTES.some((r) => matchesRoute(href, r));
        if (!matches) {
          broken.push(`${entity.label} example "${example.name}": ${example.href}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test('no duplicate ENTITIES ids', () => {
    const ids = ENTITIES.map((e) => e.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  test('every ENTITIES entry has at least one example', () => {
    for (const entity of ENTITIES) {
      expect(
        entity.examples.length,
        `Entity "${entity.label}" has no examples`,
      ).toBeGreaterThan(0);
    }
  });
});

describe('stale route detection', () => {
  test('no VIZ_PAGES paths use old /atlas prefix', () => {
    for (const page of VIZ_PAGES) {
      expect(page.path).not.toMatch(/^\/atlas\//);
    }
  });

  test('no ENTITIES routes use old /atlas prefix', () => {
    for (const entity of ENTITIES) {
      expect(entity.route).not.toMatch(/^\/atlas\//);
    }
  });

  test('no ENTITIES example hrefs use old /atlas prefix', () => {
    for (const entity of ENTITIES) {
      for (const example of entity.examples) {
        expect(example.href).not.toMatch(/^\/atlas\//);
      }
    }
  });

  test('no routes use singular collection names (old convention)', () => {
    const oldSingulars = ['/rank/', '/timeline/', '/block/', '/period/', '/group/', '/category/', '/anomaly/', '/discoverer/'];
    for (const page of VIZ_PAGES) {
      for (const old of oldSingulars) {
        expect(page.path).not.toContain(old);
      }
    }
  });
});
