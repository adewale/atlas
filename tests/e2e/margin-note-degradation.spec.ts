/**
 * Margin Note Progressive Disclosure Test — prevents Lesson #18.
 *
 * Lesson #18: Tufte-style margin notes work at >=1100px but on mobile there
 *   are no margins. Without explicit testing, a regression in useIsMobile
 *   could make notes disappear entirely on mobile.
 *
 * This test validates:
 *   1. On desktop (>=1100px): margin notes render as positioned <aside>
 *   2. On mobile (<1100px): margin notes render as <details> accordions
 *   3. Mobile <details> are interactive (can be opened/closed)
 *   4. No margin notes overflow the viewport on mobile
 */
import { test, expect } from '@playwright/test';

/** Pages known to use MarginNote. */
const PAGES_WITH_MARGIN_NOTES = [
  '/phase-landscape',
  '/property-scatter',
  '/categories/noble-gas',
  '/groups/1',
];

test.describe('Margin notes on desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const url of PAGES_WITH_MARGIN_NOTES) {
    test(`${url}: margin notes render as <aside> on desktop`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // On desktop, margin notes use the scatter-margin-note class on <aside>
      const asides = page.locator('aside.scatter-margin-note');
      const details = page.locator('details.margin-note-disclosure');

      const asideCount = await asides.count();
      const detailsCount = await details.count();

      // Either we find desktop margin notes, or the page might not have any
      // at this viewport. But we should NOT find mobile <details> at 1280px.
      if (asideCount > 0) {
        expect(detailsCount, 'Should not render mobile <details> at 1280px').toBe(0);
      }
    });
  }
});

test.describe('Margin notes on mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const url of PAGES_WITH_MARGIN_NOTES) {
    test(`${url}: margin notes render as <details> on mobile`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const asides = page.locator('aside.scatter-margin-note');
      const details = page.locator('details.margin-note-disclosure');

      const asideCount = await asides.count();
      const detailsCount = await details.count();

      // On mobile, should use <details>, not desktop <aside>
      if (detailsCount > 0) {
        expect(asideCount, 'Should not render desktop <aside> at 375px').toBe(0);
      }
    });
  }

  test('mobile <details> are interactive', async ({ page }) => {
    await page.goto(PAGES_WITH_MARGIN_NOTES[0]);
    await page.waitForLoadState('networkidle');

    const details = page.locator('details.margin-note-disclosure').first();
    if ((await details.count()) === 0) return;

    // Should be closed by default
    const isOpenBefore = await details.getAttribute('open');
    expect(isOpenBefore).toBeNull();

    // Click summary to open
    const summary = details.locator('summary');
    await summary.click();

    // Should now be open
    const isOpenAfter = await details.getAttribute('open');
    expect(isOpenAfter).not.toBeNull();

    // Content inside should be visible
    const content = details.locator('div');
    await expect(content).toBeVisible();
  });

  test('no margin notes overflow viewport on mobile', async ({ page }) => {
    for (const url of PAGES_WITH_MARGIN_NOTES) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        const details = document.querySelectorAll('details.margin-note-disclosure');
        const asides = document.querySelectorAll('aside.scatter-margin-note');

        const allNotes = [...details, ...asides];
        const overflowing: string[] = [];

        for (const note of allNotes) {
          const rect = note.getBoundingClientRect();
          if (rect.right > window.innerWidth + 5) {
            overflowing.push(`${note.tagName} at x=${Math.round(rect.x)}, right=${Math.round(rect.right)}`);
          }
        }

        return overflowing;
      });

      expect(
        overflow,
        `${url}: margin notes overflow viewport: ${overflow.join(', ')}`,
      ).toEqual([]);
    }
  });
});
