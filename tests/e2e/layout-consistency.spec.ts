import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Property-based layout consistency tests
//
// These tests apply PBT principles: instead of checking one page at a time,
// they assert universal properties ("for all pages, X holds") across the
// full set of routes, catching regressions that single-page tests miss.
// ---------------------------------------------------------------------------

const VIZ_ROUTES = [
  '/',
  '/phase-landscape',
  '/property-scatter',
  '/anomaly-explorer',
  '/discovery-timeline',
  '/etymology-map',
  '/discoverer-network',
] as const;

const ALL_PAGES = [
  ...VIZ_ROUTES,
  '/about',
  '/about/credits',
  '/about/design',
  '/elements/Fe',
  '/about/entity-map',
] as const;

const DROP_CAP_PAGES = [
  '/discovery-timeline',
  '/etymology-map',
  '/discoverer-network',
] as const;

// ---------------------------------------------------------------------------
// 1. Wordmark consistency (desktop viewport)
// ---------------------------------------------------------------------------

test.describe('Wordmark consistency (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('ATLAS wordmark is visible at the same position on every page', async ({ page }) => {
    const positions: { route: string; x: number; y: number }[] = [];

    for (const route of ALL_PAGES) {
      await page.goto(route);
      await page.waitForTimeout(2000);

      const wordmark = page.locator('h1[aria-label="Atlas"]');
      await expect(wordmark, `Wordmark should be visible on ${route}`).toBeVisible();

      const box = await wordmark.boundingBox();
      expect(box, `Wordmark bounding box should exist on ${route}`).not.toBeNull();
      positions.push({ route, x: Math.round(box!.x), y: Math.round(box!.y) });
    }

    // Property: all wordmark positions must be identical (within 2px tolerance)
    const refX = positions[0].x;
    const refY = positions[0].y;
    for (const { route, x, y } of positions) {
      expect(
        Math.abs(x - refX),
        `Wordmark x on ${route} (${x}) should match ${ALL_PAGES[0]} (${refX})`,
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(y - refY),
        `Wordmark y on ${route} (${y}) should match ${ALL_PAGES[0]} (${refY})`,
      ).toBeLessThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. PageShell grid structure
// ---------------------------------------------------------------------------

test.describe('PageShell grid structure', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of ALL_PAGES) {
    test(`${route} has correct PageShell grid layout`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(2000);

      // .page-shell exists and uses CSS grid
      const shell = page.locator('.page-shell');
      await expect(shell, `page-shell should exist on ${route}`).toBeVisible();

      const display = await shell.evaluate((el) => getComputedStyle(el).display);
      expect(display, `page-shell should use grid layout on ${route}`).toBe('grid');

      // .page-shell-content (main area) exists
      const content = page.locator('.page-shell-content');
      await expect(content, `page-shell-content should exist on ${route}`).toBeVisible();

      // .page-shell-footer exists
      const footer = page.locator('.page-shell-footer');
      await expect(footer, `page-shell-footer should exist on ${route}`).toBeVisible();

      // Structural property: footer should be below content
      const contentBox = await content.boundingBox();
      const footerBox = await footer.boundingBox();
      expect(contentBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(
        footerBox!.y,
        `Footer should be below content on ${route}`,
      ).toBeGreaterThanOrEqual(contentBox!.y);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Anomaly Explorer filter visibility
// ---------------------------------------------------------------------------

test.describe('Anomaly Explorer filter visibility', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('clicking each anomaly filter produces visible, non-overlapping highlights', async ({
    page,
  }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    // Gather all anomaly filter buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount, 'Should have anomaly filter buttons').toBeGreaterThan(0);

    for (let b = 0; b < buttonCount; b++) {
      const buttonText = await buttons.nth(b).textContent();

      // Click the anomaly button and wait for ripple animations to finish
      await buttons.nth(b).click();
      await page.waitForTimeout(1500);

      // Find highlighted element cells by querying the DOM for rects with
      // the highlight colour (WARM_RED = #9e1c2c). Each element <g> has a
      // single <rect> whose fill indicates its state. Use the SVG transform
      // attribute on <g> to get the logical position (immune to CSS animation).
      const highlightedGs = await page.$$eval(
        'svg g[style*="cursor: pointer"]',
        (groups) =>
          groups
            .filter((g) => {
              const rect = g.querySelector('rect');
              return rect && rect.getAttribute('fill') === '#9e1c2c';
            })
            .map((g) => {
              // Parse translate(x, y) from the transform attribute
              const t = g.getAttribute('transform') ?? '';
              const m = t.match(/translate\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
              const x = m ? parseFloat(m[1]) : 0;
              const y = m ? parseFloat(m[2]) : 0;
              const rect = g.querySelector('rect')!;
              const w = parseFloat(rect.getAttribute('width') ?? '0');
              return { x: Math.round(x), y: Math.round(y), w: Math.round(w) };
            }),
      );

      if (highlightedGs.length === 0) continue;

      // Property: every highlighted element should have a non-zero width
      for (let i = 0; i < highlightedGs.length; i++) {
        expect(
          highlightedGs[i].w,
          `Filter "${buttonText}": highlighted element ${i} should have non-zero width`,
        ).toBeGreaterThan(0);
      }

      // Property: no two highlighted elements should occupy the exact same
      // grid cell (stacked at identical x,y indicates a layout bug).
      // Use 3px tolerance to account for sub-pixel rounding.
      for (let i = 0; i < highlightedGs.length; i++) {
        for (let j = i + 1; j < highlightedGs.length; j++) {
          const dx = Math.abs(highlightedGs[i].x - highlightedGs[j].x);
          const dy = Math.abs(highlightedGs[i].y - highlightedGs[j].y);
          expect(
            dx > 3 || dy > 3,
            `Filter "${buttonText}": elements ${i} and ${j} overlap at ~(${highlightedGs[i].x},${highlightedGs[i].y})`,
          ).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Drop cap text readability
// ---------------------------------------------------------------------------

test.describe('Drop cap text readability', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of DROP_CAP_PAGES) {
    test(`${route} has readable introductory text (non-zero width SVG text)`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForTimeout(2000);

      // Find SVG text elements near the top of the page content.
      // The intro/drop-cap text is rendered as SVG <text> elements within
      // the main content area.
      const svgTextElements = page.locator('.page-shell-content svg text');
      const totalTextCount = await svgTextElements.count();
      expect(
        totalTextCount,
        `${route} should have SVG text elements`,
      ).toBeGreaterThan(0);

      // Collect bounding boxes of the first few text elements that are
      // near the top of the SVG (within the upper portion of the page).
      // We check the first 3 visible text elements for readability.
      let checkedCount = 0;
      const maxToCheck = 3;

      for (let i = 0; i < totalTextCount && checkedCount < maxToCheck; i++) {
        const textEl = svgTextElements.nth(i);
        const box = await textEl.boundingBox();

        if (!box) continue;

        // Property: text elements should have non-zero width (they are rendered
        // and visible, not collapsed or hidden)
        expect(
          box.width,
          `${route}: SVG text element ${i} should have non-zero width`,
        ).toBeGreaterThan(0);
        expect(
          box.height,
          `${route}: SVG text element ${i} should have non-zero height`,
        ).toBeGreaterThan(0);

        checkedCount++;
      }

      expect(
        checkedCount,
        `${route} should have at least 2 visible SVG text elements near the top`,
      ).toBeGreaterThanOrEqual(2);
    });
  }
});
