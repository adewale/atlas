import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Phase Landscape temperature interaction.
 *
 * The temperature ruler is an SVG-based slider (not an HTML input[type="range"]).
 * On mobile, the page renders SectionedCardList with phase sections.
 * On desktop, it shows the SVG periodic table coloured by phase.
 */

test.describe('Phase Landscape — temperature interaction', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('phase sections are visible on mobile', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Should have section regions for phase groups
    const sections = page.locator('section[role="region"]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3); // solid, liquid, gas
  });

  test('temperature ruler is visible on mobile', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // The ruler is an SVG element with role="slider"
    const ruler = page.locator('[role="slider"]');
    await expect(ruler).toBeVisible();
  });

  test('temperature tick marks are labelled', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Should show STP label
    await expect(page.locator('text=STP').first()).toBeVisible();
  });

  test('no horizontal overflow with slider', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test('screenshot at STP', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-slider-stp.png',
      fullPage: true,
    });
  });

  test('screenshot after interaction', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    // Click on the ruler to change temperature
    const ruler = page.locator('[role="slider"]');
    const rulerBox = await ruler.boundingBox();
    if (rulerBox) {
      // Click near the right end of the ruler (high temperature)
      await page.mouse.click(rulerBox.x + rulerBox.width * 0.8, rulerBox.y + rulerBox.height / 2);
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-slider-hot.png',
      fullPage: true,
    });
  });
});

test.describe('Phase Landscape — temperature slider (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('ruler is visible on desktop too', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const ruler = page.locator('[role="slider"]');
    await expect(ruler).toBeVisible();
  });

  test('clicking ruler changes cell colours', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // At STP, Iron (Fe) should be solid (BLACK fill)
    const feCell = page.locator('g[aria-label*="Fe —"]').locator('rect').first();
    const stpFill = await feCell.getAttribute('fill');

    // Click near the right end of the ruler (high temperature)
    const ruler = page.locator('[role="slider"]');
    const rulerBox = await ruler.boundingBox();
    if (rulerBox) {
      await page.mouse.click(rulerBox.x + rulerBox.width * 0.8, rulerBox.y + rulerBox.height / 2);
      await page.waitForTimeout(500);
    }

    const hotFill = await feCell.getAttribute('fill');
    expect(hotFill).not.toBe(stpFill);
  });

  test('screenshot at high temperature desktop', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    const ruler = page.locator('[role="slider"]');
    const rulerBox = await ruler.boundingBox();
    if (rulerBox) {
      await page.mouse.click(rulerBox.x + rulerBox.width * 0.6, rulerBox.y + rulerBox.height / 2);
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-slider-desktop.png',
      fullPage: true,
    });
  });
});
