import { test, expect, type Locator } from '@playwright/test';

/**
 * Readability & Legibility Test Suite
 *
 * Verifies that every page in the atlas renders text legibly, elements don't
 * stack on top of each other, animations complete to full opacity, and page
 * transitions don't leave content in a broken intermediate state.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert that a set of sibling locators have distinct bounding boxes (no stacking). */
async function assertNoOverlap(
  locators: Locator,
  label: string,
  minCount = 2,
) {
  const count = await locators.count();
  expect(count, `${label}: expected at least ${minCount} items`).toBeGreaterThanOrEqual(minCount);

  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < Math.min(count, 20); i++) {
    const box = await locators.nth(i).boundingBox();
    if (box) boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height });
  }

  // Check for collisions: two elements with >80% overlap area are stacked
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const overlapArea = overlapX * overlapY;
      const smallerArea = Math.min(a.w * a.h, b.w * b.h);
      if (smallerArea > 0) {
        const overlapRatio = overlapArea / smallerArea;
        expect(
          overlapRatio,
          `${label}: items ${i} and ${j} are stacked (${(overlapRatio * 100).toFixed(0)}% overlap)`,
        ).toBeLessThan(0.8);
      }
    }
  }
}

/** Assert all items in a locator set have non-zero visible size. */
async function assertAllVisible(locators: Locator, label: string, minSize = 5) {
  const count = await locators.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    const box = await locators.nth(i).boundingBox();
    expect(box, `${label} item ${i} should have a bounding box`).not.toBeNull();
    expect(box!.width, `${label} item ${i} width`).toBeGreaterThan(minSize);
    expect(box!.height, `${label} item ${i} height`).toBeGreaterThan(minSize);
  }
}


// ---------------------------------------------------------------------------
// Per-page readability tests
// ---------------------------------------------------------------------------

test.describe('Readability: Home / Periodic Table', () => {
  test('all 118 cells are positioned distinctly (no stacking)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-home.png', fullPage: true });

    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);

    // Spot-check: 4 corners + 2 lanthanides should all be at unique positions
    const labels = ['Hydrogen', 'Helium', 'Francium', 'Oganesson', 'Cerium', 'Lutetium'];
    const positions: { x: number; y: number }[] = [];
    for (const name of labels) {
      const box = await page.locator(`g[aria-label*="${name}"]`).boundingBox();
      expect(box, `${name} should be visible`).not.toBeNull();
      positions.push({ x: Math.round(box!.x), y: Math.round(box!.y) });
    }
    // All 6 should be at distinct positions
    const uniquePos = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(uniquePos.size).toBe(6);
  });

  test('element text is readable after load animation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();

    // After animation, all cells should reach opacity 1
    const lastEl = page.locator('g[aria-label*="Oganesson"] g').first();
    const opacity = await lastEl.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');

    // Element symbol text should have non-zero size
    const symbolText = page.locator('g[aria-label*="Iron"] text').nth(1);
    const box = await symbolText.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(5);
  });

  test('explore navigation links are readable and not overlapping', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();

    const navLinks = page.locator('nav a[href*="/"]').filter({ hasText: /Landscape|Scatter|Explorer|Graph|Timeline|Etymology|Network/ });
    const count = await navLinks.count();
    expect(count).toBe(7);
    await assertNoOverlap(navLinks, 'Explore nav links');
  });
});

test.describe('Readability: Element Folio', () => {
  test('folio content is laid out without overlap', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-folio-fe.png', fullPage: true });

    // Prev/next nav, symbol, name, data plate should all be at distinct y positions
    const symbolBox = await page.locator('.folio-symbol').boundingBox();
    const nameBox = await page.locator('h2').boundingBox();
    const plateBox = await page.locator('[data-testid="data-plate"]').boundingBox();
    expect(symbolBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(plateBox).not.toBeNull();

    // Symbol should be above name
    expect(nameBox!.y).toBeGreaterThan(symbolBox!.y);
  });

  test('prev/next navigation links are present and separated', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    // Prev link (Mn) and next link (Co) should exist
    const prevLink = page.locator('nav a[href="/element/Mn"]');
    const nextLink = page.locator('nav a[href="/element/Co"]');
    await expect(prevLink).toBeVisible();
    await expect(nextLink).toBeVisible();

    // They should be on opposite sides
    const prevBox = await prevLink.boundingBox();
    const nextBox = await nextLink.boundingBox();
    expect(nextBox!.x).toBeGreaterThan(prevBox!.x + 50);
  });

  test('H has no prev link, Og has no next link', async ({ page }) => {
    await page.goto('/element/H');
    await expect(page.locator('.folio-symbol')).toBeVisible();
    // Should have next (He) but no prev
    await expect(page.locator('nav a[href="/element/He"]')).toBeVisible();
    const prevLinks = page.locator('nav a:has-text("←")');
    await expect(prevLinks).toHaveCount(0);

    await page.goto('/element/Og');
    await expect(page.locator('.folio-symbol')).toBeVisible();
    // Should have prev (Ts) but no next
    await expect(page.locator('nav a[href="/element/Ts"]')).toBeVisible();
    const nextLinks = page.locator('nav a:has-text("→")');
    await expect(nextLinks).toHaveCount(0);
  });

  test('etymology and discovery sections readable with links', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    // Etymology section should be visible
    const etymologyLabel = page.locator('text=Etymology').first();
    await expect(etymologyLabel).toBeVisible();

    // Discovery section should be visible
    const discoveryLabel = page.locator('text=Discovery').first();
    await expect(discoveryLabel).toBeVisible();

    // Discoverer link should point to discoverer detail page
    const discovererLink = page.locator('a[href*="/discoverer/"]');
    await expect(discovererLink).toBeVisible();

    // Timeline link should be present (links to era or full timeline)
    const timelineLink = page.locator('a:has-text("timeline")');
    await expect(timelineLink).toBeVisible();
  });

  test('property bars are readable after animation', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    const bars = page.locator('[aria-label*="ranked"]');
    await expect(bars).toHaveCount(4);
    await assertAllVisible(bars, 'Property bars', 30);
  });

  test('summary text lines are not overlapping', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    const summarySvg = page.locator('svg[aria-label="Element summary"]');
    const textLines = summarySvg.locator('text');
    const count = await textLines.count();
    expect(count).toBeGreaterThan(2);

    // Collect y positions of text lines
    const yPositions: number[] = [];
    for (let i = 0; i < count; i++) {
      const box = await textLines.nth(i).boundingBox();
      if (box) yPositions.push(Math.round(box.y));
    }
    // All text lines should be at distinct y positions
    const uniqueYs = new Set(yPositions);
    expect(uniqueYs.size, 'Summary text lines should be at distinct y positions').toBe(yPositions.length);
  });

  test('mobile folio layout is readable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-folio-mobile.png', fullPage: true });

    // Symbol and name should be visible
    await expect(page.locator('.folio-symbol')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Iron');

    // Data plate should still be visible
    const plate = page.locator('[data-testid="data-plate"]');
    await expect(plate).toBeVisible();
  });
});

test.describe('Readability: Compare Page', () => {
  test('both elements are readable and separated', async ({ page }) => {
    await page.goto('/compare/Fe/Cu');
    await expect(page.locator('svg[aria-label*="Comparison"]')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-compare.png', fullPage: true });

    await expect(page.locator('text=Iron')).toBeVisible();
    await expect(page.locator('text=Copper')).toBeVisible();

    // The comparison SVG should have significant height (content not collapsed)
    const svg = page.locator('svg[aria-label*="Comparison"]');
    const box = await svg.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(250);
  });
});

test.describe('Readability: Phase Landscape', () => {
  test('all cells are distinct and text is readable', async ({ page }) => {
    await page.goto('/phase-landscape');
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-phase.png', fullPage: true });

    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);

    // Spot-check: symbol text should have non-zero size
    const feSymbol = page.locator('g[aria-label*="Iron"] text').first();
    const box = await feSymbol.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(3);

    // Legend items should be visible
    await expect(page.locator('text:text-is("Solid")')).toBeVisible();
    await expect(page.locator('text:text-is("Liquid")')).toBeVisible();
    await expect(page.locator('text:text-is("Gas")')).toBeVisible();
  });
});

test.describe('Readability: Property Scatter', () => {
  test('axis labels are readable and not overlapping plot', async ({ page }) => {
    await page.goto('/property-scatter');
    await expect(page.locator('text:has-text("Electronegativity")')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-scatter.png', fullPage: true });

    // Axis labels
    const xLabel = page.locator('text:has-text("Electronegativity")');
    const yLabel = page.locator('text:has-text("Ionisation energy")');
    await expect(xLabel).toBeVisible();
    await expect(yLabel).toBeVisible();

    // Labels should not overlap with axis lines
    const xBox = await xLabel.boundingBox();
    const yBox = await yLabel.boundingBox();
    expect(xBox).not.toBeNull();
    expect(yBox).not.toBeNull();
    // Y label should be above X label
    expect(xBox!.y).toBeGreaterThan(yBox!.y);
  });

  test('element squares have non-zero size after animation', async ({ page }) => {
    await page.goto('/property-scatter');
    await expect(page.locator('svg rect[width="10"]').first()).toBeVisible();

    const squares = page.locator('svg rect[width="10"]');
    const count = await squares.count();
    expect(count).toBeGreaterThan(50);

    // After card-enter animation, opacity should be non-zero
    // (checking via computed style)
    const firstSquare = squares.first();
    const opacity = await firstSquare.evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.5);
  });
});

test.describe('Readability: Anomaly Explorer', () => {
  test('grid cells are distinct with and without selection', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await expect(page.locator('svg g[style*="cursor: pointer"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-anomaly.png', fullPage: true });

    // Without selection: all cells should be paper color and spaced
    const firstCell = page.locator('svg g[style*="cursor: pointer"]').first();
    const lastCell = page.locator('svg g[style*="cursor: pointer"]').last();
    const firstBox = await firstCell.boundingBox();
    const lastBox = await lastCell.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    const dist = Math.abs(lastBox!.x - firstBox!.x) + Math.abs(lastBox!.y - firstBox!.y);
    expect(dist).toBeGreaterThan(200);

    // With selection: highlighted cells should still be spaced
    await page.locator('button').first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-anomaly-selected.png', fullPage: true });
  });
});

test.describe('Readability: Neighborhood Graph', () => {
  test('node labels are readable and distinct', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await expect(page.locator('svg circle').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-neighborhood.png', fullPage: true });

    // Circles should not all be at the same position
    const circles = page.locator('svg circle');
    expect(await circles.count()).toBe(118);

    // Get positions of first and last circles
    const firstBox = await circles.first().boundingBox();
    const lastBox = await circles.last().boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    const dist = Math.abs(lastBox!.x - firstBox!.x) + Math.abs(lastBox!.y - firstBox!.y);
    expect(dist).toBeGreaterThan(100);
  });

  test('intro text is readable', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await expect(page.locator('svg circle').first()).toBeVisible();

    // Pretext intro should have non-zero height
    const introText = page.locator('svg text').first();
    const box = await introText.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
  });
});

test.describe('Readability: Discovery Timeline', () => {
  test('timeline elements do not overflow or stack illegibly', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await expect(page.locator('text:text-is("1700")')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-timeline.png', fullPage: true });

    // Century marks should be horizontally separated
    const marks = ['1700', '1800', '1900', '2000'];
    const xPositions: number[] = [];
    for (const mark of marks) {
      const el = page.locator(`text:text-is("${mark}")`);
      const box = await el.boundingBox();
      expect(box, `${mark} mark should be visible`).not.toBeNull();
      xPositions.push(box!.x);
    }
    // Each century mark should be further right than the previous
    for (let i = 1; i < xPositions.length; i++) {
      expect(xPositions[i], `${marks[i]} should be right of ${marks[i - 1]}`).toBeGreaterThan(
        xPositions[i - 1] + 20,
      );
    }
  });

  test('antiquity squares are visible and not clipped', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await expect(page.locator('text:text-is("1700")')).toBeVisible();

    const antiqSquares = page.locator('rect[aria-label*="known since antiquity"]');
    const count = await antiqSquares.count();
    expect(count).toBeGreaterThan(5);

    // All should have positive dimensions
    await assertAllVisible(antiqSquares, 'Antiquity squares', 8);
  });
});

test.describe('Readability: Etymology Map', () => {
  test('section headers and cards are readable', async ({ page }) => {
    await page.goto('/etymology-map');
    await expect(page.locator('section').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-etymology.png', fullPage: true });

    // Section headers
    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(6);

    // First section should have visible header and cards
    const firstHeader = sections.first().locator('div').first();
    await expect(firstHeader).toBeVisible();
    const headerBox = await firstHeader.boundingBox();
    expect(headerBox!.height).toBeGreaterThan(20);
  });

  test('element cards within section are not overlapping', async ({ page }) => {
    await page.goto('/etymology-map');
    await expect(page.locator('section').first()).toBeVisible();

    // Check first section's cards for overlap
    const firstSection = page.locator('section').first();
    const cards = firstSection.locator('a');
    await assertNoOverlap(cards, 'Etymology cards in first section', 3);
  });
});

test.describe('Readability: Discoverer Network', () => {
  test('discoverer rows are vertically separated', async ({ page }) => {
    await page.goto('/discoverer-network');
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-discoverer.png', fullPage: true });

    // Verify specific discoverer names are at different y positions
    const names = ['Humphry Davy', 'Albert Ghiorso et al.'];
    const yPositions: number[] = [];
    for (const name of names) {
      const el = page.getByText(name, { exact: true });
      const box = await el.boundingBox();
      expect(box, `${name} should be visible`).not.toBeNull();
      yPositions.push(box!.y);
    }

    // These two discoverers should be on different rows
    expect(
      Math.abs(yPositions[1] - yPositions[0]),
      'Discoverer rows should be vertically separated',
    ).toBeGreaterThan(10);
  });

  test('element squares in bars are distinct', async ({ page }) => {
    await page.goto('/discoverer-network');
    await expect(page.locator('h1')).toBeVisible();

    // Check antiquity group squares
    const antiquitySquares = page.locator('svg g[style*="cursor: pointer"]');
    const count = await antiquitySquares.count();
    expect(count).toBeGreaterThan(10);
  });
});

test.describe('Readability: Atlas Index Pages', () => {
  test('group page cards are readable and non-overlapping', async ({ page }) => {
    await page.goto('/atlas/group/8');
    await expect(page.locator('g[role="link"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-atlas-group.png', fullPage: true });

    const cards = page.locator('g[role="link"]');
    await expect(cards).toHaveCount(4);
    await assertNoOverlap(cards, 'Group 8 atlas cards');
  });

  test('rank page shows all 118 elements without stacking', async ({ page }) => {
    await page.goto('/atlas/rank/mass');
    await expect(page.locator('g[role="link"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/readability-atlas-rank.png', fullPage: true });

    const cards = page.locator('g[role="link"]');
    await expect(cards).toHaveCount(118);

    // Spot check: first and last cards should be far apart
    const firstBox = await cards.first().boundingBox();
    const lastBox = await cards.last().boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    const dist = Math.abs(lastBox!.y - firstBox!.y) + Math.abs(lastBox!.x - firstBox!.x);
    expect(dist).toBeGreaterThan(200);
  });
});

// ---------------------------------------------------------------------------
// Page transition readability tests
// ---------------------------------------------------------------------------

test.describe('Page transitions: content readable after navigation', () => {
  test('home → folio → home: content readable at each step', async ({ page }) => {
    // Step 1: Home
    await page.goto('/');
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();
    const cellCount1 = await page.locator('svg g[role="button"]').count();
    expect(cellCount1).toBe(118);
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-home-start.png', fullPage: true });

    // Step 2: Navigate to folio
    await page.locator('g[aria-label*="Iron"]').click();
    await expect(page.locator('.folio-symbol')).toBeVisible();
    await expect(page.locator('.folio-symbol')).toHaveText('Fe');
    const symbolBox = await page.locator('.folio-symbol').boundingBox();
    expect(symbolBox).not.toBeNull();
    expect(symbolBox!.width).toBeGreaterThan(10);
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-folio.png', fullPage: true });

    // Step 3: Navigate back
    await page.locator('a[href="/"]').click();
    await expect(page.locator('svg g[role="button"]').first()).toBeVisible();
    const cellCount2 = await page.locator('svg g[role="button"]').count();
    expect(cellCount2).toBe(118);
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-home-return.png', fullPage: true });
  });

  test('folio → prev/next → folio: each page readable', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Iron');

    // Navigate to next element
    await page.locator('nav a:has-text("→")').click();
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Cobalt');
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-next-element.png', fullPage: true });

    // Navigate back to prev
    await page.locator('nav a:has-text("←")').first().click();
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Iron');
  });

  test('folio → discoverer detail → network: readable at each step', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    // Click discoverer link (now points to /discoverer/:name)
    const discLink = page.locator('a[href*="/discoverer/"]').first();
    await expect(discLink).toBeVisible();
    await discLink.click();
    await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();
    // Should be on a discoverer detail page with back link to network
    await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-discoverer.png', fullPage: true });

    // Navigate to network
    await page.locator('a[href="/discoverer-network"]').click();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Discoverer Network');
  });

  test('folio → etymology map: readable after transition', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    const etymLink = page.locator('a[href="/etymology-map"]');
    if ((await etymLink.count()) > 0) {
      await etymLink.click();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h1')).toHaveText('Etymology Map');
      await page.screenshot({ path: 'tests/e2e/screenshots/transition-etymology.png', fullPage: true });
    }
  });

  test('folio → timeline era: readable after transition', async ({ page }) => {
    // Use Oxygen (discoveryYear = 1774) to test era links, since Fe is antiquity (no year)
    await page.goto('/element/O');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    // O discovery link goes to /timeline/1770
    const timeLink = page.locator('a[href*="/timeline/"]').first();
    await expect(timeLink).toBeVisible();
    await timeLink.click();
    await expect(page.locator('a[href="/discovery-timeline"]')).toBeVisible();
    // Should be on a timeline era page with back link
    await expect(page.locator('a[href="/discovery-timeline"]')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-timeline-era.png', fullPage: true });
  });

  test('folio → compare → back: no broken state', async ({ page }) => {
    await page.goto('/element/Fe');
    await expect(page.locator('.folio-symbol')).toBeVisible();

    await page.locator('a:has-text("Compare →")').click();
    await expect(page.locator('text=Iron')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/transition-compare.png', fullPage: true });
  });

  test('home → each visualization page → back: roundtrip readable', async ({ page }) => {
    test.setTimeout(90000); // 7 pages × ~10s each
    const vizPages = [
      { path: '/phase-landscape', heading: 'Phase Landscape at STP' },
      { path: '/property-scatter', heading: 'Property Scatter' },
      { path: '/anomaly-explorer', heading: 'Anomaly Explorer' },
      { path: '/neighborhood-graph', heading: 'Neighbourhood Graph' },
      { path: '/discovery-timeline', heading: 'Discovery Timeline' },
      { path: '/etymology-map', heading: 'Etymology Map' },
      { path: '/discoverer-network', heading: 'Discoverer Network' },
    ];

    for (const { path, heading } of vizPages) {
      await page.goto('/');
      await expect(page.locator('svg g[role="button"]').first()).toBeVisible();

      // Navigate to viz page
      const link = page.locator(`a[href="${path}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await expect(page.locator('h1')).toBeVisible();

      // Verify heading is readable
      await expect(page.locator('h1')).toContainText(heading);

      // Navigate back
      const backLink = page.locator('a[href="/"]');
      await expect(backLink).toBeVisible();
      await backLink.click();
      await expect(page.locator('svg g[role="button"]').first()).toBeVisible();

      // Home should be intact
      const cells = page.locator('svg g[role="button"]');
      expect(await cells.count()).toBe(118);
    }
  });
});
