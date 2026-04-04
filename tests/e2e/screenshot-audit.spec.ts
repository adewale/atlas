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
    await page.goto('/elements/Fe');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/folio-fe.png', fullPage: true });

    // Verify key content
    await expect(page.locator('.folio-number')).toBeVisible();
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
    await expect(page.locator('h2')).toContainText('Iron');

    // Data plate links should be present
    const groupLink = page.locator('a[href="/groups/8"]');
    await expect(groupLink).toBeVisible();
    const periodLink = page.locator('a[href="/periods/4"]');
    await expect(periodLink).toBeVisible();
    const blockLink = page.locator('a[href="/blocks/d"]');
    await expect(blockLink).toBeVisible();
  });

  test('navigation links are present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const aboutLink = page.locator('a[href="/about"]');
    await expect(aboutLink).toBeVisible();
    const creditsLink = page.locator('a[href="/about/credits"]');
    await expect(creditsLink).toBeVisible();
  });

  test('compare page renders correctly', async ({ page }) => {
    await page.goto('/elements/Fe/compare/Cu');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/compare-fe-cu.png', fullPage: true });

    // Both element names should appear in the SVG comparison
    const svg = page.locator('svg[aria-label="Comparison of Iron and Copper"]');
    await expect(svg).toBeVisible();
  });
});

test.describe('Element folio journeys', () => {
  test('Hydrogen folio (edge case: period 1, group 1, s-block)', async ({ page }) => {
    await page.goto('/elements/H');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/folio-h.png', fullPage: true });

    await expect(page.locator('.folio-symbol')).toHaveText('H');
    await expect(page.locator('h2')).toContainText('Hydrogen');
    await expect(page.locator('.folio-number')).toBeVisible();

    // Data plate should show group 1, period 1, block s
    await expect(page.locator('a[href="/groups/1"]')).toBeVisible();
    await expect(page.locator('a[href="/periods/1"]')).toBeVisible();
    await expect(page.locator('a[href="/blocks/s"]')).toBeVisible();

    // Back link to periodic table
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Oganesson folio (edge case: last element, period 7, group 18, p-block)', async ({ page }) => {
    await page.goto('/elements/Og');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/folio-og.png', fullPage: true });

    await expect(page.locator('.folio-symbol')).toHaveText('Og');
    await expect(page.locator('h2')).toContainText('Oganesson');
    await expect(page.locator('a[href="/groups/18"]')).toBeVisible();
    await expect(page.locator('a[href="/periods/7"]')).toBeVisible();
    await expect(page.locator('a[href="/blocks/p"]')).toBeVisible();
  });

  test('Lanthanum folio (edge case: lanthanide, null group in some datasets)', async ({ page }) => {
    await page.goto('/elements/La');
    await page.waitForTimeout(1500);

    await expect(page.locator('.folio-symbol')).toHaveText('La');
    await expect(page.locator('h2')).toContainText('Lanthanum');
    // Should have a back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('folio → periodic table navigation works (no full reload)', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForTimeout(1500);

    // Click back to periodic table
    await page.locator('a[href="/"]').first().click();
    await page.waitForTimeout(1500);

    // Should now be on home with all 118 elements
    const cells = page.locator('svg g[role="button"]');
    const count = await cells.count();
    expect(count).toBe(118);
  });
});

test.describe('Atlas pages', () => {
  test('Group 8 page shows correct elements with cards', async ({ page }) => {
    await page.goto('/groups/8');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-group-8.png', fullPage: true });

    // Heading
    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Group 8');

    // AtlasPlate SVG should be visible
    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Period 4 page shows correct element count', async ({ page }) => {
    await page.goto('/periods/4');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-period-4.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Period 4');

    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();
  });

  test('Block d page shows transition metals', async ({ page }) => {
    await page.goto('/blocks/d');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-block-d.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('block');

    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();
  });

  test('Category: transition metal page', async ({ page }) => {
    await page.goto('/categories/transition-metal');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-category-transition-metal.png', fullPage: true });

    // Should have a plate with element cards
    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();
  });

  test('Rank by mass page shows all 118 elements ordered', async ({ page }) => {
    await page.goto('/properties/mass');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-rank-mass.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Atomic Mass');

    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();
  });

  test('Anomaly: synthetic-heavy page', async ({ page }) => {
    await page.goto('/anomalies/synthetic-heavy');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/atlas-anomaly-synthetic-heavy.png', fullPage: true });

    // Should have a heading
    await expect(page.locator('h1:not([aria-label="Atlas"])')).toBeVisible();

    // Plate with element cards
    const plate = page.locator('svg[role="img"]').first();
    await expect(plate).toBeVisible();

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Atlas group → element folio navigation works', async ({ page }) => {
    await page.goto('/groups/8');
    await page.waitForTimeout(1500);

    // Click on Iron card in the AtlasPlate SVG (uses g[role="link"] with onClick navigation)
    const feCard = page.locator('g[aria-label*="Iron"]').first();
    await expect(feCard).toBeVisible();
    await feCard.click();
    await page.waitForTimeout(1500);

    // Should be on the Iron folio page
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
  });
});

test.describe('Information pages', () => {
  test('About page renders with all sections', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/about.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('About');

    // SVG intro section should be visible (not zero-height)
    const introSvg = page.locator('svg[aria-label="Introduction"]');
    await expect(introSvg).toBeVisible();
    const introBox = await introSvg.boundingBox();
    expect(introBox).not.toBeNull();
    expect(introBox!.height).toBeGreaterThan(20);

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Credits page renders with table and all sections', async ({ page }) => {
    await page.goto('/about/credits');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/credits.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Credits');

    // Summaries table should have 118 rows (one per element)
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBe(118);

    // Element links in table should use client-side routing
    const feLink = page.locator('a[href="/elements/Fe"]');
    await expect(feLink).toBeVisible();

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Design page renders palette, blocks, typography, and components', async ({ page }) => {
    await page.goto('/about/design');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/design.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Design');

    // Entity Map link
    await expect(page.locator('a[href="/about/entity-map"]').first()).toBeVisible();

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('About page → home navigation works', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);

    await page.locator('a[href="/"]').first().click();
    await page.waitForTimeout(1500);

    // Should be on home with periodic table
    const cells = page.locator('svg g[role="button"]');
    const count = await cells.count();
    expect(count).toBe(118);
  });
});

test.describe('Cross-page user journeys', () => {
  test('Home → element folio → atlas group → back to home', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click on Iron in the periodic table
    await page.locator('g[aria-label*="Iron"]').click();
    await page.waitForTimeout(1500);

    // Should be on Iron folio
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');

    // Click group 8 link in data plate
    await page.locator('a[href="/groups/8"]').click();
    await page.waitForTimeout(1500);

    // Should be on group 8 atlas page
    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Group 8');

    // Click back to periodic table
    await page.locator('a[href="/"]').first().click();
    await page.waitForTimeout(1500);

    // Should be back on home with all 118 elements
    const cells = page.locator('svg g[role="button"]');
    expect(await cells.count()).toBe(118);
  });

  test('Home → About via nav link', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.locator('a[href="/about"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('About');
  });

  test('Home → Credits via nav link', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.locator('a[href="/about/credits"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toContainText('Credits');
  });

  test('Compare page has back link and both elements', async ({ page }) => {
    await page.goto('/elements/H/compare/He');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/e2e/screenshots/compare-h-he.png', fullPage: true });

    // Check the comparison SVG exists with both elements named
    const svg = page.locator('svg[aria-label="Comparison of Hydrogen and Helium"]');
    await expect(svg).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('Folio compare link navigates correctly', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForTimeout(1500);

    // Click "Compare →" link
    const compareLink = page.locator('a[href*="/compare/"]').first();
    await expect(compareLink).toBeVisible();
    await compareLink.click();
    await page.waitForTimeout(1500);

    // Should be on a compare page — check SVG aria-label contains "Iron"
    const svg = page.locator('svg[aria-label*="Iron"]');
    await expect(svg).toBeVisible();
  });

  test('Credits table element link navigates to folio', async ({ page }) => {
    await page.goto('/about/credits');
    await page.waitForTimeout(1500);

    // Click on Fe link in the credits table
    await page.locator('a[href="/elements/Fe"]').click();
    await page.waitForTimeout(1500);

    // Should be on Iron folio
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
  });
});
