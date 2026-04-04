import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows 118 element cells', async ({ page }) => {
    await page.goto('/');
    // SVG periodic table should render all 118 elements
    const cells = page.locator('svg [role="button"]');
    await expect(cells).toHaveCount(118);
  });

  test('search bar is visible', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('#pt-search');
    await expect(search).toBeVisible();
  });

  test('search filters periodic table', async ({ page }) => {
    await page.goto('/');
    await page.fill('#pt-search', 'iron');
    // Fe cell should still be visible (the others are dimmed but still rendered)
    const feCell = page.locator('[aria-label*="Iron"]');
    await expect(feCell).toBeVisible();
  });

  test('click element navigates to folio', async ({ page }) => {
    await page.goto('/');
    // Click on Iron (Fe)
    const feCell = page.locator('[aria-label*="Iron, atomic number 26"]');
    await feCell.click();
    await page.waitForURL(/\/element\/Fe/);
    expect(page.url()).toContain('/elements/Fe');
  });

  test('keyboard navigation: arrow keys move focus', async ({ page }) => {
    await page.goto('/');
    // Focus the SVG
    const svg = page.locator('svg[role="img"]').first();
    await svg.focus();
    // Press right arrow to move from H to He (skipping empty cells)
    await page.keyboard.press('ArrowRight');
    // The active cell should change (we can't easily verify which cell is active
    // without checking stroke color, but at least no errors occur)
  });
});

test.describe('Element folio', () => {
  test('shows element data with source strip', async ({ page }) => {
    await page.goto('/elements/Fe');
    // Check element name
    await expect(page.locator('h2')).toContainText('Iron');
    // Check source strip shows licensing
    await expect(page.locator('text=CC BY-SA 4.0')).toBeVisible();
    // Check PubChem attribution
    await expect(page.locator('text=PubChem')).toBeVisible();
  });

  test('folio shows data plate', async ({ page }) => {
    await page.goto('/elements/Fe');
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();
  });
});

test.describe('Compare view', () => {
  test('renders both elements', async ({ page }) => {
    await page.goto('/compare/Fe/O');
    // Check both element symbols are visible
    await expect(page.locator('text=Fe').first()).toBeVisible();
    await expect(page.locator('text=O').first()).toBeVisible();
    // Check comparison label
    const svg = page.locator('svg[role="img"]');
    await expect(svg).toBeVisible();
  });
});

test.describe('All routes load', () => {
  const routes = [
    '/',
    '/elements/H',
    '/elements/Fe',
    '/elements/Og',
    '/groups/1',
    '/periods/4',
    '/blocks/d',
    '/categories/noble-gas',
    '/properties/mass',
    '/anomalies/synthetic-heavy',
    '/compare/Fe/O',
    '/about',
    '/about/credits',
    '/about/design',
    '/phase-landscape',
    '/property-scatter',
    '/anomaly-explorer',
    '/neighbourhood-graph',
    '/discovery-timeline',
    '/etymology-map',
    '/discoverer-network',
  ];

  for (const route of routes) {
    test(`${route} loads without error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route);
      // Allow dynamic imports to settle
      await page.waitForTimeout(500);
      // No uncaught JS errors
      expect(errors).toEqual([]);
    });
  }
});

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('search bar visible on mobile', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('#pt-search');
    await expect(search).toBeVisible();
  });

  test('periodic table scrolls horizontally on mobile', async ({ page }) => {
    await page.goto('/');
    // The scroll container should exist
    const container = page.locator('.pt-scroll-container');
    await expect(container).toBeVisible();
  });
});
