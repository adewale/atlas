/**
 * Route Crawler — prevents Lessons #3 and #6.
 *
 * Lesson #3: Category page showed no elements because the link href used
 *   hyphens but the data used spaces. This test follows every link to verify
 *   the destination actually renders content — not just that the href exists.
 *
 * Lesson #6: Orphaned pages had no inbound navigation. This test starts from
 *   `/` and crawls every internal link. Any route defined in the router but
 *   never reached is flagged as orphaned.
 *
 * How it works:
 *   1. Extract all route paths from the router definition.
 *   2. Starting from `/`, follow every internal `<a>` and `<Link>` found on
 *      each page (BFS crawl).
 *   3. Assert that every visited page renders meaningful content (not blank).
 *   4. Assert that every defined route was visited at least once.
 */
import { test, expect } from '@playwright/test';

/** All route patterns from routes.tsx that a user should be able to reach. */
const DEFINED_ROUTE_PATTERNS = [
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
  '/neighbourhood-graph',
  '/etymology-map',
  '/discoverer-network',
];

/** Convert a concrete URL like `/groups/1` to its pattern `/groups/:n`. */
function matchesPattern(url: string, pattern: string): boolean {
  const urlParts = url.split('/');
  const patParts = pattern.split('/');
  if (urlParts.length !== patParts.length) return false;
  return patParts.every((p, i) => p.startsWith(':') || p === urlParts[i]);
}

test.describe('Route crawler', () => {
  test('every page reachable from / renders content', async ({ page }) => {
    const visited = new Set<string>();
    const queue: string[] = ['/'];
    const errors: string[] = [];
    const MAX_PAGES = 60; // safety limit

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      await page.goto(url, { waitUntil: 'networkidle' });

      // Every page must render something visible (not empty/blank)
      const bodyText = await page.locator('body').innerText();
      if (bodyText.trim().length < 5) {
        errors.push(`${url}: page rendered no visible content`);
      }

      // Collect internal links
      const hrefs = await page.locator('a[href^="/"]').evaluateAll(
        (els) => els.map((a) => (a as HTMLAnchorElement).getAttribute('href')!),
      );

      for (const href of hrefs) {
        // Normalise: strip query params and hash
        const clean = href.split('?')[0].split('#')[0];
        if (!visited.has(clean) && clean.startsWith('/')) {
          queue.push(clean);
        }
      }
    }

    expect(errors).toEqual([]);
    expect(visited.size).toBeGreaterThan(5);
  });

  test('no defined route is orphaned (unreachable from /)', async ({ page }) => {
    const visited = new Set<string>();
    const queue: string[] = ['/'];
    const MAX_PAGES = 80;

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      await page.goto(url, { waitUntil: 'networkidle' });

      const hrefs = await page.locator('a[href^="/"]').evaluateAll(
        (els) => els.map((a) => (a as HTMLAnchorElement).getAttribute('href')!),
      );

      for (const href of hrefs) {
        const clean = href.split('?')[0].split('#')[0];
        if (!visited.has(clean) && clean.startsWith('/')) {
          queue.push(clean);
        }
      }
    }

    // For each pattern, check if at least one visited URL matches
    const orphaned: string[] = [];
    for (const pattern of DEFINED_ROUTE_PATTERNS) {
      const hasMatch = [...visited].some((url) => matchesPattern(url, pattern));
      if (!hasMatch) {
        orphaned.push(pattern);
      }
    }

    if (orphaned.length > 0) {
      console.warn('Orphaned routes (not reachable from /):', orphaned);
    }
    expect(orphaned).toEqual([]);
  });

  test('every internal link destination renders non-empty content', async ({ page }) => {
    // Visit a sample of key pages and follow their internal links
    const seedPages = [
      '/',
      '/elements/Fe',
      '/about',
      '/groups',
      '/categories',
      '/discoverers',
      '/eras',
    ];

    const broken: string[] = [];
    const checked = new Set<string>();

    for (const seedUrl of seedPages) {
      await page.goto(seedUrl, { waitUntil: 'networkidle' });
      const hrefs = await page.locator('a[href^="/"]').evaluateAll(
        (els) => els.map((a) => (a as HTMLAnchorElement).getAttribute('href')!),
      );

      // Check a sample of links from each page
      for (const href of hrefs.slice(0, 10)) {
        const clean = href.split('?')[0].split('#')[0];
        if (checked.has(clean)) continue;
        checked.add(clean);

        await page.goto(clean, { waitUntil: 'networkidle' });
        const text = await page.locator('body').innerText();
        if (text.trim().length < 5) {
          broken.push(`Link from ${seedUrl} → ${clean}: destination is blank`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
