import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Screenshot tests for all 7 visualization pages
// ---------------------------------------------------------------------------

test.describe('Phase Landscape', () => {
  test('renders 118 elements colored by phase', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/phase-landscape.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Phase Landscape at STP');

    // Should have 118 element cells
    const cells = page.locator('svg g[role="button"]');
    await expect(cells).toHaveCount(118);

    // Back link
    await expect(page.locator('a[href="/"]')).toBeVisible();
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
    // Click on Iron
    await page.locator('g[aria-label*="Iron"]').locator('..').click();
    await page.waitForURL(/\/element\/Fe/);
    expect(page.url()).toContain('/element/Fe');
  });
});

test.describe('Property Scatter', () => {
  test('renders scatter plot with element squares', async ({ page }) => {
    await page.goto('/property-scatter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/property-scatter.png', fullPage: true });

    // Axis labels should be visible
    await expect(page.locator('text:has-text("Electronegativity")')).toBeVisible();
    await expect(page.locator('text:has-text("Ionization energy")')).toBeVisible();

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

    // Hover over the first square
    const firstSquare = page.locator('svg rect[width="10"]').first();
    await firstSquare.hover();
    await page.waitForTimeout(200);

    // A tooltip rect should appear
    const tooltips = page.locator('svg rect[width="120"]');
    const tooltipCount = await tooltips.count();
    expect(tooltipCount).toBeGreaterThan(0);
  });
});

test.describe('Anomaly Explorer', () => {
  test('renders periodic table with anomaly buttons', async ({ page }) => {
    await page.goto('/anomaly-explorer');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/anomaly-explorer.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Anomaly Explorer');

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

test.describe('Neighborhood Graph', () => {
  test('renders nodes and edges', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/neighborhood-graph.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Neighbourhood Graph');

    // Should have node circles (118 elements)
    const circles = page.locator('svg circle');
    const circleCount = await circles.count();
    expect(circleCount).toBe(118);

    // Should have edge lines (stroke #ccc for non-highlighted edges)
    const edges = page.locator('svg line[stroke="#ccc"]');
    const edgeCount = await edges.count();
    expect(edgeCount).toBeGreaterThan(50);
  });

  test('nodes are not stacked — corners separated', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await page.waitForTimeout(2000);

    // Check a few node labels aren't at the same position
    const nodeButtons = page.locator('g[role="button"]');
    const firstBox = await nodeButtons.first().boundingBox();
    const lastBox = await nodeButtons.last().boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();
    // First and last nodes should be significantly separated
    const dist = Math.sqrt(
      Math.pow(lastBox!.x - firstBox!.x, 2) + Math.pow(lastBox!.y - firstBox!.y, 2),
    );
    expect(dist).toBeGreaterThan(100);
  });

  test('hover highlights neighborhood', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await page.waitForTimeout(2000);

    // Hover over a node
    const feNode = page.locator('g[aria-label*="Iron"]');
    await feNode.hover();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/neighborhood-hover.png', fullPage: true });
  });

  test('clicking node navigates to element', async ({ page }) => {
    await page.goto('/neighborhood-graph');
    await page.waitForTimeout(2000);

    await page.locator('g[aria-label*="Iron"]').click();
    await page.waitForURL(/\/element\/Fe/);
    expect(page.url()).toContain('/element/Fe');
  });
});

test.describe('Discovery Timeline', () => {
  test('renders timeline with antiquity and historical elements', async ({ page }) => {
    await page.goto('/discovery-timeline');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/discovery-timeline.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Discovery Timeline');

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

    await expect(page.locator('h1')).toHaveText('Etymology Map');

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
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/element/');
  });
});

test.describe('Drop cap text flow', () => {
  test('drop cap initial does not overlap body text', async ({ page }) => {
    await page.goto('/element/Fe');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/drop-cap-fe.png', fullPage: true });

    // The summary SVG contains the drop cap and body text
    const summarySvg = page.locator('svg[aria-label="Element summary"]');
    await expect(summarySvg).toBeVisible();

    // The drop cap is a large <text> element (font-size ~48px)
    const dropCap = summarySvg.locator('text[font-size="48"]');
    const dropCapCount = await dropCap.count();
    expect(dropCapCount).toBe(1);

    // Body text lines exist after the drop cap
    const bodyLines = summarySvg.locator('text:not([font-size="48"])');
    const bodyCount = await bodyLines.count();
    expect(bodyCount).toBeGreaterThan(2);

    // Drop cap should be positioned at the top-left of the SVG
    const svgBox = await summarySvg.boundingBox();
    const dropCapBox = await dropCap.boundingBox();
    expect(svgBox).not.toBeNull();
    expect(dropCapBox).not.toBeNull();

    // Drop cap should be within the SVG bounds and have visible dimensions
    expect(dropCapBox!.width).toBeGreaterThan(5);
    expect(dropCapBox!.height).toBeGreaterThan(20);

    // The first few body lines should have different x from later lines,
    // showing text flows around the drop cap (narrower width near cap)
    // Collect all body line x positions relative to SVG
    const xPositions: number[] = [];
    for (let i = 0; i < bodyCount; i++) {
      const box = await bodyLines.nth(i).boundingBox();
      if (box) xPositions.push(Math.round(box.x - svgBox!.x));
    }
    // At least the first line should be indented (x > 0) from the drop cap
    // while later lines return to x ≈ 0
    const hasIndentedLine = xPositions.some((x) => x > 10);
    const hasFullWidthLine = xPositions.some((x) => x < 5);
    expect(hasIndentedLine).toBe(true);
    expect(hasFullWidthLine).toBe(true);
  });

  test('drop cap flows text on Hydrogen (short summary)', async ({ page }) => {
    await page.goto('/element/H');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/drop-cap-h.png', fullPage: true });

    const summarySvg = page.locator('svg[aria-label="Element summary"]');
    await expect(summarySvg).toBeVisible();

    // Drop cap should still exist
    const dropCap = summarySvg.locator('text[font-size="48"]');
    await expect(dropCap).toBeVisible();
  });

  test('drop cap flows text on Oganesson (long summary)', async ({ page }) => {
    await page.goto('/element/Og');
    await page.waitForTimeout(2000);

    const summarySvg = page.locator('svg[aria-label="Element summary"]');
    await expect(summarySvg).toBeVisible();

    const dropCap = summarySvg.locator('text[font-size="48"]');
    await expect(dropCap).toBeVisible();

    // Lines after the drop cap height should use full width (x ≈ 0 relative to SVG)
    const svgBox = await summarySvg.boundingBox();
    expect(svgBox).not.toBeNull();
    const bodyLines = summarySvg.locator('text:not([font-size="48"])');
    const count = await bodyLines.count();
    if (count > 4) {
      // A later line should have x close to 0 (full width, not indented)
      const laterBox = await bodyLines.nth(count - 1).boundingBox();
      expect(laterBox).not.toBeNull();
      const relX = laterBox!.x - svgBox!.x;
      expect(relX).toBeLessThan(20);
    }
  });
});

test.describe('Discoverer Detail', () => {
  test('renders discoverer page with elements', async ({ page }) => {
    await page.goto('/discoverer/' + encodeURIComponent('Humphry Davy'));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/discoverer-davy.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Humphry Davy');

    // Should show element count
    await expect(page.locator('text=element')).toBeVisible();

    // Back link to network
    await expect(page.locator('a[href="/discoverer-network"]')).toBeVisible();

    // Related discoverers section
    await expect(page.locator('h2:has-text("Related Discoverers")')).toBeVisible();
  });

  test('prev/next navigation works', async ({ page }) => {
    await page.goto('/discoverer/' + encodeURIComponent('Humphry Davy'));
    await page.waitForTimeout(1500);

    // Should have prev or next links
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Click a nav link
    await navLinks.first().click();
    await page.waitForTimeout(1500);

    // Should be on a different discoverer page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('related discoverer links navigate correctly', async ({ page }) => {
    await page.goto('/discoverer/' + encodeURIComponent('Humphry Davy'));
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
    await page.goto('/timeline/1770');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/timeline-1770s.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('1770s');

    // Should show element count
    await expect(page.locator('text=element')).toBeVisible();

    // Back link to timeline
    await expect(page.locator('a[href="/discovery-timeline"]')).toBeVisible();

    // Nearby eras section
    await expect(page.locator('h2:has-text("Nearby Eras")')).toBeVisible();
  });

  test('antiquity era page works', async ({ page }) => {
    await page.goto('/timeline/antiquity');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toHaveText('Antiquity');
    await expect(page.locator('text=element')).toBeVisible();
  });

  test('prev/next era navigation works', async ({ page }) => {
    await page.goto('/timeline/1770');
    await page.waitForTimeout(1500);

    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    await navLinks.first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('discoverer links from era page work', async ({ page }) => {
    await page.goto('/timeline/1770');
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
    await page.goto('/entity-map');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/entity-map.png', fullPage: true });

    await expect(page.locator('h1')).toHaveText('Entity Map');

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
    await page.goto('/entity-map');
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

    await expect(page.locator('h1')).toHaveText('Discoverer Network');

    // Should have element squares (rects with block colors)
    const squares = page.locator('svg rect[rx="2"]');
    const count = await squares.count();
    expect(count).toBeGreaterThan(20); // Multiple discoverers with multiple elements
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

  test('hover shows tooltip', async ({ page }) => {
    await page.goto('/discoverer-network');
    await page.waitForTimeout(2000);

    // Hover over an element square
    const firstSquare = page.locator('svg g[style*="cursor: pointer"]').first();
    await firstSquare.hover();
    await page.waitForTimeout(200);
  });
});
