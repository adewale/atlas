import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Phase Landscape temperature slider.
 *
 * The slider lets users change the temperature and see elements reclassified
 * between solid, liquid, gas, and unknown phases in real time.
 */

test.describe('Phase Landscape — temperature slider', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('slider is visible on mobile', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('aria-label', /temperature/i);
  });

  test('displays temperature value in K and °C', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Default is 273K = 0°C (STP)
    const label = page.locator('[data-testid="temp-display"]');
    await expect(label).toContainText('273');
    await expect(label).toContainText('0°C');
  });

  test('changing slider updates section counts', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Read solid count at STP
    const solidHeading = page.locator('section#solid h2');
    const stpSolidText = await solidHeading.textContent();
    const stpSolidCount = parseInt(stpSolidText!.match(/\d+/)![0], 10);

    // Drag slider to high temperature (5000K) — most elements become gas
    const slider = page.locator('input[type="range"]');
    await slider.fill('5000');
    await page.waitForTimeout(500);

    // Gas section should have more elements now
    const gasHeading = page.locator('section#gas h2');
    const hotGasText = await gasHeading.textContent();
    const hotGasCount = parseInt(hotGasText!.match(/\d+/)![0], 10);

    // At 5000K, most elements should be gas (nearly all bp < 5000K)
    expect(hotGasCount).toBeGreaterThan(80);

    // Solid count should have decreased dramatically
    const hotSolidText = await solidHeading.textContent();
    const hotSolidCount = parseInt(hotSolidText!.match(/\d+/)![0], 10);
    expect(hotSolidCount).toBeLessThan(stpSolidCount);
  });

  test('at 0K all elements with data are solid', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const slider = page.locator('input[type="range"]');
    await slider.fill('0');
    await page.waitForTimeout(500);

    // Liquid and gas sections should have 0 items
    const liquidHeading = page.locator('section#liquid h2');
    const liquidText = await liquidHeading.textContent();
    expect(liquidText).toContain('0');

    const gasHeading = page.locator('section#gas h2');
    const gasText = await gasHeading.textContent();
    expect(gasText).toContain('0');
  });

  test('temperature tick marks are labelled', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Should show key temperature landmarks
    await expect(page.locator('text=STP')).toBeVisible();
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

  test('screenshot at 5000K', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    const slider = page.locator('input[type="range"]');
    await slider.fill('5000');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-slider-5000k.png',
      fullPage: true,
    });
  });
});

test.describe('Phase Landscape — temperature slider (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('slider is visible on desktop too', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });

  test('changing temperature recolours periodic table cells', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // At STP, Iron (Fe) should be solid (BLACK fill)
    const feCell = page.locator('g[aria-label*="Fe —"]').locator('rect').first();
    const stpFill = await feCell.getAttribute('fill');

    // Set to 2000K — Iron melts (mp=1811K), should now be liquid (DEEP_BLUE)
    const slider = page.locator('input[type="range"]');
    await slider.fill('2000');
    await page.waitForTimeout(500);

    const hotFill = await feCell.getAttribute('fill');
    expect(hotFill).not.toBe(stpFill);
  });

  test('screenshot at 2000K desktop', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    const slider = page.locator('input[type="range"]');
    await slider.fill('2000');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-slider-2000k-desktop.png',
      fullPage: true,
    });
  });
});
