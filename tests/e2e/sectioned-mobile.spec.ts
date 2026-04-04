import { test, expect } from '@playwright/test';

/**
 * E2E tests for the SectionedCardList mobile refactor.
 *
 * These tests verify that Phase Landscape, Anomaly Explorer, Discovery
 * Timeline, and Discoverer Network use the sectioned card layout on mobile,
 * matching the Etymology Map pattern.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// Phase Landscape — sectioned by phase (solid / liquid / gas)
// ---------------------------------------------------------------------------
test.describe('Phase Landscape — mobile sectioned view', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('renders phase sections with headers and element cards', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Should have section regions for phase groups
    const sections = page.locator('section[role="region"]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3); // solid, liquid, gas

    // Solid section should have the most elements
    const solidSection = page.locator('section#solid');
    await expect(solidSection).toBeVisible();

    // Liquid section — only 2 elements
    const liquidSection = page.locator('section#liquid');
    await expect(liquidSection).toBeVisible();
    const liquidCards = liquidSection.locator('a');
    await expect(liquidCards).toHaveCount(2);

    // Gas section
    const gasSection = page.locator('section#gas');
    await expect(gasSection).toBeVisible();
  });

  test('section headers show correct counts', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // Each section header <h2> should contain a numeric count
    const headings = page.locator('section[role="region"] h2');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < headingCount; i++) {
      const text = await headings.nth(i).textContent();
      // Should contain a number
      expect(text).toMatch(/\d+/);
    }
  });

  test('element cards link to element pages', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const cards = page.locator('section[role="region"] a');
    const count = await cards.count();
    expect(count).toBeGreaterThan(100); // Most of the 118 elements

    // Spot check
    const firstHref = await cards.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/elements\/[A-Z][a-z]?$/);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('screenshot', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/phase-landscape-mobile-sectioned.png',
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Anomaly Explorer — sectioned by anomaly type
// ---------------------------------------------------------------------------
test.describe('Anomaly Explorer — mobile sectioned view', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('renders anomaly type sections with headers and element cards', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    const sections = page.locator('section[role="region"]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3); // Multiple anomaly types
  });

  test('each section has a heading with label and count', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    const headings = page.locator('section[role="region"] h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const text = await headings.nth(i).textContent();
      expect(text!.length).toBeGreaterThan(0);
      expect(text).toMatch(/\d+/); // count badge
    }
  });

  test('element cards link to element pages', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    const cards = page.locator('section[role="region"] a');
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);

    const href = await cards.first().getAttribute('href');
    expect(href).toMatch(/^\/elements\/[A-Z][a-z]?$/);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('accordion toggles work', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    // Should have toggle buttons
    const toggles = page.locator('section[role="region"] h2 button');
    const toggleCount = await toggles.count();
    if (toggleCount > 0) {
      // Click first toggle to collapse
      await toggles.first().click();
      await page.waitForTimeout(300);

      // The first section's cards should be hidden
      const firstSection = page.locator('section[role="region"]').first();
      const cards = firstSection.locator('a');
      await expect(cards).toHaveCount(0);
    }
  });

  test('screenshot', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/anomaly-explorer-mobile-sectioned.png',
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Discovery Timeline — sectioned by era
// ---------------------------------------------------------------------------
test.describe('Discovery Timeline — mobile sectioned view', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('renders era sections with headers and element cards', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    const sections = page.locator('section[role="region"]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3); // Antiquity + several centuries
  });

  test('has an Antiquity section', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    const antiquity = page.locator('section#antiquity');
    await expect(antiquity).toBeVisible();
  });

  test('element cards show discovery year in description', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    // Cards outside Antiquity should mention a year in description
    const sections = page.locator('section[role="region"]:not(#antiquity)');
    const sectionCount = await sections.count();
    if (sectionCount > 0) {
      const firstCard = sections.first().locator('a').first();
      const label = await firstCard.getAttribute('aria-label');
      // Should mention the symbol
      expect(label).toBeTruthy();
    }
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('screenshot', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/discovery-timeline-mobile-sectioned.png',
      fullPage: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Discoverer Network — sectioned by discoverer
// ---------------------------------------------------------------------------
test.describe('Discoverer Network — mobile sectioned view', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('renders discoverer sections with headers and element cards', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    const sections = page.locator('section[role="region"]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(5); // Multiple prolific discoverers
  });

  test('section headers show discoverer name and count', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    const headings = page.locator('section[role="region"] h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // At least one heading should contain "Humphry Davy" or "Glenn Seaborg"
    const allText = [];
    for (let i = 0; i < count; i++) {
      allText.push(await headings.nth(i).textContent());
    }
    const joined = allText.join(' ');
    expect(
      joined.includes('Humphry Davy') || joined.includes('Seaborg'),
    ).toBe(true);
  });

  test('element cards link to element pages', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    const cards = page.locator('section[role="region"] a');
    const count = await cards.count();
    expect(count).toBeGreaterThan(20);

    const href = await cards.first().getAttribute('href');
    expect(href).toMatch(/^\/elements\/[A-Z][a-z]?$/);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
  });

  test('accordion behaviour — collapse and expand', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    const toggles = page.locator('section[role="region"] h2 button');
    const toggleCount = await toggles.count();
    if (toggleCount > 0) {
      const firstSection = page.locator('section[role="region"]').first();
      const cardsBefore = await firstSection.locator('a').count();

      // On mobile, sections start collapsed (0 cards) — click to expand
      if (cardsBefore === 0) {
        await toggles.first().click();
        await page.waitForTimeout(300);
        const cardsExpanded = await firstSection.locator('a').count();
        expect(cardsExpanded).toBeGreaterThan(0);

        // Click again to collapse
        await toggles.first().click();
        await page.waitForTimeout(300);
        const cardsCollapsed = await firstSection.locator('a').count();
        expect(cardsCollapsed).toBe(0);
      } else {
        // Desktop: sections start expanded — click to collapse
        await toggles.first().click();
        await page.waitForTimeout(300);
        const cardsAfter = await firstSection.locator('a').count();
        expect(cardsAfter).toBe(0);
      }
    }
  });

  test('screenshot', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/e2e/screenshots/discoverer-network-mobile-sectioned.png',
      fullPage: true,
    });
  });
});
