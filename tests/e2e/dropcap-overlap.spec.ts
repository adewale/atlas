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
 * - "cold load" delays the font file so the fallback is measured first, then
 *   requires Cinzel to arrive before asserting the repaired geometry.
 */

const TOLERANCE = 2;

type IndentCheck = { checked: number; violations: string[] };

async function checkIndent(page: Page): Promise<IndentCheck> {
  return page.evaluate((tol) => {
    const svg = document.querySelector('[data-testid="pt-intro"]');
    if (!svg) return { checked: 0, violations: ['MISSING: [data-testid="pt-intro"]'] };

    const texts = Array.from(svg.querySelectorAll('text'));
    const dropCap = texts.find(
      (t) => parseFloat(t.getAttribute('font-size') || '0') >= 48,
    );
    if (!dropCap) return { checked: 0, violations: ['MISSING: drop cap (font-size >= 48)'] };

    const body = texts.filter((t) => t !== dropCap);
    if (body.length === 0) return { checked: 0, violations: ['MISSING: body lines'] };

    const dcRight = dropCap.getBoundingClientRect().right;

    let checked = 0;
    const violations: string[] = [];
    for (const line of body) {
      const left = line.getBoundingClientRect().left;
      // The app writes computed flow offsets to each SVG <text x="...">.
      // Use that authored x-offset, not the minimum rendered left edge, because
      // wide desktop layouts can have only indented body lines.
      const isIndented = parseFloat(line.getAttribute('x') || '0') > 0;
      if (!isIndented) continue;
      checked++;
      if (left < dcRight - tol) {
        violations.push(
          `indented line "${(line.textContent || '').slice(0, 24)}" ` +
            `L=${Math.round(left)} < dropCap R=${Math.round(dcRight)}`,
        );
      }
    }
    return { checked, violations };
  }, TOLERANCE);
}

function expectNoOverlap({ checked, violations }: IndentCheck, label: string) {
  expect(checked, `${label}: expected at least one line beside the drop cap`).toBeGreaterThan(0);
  expect(violations, `${label}: indent does not clear drop cap:\n${violations.join('\n')}`).toEqual([]);
}

test.describe('Intro drop cap: indented lines must clear the drop cap', () => {
  test('warm load (font cached or fallback)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="pt-intro"] text', { timeout: 15000 });
    await page.waitForTimeout(1200); // settle any font swap + re-layout

    expectNoOverlap(await checkIndent(page), 'warm load');
  });

  test('cold load (font delayed → fallback measured first, then swapped)', async ({ page }) => {
    // Hold the web-font file back so the first measurement uses the fallback.
    await page.route(/fonts\.gstatic\.com/, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="pt-intro"] text', { timeout: 15000 });

    // This regression only proves anything if Cinzel really arrives. If the
    // font never loads, the page stays in fallback and the stale-canvas failure
    // path was not exercised.
    await expect
      .poll(
        () => page.evaluate(async () => {
          const faces = await document.fonts.load('700 80px Cinzel', 'O');
          return faces.length > 0 && document.fonts.check('700 80px Cinzel');
        }),
        { timeout: 10000 },
      )
      .toBe(true);
    await page.waitForTimeout(800); // let the post-swap re-layout flush

    expectNoOverlap(await checkIndent(page), 'cold load after font swap');
  });
});
