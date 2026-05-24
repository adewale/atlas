import { test, expect, type Page } from '@playwright/test';

/**
 * Drop-cap overlap regression (the bug fixed by lib/measurement-cache).
 *
 * On a cold first load the drop-cap glyph was measured during the web-font
 * fallback period (narrow Georgia metrics) but rendered after the web font
 * swapped in (wider Cinzel), so the body text indent didn't clear the drop
 * cap and the two overlapped. It went away on reload (font already cached).
 *
 * Invariant we assert: every body line that is *indented beside* the drop
 * cap must start at or after the drop cap's right edge. The staleness bug
 * makes the indent too narrow, so an indented line starts left of the
 * rendered glyph — caught here. We deliberately do NOT compare against the
 * non-indented full-width lines below the drop cap: an SVG <text> bounding
 * box includes the font's descent padding, which would spuriously "overlap"
 * the next line even when no ink does.
 *
 * - "warm load" runs on every project; it guards the indent math generally.
 * - "cold load" delays the font file so the fallback is measured first; on
 *   the `webkit-mobile` project this reproduces the original failure path.
 */

const TOLERANCE = 2;

async function indentViolations(page: Page): Promise<string[]> {
  return page.evaluate((tol) => {
    const svg = document.querySelector('[data-testid="pt-intro"]');
    if (!svg) return ['MISSING: [data-testid="pt-intro"]'];

    const texts = Array.from(svg.querySelectorAll('text'));
    const dropCap = texts.find(
      (t) => parseFloat(t.getAttribute('font-size') || '0') >= 48,
    );
    if (!dropCap) return ['MISSING: drop cap (font-size >= 48)'];

    const body = texts.filter((t) => t !== dropCap);
    if (body.length === 0) return ['MISSING: body lines'];

    const dcRight = dropCap.getBoundingClientRect().right;
    // The non-indented lines sit at the paragraph's left margin; that is the
    // minimum left edge across all body lines.
    const marginLeft = Math.min(
      ...body.map((t) => t.getBoundingClientRect().left),
    );

    const violations: string[] = [];
    for (const line of body) {
      const left = line.getBoundingClientRect().left;
      const isIndented = left > marginLeft + 20; // clearly pushed off the margin
      if (!isIndented) continue;
      if (left < dcRight - tol) {
        violations.push(
          `indented line "${(line.textContent || '').slice(0, 24)}" ` +
            `L=${Math.round(left)} < dropCap R=${Math.round(dcRight)}`,
        );
      }
    }
    return violations;
  }, TOLERANCE);
}

test.describe('Intro drop cap: indented lines must clear the drop cap', () => {
  test('warm load (font cached or fallback)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pt-intro"] text', { timeout: 15000 });
    await page.waitForTimeout(1200); // settle any font swap + re-layout

    const violations = await indentViolations(page);
    expect(violations, `indent does not clear drop cap:\n${violations.join('\n')}`).toEqual([]);
  });

  test('cold load (font delayed → fallback measured first, then swapped)', async ({ page }) => {
    // Hold the web-font file back so the first measurement uses the fallback.
    await page.route(/fonts\.gstatic\.com/, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="pt-intro"] text', { timeout: 15000 });

    // Wait for the web font to apply if the environment has network; tolerate
    // offline sandboxes where it never loads (fallback stays — still valid).
    await page
      .waitForFunction(() => (document as Document).fonts.check('700 48px Cinzel'), null, {
        timeout: 5000,
      })
      .catch(() => undefined);
    await page.waitForTimeout(800); // let the post-swap re-layout flush

    const violations = await indentViolations(page);
    expect(violations, `indent does not clear drop cap after swap:\n${violations.join('\n')}`).toEqual([]);
  });
});
