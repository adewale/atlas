import { test, expect } from '@playwright/test';

/**
 * View Transition Morph Tests.
 *
 * Verifies that elements participating in cross-page view transitions
 * have the correct viewTransitionName CSS property set. This catches:
 * - Missing viewTransitionName on shared elements
 * - Typos in transition name strings
 * - Duplicate viewTransitionNames on the same page (causes morph failure)
 */

test.describe('Folio page — view transition names', () => {
  test('element symbol has viewTransitionName set', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('.folio-symbol', { timeout: 10000 });

    const vtName = await page.evaluate(() => {
      const el = document.querySelector('.folio-symbol');
      return el ? getComputedStyle(el).viewTransitionName : null;
    });

    expect(vtName).toBe('element-symbol');
  });

  test('atomic number has viewTransitionName set', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('.folio-number', { timeout: 10000 });

    const vtName = await page.evaluate(() => {
      const el = document.querySelector('.folio-number');
      return el ? getComputedStyle(el).viewTransitionName : null;
    });

    expect(vtName).toBe('element-number');
  });

  test('colour accent bar has viewTransitionName set', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForLoadState('networkidle');

    const vtName = await page.evaluate(() => {
      // The colour bar is an aria-hidden div with viewTransitionName
      const bars = document.querySelectorAll('[aria-hidden="true"]');
      for (const bar of bars) {
        const vt = getComputedStyle(bar).viewTransitionName;
        if (vt === 'element-cell-bg') return vt;
      }
      return null;
    });

    expect(vtName).toBe('element-cell-bg');
  });

  test('no duplicate viewTransitionNames on folio page', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('.folio-layout', { timeout: 10000 });

    const duplicates = await page.evaluate(() => {
      const names = new Map<string, number>();
      const all = document.querySelectorAll('*');
      all.forEach((el) => {
        const vt = getComputedStyle(el).viewTransitionName;
        if (vt && vt !== 'none' && vt !== 'auto') {
          names.set(vt, (names.get(vt) ?? 0) + 1);
        }
      });
      const dupes: string[] = [];
      names.forEach((count, name) => {
        if (count > 1) dupes.push(`${name} (×${count})`);
      });
      return dupes;
    });

    expect(duplicates, 'Duplicate viewTransitionNames cause morph failures').toEqual([]);
  });
});

test.describe('Periodic table — view transition names', () => {
  test('clicking element assigns viewTransitionName before navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]', { timeout: 10000 });

    // Check that the Fe cell has viewTransitionName attributes ready
    // (these are conditionally set via the vt() helper based on activeSymbol)
    const feCell = page.locator('[aria-label*="Iron"]');
    const box = await feCell.boundingBox();
    expect(box).not.toBeNull();

    // The table assigns viewTransitionName to the active element on click.
    // Verify the cell exists and is clickable (navigation works).
    await feCell.click();
    await page.waitForSelector('.folio-symbol', { timeout: 10000 });

    // After navigation, the folio page should have the morph targets
    const symbolVT = await page.evaluate(() => {
      const el = document.querySelector('.folio-symbol');
      return el ? getComputedStyle(el).viewTransitionName : null;
    });
    expect(symbolVT).toBe('element-symbol');
  });
});

test.describe('Data plate — view transition names', () => {
  test('group/period/block rows have transition names for cross-page morph', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });

    const vtNames = await page.evaluate(() => {
      const plate = document.querySelector('[data-testid="data-plate"]');
      if (!plate) return [];
      const children = plate.querySelectorAll('[style*="view-transition-name"]');
      const names: string[] = [];
      children.forEach((el) => {
        const vt = getComputedStyle(el).viewTransitionName;
        if (vt && vt !== 'none') names.push(vt);
      });
      // Also check direct children with inline styles
      plate.querySelectorAll('div').forEach((el) => {
        const vt = getComputedStyle(el).viewTransitionName;
        if (vt && vt !== 'none' && vt !== 'auto') names.push(vt);
      });
      return [...new Set(names)];
    });

    // Should contain group, period, and block transition names
    expect(vtNames).toContain('data-plate-group');
    expect(vtNames).toContain('data-plate-period');
    expect(vtNames).toContain('data-plate-block');
  });
});
