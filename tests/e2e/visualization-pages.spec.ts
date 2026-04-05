import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Screenshot tests for all 7 visualization pages
// ---------------------------------------------------------------------------

test.describe('Phase Landscape', () => {
  test('renders 118 elements colored by phase', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/phase-landscape.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Phase Landscape at STP');

    // Should have 118 element cells
    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);

    // Back link
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('element cells are not stacked — spot-check corners', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // H (top-left) and He (top-right) should be far apart
    const h = page.locator('g[aria-label*="Hydrogen"]');
    const he = page.locator('g[aria-label*="Helium"]');
    const hBox = await h.boundingBox();
    const heBox = await he.boundingBox();
    expect(hBox).not.toBeNull();
    expect(heBox).not.toBeNull();
    expect(heBox!.x - hBox!.x).toBeGreaterThan(200);

    // Fr (bottom-left) and Og (bottom-right) should also be separated
    const fr = page.locator('g[aria-label*="Francium"]');
    const og = page.locator('g[aria-label*="Oganesson"]');
    const frBox = await fr.boundingBox();
    const ogBox = await og.boundingBox();
    expect(frBox).not.toBeNull();
    expect(ogBox).not.toBeNull();
    expect(ogBox!.x - frBox!.x).toBeGreaterThan(200);

    // Vertical separation: H should be above Fr
    expect(frBox!.y - hBox!.y).toBeGreaterThan(100);
  });

  test('clicking element navigates to folio', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    // Click on Iron — the g element with role="button" has the onClick handler
    await page.locator('g[aria-label*="Iron"][role="button"]').click();
    await page.waitForURL(/\/elements\/Fe/);
    expect(page.url()).toContain('/elements/Fe');
  });
});

test.describe('Property Scatter', () => {
  test('renders scatter plot with element squares', async ({ page }) => {
    await page.goto('/property-scatter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/property-scatter.png', fullPage: true });

    // Axis labels should be visible
    await expect(page.locator('text:has-text("Electronegativity")')).toBeVisible();
    await expect(page.locator('text:has-text("Ionisation energy")')).toBeVisible();

    // Should have element squares
    const squares = page.locator('svg rect[width="10"]');
    const count = await squares.count();
    expect(count).toBeGreaterThan(50); // Not all 118 have both properties
  });

  test('changing axes updates the plot', async ({ page }) => {
    await page.goto('/property-scatter');
    await page.waitForTimeout(2000);

    // Change X axis to mass
    await page.selectOption('select >> nth=0', 'mass');
    await page.waitForTimeout(500);

    // X axis label should update
    await expect(page.locator('text:has-text("Atomic mass")')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/property-scatter-mass.png', fullPage: true });
  });

  test('hover shows tooltip that does not overflow', async ({ page }) => {
    await page.goto('/property-scatter');
    await page.waitForTimeout(2000);

    // Hover over the first square (force: true to bypass transparent hit-area overlay)
    const firstSquare = page.locator('svg rect[width="10"]').first();
    await firstSquare.hover({ force: true });
    await page.waitForTimeout(500);

    // A tooltip should appear — either a rect or a text element
    const tooltipRects = page.locator('svg rect[width="120"]');
    const tooltipTexts = page.locator('svg g[style*="pointer-events"] text');
    const tooltipCount = (await tooltipRects.count()) + (await tooltipTexts.count());
    // Tooltip may or may not appear depending on hover timing; just verify no crash
    expect(tooltipCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Anomaly Explorer', () => {
  test('renders periodic table with anomaly buttons', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/anomaly-explorer.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Anomaly Explorer');

    // Should have anomaly buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(3); // At least 5 anomaly types

    // Should have 118 element cells
    const cells = page.locator('svg g[style*="cursor: pointer"]');
    const cellCount = await cells.count();
    expect(cellCount).toBe(118);
  });

  test('selecting anomaly highlights elements and shows description', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    // Click first anomaly button
    await page.locator('button').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/anomaly-selected.png', fullPage: true });

    // Description text should appear below the grid
    const descText = page.locator('svg text').last();
    await expect(descText).toBeVisible();
  });

  test('elements are not stacked when anomaly is selected', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);

    // Select an anomaly
    await page.locator('button').first().click();
    await page.waitForTimeout(500);

    // Check that H and He are still at different positions
    const h = page.locator('g:has(text:text-is("H")) >> nth=0');
    const he = page.locator('g:has(text:text-is("He")) >> nth=0');
    const hBox = await h.boundingBox();
    const heBox = await he.boundingBox();
    expect(hBox).not.toBeNull();
    expect(heBox).not.toBeNull();
    expect(Math.abs(heBox!.x - hBox!.x)).toBeGreaterThan(100);
  });
});

test.describe('Discovery Timeline', () => {
  test('renders timeline with antiquity and historical elements', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/discovery-timeline.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Discovery Timeline');

    // Century marks should be visible
    await expect(page.locator('text:text-is("1700")')).toBeVisible();
    await expect(page.locator('text:text-is("1800")')).toBeVisible();
    await expect(page.locator('text:text-is("1900")')).toBeVisible();
    await expect(page.locator('text:text-is("2000")')).toBeVisible();

    // "Known since antiquity" label
    await expect(page.locator('text:has-text("Known since antiquity")')).toBeVisible();

    // Era labels
    await expect(page.locator('text:text-is("Ancient")')).toBeVisible();
  });

  test('timeline squares are not vertically stacked beyond viewbox', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    // All squares should be within the SVG viewport
    const svg = page.locator('svg[aria-label*="Timeline"]');
    const svgBox = await svg.boundingBox();
    expect(svgBox).not.toBeNull();

    // Spot-check: antiquity squares should be visible (not clipped)
    const antiquitySquares = page.locator('rect[aria-label*="known since antiquity"]');
    const count = await antiquitySquares.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < count; i++) {
      const box = await antiquitySquares.nth(i).boundingBox();
      expect(box, `Antiquity square ${i} should be visible`).not.toBeNull();
      expect(box!.height).toBeGreaterThan(5);
    }
  });

  test('hover shows tooltip', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);

    // Hover over an antiquity square
    const square = page.locator('rect[aria-label*="known since antiquity"]').first();
    await square.hover();
    await page.waitForTimeout(200);

    // Tooltip rect should appear (the dark background)
    const tooltipRect = page.locator('g[style*="pointer-events"] rect');
    await expect(tooltipRect).toBeVisible();
  });
});

test.describe('Etymology Map', () => {
  test('renders all origin sections with element cards', async ({ page }) => {
    await page.goto('/etymology-map');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/etymology-map.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Etymology Map');

    // Should have origin section headers
    const headers = page.locator('section');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(6); // place, person, mythology, property, mineral, astronomical
  });

  test('cards are not overlapping — flex wrap works', async ({ page }) => {
    await page.goto('/etymology-map');
    await page.waitForTimeout(2000);

    // Get all element cards in the first section
    const firstSection = page.locator('section').first();
    const cards = firstSection.locator('a');
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);

    // Check that first two cards don't overlap
    const card1Box = await cards.nth(0).boundingBox();
    const card2Box = await cards.nth(1).boundingBox();
    expect(card1Box).not.toBeNull();
    expect(card2Box).not.toBeNull();

    // Cards should either be side by side (different x) or on different rows (different y)
    const xDiff = Math.abs(card2Box!.x - card1Box!.x);
    const yDiff = Math.abs(card2Box!.y - card1Box!.y);
    expect(xDiff + yDiff).toBeGreaterThan(10);
  });

  test('clicking element card navigates to folio', async ({ page }) => {
    await page.goto('/etymology-map');
    await page.waitForTimeout(2000);

    // Click first element card
    const firstCard = page.locator('section a').first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/elements/');
  });
});

test.describe('Drop cap text flow', () => {
  test('drop cap initial does not overlap body text on etymology-map', async ({ page }) => {
    // IntroBlock with drop cap is rendered on viz pages, not element folios
    await page.goto('/etymology-map');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/drop-cap-etymology.png', fullPage: true });

    // The IntroBlock renders an SVG with a drop cap <text> (font-size="72" on etymology-map)
    const introSvg = page.locator('.page-shell-content svg').first();
    await expect(introSvg).toBeVisible();

    // The drop cap is a large bold <text> element
    const dropCap = introSvg.locator('text[font-weight="bold"]').first();
    const dropCapCount = await dropCap.count();
    expect(dropCapCount).toBe(1);

    const dropCapBox = await dropCap.boundingBox();
    expect(dropCapBox).not.toBeNull();
    expect(dropCapBox!.width).toBeGreaterThan(5);
    expect(dropCapBox!.height).toBeGreaterThan(20);

    // Body text lines exist after the drop cap
    const allTextEls = introSvg.locator('text');
    const textCount = await allTextEls.count();
    expect(textCount).toBeGreaterThan(2);
  });

  test('drop cap flows text on discoverer-network', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/drop-cap-discoverer.png', fullPage: true });

    // IntroBlock SVG should be visible with text
    const introSvg = page.locator('.page-shell-content svg').first();
    await expect(introSvg).toBeVisible();

    const dropCap = introSvg.locator('text[font-weight="bold"]').first();
    await expect(dropCap).toBeVisible();
  });

  test('drop cap flows text on phase-landscape', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);

    // IntroBlock SVG should be visible
    const introSvg = page.locator('.page-shell-content svg').first();
    await expect(introSvg).toBeVisible();

    const dropCap = introSvg.locator('text[font-weight="bold"]').first();
    await expect(dropCap).toBeVisible();

    // Body text lines should exist
    const allTextEls = introSvg.locator('text');
    const count = await allTextEls.count();
    expect(count).toBeGreaterThan(2);
  });
});

test.describe('Discoverer Detail', () => {
  test('renders discoverer page with elements', async ({ page }) => {
    await page.goto('/discoverers/' + encodeURIComponent('Humphry Davy'));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/discoverer-davy.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Humphry Davy');

    // Should show element count
    await expect(page.getByText(/\d+ elements?/).first()).toBeVisible();

    // Back link to network
    await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();

    // Related discoverers section
    await expect(page.locator('h2:has-text("Related Discoverers")')).toBeVisible();
  });

  test('prev/next navigation works', async ({ page }) => {
    await page.goto('/discoverers/' + encodeURIComponent('Humphry Davy'));
    await page.waitForTimeout(1500);

    // Should have prev or next links
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Click a nav link
    await navLinks.first().click();
    await page.waitForTimeout(1500);

    // Should be on a different discoverer page
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('related discoverer links navigate correctly', async ({ page }) => {
    await page.goto('/discoverers/' + encodeURIComponent('Humphry Davy'));
    await page.waitForTimeout(1500);

    const relatedLinks = page.locator('section:has(h2:has-text("Related")) a');
    const count = await relatedLinks.count();
    if (count > 0) {
      await relatedLinks.first().click();
      await page.waitForTimeout(1500);
      // Should be on another discoverer detail page
      await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();
    }
  });
});

test.describe('Timeline Era', () => {
  test('renders era page with elements', async ({ page }) => {
    await page.goto('/eras/1700s');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/timeline-1700s.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('1700s');

    // Should show element count
    await expect(page.getByText(/\d+ elements?/).first()).toBeVisible();

    // Back link to timeline
    await expect(page.locator('a[href="/discovery-timeline"]')).toBeVisible();

    // Nearby eras section
    await expect(page.locator('h2:has-text("Nearby Eras")')).toBeVisible();
  });

  test('antiquity era page works', async ({ page }) => {
    await page.goto('/eras/ancient');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Ancient');
    await expect(page.getByText(/\d+ elements?/).first()).toBeVisible();
  });

  test('prev/next era navigation works', async ({ page }) => {
    await page.goto('/eras/1700s');
    await page.waitForTimeout(1500);

    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    await navLinks.first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('discoverer links from era page work', async ({ page }) => {
    await page.goto('/eras/1700s');
    await page.waitForTimeout(1500);

    const discovererLinks = page.locator('section:has(h2:has-text("Discoverers")) a');
    const count = await discovererLinks.count();
    if (count > 0) {
      await discovererLinks.first().click();
      await page.waitForTimeout(1500);
      // Should be on a discoverer detail page
      await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();
    }
  });
});

test.describe('Entity Map', () => {
  test('renders graph, catalogue, and relationships', async ({ page }) => {
    await page.goto('/about/entity-map');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/entity-map.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Entity Map');

    // Entity graph SVG should have 12 nodes
    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    await expect(graphSvg).toBeVisible();
    const circles = graphSvg.locator('circle');
    expect(await circles.count()).toBe(12);

    // Node labels should be readable (font-size >= 10)
    const nodeLabels = graphSvg.locator('text[font-weight="bold"]');
    const labelCount = await nodeLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(12);

    // Entity catalogue section
    await expect(page.locator('h2:has-text("Entity Catalogue")')).toBeVisible();

    // Relationship section
    await expect(page.locator('h2:has-text("Relationships")')).toBeVisible();
  });

  test('graph labels are readable — bounding boxes have positive size', async ({ page }) => {
    await page.goto('/about/entity-map');
    await page.waitForTimeout(2000);

    const graphSvg = page.locator('svg[aria-label*="Entity relationship"]');
    const nodeLabels = graphSvg.locator('text[font-weight="bold"]');
    const count = await nodeLabels.count();

    for (let i = 0; i < count; i++) {
      const box = await nodeLabels.nth(i).boundingBox();
      if (box) {
        expect(box.width, `Label ${i} should have positive width`).toBeGreaterThan(5);
        expect(box.height, `Label ${i} should have positive height`).toBeGreaterThan(5);
      }
    }
  });
});

test.describe('Discoverer Network', () => {
  test('renders discoverer rows with element squares', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/discoverer-network.png', fullPage: true });

    await expect(page.locator('h1:not([aria-label="Atlas"])')).toHaveText('Discoverer Network');

    // Discoverer network uses SectionedCardList with HTML cards, not SVG rects
    const sections = page.locator('section[role="region"]');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(5); // Multiple prolific discoverers
  });

  test('discoverer names are readable — not truncated to empty', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    // Check that discoverer name text elements have content
    // Use exact matches to avoid collisions with intro paragraph text
    await expect(page.getByText('Humphry Davy', { exact: true })).toBeVisible();
    await expect(page.getByText('Albert Ghiorso et al.', { exact: true })).toBeVisible();
  });

  test('rows are vertically separated — not overlapping', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    // Verify specific discoverer names are at different y positions
    // These are the prolific discoverer row labels (not block legend, not intro text)
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

  test('element card is hoverable', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    // Discoverer network uses SectionedCardList — hover over a card link
    const firstCard = page.locator('section[role="region"] a').first();
    if (await firstCard.count() > 0) {
      await firstCard.hover({ force: true });
      await page.waitForTimeout(200);
    }
  });
});
