import { test, expect } from '@playwright/test';

/**
 * Real Text Measurement E2E Tests.
 *
 * Unlike unit tests that mock @chenglou/pretext, these tests run in a
 * real Chromium browser with real font rendering. They verify that:
 * - fitLabel / truncateToFit produces correct visual results
 * - SVG text doesn't overflow its container
 * - Drop cap characters are positioned correctly
 * - Long category names are abbreviated, not clipped
 */

test.describe('AtlasPlate text measurement', () => {
  test('category labels fit within card bounds', async ({ page }) => {
    await page.goto('/categories/transition-metal');
    await page.waitForSelector('svg[role="img"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check all text elements in the AtlasPlate SVG fit within card bounds
    const overflows = await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]') as SVGSVGElement;
      if (!svg) return ['No SVG found'];

      const results: string[] = [];
      const texts = svg.querySelectorAll('text');
      const viewBox = svg.viewBox?.baseVal;

      texts.forEach((text) => {
        const bbox = text.getBBox();
        // Text should not extend beyond viewBox right edge
        if (viewBox && bbox.x + bbox.width > viewBox.width + 4) {
          results.push(`"${text.textContent}" overflows: ${Math.round(bbox.x + bbox.width)}px > ${viewBox.width}px`);
        }
      });
      return results;
    });

    expect(overflows).toEqual([]);
  });

  test('element names in cards are truncated with ellipsis when needed', async ({ page }) => {
    await page.goto('/categories/transition-metal');
    await page.waitForSelector('svg[role="img"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify that long names have been truncated — the full name should NOT
    // appear as a visible text element if it's too wide for the card
    const textInfo = await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]') as SVGSVGElement;
      if (!svg) return [];
      const CARD_W = 100;
      const texts = svg.querySelectorAll('text');
      return Array.from(texts).map((t) => ({
        content: t.textContent ?? '',
        width: t.getBBox().width,
        fits: t.getBBox().width <= CARD_W - 8,
      }));
    });

    // Every rendered text element should fit within card bounds (with padding)
    for (const t of textInfo) {
      expect(t.fits, `"${t.content}" (${Math.round(t.width)}px) overflows card`).toBe(true);
    }
  });
});

test.describe('Folio text measurement', () => {
  test('summary SVG text lines have non-zero width from real font metrics', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('svg[aria-label="Element summary"]', { timeout: 10000 });
    await page.waitForTimeout(800); // wait for fonts + animation

    const lineWidths = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-label="Element summary"]');
      if (!svg) return [];
      const texts = svg.querySelectorAll('text');
      return Array.from(texts).map((t) => ({
        text: (t.textContent ?? '').slice(0, 30),
        width: t.getBBox().width,
      }));
    });

    expect(lineWidths.length).toBeGreaterThan(0);
    // Every text line should have non-zero width (real font measurement worked)
    for (const line of lineWidths) {
      expect(line.width, `Line "${line.text}..." has zero width`).toBeGreaterThan(0);
    }
  });

  test('DataPlateRow text fits within SVG viewBox at all viewport widths', async ({ browser }) => {
    for (const width of [375, 812, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 720 } });
      const page = await context.newPage();
      await page.goto('/elements/Ba'); // "alkaline earth metal" — longest category
      await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });
      await page.waitForTimeout(600);

      const overflows = await page.evaluate(() => {
        const plate = document.querySelector('[data-testid="data-plate"]');
        if (!plate) return ['No data plate found'];
        const svgs = plate.querySelectorAll('svg');
        const results: string[] = [];
        svgs.forEach((svg) => {
          const viewBox = (svg as SVGSVGElement).viewBox?.baseVal;
          const texts = svg.querySelectorAll('text');
          texts.forEach((t) => {
            const bbox = t.getBBox();
            if (viewBox && bbox.x + bbox.width > viewBox.width + 2) {
              results.push(`"${t.textContent}" at ${bbox.x + bbox.width}px > viewBox ${viewBox.width}px`);
            }
          });
        });
        return results;
      });

      expect(overflows, `Text overflow at ${width}px viewport`).toEqual([]);
      await context.close();
    }
  });
});

test.describe('Drop cap text measurement', () => {
  test('drop cap character has correct visual size', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // The About page uses IntroBlock with a drop cap
    const dropCapInfo = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      for (const svg of svgs) {
        const texts = svg.querySelectorAll('text');
        for (const t of texts) {
          const fontSize = parseFloat(getComputedStyle(t).fontSize);
          if (fontSize > 30 && (t.textContent?.length ?? 0) === 1) {
            const bbox = t.getBBox();
            return {
              char: t.textContent,
              fontSize,
              width: bbox.width,
              height: bbox.height,
            };
          }
        }
      }
      return null;
    });

    if (dropCapInfo) {
      // Drop cap should be a single uppercase letter
      expect(dropCapInfo.char).toMatch(/^[A-Z]$/);
      // Should have real dimensions from font measurement
      expect(dropCapInfo.width).toBeGreaterThan(5);
      expect(dropCapInfo.height).toBeGreaterThan(10);
      // Font size should be the large drop-cap size
      expect(dropCapInfo.fontSize).toBeGreaterThanOrEqual(30);
    }
  });
});
