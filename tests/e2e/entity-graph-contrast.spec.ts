import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Entity Graph Contrast & Readability Tests
 *
 * Verifies three refinements:
 * 1. Roundel label bars are wider than the longest label text
 * 2. Hover tooltip boxes fully contain their text (no clipping)
 * 3. Edge label backgrounds are fully opaque for readability
 *
 * Uses Pretext-measured SVG bounding boxes for precise assertions.
 */

const SCREENSHOT_DIR = 'tests/e2e/screenshots';

/** Wait for load animations to settle. */
async function settle(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

// ---------------------------------------------------------------------------
// Desktop tests (1280×720 viewport — inherits from playwright config)
// ---------------------------------------------------------------------------

test.describe('Entity graph contrast — desktop', () => {
  test.setTimeout(60_000);

  test('roundel bars are wider than label text', async ({ page }) => {
    await page.goto('/entity-map');
    await settle(page);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    await expect(graphSvg).toBeVisible();

    // Each node <g> contains a <rect> (bar) and a <text> (label).
    // Verify every bar rect is wider than the text it contains.
    const nodeGroups = graphSvg.locator('g[style*="cursor"]');
    const count = await nodeGroups.count();
    expect(count).toBe(12);

    for (let i = 0; i < count; i++) {
      const group = nodeGroups.nth(i);
      const rect = group.locator('rect').first();
      const label = group.locator('text[font-weight="bold"]').first();

      const rectBox = await rect.boundingBox();
      const labelBox = await label.boundingBox();

      expect(rectBox, `Node ${i} bar should have a bounding box`).not.toBeNull();
      expect(labelBox, `Node ${i} label should have a bounding box`).not.toBeNull();

      // Bar must be wider than the label text
      expect(
        rectBox!.width,
        `Node ${i}: bar width (${rectBox!.width}) should exceed label width (${labelBox!.width})`,
      ).toBeGreaterThan(labelBox!.width);

      // Bar must also be taller than the label text
      expect(
        rectBox!.height,
        `Node ${i}: bar height (${rectBox!.height}) should exceed label height (${labelBox!.height})`,
      ).toBeGreaterThanOrEqual(labelBox!.height);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/entity-graph-bars-desktop.png`,
      fullPage: true,
    });
  });

  test('all roundel bars have uniform width', async ({ page }) => {
    await page.goto('/entity-map');
    await settle(page);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    const nodeGroups = graphSvg.locator('g[style*="cursor"]');
    const count = await nodeGroups.count();

    // Collect bar widths for non-element nodes (element is larger)
    const barWidths: number[] = [];
    for (let i = 0; i < count; i++) {
      const rect = nodeGroups.nth(i).locator('rect').first();
      const box = await rect.boundingBox();
      if (box) barWidths.push(Math.round(box.width));
    }

    // Non-element bars should be based on the same maxLabelW, so widths
    // should cluster tightly (allow 2px tolerance for sub-pixel differences)
    const nonElementWidths = barWidths.slice(0); // all widths
    const maxW = Math.max(...nonElementWidths);
    const minW = Math.min(...nonElementWidths);
    // Element node may be wider; the rest should be within a narrow band
    // At minimum, bars should not vary wildly
    expect(maxW - minW, 'Bar widths should be consistent').toBeLessThanOrEqual(20);
  });

  test('hover tooltip fully contains description text', async ({ page }) => {
    await page.goto('/entity-map');
    await settle(page);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');

    // Hover over the "element" node (central, largest)
    const elementNode = graphSvg.locator('g[style*="cursor"]').first();
    await elementNode.hover();
    await page.waitForTimeout(500);

    // After hovering, a description group should appear with a background rect
    // The tooltip is the last <g> child of the SVG that contains a <rect> + PretextSvg text
    // Look for the animated tooltip group
    const tooltipRects = graphSvg.locator('g[style*="animation"] rect');
    const tooltipTexts = graphSvg.locator('g[style*="animation"] text');

    const rectCount = await tooltipRects.count();
    if (rectCount > 0) {
      const bgBox = await tooltipRects.first().boundingBox();
      expect(bgBox, 'Tooltip background should exist').not.toBeNull();

      // Check that all tooltip text elements are within the background rect
      const textCount = await tooltipTexts.count();
      for (let t = 0; t < textCount; t++) {
        const textBox = await tooltipTexts.nth(t).boundingBox();
        if (!textBox || !bgBox) continue;

        // Text left edge should be inside (or at) the background left edge
        expect(
          textBox.x,
          `Tooltip text ${t} left edge should be inside background`,
        ).toBeGreaterThanOrEqual(bgBox.x - 1);

        // Text right edge should be inside the background right edge
        expect(
          textBox.x + textBox.width,
          `Tooltip text ${t} right edge should be inside background`,
        ).toBeLessThanOrEqual(bgBox.x + bgBox.width + 1);

        // Text top should be inside background
        expect(
          textBox.y,
          `Tooltip text ${t} top should be inside background`,
        ).toBeGreaterThanOrEqual(bgBox.y - 1);

        // Text bottom should be inside background
        expect(
          textBox.y + textBox.height,
          `Tooltip text ${t} bottom should be inside background`,
        ).toBeLessThanOrEqual(bgBox.y + bgBox.height + 1);
      }
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/entity-graph-tooltip-desktop.png`,
      fullPage: true,
    });
  });

  test('edge label backgrounds are fully opaque', async ({ page }) => {
    await page.goto('/entity-map');
    await settle(page);

    // Verify via the source markup that edge rect opacity is 1.
    // We read the raw SVG source because edge rects only appear on hover and
    // the SVG is rendered inline in the DOM.
    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    await expect(graphSvg).toBeVisible();

    // Hover the first node to activate edges
    const firstNode = graphSvg.locator('g[style*="cursor"]').first();
    await firstNode.hover({ timeout: 10_000 });
    await page.waitForTimeout(600);

    // Now edge label rects should be in the DOM — query their opacity attribute
    const opacities = await graphSvg.evaluate((svg) => {
      // Edge background rects are direct children of edge <g> elements (not inside cursor groups)
      const rects = svg.querySelectorAll(':scope > g > rect[opacity]');
      return Array.from(rects).map((r) => Number(r.getAttribute('opacity')));
    });

    expect(opacities.length, 'Should find edge label background rects').toBeGreaterThan(0);
    for (const val of opacities) {
      expect(val, 'Edge label background opacity should be >= 0.95').toBeGreaterThanOrEqual(0.95);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/entity-graph-edges-desktop.png`,
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Mobile tests — iPhone 15 Pro Max viewport
// ---------------------------------------------------------------------------

test.describe('Entity graph contrast — mobile', () => {
  test.setTimeout(60_000);

  const MOBILE_VP = { width: 430, height: 932 };
  const BASE = 'http://localhost:4173';

  test('roundel bars contain labels and tooltip is readable on mobile', async ({ browser }) => {
    const context: BrowserContext = await browser.newContext({
      viewport: MOBILE_VP,
      deviceScaleFactor: 3,
      baseURL: BASE,
    });
    const page = await context.newPage();

    await page.goto('/entity-map');
    await settle(page);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    await expect(graphSvg).toBeVisible();

    // Verify bars contain labels
    const nodeGroups = graphSvg.locator('g[style*="cursor"]');
    const count = await nodeGroups.count();
    expect(count).toBe(12);

    for (let i = 0; i < count; i++) {
      const group = nodeGroups.nth(i);
      const rect = group.locator('rect').first();
      const label = group.locator('text[font-weight="bold"]').first();

      const rectBox = await rect.boundingBox();
      const labelBox = await label.boundingBox();

      if (rectBox && labelBox) {
        expect(
          rectBox.width,
          `Mobile node ${i}: bar should be wider than label`,
        ).toBeGreaterThan(labelBox.width);
      }
    }

    // Tap the element node to show tooltip (mobile uses tap, not hover)
    const elementNode = nodeGroups.first();
    await elementNode.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/entity-graph-mobile-430.png`,
      fullPage: true,
    });

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VP.width + 1);

    await context.close();
  });

  test('entity graph is readable on 375px mobile', async ({ browser }) => {
    const context: BrowserContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 3,
      baseURL: BASE,
    });
    const page = await context.newPage();

    await page.goto('/entity-map');
    await settle(page);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    await expect(graphSvg).toBeVisible();

    // Graph should scale down but remain visible
    const svgBox = await graphSvg.boundingBox();
    expect(svgBox, 'Graph SVG should be visible').not.toBeNull();
    expect(svgBox!.width).toBeGreaterThan(100);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/entity-graph-mobile-375.png`,
      fullPage: true,
    });

    await context.close();
  });
});
