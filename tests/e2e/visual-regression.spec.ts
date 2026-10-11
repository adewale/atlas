import { test, expect } from './fixtures';
import { settle as waitForAnimations } from './helpers/settle';

/**
 * Visual Regression Tests — pixel-level screenshot comparisons.
 *
 * Uses Playwright's built-in toHaveScreenshot() for pixel-diff detection.
 * Screenshots are stored in tests/e2e/visual-regression.spec.ts-snapshots/
 * and compared against baselines on subsequent runs.
 *
 * Baselines are per platform (`*-darwin.png`, `*-linux.png`). CI compares
 * against the `*-linux.png` baselines. Until they are committed, the CI
 * visual step renders them on the CI image into its e2e-screenshots artifact
 * for review and commit. Fonts come from the
 * committed copies (tests/fonts/), not Google Fonts.
 *
 * Locally: `npm run test:visual` (add --update-snapshots to refresh your
 * platform's baselines).
 */

// Pixels are only comparable on the platform that rendered the baselines, so
// this spec runs when asked (RUN_VISUAL=1): CI sets it once Linux baselines exist.
test.skip(process.env.RUN_VISUAL !== '1', 'Visual regression runs with RUN_VISUAL=1 (see header)');


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
      await waitForAnimations(page);

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
    await waitForAnimations(page);

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
    await page.goto('/eras/1700s');
    await page.waitForLoadState('networkidle');

    // Screenshot the discoverer section — validates chip flex layout
    const discovererSection = page.locator('h2:has-text("Discoverers")').locator('..');
    if (await discovererSection.count() > 0) {
      await expect(discovererSection).toHaveScreenshot(
        `era-1700s-discoverers-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.01, animations: 'disabled' },
      );
    }
  });
});
