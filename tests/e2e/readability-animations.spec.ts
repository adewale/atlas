import { test, expect } from '@playwright/test';

test.describe('Text readability', () => {
  test('periodic table element names are readable (non-zero size)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Every element cell should have text with a non-zero bounding box
    const cells = page.locator('svg g[role="button"]');
    const count = await cells.count();
    expect(count).toBe(118);

    // Spot-check several elements across the grid for readable text
    for (const label of ['Hydrogen', 'Iron', 'Oganesson', 'Carbon', 'Uranium']) {
      const cell = page.locator(`g[aria-label*="${label}"]`);
      const box = await cell.boundingBox();
      expect(box, `${label} cell should have non-zero size`).not.toBeNull();
      expect(box!.width).toBeGreaterThan(10);
      expect(box!.height).toBeGreaterThan(10);
    }
  });

  test('folio summary text is readable (proper line height, non-overlapping)', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForTimeout(1500);

    // The summary SVG should have visible text
    const summarySvg = page.locator('svg[aria-label="Element summary"]');
    await expect(summarySvg).toBeVisible();
    const box = await summarySvg.boundingBox();
    expect(box).not.toBeNull();
    // Summary text should have real height (not zero from broken lineHeight)
    expect(box!.height).toBeGreaterThan(50);

    // Check that text elements inside have non-overlapping y-positions
    const textElements = summarySvg.locator('text');
    const textCount = await textElements.count();
    expect(textCount).toBeGreaterThan(1);

    // Collect y-positions and verify they increase (not all stacked at 0)
    const yPositions: number[] = [];
    for (let i = 0; i < Math.min(textCount, 5); i++) {
      const textBox = await textElements.nth(i).boundingBox();
      if (textBox) yPositions.push(textBox.y);
    }
    // At least 2 distinct y-positions (text on different lines, not stacked)
    const uniqueYs = new Set(yPositions.map((y) => Math.round(y)));
    expect(uniqueYs.size).toBeGreaterThanOrEqual(2);
  });

  test('About page SVG text sections have readable content', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1500);

    // Introduction SVG should have real height and text
    const introSvg = page.locator('svg[aria-label="Introduction"]');
    await expect(introSvg).toBeVisible();
    const introBox = await introSvg.boundingBox();
    expect(introBox).not.toBeNull();
    expect(introBox!.height).toBeGreaterThan(30);

    // Data sources SVG
    const dataSvg = page.locator('svg[aria-label="Data sources description"]');
    await expect(dataSvg).toBeVisible();
    const dataBox = await dataSvg.boundingBox();
    expect(dataBox!.height).toBeGreaterThan(20);

    // Technology SVG
    const techSvg = page.locator('svg[aria-label="Technology description"]');
    await expect(techSvg).toBeVisible();
    const techBox = await techSvg.boundingBox();
    expect(techBox!.height).toBeGreaterThan(20);
  });

  test('AtlasPlate cards have readable text (category labels not clipped)', async ({ page }) => {
    await page.goto('/groups/8');
    await page.waitForTimeout(1500);

    // Each card should have visible text
    const cards = page.locator('g[role="link"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Check first card has non-zero bounding box
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
    expect(box!.height).toBeGreaterThan(50);
  });

  test('compare view text is readable on colored backgrounds', async ({ page }) => {
    await page.goto('/elements/Fe/compare/Cu');
    await page.waitForTimeout(1500);

    // Both element names should be visible
    await expect(page.locator('text:has-text("Iron")')).toBeVisible();
    await expect(page.locator('text:has-text("Copper")')).toBeVisible();

    // The comparison SVG should have substantial content
    const svg = page.locator('svg[aria-label*="Comparison"]');
    await expect(svg).toBeVisible();
    const box = await svg.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(200);
  });

  test('folio data plate text is readable (white on colored background)', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForTimeout(1500);

    // Data plate should have visible GROUP, PERIOD, BLOCK text
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();

    // Each plate section should have visible SVG text
    const svgs = plate.locator('svg');
    const svgCount = await svgs.count();
    expect(svgCount).toBe(3); // group, period, block

    for (let i = 0; i < svgCount; i++) {
      const svg = svgs.nth(i);
      const box = await svg.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(30);
    }
  });
});

test.describe('Animation transitions', () => {
  test('periodic table load animation completes (cells reach full opacity)', async ({ page }) => {
    await page.goto('/');
    // Wait for staggered load animation (118 elements × 4ms delay + 200ms duration)
    await page.waitForTimeout(2000);

    // After animation completes, cells should be fully opaque
    // Check a late element (high atomic number = long delay)
    const oganesson = page.locator('g[aria-label*="Oganesson"]');
    await expect(oganesson).toBeVisible();

    // The inner <g> animation should have completed — verify via computed style
    const innerG = oganesson.locator('g').first();
    const opacity = await innerG.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(opacity).toBe('1');
  });

  test('highlight mode transition produces visual change', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Get initial fill of a cell
    const feRect = page.locator('g[aria-label*="Iron"] rect');
    const initialFill = await feRect.getAttribute('fill');

    // Switch to block highlight mode via chip button
    await page.getByRole('button', { name: /block/i }).click();
    await page.waitForTimeout(500);

    // Fill should have changed
    const newFill = await feRect.getAttribute('fill');
    expect(newFill).not.toBe(initialFill);
  });

  test('folio data plate wipe animation completes', async ({ page }) => {
    await page.goto('/elements/Fe');
    // Wait for plate-wipe animation (350ms + 150ms delay)
    await page.waitForTimeout(1500);

    // Data plate should be fully visible after animation
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();
    const box = await plate.boundingBox();
    expect(box).not.toBeNull();
    // Plate should have real dimensions (not clipped to zero)
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('property bar grow animation completes', async ({ page }) => {
    await page.goto('/elements/Fe');
    // Wait for bar-grow animation (300ms + staggered delay)
    await page.waitForTimeout(1500);

    // Property bars should have visible colored fill
    const bars = page.locator('[aria-label*="ranked"]');
    const count = await bars.count();
    expect(count).toBeGreaterThanOrEqual(3); // Mass, EN, IE, Radius (some may vary)

    for (let i = 0; i < count; i++) {
      const box = await bars.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(50);
    }
  });

  test('compare view split animation completes', async ({ page }) => {
    await page.goto('/elements/Fe/compare/Cu');
    // Wait for compare-expand + compare-scale animations
    await page.waitForTimeout(1500);

    // Both panels should be visible with full dimensions
    const svg = page.locator('svg[aria-label*="Comparison"]');
    const rects = svg.locator('rect');
    const rectCount = await rects.count();
    expect(rectCount).toBeGreaterThan(2);

    // The two main panel rects should have non-zero width
    const firstRect = rects.first();
    const firstBox = await firstRect.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(firstBox!.width).toBeGreaterThan(100);
  });

  test('search filter produces dimming transition', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Type "Fe" in search — most cells should dim
    const search = page.locator('input[type="search"], input[placeholder*="earch"], #pt-search');
    await search.first().fill('Fe');
    await page.waitForTimeout(500);

    // Iron should NOT be dimmed
    const feRect = page.locator('g[aria-label*="Iron"] rect');
    const feFill = await feRect.getAttribute('fill');

    // An unrelated element should be dimmed
    const heRect = page.locator('g[aria-label*="Helium"] rect');
    const heFill = await heRect.getAttribute('fill');

    // Fe should have a non-dim fill, He should be dimmed (#ece7db)
    expect(heFill).toBe('#ece7db');
    expect(feFill).not.toBe('#ece7db');
  });

  test('prefers-reduced-motion is respected', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/elements/Fe');
    await page.waitForTimeout(500);

    // Data plate should be immediately visible (no animation delay)
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();
    const box = await plate.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
  });
});
