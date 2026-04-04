import { test, expect } from '@playwright/test';

// All visualization pages that show in VizNav
const VIZ_PAGES = [
  '/',
  '/phase-landscape',
  '/neighbourhood-graph',
  '/anomaly-explorer',
  '/property-scatter',
  '/discovery-timeline',
  '/etymology-map',
  '/discoverer-network',
];

// Pages that show a periodic table grid
const TABLE_PAGES = [
  '/',
  '/phase-landscape',
  '/neighbourhood-graph',
  '/anomaly-explorer',
];

test.describe('Structural audit — PBT constraints', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  // 1. VizNav tab order: table-showing pages should appear first
  test('VizNav tabs show table-pages before non-table pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const navLinks = page.locator('nav[aria-label="Visualisation pages"] a');
    const count = await navLinks.count();
    expect(count).toBe(8);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      hrefs.push(href ?? '');
    }

    // First 4 should be table pages
    const tablePageSet = new Set(TABLE_PAGES);
    for (let i = 0; i < 4; i++) {
      expect(
        tablePageSet.has(hrefs[i]),
        `Tab position ${i} (${hrefs[i]}) should be a table-showing page`
      ).toBe(true);
    }
  });

  // 2. Every visualization page has a title heading
  test('every visualization page has a visible h1 title', async ({ page }) => {
    for (const path of VIZ_PAGES) {
      await page.goto(path);
      await page.waitForTimeout(1500);

      // PageShell renders an h1 wordmark on desktop; check for at least one h1
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(
        h1Count,
        `Page ${path} should have an h1 heading`
      ).toBeGreaterThanOrEqual(1);

      const visible = await h1.first().isVisible();
      expect(visible, `h1 on ${path} should be visible`).toBe(true);
    }
  });

  // 3. No page has JS console errors
  test('no visualization page produces console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`${msg.text()}`);
    });

    for (const path of VIZ_PAGES) {
      await page.goto(path);
      await page.waitForTimeout(1500);
    }

    // Filter out known benign errors (like failed network requests in test env)
    const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
    expect(
      realErrors,
      `Console errors found: ${realErrors.join(', ')}`
    ).toHaveLength(0);
  });

  // 4. Keyboard overlay is accessible via ? key
  test('keyboard help overlay opens with ? key and closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Press ? to open — dispatch key event directly since Shift+/ varies by layout
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    });

    const dialog = page.locator('[role="dialog"][aria-label="Keyboard shortcuts"]');
    await expect(dialog).toBeVisible({ timeout: 2000 });

    // Check that "Keyboard Controls" text is present and not clipped
    const text = await dialog.locator('div').first().textContent();
    expect(text).toContain('Keyboard Controls');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  // 5. Entity Graph nodes use roundel design (always filled, white text)
  test('Entity Graph nodes have white text on colored backgrounds', async ({ page }) => {
    await page.goto('/about/entity-map');
    await page.waitForTimeout(2000);

    // Find SVG node text elements
    const nodeTexts = page.locator('svg[aria-label*="Entity"] g[style*="cursor: pointer"] text[text-anchor="middle"][dominant-baseline="middle"]');
    const count = await nodeTexts.count();
    expect(count, 'Entity graph should have node labels').toBeGreaterThan(0);

    // Check that node text uses PAPER color (#f7f2e8)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const fill = await nodeTexts.nth(i).getAttribute('fill');
      expect(
        fill,
        `Node text ${i} fill should be PAPER (#f7f2e8) for roundel readability`
      ).toBe('#f7f2e8');
    }
  });

  // 6. Timeline has filters above visualization
  test('Timeline page has era browse links above the SVG chart', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(1500);

    const browseSection = page.locator('h2:has-text("Browse by Era")');
    const svg = page.locator('svg[role="img"]');

    await expect(browseSection).toBeVisible();
    await expect(svg).toBeVisible();

    const browseBox = await browseSection.boundingBox();
    const svgBox = await svg.boundingBox();

    expect(browseBox).not.toBeNull();
    expect(svgBox).not.toBeNull();

    expect(
      browseBox!.y,
      'Browse by Era section should be above the SVG chart'
    ).toBeLessThan(svgBox!.y);
  });
});
