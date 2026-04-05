/**
 * Regression test: drop cap must not resize after initial render.
 *
 * The bug: Cinzel web font loads after Pretext measures with Georgia
 * fallback. The drop cap renders at Georgia metrics, then jumps to
 * Cinzel metrics — visible as a flash/resize on first load.
 *
 * The fix: useFontsReady probes for 'Cinzel' specifically (not the
 * fallback stack) and re-measures when the web font loads.
 *
 * This test verifies the drop cap size is stable — same immediately
 * after load and after a delay (no late resize).
 */
import { test, expect } from '@playwright/test';

test.describe('Drop cap font stability', () => {
  test('drop cap on home page does not resize after load', async ({ page }) => {
    await page.goto('/');
    // Wait for page to render (including potential font loading)
    await page.waitForTimeout(1000);

    // Measure the drop cap SVG text element
    const getDropCapSize = async () => {
      return page.evaluate(() => {
        // The drop cap is the large initial character in the intro PretextSvg
        const texts = document.querySelectorAll('svg text');
        for (const t of texts) {
          const fs = t.getAttribute('font-size');
          if (fs && parseInt(fs) >= 48) {
            const r = t.getBoundingClientRect();
            return { width: Math.round(r.width), height: Math.round(r.height), fontSize: fs };
          }
        }
        return null;
      });
    };

    const sizeAt1s = await getDropCapSize();
    expect(sizeAt1s, 'Drop cap should exist').not.toBeNull();

    // Wait another 3 seconds for any late font loading
    await page.waitForTimeout(3000);
    const sizeAt4s = await getDropCapSize();
    expect(sizeAt4s, 'Drop cap should still exist').not.toBeNull();

    // The size should be identical — no resize after font load
    expect(sizeAt4s!.width, 'Drop cap width should be stable').toBe(sizeAt1s!.width);
    expect(sizeAt4s!.height, 'Drop cap height should be stable').toBe(sizeAt1s!.height);
  });
});
