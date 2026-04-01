import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Page stability tests — verify structural consistency across navigation
// ---------------------------------------------------------------------------

const VIZ_ROUTES = [
  '/',
  '/phase-landscape',
  '/property-scatter',
  '/anomaly-explorer',
  '/neighborhood-graph',
  '/discovery-timeline',
  '/etymology-map',
  '/discoverer-network',
] as const;

const SITE_NAV_LINKS = ['Atlas', 'About', 'Credits', 'Design', 'Entity Map'] as const;

// ---------------------------------------------------------------------------
// 1. Header / VizNav stability across viz pages
// ---------------------------------------------------------------------------

test.describe('VizNav stability', () => {
  test('VizNav stays at the same vertical position across all viz pages', async ({ page }) => {
    const navYPositions: { route: string; y: number }[] = [];

    for (const route of VIZ_ROUTES) {
      await page.goto(route);

      const vizNav = page.locator('nav[aria-label="Visualisation pages"]');
      await expect(vizNav).toBeVisible();

      const box = await vizNav.boundingBox();
      expect(box, `VizNav should be visible on ${route}`).not.toBeNull();
      navYPositions.push({ route, y: Math.round(box!.y) });

      await page.screenshot({
        path: `tests/e2e/screenshots/stability-viznav-${route.replace(/\//g, '_') || 'home'}.png`,
        fullPage: false,
      });
    }

    // All VizNav y-positions should be within 2px of each other
    const firstY = navYPositions[0].y;
    for (const { route, y } of navYPositions) {
      expect(
        Math.abs(y - firstY),
        `VizNav y on ${route} (${y}) should match home (${firstY})`,
      ).toBeLessThanOrEqual(2);
    }
  });

  test('VizNav contains all 8 expected links on every viz page', async ({ page }) => {
    const expectedLabels = [
      'Table', 'Phase', 'Scatter', 'Anomalies',
      'Neighbours', 'Timeline', 'Etymology', 'Discoverers',
    ];

    for (const route of VIZ_ROUTES) {
      await page.goto(route);

      const vizNav = page.locator('nav[aria-label="Visualisation pages"]');
      await expect(vizNav).toBeVisible();

      const links = vizNav.locator('a');
      await expect(links).toHaveCount(8);

      for (const label of expectedLabels) {
        await expect(
          vizNav.locator(`a:has-text("${label}")`),
          `VizNav should contain "${label}" on ${route}`,
        ).toBeVisible();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Footer / SiteNav stability
// ---------------------------------------------------------------------------

const ALL_PAGES = [
  ...VIZ_ROUTES,
  '/about',
  '/credits',
  '/design',
  '/element/Fe',
  '/entity-map',
];

test.describe('SiteNav footer stability', () => {
  test('SiteNav footer exists and contains correct links on every page', async ({ page }) => {
    for (const route of ALL_PAGES) {
      await page.goto(route);

      // SiteNav is the nav at the bottom with the keyboard shortcut hint
      const siteNav = page.locator('nav').filter({ hasText: 'keyboard shortcuts' });
      await expect(siteNav, `SiteNav should exist on ${route}`).toBeVisible();

      for (const linkText of SITE_NAV_LINKS) {
        await expect(
          siteNav.locator(`a:has-text("${linkText}")`),
          `SiteNav should have "${linkText}" link on ${route}`,
        ).toBeVisible();
      }
    }
  });

  test('SiteNav link count is consistent across pages', async ({ page }) => {
    let expectedCount: number | null = null;

    for (const route of ALL_PAGES) {
      await page.goto(route);

      const siteNav = page.locator('nav').filter({ hasText: 'keyboard shortcuts' });
      await expect(siteNav).toBeVisible();
      const linkCount = await siteNav.locator('a').count();

      if (expectedCount === null) {
        expectedCount = linkCount;
      } else {
        expect(linkCount, `SiteNav link count on ${route} should match`).toBe(expectedCount);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Navigation round-trip stability
// ---------------------------------------------------------------------------

test.describe('Navigation round-trip stability', () => {
  test('Home -> Fe -> Home produces consistent layout', async ({ page }) => {
    // First visit: wait for layout to stabilise
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    const vizNavBefore = await page
      .locator('nav[aria-label="Visualisation pages"]')
      .boundingBox();
    expect(vizNavBefore).not.toBeNull();

    // Navigate to Fe
    await page.goto('/element/Fe');
    await expect(page.locator('[data-testid="data-plate"]')).toBeVisible();
    await page.screenshot({
      path: 'tests/e2e/screenshots/stability-roundtrip-fe.png',
      fullPage: true,
    });

    // Navigate back to home
    await page.locator('a[href="/"]').first().click();
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    // Verify VizNav is present and at same position
    const vizNav = page.locator('nav[aria-label="Visualisation pages"]');
    await expect(vizNav).toBeVisible();
    const vizNavAfter = await vizNav.boundingBox();
    expect(vizNavAfter).not.toBeNull();

    // VizNav position should be stable across round-trip
    expect(
      Math.abs(vizNavAfter!.y - vizNavBefore!.y),
      'VizNav y should match after Fe round-trip',
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs(vizNavAfter!.x - vizNavBefore!.x),
      'VizNav x should match after Fe round-trip',
    ).toBeLessThanOrEqual(2);

    // Verify 118 elements still render
    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);
  });

  test('Home -> About -> Home produces consistent layout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    const vizNavBefore = await page
      .locator('nav[aria-label="Visualisation pages"]')
      .boundingBox();
    expect(vizNavBefore).not.toBeNull();

    // Go to About
    await page.locator('a[href="/about"]').first().click();
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/e2e/screenshots/stability-roundtrip-about.png',
      fullPage: true,
    });

    // Back to Home
    await page.locator('a[href="/"]').first().click();
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    const vizNavAfter = await page
      .locator('nav[aria-label="Visualisation pages"]')
      .boundingBox();
    expect(vizNavAfter).not.toBeNull();

    // VizNav should be at the same position
    expect(
      Math.abs(vizNavAfter!.y - vizNavBefore!.y),
      'VizNav y should match after About round-trip',
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs(vizNavAfter!.x - vizNavBefore!.x),
      'VizNav x should match after About round-trip',
    ).toBeLessThanOrEqual(2);

    // Elements should be back
    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);
  });

  test('Home -> Discovery Timeline -> Home produces consistent layout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    const vizNavBefore = await page
      .locator('nav[aria-label="Visualisation pages"]')
      .boundingBox();
    expect(vizNavBefore).not.toBeNull();

    // Go to Discovery Timeline
    const timelineLink = page.locator(
      'nav[aria-label="Visualisation pages"] a:has-text("Timeline")',
    );
    await timelineLink.click();
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/e2e/screenshots/stability-roundtrip-timeline.png',
      fullPage: true,
    });

    // Back to Home via VizNav
    const tableLink = page.locator(
      'nav[aria-label="Visualisation pages"] a:has-text("Table")',
    );
    await tableLink.click();
    await expect(page.locator('nav[aria-label="Visualisation pages"]')).toBeVisible();

    const vizNavAfter = await page
      .locator('nav[aria-label="Visualisation pages"]')
      .boundingBox();
    expect(vizNavAfter).not.toBeNull();

    expect(
      Math.abs(vizNavAfter!.y - vizNavBefore!.y),
      'VizNav y should match after Timeline round-trip',
    ).toBeLessThanOrEqual(2);

    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);
  });
});

// ---------------------------------------------------------------------------
// 4. Content doesn't shift (no CLS)
// ---------------------------------------------------------------------------

test.describe('No content layout shift', () => {
  for (const route of VIZ_ROUTES) {
    test(`no layout shift on ${route}`, async ({ page }) => {
      await page.goto(route);
      // Wait for layout to stabilise
      const vizNav = page.locator('nav[aria-label="Visualisation pages"]');
      await expect(vizNav).toBeVisible();
      const navBoxBefore = await vizNav.boundingBox();
      expect(navBoxBefore).not.toBeNull();

      // Take first screenshot
      const shot1 = await page.screenshot({ fullPage: true });

      // Wait 500ms for any deferred layout
      await page.waitForTimeout(500);

      // Measure again
      const navBoxAfter = await vizNav.boundingBox();
      expect(navBoxAfter).not.toBeNull();

      // Take second screenshot
      const shot2 = await page.screenshot({ fullPage: true });

      // VizNav should not have shifted
      expect(
        Math.abs(navBoxAfter!.y - navBoxBefore!.y),
        `VizNav should not shift vertically on ${route}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(navBoxAfter!.x - navBoxBefore!.x),
        `VizNav should not shift horizontally on ${route}`,
      ).toBeLessThanOrEqual(1);

      // Screenshot sizes should be very similar (no major reflow)
      const sizeDiff = Math.abs(shot1.length - shot2.length);
      const sizeRatio = sizeDiff / shot1.length;
      expect(
        sizeRatio,
        `Screenshot size should be stable on ${route} (ratio: ${sizeRatio.toFixed(4)})`,
      ).toBeLessThan(0.05);
    });
  }

  for (const route of ['/about', '/credits', '/design', '/element/Fe']) {
    test(`no layout shift on ${route}`, async ({ page }) => {
      await page.goto(route);
      // Use SiteNav as the stability anchor on non-viz pages
      const siteNav = page.locator('nav').filter({ hasText: 'keyboard shortcuts' });
      await expect(siteNav).toBeVisible();
      const navBoxBefore = await siteNav.boundingBox();
      expect(navBoxBefore).not.toBeNull();

      const shot1 = await page.screenshot({ fullPage: true });

      await page.waitForTimeout(500);

      const navBoxAfter = await siteNav.boundingBox();
      expect(navBoxAfter).not.toBeNull();

      const shot2 = await page.screenshot({ fullPage: true });

      // SiteNav should not shift
      expect(
        Math.abs(navBoxAfter!.y - navBoxBefore!.y),
        `SiteNav should not shift vertically on ${route}`,
      ).toBeLessThanOrEqual(2);

      // Element folios have complex animations; allow larger tolerance
      const threshold = route.startsWith('/element/') ? 0.25 : 0.05;
      const sizeDiff = Math.abs(shot1.length - shot2.length);
      const sizeRatio = sizeDiff / shot1.length;
      expect(
        sizeRatio,
        `Screenshot size should be stable on ${route}`,
      ).toBeLessThan(threshold);
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Cross-page consistency — same structural elements everywhere
// ---------------------------------------------------------------------------

test.describe('Cross-page structural consistency', () => {
  test('VizNav dimensions are consistent across all viz pages', async ({ page }) => {
    const dimensions: { route: string; width: number; height: number }[] = [];

    // Skip Home (/) — it has a 64px wordmark sidebar that intentionally narrows VizNav
    const nonHomeRoutes = VIZ_ROUTES.filter((r) => r !== '/');

    for (const route of nonHomeRoutes) {
      await page.goto(route);

      const vizNav = page.locator('nav[aria-label="Visualisation pages"]');
      await expect(vizNav).toBeVisible();
      const box = await vizNav.boundingBox();
      expect(box, `VizNav should be visible on ${route}`).not.toBeNull();
      dimensions.push({
        route,
        width: Math.round(box!.width),
        height: Math.round(box!.height),
      });
    }

    // Width should be identical (same container), height within 2px (wrapping)
    const firstWidth = dimensions[0].width;
    const firstHeight = dimensions[0].height;
    for (const { route, width, height } of dimensions) {
      expect(
        Math.abs(width - firstWidth),
        `VizNav width on ${route} should match ${nonHomeRoutes[0]}`,
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(height - firstHeight),
        `VizNav height on ${route} should match ${nonHomeRoutes[0]}`,
      ).toBeLessThanOrEqual(2);
    }
  });

  test('SiteNav structure is identical across all page types', async ({ page }) => {
    const navHTMLs: string[] = [];

    for (const route of ALL_PAGES) {
      await page.goto(route);

      const siteNav = page.locator('nav').filter({ hasText: 'keyboard shortcuts' });
      await expect(siteNav).toBeVisible();

      // Extract link hrefs to compare structure
      const links = siteNav.locator('a');
      const count = await links.count();
      const hrefs: string[] = [];
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        hrefs.push(href ?? '');
      }
      navHTMLs.push(hrefs.join(','));
    }

    // All pages should have the same SiteNav link structure
    const first = navHTMLs[0];
    for (let i = 1; i < navHTMLs.length; i++) {
      expect(
        navHTMLs[i],
        `SiteNav links on ${ALL_PAGES[i]} should match ${ALL_PAGES[0]}`,
      ).toBe(first);
    }
  });

  test('back links exist on detail pages', async ({ page }) => {
    const detailPages = [
      '/element/Fe',
      '/element/H',
      '/element/Og',
      '/about',
      '/credits',
      '/design',
    ];

    for (const route of detailPages) {
      await page.goto(route);

      // Every detail page should have a link back to home
      const homeLink = page.locator('a[href="/"]');
      const count = await homeLink.count();
      expect(count, `${route} should have at least one link to home`).toBeGreaterThan(0);
    }
  });
});
