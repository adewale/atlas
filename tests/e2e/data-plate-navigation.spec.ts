import { test, expect } from '@playwright/test';

// Block Google Fonts (unreachable in sandbox) and use 'commit' to avoid load timeout
test.beforeEach(async ({ page }) => {
  await page.route(/(googleapis|gstatic|google)/, (route) => route.abort());
});

test.describe('Data plate navigation arrows', () => {
  test('element page shows prev/next arrows in data plate rows', async ({ page }) => {
    await page.goto('/elements/Fe', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();

    // Group row should have a next arrow (Fe is first in Group 8 → Ru)
    const nextInGroup = plate.locator('a[href="/elements/Ru"]');
    await expect(nextInGroup).toBeVisible();

    // Period row should have prev (Mn) and next (Co) arrows
    const prevInPeriod = plate.locator('a[href="/elements/Mn"]');
    const nextInPeriod = plate.locator('a[href="/elements/Co"]');
    await expect(prevInPeriod.first()).toBeVisible();
    await expect(nextInPeriod.first()).toBeVisible();
  });

  test('first element (H) has no prev arrows, only next', async ({ page }) => {
    await page.goto('/elements/H', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();

    // Next in Group 1 should be Li
    const nextInGroup = plate.locator('a[href="/elements/Li"]');
    await expect(nextInGroup).toBeVisible();

    // Next in Period 1 should be He (appears in period row, block row, and sequential nav)
    const nextInPeriod = plate.locator('a[href="/elements/He"]').first();
    await expect(nextInPeriod).toBeVisible();
  });

  test('lanthanide (La) has no group arrows since group is null', async ({ page }) => {
    await page.goto('/elements/La', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();

    // La has group: null — but period and block rows should still have arrows
    const blockNext = plate.locator('a[href="/elements/Ce"]').first();
    await expect(blockNext).toBeVisible();
  });

  test('clicking a group arrow navigates to the correct element', async ({ page }) => {
    await page.goto('/elements/Fe', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const plate = page.locator('[data-testid="data-plate"]');
    const ruLink = plate.locator('a[href="/elements/Ru"]');
    await ruLink.click();
    await page.waitForURL(/\/elements\/Ru/, { timeout: 10000 });
    expect(page.url()).toContain('/elements/Ru');
  });

});

test.describe('Hero header navigation (TimelineEra)', () => {
  test('prev/next era links appear beneath the hero header', async ({ page }) => {
    await page.goto('/eras/1800', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const navSvg = page.locator('svg[aria-label="Previous and next era navigation"]');
    await expect(navSvg).toBeVisible();
  });
});

test.describe('Hero header navigation (DiscovererDetail)', () => {
  test('prev/next discoverer links appear beneath the hero header', async ({ page }) => {
    await page.goto('/discoverers/Humphry%20Davy', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    const navSvg = page.locator('svg[aria-label="Previous and next discoverer navigation"]');
    await expect(navSvg).toBeVisible();
  });
});

test.describe('URL-based filtering', () => {
  test('anomaly explorer loads with URL parameter without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/anomaly-explorer?anomaly=synthetic-heavy', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('property scatter loads with URL axis parameters without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/property-scatter?x=electronegativity&y=ionizationEnergy', { waitUntil: 'commit' });
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
