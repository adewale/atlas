import { test, expect } from '@playwright/test';

test.describe('Homepage screenshot audit', () => {
  test('all 118 elements are visible on the periodic table', async ({ page }) => {
    await page.goto('/');
    // Wait for load animation to complete
    await page.waitForTimeout(2000);

    // Take full-page screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/home-full.png', fullPage: true });

    // Count the number of element cells (g elements with role="button")
    const cells = page.locator('svg g[role="button"]');
    const count = await cells.count();
    expect(count).toBe(118);

    // Verify elements are positioned correctly (not all stacked at 0,0)
    // H should be at col 1 (x=0), He at col 18 (x=952) — they should NOT overlap
    const hydrogen = page.locator('g[aria-label*="Hydrogen"]');
    const helium = page.locator('g[aria-label*="Helium"]');
    await expect(hydrogen).toBeVisible();
    await expect(helium).toBeVisible();

    // H and He must be at different x positions (not stacked at 0,0)
    const hBox = await hydrogen.boundingBox();
    const heBox = await helium.boundingBox();
    expect(hBox).not.toBeNull();
    expect(heBox).not.toBeNull();
    // He should be far to the right of H (col 18 vs col 1)
    expect(heBox!.x - hBox!.x).toBeGreaterThan(400);

    // Og (bottom-right of main grid)
    const oganesson = page.locator('g[aria-label*="Oganesson"]');
    await expect(oganesson).toBeVisible();

    // Fr (bottom-left of main grid, period 7 group 1)
    const francium = page.locator('g[aria-label*="Francium"]');
    await expect(francium).toBeVisible();

    // La (lanthanide, should be in main grid row 6 group 3)
    const lanthanum = page.locator('g[aria-label*="Lanthanum"]');
    await expect(lanthanum).toBeVisible();

    // Ce (first lanthanide in f-block row)
    const cerium = page.locator('g[aria-label*="Cerium"]');
    await expect(cerium).toBeVisible();

    // Lu (last lanthanide)
    const lutetium = page.locator('g[aria-label*="Lutetium"]');
    await expect(lutetium).toBeVisible();

    // Lr (last actinide)
    const lawrencium = page.locator('g[aria-label*="Lawrencium"]');
    await expect(lawrencium).toBeVisible();

    // Screenshot just the SVG periodic table
    const svg = page.locator('svg[aria-label="Periodic table of elements"]');
    await svg.screenshot({ path: 'tests/e2e/screenshots/periodic-table.png' });
  });

  test('element folio renders correctly for Iron', async ({ page }) => {
    await page.goto('/element/Fe');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/folio-fe.png', fullPage: true });

    // Verify key content
    await expect(page.locator('.folio-number')).toBeVisible();
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
    await expect(page.locator('h2')).toHaveText('Iron');

    // Data plate links should be present
    const groupLink = page.locator('a[href="/atlas/group/8"]');
    await expect(groupLink).toBeVisible();
    const periodLink = page.locator('a[href="/atlas/period/4"]');
    await expect(periodLink).toBeVisible();
    const blockLink = page.locator('a[href="/atlas/block/d"]');
    await expect(blockLink).toBeVisible();
  });

  test('navigation links are present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const aboutLink = page.locator('a[href="/about"]');
    await expect(aboutLink).toBeVisible();
    const creditsLink = page.locator('a[href="/credits"]');
    await expect(creditsLink).toBeVisible();
  });

  test('compare page renders correctly', async ({ page }) => {
    await page.goto('/compare/Fe/Cu');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/compare-fe-cu.png', fullPage: true });

    // Both element names should appear
    await expect(page.locator('text=Iron')).toBeVisible();
    await expect(page.locator('text=Copper')).toBeVisible();
  });
});
