/**
 * Layout Shift Detector — prevents Lessons #11 and #12.
 *
 * Lesson #11: Conditional rendering (`{show && <button>}`) in flex layouts
 *   caused content reflow. Dynamic text changing line count shifted content.
 *
 * Lesson #12: Proportional numerals in dynamic number displays caused width
 *   changes as digit counts changed (e.g. "99" → "100").
 *
 * This E2E test:
 *   1. Checks that interactive pages have no layout shift when UI state changes
 *   2. Verifies dynamic number displays use tabular-nums
 *   3. Measures bounding boxes before and after interaction to detect reflow
 */
import { test, expect } from '@playwright/test';

test.describe('Layout shift: conditional rendering', () => {
  test('PhaseLandscape STP button does not shift layout', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForLoadState('networkidle');

    // Find the main content area and measure its position
    const svg = page.locator('svg').first();
    const initialBox = await svg.boundingBox();
    expect(initialBox).not.toBeNull();

    // Interact with the slider/temperature control if it exists
    const slider = page.locator('input[type="range"]');
    if (await slider.count() > 0) {
      // Move the slider to trigger the STP button appearance
      await slider.fill('500');
      await page.waitForTimeout(200);

      const afterBox = await svg.boundingBox();
      expect(afterBox).not.toBeNull();

      // The SVG should not have shifted vertically by more than 2px
      expect(
        Math.abs(afterBox!.y - initialBox!.y),
        'SVG should not shift vertically when slider changes',
      ).toBeLessThan(3);
    }
  });
});

test.describe('Tabular numerals on dynamic displays', () => {
  test('PhaseLandscape temperature display uses tabular-nums', async ({ page }) => {
    await page.goto('/phase-landscape');
    await page.waitForLoadState('networkidle');

    const hasTabularNums = await page.evaluate(() => {
      // Find elements that display dynamic numbers
      const candidates = document.querySelectorAll(
        '[data-testid*="temp"], .temperature, .tick-label, output, [role="status"]',
      );

      // Also check any element with numeric content near a slider
      const sliders = document.querySelectorAll('input[type="range"]');
      const nearbyElements: Element[] = [];
      sliders.forEach((slider) => {
        const parent = slider.parentElement;
        if (parent) {
          parent.querySelectorAll('span, output, div, text').forEach((el) => {
            if (/^\d/.test(el.textContent?.trim() ?? '')) {
              nearbyElements.push(el);
            }
          });
        }
      });

      const allElements = [...candidates, ...nearbyElements];
      if (allElements.length === 0) return { found: false, checked: 0 };

      let tabularCount = 0;
      for (const el of allElements) {
        const style = getComputedStyle(el);
        if (
          style.fontVariantNumeric.includes('tabular-nums') ||
          style.fontFeatureSettings.includes('tnum')
        ) {
          tabularCount++;
        }
      }

      return { found: true, checked: allElements.length, tabular: tabularCount };
    });

    // If we found dynamic number elements, at least some should use tabular-nums
    if (hasTabularNums.found && (hasTabularNums.checked ?? 0) > 0) {
      expect(
        hasTabularNums.tabular,
        'Dynamic number displays should use font-variant-numeric: tabular-nums',
      ).toBeGreaterThan(0);
    }
  });

  test('PropertyScatter axis labels use tabular-nums', async ({ page }) => {
    await page.goto('/property-scatter');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(() => {
      // Find SVG text elements that contain numbers (tick labels)
      const textEls = document.querySelectorAll('svg text');
      const numericTexts = Array.from(textEls).filter((el) =>
        /^\d/.test(el.textContent?.trim() ?? ''),
      );

      let tabularCount = 0;
      for (const el of numericTexts) {
        const style = getComputedStyle(el);
        if (
          style.fontVariantNumeric.includes('tabular-nums') ||
          style.fontFeatureSettings.includes('tnum')
        ) {
          tabularCount++;
        }
      }

      return { total: numericTexts.length, tabular: tabularCount };
    });

    if (result.total > 0) {
      expect(
        result.tabular,
        `${result.total} numeric SVG labels found but only ${result.tabular} use tabular-nums`,
      ).toBeGreaterThan(0);
    }
  });
});

test.describe('Layout shift: SVG position stability', () => {
  const vizPages = [
    '/phase-landscape',
    '/property-scatter',
    '/anomaly-explorer',
    '/discovery-timeline',
  ];

  for (const url of vizPages) {
    test(`${url} SVG does not shift after load settles`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const svgs = page.locator('svg');
      if ((await svgs.count()) === 0) return;

      const firstSvg = svgs.first();
      const box1 = await firstSvg.boundingBox();
      expect(box1).not.toBeNull();

      // Wait a bit for any animations/fonts to settle
      await page.waitForTimeout(500);

      const box2 = await firstSvg.boundingBox();
      expect(box2).not.toBeNull();

      // Position should be stable (< 2px drift)
      expect(
        Math.abs(box2!.y - box1!.y),
        `${url}: SVG shifted vertically by ${Math.abs(box2!.y - box1!.y)}px after settling`,
      ).toBeLessThan(3);
      expect(
        Math.abs(box2!.x - box1!.x),
        `${url}: SVG shifted horizontally by ${Math.abs(box2!.x - box1!.x)}px after settling`,
      ).toBeLessThan(3);
    });
  }
});
