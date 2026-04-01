import { test, expect } from '@playwright/test';

test.describe('Animation Palette page', () => {
  test('page loads and renders all sections', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(1000);

    // Back link
    await expect(page.locator('a').filter({ hasText: '← Table' })).toBeVisible();

    // Page title
    await expect(page.locator('h1')).toContainText('Animation Palette');

    // Sections
    await expect(page.locator('h2').filter({ hasText: 'Easing Curves' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Duration Tiers' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'View Transition Names' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Entry Keyframes' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Morph Demos' })).toBeVisible();

    // Reduced motion note
    await expect(page.locator('code').filter({ hasText: 'prefers-reduced-motion' })).toBeVisible();

    // Full-page screenshot
    await page.screenshot({
      path: 'tests/e2e/screenshots/animation-palette-full.png',
      fullPage: true,
    });
  });

  test('easing curve demos are interactive', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    // Find and click the first Play button
    const playButtons = page.locator('button').filter({ hasText: 'Play' });
    await expect(playButtons.first()).toBeVisible();
    const count = await playButtons.count();
    expect(count).toBe(2); // two easing curves

    // Click both play buttons
    await playButtons.first().click();
    await playButtons.nth(1).click();
  });

  test('entry keyframe demos are replayable', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    // Replay buttons for keyframes
    const replayButtons = page.locator('button').filter({ hasText: 'Replay' });
    const count = await replayButtons.count();
    expect(count).toBeGreaterThanOrEqual(5); // 5 keyframes + stagger

    // Click each replay button
    for (let i = 0; i < count; i++) {
      await replayButtons.nth(i).click();
    }

    // Wait for animations to play
    await page.waitForTimeout(600);

    // Screenshot after replaying
    await page.screenshot({
      path: 'tests/e2e/screenshots/animation-palette-after-replay.png',
      fullPage: true,
    });
  });

  test('morph demo is toggleable', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    // Expand button
    const expandBtn = page.locator('button').filter({ hasText: 'Expand' });
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    // After clicking, button should now say Collapse
    await expect(page.locator('button').filter({ hasText: 'Collapse' })).toBeVisible();

    // Wait for transition
    await page.waitForTimeout(350);

    // Collapse
    await page.locator('button').filter({ hasText: 'Collapse' }).click();
    await page.waitForTimeout(350);

    // Should be Expand again
    await expect(page.locator('button').filter({ hasText: 'Expand' })).toBeVisible();
  });

  test('colour morph demo cycles blocks', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    const nextBlockBtn = page.locator('button').filter({ hasText: 'Next block' });
    await expect(nextBlockBtn).toBeVisible();

    // Cycle through all 4 blocks
    for (let i = 0; i < 4; i++) {
      await nextBlockBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('view transition name table lists all 11 names', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    // Count table rows (excluding header)
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBe(11);

    // Verify key names are present
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain('element-symbol');
    expect(tableText).toContain('element-number');
    expect(tableText).toContain('element-name');
    expect(tableText).toContain('element-cell-bg');
    expect(tableText).toContain('viz-nav');
    expect(tableText).toContain('viz-title');
    expect(tableText).toContain('nav-back');
    expect(tableText).toContain('color-rule');
    expect(tableText).toContain('data-plate-group');
    expect(tableText).toContain('data-plate-period');
    expect(tableText).toContain('data-plate-block');
  });

  test('duration tier cards display correctly', async ({ page }) => {
    await page.goto('/animation-palette');
    await page.waitForTimeout(500);

    await expect(page.locator('text=150ms').first()).toBeVisible();
    await expect(page.locator('text=250ms').first()).toBeVisible();
  });
});
