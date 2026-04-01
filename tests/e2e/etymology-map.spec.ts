import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Property-based e2e tests for the Etymology Map page
//
// These tests assert structural and accessibility properties that the
// Etymology Map should satisfy. They are written RED-first: the current
// implementation violates several of these properties, so the tests will
// fail until the code is brought into compliance.
// ---------------------------------------------------------------------------

const ETYMOLOGY_URL = '/etymology-map';

const ORIGIN_CATEGORIES = [
  'place',
  'person',
  'mythology',
  'property',
  'mineral',
  'astronomical',
  'unknown',
];

test.describe('Etymology Map — property-based tests', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  // -------------------------------------------------------------------------
  // 1. Semantic section headings
  //    Each origin section should use an <h2> for its heading, not a <div>.
  // -------------------------------------------------------------------------
  test('each origin section uses a semantic <h2> heading', async ({ page }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount, 'Should have origin sections').toBeGreaterThan(0);

    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const h2 = section.locator('h2');
      const h2Count = await h2.count();
      expect(
        h2Count,
        `Section ${i} should contain an <h2> element for its heading`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // -------------------------------------------------------------------------
  // 2. No hardcoded colors
  //    All text should use theme-approved colors, not raw hex literals like
  //    '#555' or '#fff'.
  // -------------------------------------------------------------------------
  test('no elements use hardcoded non-theme colors', async ({ page }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    // Check for inline style color: '#555'
    const elemsWith555 = page.locator('[style*="color: #555"], [style*="color:#555"]');
    const count555 = await elemsWith555.count();
    expect(
      count555,
      'No elements should use hardcoded color #555 — use a theme token instead',
    ).toBe(0);

    // Check for inline style color: '#fff'
    const elemsWithFff = page.locator('[style*="color: #fff"], [style*="color:#fff"]');
    const countFff = await elemsWithFff.count();
    expect(
      countFff,
      'No elements should use hardcoded color #fff — use a theme token instead',
    ).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 3. Card hover/focus visibility
  //    Each etymology card should have visible focus styling when tabbed to.
  // -------------------------------------------------------------------------
  test('cards have visible focus styling when tabbed', async ({ page }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    // Tab several times to reach the first card link
    // (skip past nav links by tabbing enough times)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
    }

    // Find the currently focused element
    const focused = page.locator(':focus');
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());

    // If we landed on an <a> (card), check its focus styling
    if (tagName === 'a') {
      const outline = await focused.evaluate(
        (el) => getComputedStyle(el).outline,
      );
      const outlineWidth = await focused.evaluate(
        (el) => getComputedStyle(el).outlineWidth,
      );
      const boxShadow = await focused.evaluate(
        (el) => getComputedStyle(el).boxShadow,
      );
      // The element must have SOME visible focus indicator:
      // either a non-zero outline, a box-shadow, or a changed border
      const hasVisibleOutline =
        outlineWidth !== '0px' && !outline.includes('none');
      const hasBoxShadow = boxShadow !== 'none';

      expect(
        hasVisibleOutline || hasBoxShadow,
        `Focused card should have a visible outline or box-shadow for accessibility. ` +
          `Got outline="${outline}", boxShadow="${boxShadow}"`,
      ).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // 4. All cards have distinct positions (no overlap/stacking)
  // -------------------------------------------------------------------------
  test('all element cards within each section have unique positions', async ({
    page,
  }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    for (let s = 0; s < sectionCount; s++) {
      const section = sections.nth(s);
      const sectionId =
        (await section.getAttribute('id')) ?? `section-${s}`;
      const cards = section.locator('a');
      const cardCount = await cards.count();

      if (cardCount === 0) continue;

      const positions: { x: number; y: number }[] = [];

      for (let c = 0; c < cardCount; c++) {
        const box = await cards.nth(c).boundingBox();
        expect(
          box,
          `Card ${c} in section "${sectionId}" should have a bounding box`,
        ).not.toBeNull();
        positions.push({
          x: Math.round(box!.x),
          y: Math.round(box!.y),
        });
      }

      // Property: no two cards should share the exact same position
      // (3px tolerance for sub-pixel rounding)
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = Math.abs(positions[i].x - positions[j].x);
          const dy = Math.abs(positions[i].y - positions[j].y);
          expect(
            dx > 3 || dy > 3,
            `Section "${sectionId}": cards ${i} and ${j} overlap at ~(${positions[i].x}, ${positions[i].y})`,
          ).toBe(true);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // 5. Drop cap readability
  //    The introduction SVG should have visible text with non-zero dimensions.
  // -------------------------------------------------------------------------
  test('introduction SVG has visible text with non-zero dimensions', async ({
    page,
  }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const introSvg = page.locator(
      'svg[role="img"][aria-label="Introduction to etymology map"]',
    );
    await expect(introSvg, 'Intro SVG should be visible').toBeVisible();

    const svgTextElements = introSvg.locator('text');
    const textCount = await svgTextElements.count();
    expect(
      textCount,
      'Intro SVG should contain text elements',
    ).toBeGreaterThan(0);

    let visibleCount = 0;
    for (let i = 0; i < textCount; i++) {
      const box = await svgTextElements.nth(i).boundingBox();
      if (!box) continue;

      expect(
        box.width,
        `Intro SVG text element ${i} should have non-zero width`,
      ).toBeGreaterThan(0);
      expect(
        box.height,
        `Intro SVG text element ${i} should have non-zero height`,
      ).toBeGreaterThan(0);
      visibleCount++;
    }

    expect(
      visibleCount,
      'At least one SVG text element should be visible',
    ).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // 6. Section count matches card count
  //    Each section header shows a count badge — the actual number of cards
  //    in that section must match.
  // -------------------------------------------------------------------------
  test('section header count badge matches actual card count', async ({
    page,
  }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    for (let s = 0; s < sectionCount; s++) {
      const section = sections.nth(s);
      const sectionId =
        (await section.getAttribute('id')) ?? `section-${s}`;

      // The count badge is the second <span> inside the section header
      // (the first <span> is the origin name)
      const headerSpans = section.locator('div > span, h2 > span');
      const spanCount = await headerSpans.count();

      // Find the count span (last span in the header area)
      let badgeText: string | null = null;
      for (let i = 0; i < spanCount; i++) {
        const text = (await headerSpans.nth(i).textContent())?.trim() ?? '';
        if (/^\d+$/.test(text)) {
          badgeText = text;
          break;
        }
      }

      expect(
        badgeText,
        `Section "${sectionId}" should have a numeric count badge`,
      ).not.toBeNull();

      const expectedCount = parseInt(badgeText!, 10);
      const cards = section.locator('a');
      const actualCount = await cards.count();

      expect(
        actualCount,
        `Section "${sectionId}": card count (${actualCount}) should match badge (${expectedCount})`,
      ).toBe(expectedCount);
    }
  });

  // -------------------------------------------------------------------------
  // 7. All origin sections present
  //    The page should display all 7 origin categories.
  // -------------------------------------------------------------------------
  test('all expected origin sections are present', async ({ page }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const sections = page.locator('section');
    const sectionCount = await sections.count();

    const foundIds: string[] = [];
    for (let i = 0; i < sectionCount; i++) {
      const id = await sections.nth(i).getAttribute('id');
      if (id) foundIds.push(id.toLowerCase());
    }

    // At least 6 of the 7 categories should be present
    // (unknown may have 0 elements and be omitted)
    const requiredCategories = ORIGIN_CATEGORIES.filter(
      (c) => c !== 'unknown',
    );
    for (const category of requiredCategories) {
      expect(
        foundIds,
        `Origin section "${category}" should be present on the page`,
      ).toContain(category);
    }

    // Ideally all 7 are present
    expect(
      sectionCount,
      'Should have at least 6 origin sections',
    ).toBeGreaterThanOrEqual(6);
  });

  // -------------------------------------------------------------------------
  // 8. Cards link to element pages
  //    Each card's href should match /element/{symbol}.
  // -------------------------------------------------------------------------
  test('all cards link to element pages with correct href pattern', async ({
    page,
  }) => {
    await page.goto(ETYMOLOGY_URL);
    await expect(page.locator('section').first()).toBeVisible();

    const sections = page.locator('section');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    let totalCards = 0;

    for (let s = 0; s < sectionCount; s++) {
      const section = sections.nth(s);
      const sectionId =
        (await section.getAttribute('id')) ?? `section-${s}`;
      const cards = section.locator('a');
      const cardCount = await cards.count();

      for (let c = 0; c < cardCount; c++) {
        const href = await cards.nth(c).getAttribute('href');
        expect(
          href,
          `Card ${c} in section "${sectionId}" should have an href`,
        ).not.toBeNull();
        expect(
          href,
          `Card ${c} in section "${sectionId}" href "${href}" should match /element/{symbol} pattern`,
        ).toMatch(/^\/element\/[A-Z][a-z]?$/);
        totalCards++;
      }
    }

    expect(
      totalCards,
      'Should have at least some element cards on the page',
    ).toBeGreaterThan(0);
  });
});
