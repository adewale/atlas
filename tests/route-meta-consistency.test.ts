/**
 * Route Metadata Consistency Test — prevents Lesson #14.
 *
 * Lesson #14: Removing the `/atlas` prefix and pluralizing URLs required
 *   changes across routeMeta.ts, every page consuming it, back-link labels,
 *   and tests. The ripple was invisible until runtime.
 *
 * This test validates that routeMeta.ts (VIZ_PAGES, ENTITIES) stays in sync
 * with the route table the app actually serves: the exported `router` from
 * routes.tsx, matched with React Router's own `matchRoutes`. If a route path
 * changes or is removed, this test breaks immediately — not after a user
 * discovers a broken VizNav or Entity Map link.
 *
 * What it checks:
 *   1. Every VIZ_PAGES path is a static route in the router
 *   2. Every ENTITIES route pattern is a route pattern in the router
 *   3. Every ENTITIES example href resolves to a router route AND to a real
 *      entity (a malformed or unknown slug has no SEO metadata)
 */
import { describe, test, expect } from 'vitest';
import { matchRoutes, type RouteObject } from 'react-router';
import { router } from '../src/routes';
import { VIZ_PAGES, ENTITIES } from '../src/lib/routeMeta';
import { getIndexableComparisonPaths, getSeoMetadata } from '../src/lib/seo';

function routePatterns(routes: readonly RouteObject[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...routePatterns(route.children ?? []),
  ]);
}

const ROUTER_PATTERNS = routePatterns(router.routes);

/** The pattern of the deepest router route that serves `path`, or null. */
function servingPattern(path: string): string | null {
  const matches = matchRoutes(router.routes, path);
  return matches?.at(-1)?.route.path ?? null;
}

describe('router fixture', () => {
  test('exposes the app route table with static and dynamic routes', () => {
    expect(ROUTER_PATTERNS).toContain('/');
    expect(ROUTER_PATTERNS).toContain('/elements/:symbol');
    expect(servingPattern('/no-such-page')).toBeNull();
  });
});

describe('VIZ_PAGES consistency', () => {
  test('every VIZ_PAGES path is served by a static router route', () => {
    const missing = VIZ_PAGES.filter((page) => servingPattern(page.path) !== page.path).map(
      (page) => `${page.label}: ${page.path}`,
    );
    expect(missing).toEqual([]);
  });

  test('every VIZ_PAGES entry has a non-empty label', () => {
    for (const page of VIZ_PAGES) {
      expect(page.label.length, `VIZ_PAGES entry with path ${page.path} has empty label`).toBeGreaterThan(0);
    }
  });

  test('no duplicate VIZ_PAGES paths', () => {
    const paths = VIZ_PAGES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('ENTITIES consistency', () => {
  test('every ENTITIES route pattern is a router route pattern', () => {
    const missing = ENTITIES.filter((entity) => entity.route !== '—')
      .filter((entity) => !ROUTER_PATTERNS.includes(entity.route.split('#')[0]))
      .map((entity) => `${entity.label}: ${entity.route}`);
    expect(missing).toEqual([]);
  });

  test('every ENTITIES example href is served by a router route and names a real entity', () => {
    const broken: string[] = [];
    for (const entity of ENTITIES) {
      for (const example of entity.examples) {
        const path = example.href.split('#')[0];
        if (servingPattern(path) === null) {
          broken.push(`${entity.label} example "${example.name}": ${example.href} has no route`);
        } else if (getSeoMetadata(path) === null) {
          broken.push(`${entity.label} example "${example.name}": ${example.href} names no entity`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test('comparison examples stay within the indexed folio-linked set', () => {
    const comparison = ENTITIES.find((entity) => entity.id === 'comparison');
    expect(comparison).toBeDefined();
    const indexed = new Set(getIndexableComparisonPaths());
    for (const example of comparison?.examples ?? []) {
      expect(indexed.has(example.href), example.href).toBe(true);
    }
  });

  test('no duplicate ENTITIES ids', () => {
    const ids = ENTITIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every ENTITIES entry has at least one example', () => {
    for (const entity of ENTITIES) {
      expect(entity.examples.length, `Entity "${entity.label}" has no examples`).toBeGreaterThan(0);
    }
  });
});
