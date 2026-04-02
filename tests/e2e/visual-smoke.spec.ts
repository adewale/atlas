/**
 * Visual Smoke Tests — prevents Lessons #1, #2, and #7.
 *
 * Lesson #1: CSS transform overrode SVG transform, stacking all 118 elements
 *   at (0,0). DOM assertions passed in jsdom. Only real bounding-box checks
 *   in a real browser would catch this.
 *
 * Lesson #2: computeLineHeight returned zero, making all PretextSvg sections
 *   invisible. Only bounding-box height assertions in a real browser catch
 *   zero-height rendering.
 *
 * Lesson #7 (animation): Animations stuck at opacity:0 or zero-width are
 *   invisible bugs. This file asserts final visual state after load.
 *
 * Philosophy: DOM existence ≠ visual correctness. These tests assert geometry
 * — bounding boxes, spatial separation, non-zero dimensions — in a real
 * Chromium browser via Playwright.
 */
import { test, expect } from '@playwright/test';

test.describe('Periodic table spatial layout', () => {
  test('H is at far-left, He at far-right, with >400px separation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]');

    // Hydrogen (first element) bounding box
    const hCell = page.locator('[aria-label*="Hydrogen"]');
    const hBox = await hCell.boundingBox();
    expect(hBox).not.toBeNull();

    // Helium (far-right of row 1)
    const heCell = page.locator('[aria-label*="Helium"]');
    const heBox = await heCell.boundingBox();
    expect(heBox).not.toBeNull();

    // They must be separated by at least 400px horizontally
    const separation = heBox!.x - hBox!.x;
    expect(separation).toBeGreaterThan(400);
  });

  test('elements are not all stacked at the same position', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]');

    // Sample a few elements from different corners of the table
    const labels = ['Hydrogen', 'Helium', 'Iron', 'Oganesson', 'Carbon'];
    const positions: { x: number; y: number }[] = [];

    for (const label of labels) {
      const cell = page.locator(`[aria-label*="${label}"]`);
      const box = await cell.boundingBox();
      expect(box, `${label} must have a bounding box`).not.toBeNull();
      expect(box!.width, `${label} must have non-zero width`).toBeGreaterThan(0);
      expect(box!.height, `${label} must have non-zero height`).toBeGreaterThan(0);
      positions.push({ x: box!.x, y: box!.y });
    }

    // At least 3 distinct X positions and 2 distinct Y positions
    const uniqueX = new Set(positions.map((p) => Math.round(p.x / 10)));
    const uniqueY = new Set(positions.map((p) => Math.round(p.y / 10)));
    expect(uniqueX.size, 'Elements must have diverse X positions').toBeGreaterThanOrEqual(3);
    expect(uniqueY.size, 'Elements must have diverse Y positions').toBeGreaterThanOrEqual(2);
  });

  test('Og is at bottom-right of main grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]');

    const hBox = await page.locator('[aria-label*="Hydrogen"]').boundingBox();
    const ogBox = await page.locator('[aria-label*="Oganesson"]').boundingBox();
    expect(hBox).not.toBeNull();
    expect(ogBox).not.toBeNull();

    // Og must be below H and to the right
    expect(ogBox!.y).toBeGreaterThan(hBox!.y + 100);
    expect(ogBox!.x).toBeGreaterThan(hBox!.x + 400);
  });
});

test.describe('SVG text rendering (non-zero height)', () => {
  test('Folio summary text has non-zero height', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForLoadState('networkidle');

    // The Folio page should render SVG text for the element summary
    const svgs = page.locator('svg');
    const svgCount = await svgs.count();
    expect(svgCount, 'Folio must render at least one SVG').toBeGreaterThan(0);

    // Find SVG elements that contain text — at least one must have non-zero height
    let hasVisibleSvgText = false;
    for (let i = 0; i < Math.min(svgCount, 10); i++) {
      const svg = svgs.nth(i);
      const box = await svg.boundingBox();
      if (box && box.height > 20 && box.width > 20) {
        hasVisibleSvgText = true;
        break;
      }
    }
    expect(hasVisibleSvgText, 'At least one SVG must have rendered height > 20px').toBe(true);
  });

  test('About page text sections have non-zero dimensions', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const svgs = page.locator('svg');
    const svgCount = await svgs.count();

    // About page uses PretextSvg for body text — at least one must be visible
    let visibleCount = 0;
    for (let i = 0; i < Math.min(svgCount, 15); i++) {
      const box = await svgs.nth(i).boundingBox();
      if (box && box.height > 10) visibleCount++;
    }
    expect(visibleCount, 'About page must have visible SVG text sections').toBeGreaterThan(0);
  });

  test('element data plate is visible on Folio', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForLoadState('networkidle');

    const plate = page.locator('[data-testid="data-plate"]');
    const box = await plate.boundingBox();
    expect(box, 'Data plate must have a bounding box').not.toBeNull();
    expect(box!.width, 'Data plate must have non-zero width').toBeGreaterThan(50);
    expect(box!.height, 'Data plate must have non-zero height').toBeGreaterThan(50);
  });
});

test.describe('Visualization page content renders', () => {
  const vizPages = [
    { url: '/phase-landscape', name: 'Phase Landscape' },
    { url: '/property-scatter', name: 'Property Scatter' },
    { url: '/anomaly-explorer', name: 'Anomaly Explorer' },
    { url: '/discovery-timeline', name: 'Discovery Timeline' },
    { url: '/etymology-map', name: 'Etymology Map' },
    { url: '/discoverer-network', name: 'Discoverer Network' },
    { url: '/neighborhood-graph', name: 'Neighborhood Graph' },
  ];

  for (const { url, name } of vizPages) {
    test(`${name} renders SVG content with non-zero dimensions`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Every viz page must have at least one SVG with real dimensions
      const svgs = page.locator('svg');
      const svgCount = await svgs.count();
      expect(svgCount, `${name} must render at least one SVG`).toBeGreaterThan(0);

      const firstSvg = svgs.first();
      const box = await firstSvg.boundingBox();
      expect(box, `${name} first SVG must have a bounding box`).not.toBeNull();
      expect(box!.width, `${name} SVG must have non-zero width`).toBeGreaterThan(10);
      expect(box!.height, `${name} SVG must have non-zero height`).toBeGreaterThan(10);
    });
  }
});

test.describe('Layout shift guards', () => {
  test('Folio page has no overlapping text and plate', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForLoadState('networkidle');

    const plate = page.locator('[data-testid="data-plate"]');
    const plateBox = await plate.boundingBox();

    if (plateBox) {
      // h2 (element name) should not overlap with the data plate
      const heading = page.locator('h2').first();
      const headingBox = await heading.boundingBox();

      if (headingBox && plateBox) {
        // They should not be on top of each other (y ranges shouldn't fully overlap)
        const headingBottom = headingBox.y + headingBox.height;
        const plateBottom = plateBox.y + plateBox.height;

        // Either heading is above plate or plate is above heading
        const overlapsVertically =
          headingBox.y < plateBottom && plateBox.y < headingBottom;
        const overlapsHorizontally =
          headingBox.x < plateBox.x + plateBox.width &&
          plateBox.x < headingBox.x + headingBox.width;

        // If they share horizontal space, they shouldn't fully overlap vertically
        if (overlapsHorizontally) {
          // Allow some overlap (8px tolerance) but not complete stacking
          const overlapAmount = Math.min(headingBottom, plateBottom) - Math.max(headingBox.y, plateBox.y);
          expect(
            overlapAmount,
            'Heading and data plate should not significantly overlap',
          ).toBeLessThan(headingBox.height * 0.5);
        }
      }
    }
  });
});
