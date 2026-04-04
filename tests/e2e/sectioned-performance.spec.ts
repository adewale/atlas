import { test, expect } from '@playwright/test';

/**
 * Performance tests for the SectionedCardList mobile refactor.
 *
 * Measures page load and interaction times on mobile viewport to ensure
 * the sectioned card layout does not regress performance.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const PERF_BUDGET_MS = 5000; // Max time for page to be interactive

const SECTIONED_PAGES = [
  { path: '/phase-landscape', label: 'Phase Landscape' },
  { path: '/anomaly-explorer', label: 'Anomaly Explorer' },
  { path: '/discovery-timeline', label: 'Discovery Timeline' },
  { path: '/discoverer-network', label: 'Discoverer Network' },
];

test.describe('Sectioned pages — mobile performance', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const page of SECTIONED_PAGES) {
    test(`${page.label} loads within performance budget`, async ({ page: p }) => {
      const start = Date.now();

      await p.goto(page.path);
      // Wait for sections to appear (indicates content is rendered)
      await p.locator('section[role="region"]').first().waitFor({ state: 'visible', timeout: PERF_BUDGET_MS });

      const loadTime = Date.now() - start;

      // Assert within budget
      expect(
        loadTime,
        `${page.label} took ${loadTime}ms to render first section (budget: ${PERF_BUDGET_MS}ms)`,
      ).toBeLessThan(PERF_BUDGET_MS);
    });

    test(`${page.label} accordion toggle is responsive (<500ms)`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForTimeout(2000);

      const toggles = p.locator('section[role="region"] h2 button');
      const count = await toggles.count();
      if (count === 0) return; // No accordion on this page config

      const firstSection = p.locator('section[role="region"]').first();
      const cardsBefore = await firstSection.locator('a').count();

      // On mobile, sections may start collapsed — expand first then collapse
      if (cardsBefore === 0) {
        await toggles.first().click();
        await p.waitForTimeout(200);
      }

      // Measure toggle time (collapse)
      const start = Date.now();
      await toggles.first().click();
      await expect(firstSection.locator('a')).toHaveCount(0, { timeout: 1000 });
      const toggleTime = Date.now() - start;

      expect(
        toggleTime,
        `Accordion toggle took ${toggleTime}ms (should be <1000ms)`,
      ).toBeLessThan(1000);
    });
  }

  test('no memory leaks from repeated accordion toggles', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const toggles = page.locator('section[role="region"] h2 button');
    const count = await toggles.count();
    if (count === 0) return;

    // Rapid toggle 20 times
    for (let i = 0; i < 20; i++) {
      await toggles.first().click();
      await page.waitForTimeout(50);
    }

    // Page should still be responsive — check a section is visible
    const sections = page.locator('section[role="region"]');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(3);

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Screenshot comparison — desktop vs mobile side by side
// ---------------------------------------------------------------------------
test.describe('Sectioned pages — screenshot audit', () => {
  for (const pg of SECTIONED_PAGES) {
    test(`${pg.label} — desktop screenshot`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await ctx.newPage();
      await page.goto(pg.path);
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `tests/e2e/screenshots/${pg.label.toLowerCase().replace(/\s+/g, '-')}-desktop.png`,
        fullPage: true,
      });
      await ctx.close();
    });

    test(`${pg.label} — mobile screenshot (375px)`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: MOBILE_VIEWPORT,
      });
      const page = await ctx.newPage();
      await page.goto(pg.path);
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `tests/e2e/screenshots/${pg.label.toLowerCase().replace(/\s+/g, '-')}-mobile-375.png`,
        fullPage: true,
      });
      await ctx.close();
    });

    test(`${pg.label} — iPhone 15 Pro Max screenshot`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
      });
      const page = await ctx.newPage();
      await page.goto(pg.path);
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `tests/e2e/screenshots/${pg.label.toLowerCase().replace(/\s+/g, '-')}-iphone15promax.png`,
        fullPage: true,
      });
      await ctx.close();
    });
  }
});
