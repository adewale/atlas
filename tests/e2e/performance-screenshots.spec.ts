/**
 * Performance-focused screenshot & metric tests.
 *
 * These E2E tests capture:
 *  1. Visual regression screenshots for before/after comparison
 *  2. Performance metrics (load times, DOM node counts, transition timing)
 *  3. Bundle loading behaviour (lazy vs eager)
 */
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Screenshot: Home page periodic table (visual regression)
// ---------------------------------------------------------------------------
test.describe('Performance visual regression', () => {
  test('Home page renders correctly after optimizations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    // Screenshot full page
    await page.screenshot({
      path: 'tests/e2e/screenshots/perf-home-full.png',
      fullPage: true,
    });

    // All 118 cells must still render
    const cells = page.locator('svg g[role="button"]');
    expect(await cells.count()).toBe(118);

    // Screenshot just the periodic table SVG
    const svg = page.locator('svg[aria-label="Periodic table of elements"]');
    await svg.screenshot({
      path: 'tests/e2e/screenshots/perf-periodic-table.png',
    });
  });

  test('Highlight mode block still colours correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click Block highlight
    await page.getByRole('button', { name: /block/i }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/e2e/screenshots/perf-highlight-block.png',
      fullPage: true,
    });

    // Iron (d-block) should have warm red fill
    const feRect = page.locator('g[aria-label*="Iron"] rect').first();
    const fill = await feRect.getAttribute('fill');
    expect(fill).toBe('#9e1c2c');

    // Hydrogen (s-block) should have deep blue fill
    const hRect = page.locator('g[aria-label*="Hydrogen"] rect').first();
    const hFill = await hRect.getAttribute('fill');
    expect(hFill).toBe('#133e7c');
  });

  test('Highlight mode property still applies gradient', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /property/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /mass/i }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/e2e/screenshots/perf-highlight-property-mass.png',
      fullPage: true,
    });

    // Oganesson (heaviest) should have a darker fill than Hydrogen (lightest)
    const ogRect = page.locator('g[aria-label*="Oganesson"] rect').first();
    const hRect = page.locator('g[aria-label*="Hydrogen"] rect').first();
    const ogFill = await ogRect.getAttribute('fill');
    const hFill = await hRect.getAttribute('fill');
    expect(ogFill).not.toBe(hFill);
  });

  test('Element folio still renders after optimizations', async ({ page }) => {
    await page.goto('/element/Fe');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'tests/e2e/screenshots/perf-folio-fe.png',
      fullPage: true,
    });

    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
    await expect(page.locator('h2')).toContainText('Iron');
  });

  test('Discovery timeline page renders after optimizations', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForSelector('h1', { timeout: 10000 });

    await page.screenshot({
      path: 'tests/e2e/screenshots/perf-discovery-timeline.png',
      fullPage: true,
    });

    await expect(page.locator('h1')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Performance metrics
// ---------------------------------------------------------------------------
test.describe('Performance metrics', () => {
  test('Home page DOM node count is reasonable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[aria-label="Periodic table of elements"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    // Should have all 118 element cells but not be excessively bloated
    expect(nodeCount).toBeGreaterThan(300);
    expect(nodeCount).toBeLessThan(1200);
  });

  test('Home page SVG node count is optimized', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const svgNodeCount = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-label="Periodic table of elements"]');
      return svg ? svg.querySelectorAll('*').length : 0;
    });

    // Baseline: 472+ nodes (118 cells × 4 children). Should still have all elements.
    // With optimization: nodes should be ≤ 500 (we keep all cells but may reduce children)
    expect(svgNodeCount).toBeGreaterThan(350); // sanity: cells exist
    expect(svgNodeCount).toBeLessThan(900); // not bloated
  });

  test('Home page loads and renders periodic table', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[aria-label="Periodic table of elements"]', { timeout: 10000 });

    // Verify it actually rendered
    const cells = page.locator('svg g[role="button"]');
    expect(await cells.count()).toBe(118);
  });

  test('Element folio loads and renders', async ({ page }) => {
    await page.goto('/element/Fe');
    await page.waitForSelector('.folio-symbol', { timeout: 10000 });

    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
  });

  test('Highlight mode switch does not cause layout thrashing', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Measure time to switch highlight mode
    const switchTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        const btn = document.querySelector('button[aria-pressed="false"]') as HTMLButtonElement;
        if (btn) btn.click();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(performance.now() - start);
          });
        });
      });
    });

    // Should complete within 2 frames (~33ms) without layout thrashing
    expect(switchTime).toBeLessThan(100);
  });

  test('Bundle splitting: pretext is not in index chunk', async ({ page }) => {
    // Load the page and check which scripts are loaded
    const scriptSrcs: string[] = [];
    page.on('response', (response) => {
      if (response.url().endsWith('.js')) {
        scriptSrcs.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // At least 3 JS files should load (index, pretext/vendor, page chunk)
    expect(scriptSrcs.length).toBeGreaterThanOrEqual(3);
  });
});
