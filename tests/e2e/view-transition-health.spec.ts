import { test, expect } from '@playwright/test';

/**
 * View transition health checks — ensures navigations complete
 * without timeout errors or excessive delays.
 *
 * The View Transitions API holds the old page screenshot until the
 * callback's promise resolves. If the DOM update takes too long,
 * the browser aborts after ~4 seconds with a TimeoutError. This
 * test catches that class of bug.
 */

test.describe('View transition health', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Table → Element navigation has no transition timeout errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click Iron (Fe) — triggers view transition to element page
    const feCell = page.locator('[aria-label*="Fe"][aria-label*="Iron"]').first();
    await feCell.click();

    // Wait well past the 4s browser timeout
    await page.waitForTimeout(6000);

    // Should have navigated to the element page
    await expect(page).toHaveURL(/\/elements\/Fe/);

    // No transition timeout errors
    const transitionErrors = errors.filter(
      (e) => e.includes('Transition was aborted') || e.includes('TimeoutError'),
    );
    expect(
      transitionErrors,
      `Expected no view transition errors but got: ${transitionErrors.join('; ')}`,
    ).toHaveLength(0);
  });

  test('Table → Element navigation completes within 2 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const feCell = page.locator('[aria-label*="Fe"][aria-label*="Iron"]').first();

    const start = Date.now();
    await feCell.click();
    await page.waitForURL(/\/elements\/Fe/, { timeout: 5000 });
    const elapsed = Date.now() - start;

    // Navigation should complete well under 4 seconds
    // (the old bug caused a 4-second hang)
    expect(elapsed, `Navigation took ${elapsed}ms — should be under 2000ms`).toBeLessThan(2000);
  });

  test('Element → Table back-navigation has no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/elements/Fe');
    await page.waitForTimeout(2000);

    // Navigate back to Table
    const backLink = page.locator('a:has-text("Table")').first();
    await backLink.click();
    await page.waitForTimeout(6000);

    await expect(page).toHaveURL('/');

    const transitionErrors = errors.filter(
      (e) => e.includes('Transition was aborted') || e.includes('TimeoutError'),
    );
    expect(transitionErrors).toHaveLength(0);
  });

  test('Explore → Element card navigation has no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/explore');
    await page.waitForTimeout(2000);

    // Click the first element card that has an href
    const card = page.locator('a[href^="/elements/"]').first();
    if (await card.count() > 0) {
      await card.click();
      await page.waitForTimeout(6000);

      const transitionErrors = errors.filter(
        (e) => e.includes('Transition was aborted') || e.includes('TimeoutError'),
      );
      expect(transitionErrors).toHaveLength(0);
    }
  });
});
