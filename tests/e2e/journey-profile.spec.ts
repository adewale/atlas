import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const ROUTES = [
  '/',
  '/element/Fe',
  '/atlas/group/8',
  '/atlas/period/4',
  '/atlas/block/d',
  '/atlas/category/transition%20metal',
  '/atlas/rank/mass',
  '/atlas/anomaly/synthetic-heavy',
  '/compare/Fe/Mn',
  '/about',
  '/credits',
  '/design',
  '/entity-map',
  '/discovery-timeline',
  '/phase-landscape',
  '/property-scatter',
  '/anomaly-explorer',
  '/neighborhood-graph',
  '/etymology-map',
  '/discoverer-network',
  '/discoverer/Albert%20Ghiorso%20et%20al.',
  '/timeline/2010',
] as const;

test.describe('journey profile', () => {
  test('profiles 100% of page-to-page journeys', async ({ page, baseURL }, testInfo) => {
    test.setTimeout(0);
    if (!baseURL) throw new Error('baseURL is required for journey profiling');

    const journeys: Array<{
      from: string;
      to: string;
      durationMs: number;
      navDurationMs: number;
      domContentLoadedMs: number;
      loadEventMs: number;
    }> = [];

    for (const from of ROUTES) {
      await page.goto(`${baseURL}${from}`, { waitUntil: 'networkidle' });

      for (const to of ROUTES) {
        if (to === from) continue;
        const startedAt = performance.now();
        await page.goto(`${baseURL}${to}`, { waitUntil: 'networkidle' });
        const endedAt = performance.now();

        const timing = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation').at(-1) as PerformanceNavigationTiming | undefined;
          return {
            navDurationMs: nav?.duration ?? 0,
            domContentLoadedMs: nav?.domContentLoadedEventEnd ?? 0,
            loadEventMs: nav?.loadEventEnd ?? 0,
          };
        });

        journeys.push({
          from,
          to,
          durationMs: endedAt - startedAt,
          navDurationMs: timing.navDurationMs,
          domContentLoadedMs: timing.domContentLoadedMs,
          loadEventMs: timing.loadEventMs,
        });
      }
    }

    const durations = journeys.map((j) => j.durationMs).sort((a, b) => a - b);
    const index = (percentile: number) => Math.floor((durations.length - 1) * percentile);
    const summary = {
      routeCount: ROUTES.length,
      journeyCount: journeys.length,
      meanMs: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50Ms: durations[index(0.5)],
      p95Ms: durations[index(0.95)],
      p99Ms: durations[index(0.99)],
      slowestJourneys: [...journeys].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10),
    };

    mkdirSync('artifacts', { recursive: true });
    const outPath = `artifacts/journey-profile.${testInfo.project.name}.json`;
    writeFileSync(outPath, JSON.stringify({ summary, journeys }, null, 2), 'utf-8');
    await testInfo.attach('journey-profile', { path: outPath, contentType: 'application/json' });
  });
});
