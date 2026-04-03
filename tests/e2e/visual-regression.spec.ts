import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests — pixel-level screenshot comparisons.
 *
 * Uses Playwright's built-in toHaveScreenshot() for pixel-diff detection.
 * Screenshots are stored in tests/e2e/visual-regression.spec.ts-snapshots/
 * and compared against baselines on subsequent runs.
 *
 * First run generates baselines. Use --update-snapshots to refresh.
 *
 * Note: screenshot-audit.spec.ts covers broad route crawling; this file
 * targets specific layout-critical components at multiple viewports.
 */

/** Wait for page load + animation settle. */
async function waitForAnimations(page: import('@playwright/test').Page, ms = 600) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

const FOLIO_ELEMENTS = [
  { symbol: 'Fe', name: 'Iron — transition metal' },
  { symbol: 'H', name: 'Hydrogen — short summary' },
  { symbol: 'Og', name: 'Oganesson — synthetic' },
];

test.describe('Visual regression: Folio pages', () => {
  for (const el of FOLIO_ELEMENTS) {
    test(`${el.name} folio layout`, async ({ page }, testInfo) => {
      await page.goto(`/elements/${el.symbol}`);
      await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });
      await waitForAnimations(page);

      // Screenshot the folio main area (excluding marginalia which may vary)
      const main = page.locator('.folio-main');
      await expect(main).toHaveScreenshot(`folio-${el.symbol}-${testInfo.project.name}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual regression: AtlasPlate grids', () => {
  const GRID_PAGES = [
    { url: '/groups/8', name: 'group-8' },
    { url: '/blocks/d', name: 'block-d' },
    { url: '/categories/noble-gas', name: 'noble-gas' },
  ];

  for (const pg of GRID_PAGES) {
    test(`${pg.name} grid layout`, async ({ page }, testInfo) => {
      await page.goto(pg.url);
      await page.waitForSelector('svg[role="img"]', { timeout: 10000 });
      await waitForAnimations(page, 400);

      const plate = page.locator('svg[role="img"]').first();
      await expect(plate).toHaveScreenshot(`plate-${pg.name}-${testInfo.project.name}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual regression: periodic table home', () => {
  test('periodic table grid', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Screenshot just the main SVG periodic table
    const tableSvg = page.locator('svg').first();
    await expect(tableSvg).toHaveScreenshot(`periodic-table-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});

test.describe('Visual regression: EntityChip discoverer list', () => {
  test('era page discoverer chips fill width', async ({ page }, testInfo) => {
    await page.goto('/eras/1770');
    await page.waitForLoadState('networkidle');

    // Screenshot the discoverer section — validates chip flex layout
    const discovererSection = page.locator('h2:has-text("Discoverers")').locator('..');
    if (await discovererSection.count() > 0) {
      await expect(discovererSection).toHaveScreenshot(
        `era-1770-discoverers-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.01, animations: 'disabled' },
      );
    }
  });
});
