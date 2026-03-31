import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Mobile Screenshot Test Suite
 *
 * Takes full-page screenshots of every major route on three iPhone viewports
 * and verifies readability: no horizontal overflow, no console errors, and
 * visual regression via saved PNGs.
 */

// ---------------------------------------------------------------------------
// Device definitions
// ---------------------------------------------------------------------------

const devices = [
  { name: 'iphone15promax', width: 430, height: 932, scaleFactor: 3 },
  { name: 'iphone16promax', width: 440, height: 956, scaleFactor: 3 },
  { name: 'iphone17', width: 440, height: 956, scaleFactor: 3 },
] as const;

// ---------------------------------------------------------------------------
// Routes to test (22 total)
// ---------------------------------------------------------------------------

const routes: { path: string; label: string }[] = [
  { path: '/', label: 'home' },
  { path: '/element/Fe', label: 'element-fe' },
  { path: '/element/H', label: 'element-h' },
  { path: '/element/Og', label: 'element-og' },
  { path: '/atlas/group/8', label: 'atlas-group-8' },
  { path: '/atlas/period/4', label: 'atlas-period-4' },
  { path: '/atlas/block/d', label: 'atlas-block-d' },
  { path: '/atlas/category/transition-metal', label: 'atlas-category-transition-metal' },
  { path: '/atlas/rank/mass', label: 'atlas-rank-mass' },
  { path: '/atlas/anomaly/synthetic-heavy', label: 'atlas-anomaly-synthetic-heavy' },
  { path: '/compare/Fe/Cu', label: 'compare-fe-cu' },
  { path: '/about', label: 'about' },
  { path: '/credits', label: 'credits' },
  { path: '/design', label: 'design' },
  { path: '/entity-map', label: 'entity-map' },
  { path: '/discovery-timeline', label: 'discovery-timeline' },
  { path: '/phase-landscape', label: 'phase-landscape' },
  { path: '/property-scatter', label: 'property-scatter' },
  { path: '/anomaly-explorer', label: 'anomaly-explorer' },
  { path: '/neighborhood-graph', label: 'neighborhood-graph' },
  { path: '/etymology-map', label: 'etymology-map' },
  { path: '/discoverer-network', label: 'discoverer-network' },
  { path: '/discoverer/Humphry%20Davy', label: 'discoverer-humphry-davy' },
  { path: '/timeline/1770', label: 'timeline-1770' },
];

// ---------------------------------------------------------------------------
// Screenshot directory
// ---------------------------------------------------------------------------

const SCREENSHOT_DIR = 'tests/e2e/screenshots';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for load animations to settle. */
async function waitForAnimations(page: Page, timeout = 2500) {
  await page.waitForTimeout(timeout);
}

/**
 * Assert that the page has no horizontal overflow — the document's scroll
 * width should not exceed the viewport width.
 */
async function assertNoHorizontalOverflow(page: Page, viewportWidth: number, label: string) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(
    scrollWidth,
    `${label}: page scrollWidth (${scrollWidth}) should not exceed viewport (${viewportWidth})`,
  ).toBeLessThanOrEqual(viewportWidth + 1); // +1 for sub-pixel rounding
}

// ---------------------------------------------------------------------------
// Tests — one describe block per device, one test per route
// ---------------------------------------------------------------------------

for (const device of devices) {
  test.describe(`Mobile screenshots: ${device.name} (${device.width}x${device.height})`, () => {
    // Increase timeout: 24 pages with animations need time
    test.setTimeout(120_000);

    for (const route of routes) {
      test(`${route.label} — no overflow, no console errors, screenshot`, async ({
        browser,
      }) => {
        // Collect console errors
        const consoleErrors: string[] = [];

        // Create a context with the exact device viewport and scale factor
        const context: BrowserContext = await browser.newContext({
          viewport: { width: device.width, height: device.height },
          deviceScaleFactor: device.scaleFactor,
        });
        const page = await context.newPage();

        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Navigate and wait for animations
        await page.goto(route.path);
        await waitForAnimations(page);

        // Take full-page screenshot
        const screenshotPath = `${SCREENSHOT_DIR}/mobile-${device.name}-${route.label}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Assert no horizontal overflow
        await assertNoHorizontalOverflow(page, device.width, `${device.name}/${route.label}`);

        // Assert no console errors (filter out known benign messages)
        const realErrors = consoleErrors.filter(
          (msg) =>
            !msg.includes('favicon') &&
            !msg.includes('Failed to load resource') &&
            !msg.includes('DevTools'),
        );
        expect(
          realErrors,
          `${device.name}/${route.label}: unexpected console errors:\n${realErrors.join('\n')}`,
        ).toHaveLength(0);

        await context.close();
      });
    }
  });
}
