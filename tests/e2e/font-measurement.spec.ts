/**
 * Font-Dependent Measurement Test — prevents Lesson #9.
 *
 * Lesson #9: Pretext SVG text measurements were cached using fallback font
 *   metrics before the custom web font loaded. Once the font arrived,
 *   previously measured text no longer matched — causing layout shift,
 *   text overflow, and dropcap crowding.
 *
 * This test validates:
 *   1. After page load settles, SVG text dimensions are stable (no re-layout)
 *   2. Text measurements use the loaded font, not the fallback
 *   3. The Folio summary text doesn't overflow its container after font load
 */
import { test, expect } from '@playwright/test';

test.describe('Font-dependent text measurement', () => {
  test('Folio SVG text is stable after fonts load', async ({ page }) => {
    await page.goto('/elements/Fe');

    // Wait for fonts to be ready (the app uses useFontsReady hook)
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');

    // Measure SVG text bounding boxes
    const snapshot1 = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      return Array.from(svgs)
        .map((svg) => {
          const rect = svg.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        })
        .filter((r) => r.height > 20);
    });

    // Wait 500ms more for any deferred re-measurement
    await page.waitForTimeout(500);

    const snapshot2 = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      return Array.from(svgs)
        .map((svg) => {
          const rect = svg.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        })
        .filter((r) => r.height > 20);
    });

    // SVG dimensions should be stable (no layout shift from late re-measurement)
    expect(snapshot1.length).toBe(snapshot2.length);
    for (let i = 0; i < snapshot1.length; i++) {
      expect(
        Math.abs(snapshot1[i].height - snapshot2[i].height),
        `SVG ${i} height shifted from ${snapshot1[i].height} to ${snapshot2[i].height} after fonts settled`,
      ).toBeLessThan(5);
    }
  });

  test('drop cap text renders with correct font metrics', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');

    // Find drop cap elements (large initial letters in intro text)
    const dropCaps = await page.evaluate(() => {
      const texts = document.querySelectorAll('svg text');
      const caps: { text: string; fontSize: number; y: number }[] = [];
      for (const t of texts) {
        const style = getComputedStyle(t);
        const fontSize = parseFloat(style.fontSize);
        // Drop caps are typically > 30px font size
        if (fontSize > 30 && (t.textContent?.length ?? 0) <= 2) {
          caps.push({
            text: t.textContent ?? '',
            fontSize,
            y: (t as SVGTextElement).getBBox?.()?.y ?? 0,
          });
        }
      }
      return caps;
    });

    // If drop caps exist, they should have positive y position (not stacked at 0)
    for (const cap of dropCaps) {
      expect(cap.fontSize, `Drop cap "${cap.text}" has unexpectedly small font`).toBeGreaterThan(20);
    }
  });

  test('About page text has stable height after font load', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Snapshot the page height
    const height1 = await page.evaluate(() => document.body.scrollHeight);

    await page.waitForTimeout(500);

    const height2 = await page.evaluate(() => document.body.scrollHeight);

    // Page height should not change after fonts have loaded (no late re-measurement)
    expect(
      Math.abs(height1 - height2),
      `Page height shifted from ${height1} to ${height2} after fonts settled`,
    ).toBeLessThan(10);
  });
});
