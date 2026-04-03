import { test, expect } from '@playwright/test';

/**
 * Folio overlap regression tests using real browser layout.
 *
 * These tests navigate to element detail pages and measure actual
 * bounding boxes to detect overlap between the identity block,
 * data plate, and shaped SVG text.
 */

const ELEMENTS = ['Fe', 'Ir', 'H', 'Og', 'Ba'];

test.describe('Folio — identity block must not overlap SVG text', () => {
  for (const sym of ELEMENTS) {
    test(`/elements/${sym}`, async ({ page }) => {
      await page.goto(`/elements/${sym}`, { waitUntil: 'commit' });
      await page.waitForSelector('.folio-identity', { timeout: 15000 });
      await page.waitForTimeout(800); // animations

      const result = await page.evaluate(() => {
        const identity = document.querySelector('.folio-identity');
        const svg = document.querySelector('svg[aria-label="Element summary"]');
        if (!identity || !svg) return { error: 'Missing elements' };

        const idRect = identity.getBoundingClientRect();
        const texts = svg.querySelectorAll('text');
        const overlapping: string[] = [];

        for (const t of texts) {
          const tRect = t.getBoundingClientRect();
          const hOverlap = tRect.left < idRect.right - 2 && tRect.right > idRect.left + 2;
          const vOverlap = tRect.top < idRect.bottom - 2 && tRect.bottom > idRect.top + 2;
          if (hOverlap && vOverlap) {
            overlapping.push(
              `"${(t.textContent || '').slice(0, 30)}" at (${Math.round(tRect.left)},${Math.round(tRect.top)})`
            );
          }
        }

        return {
          identity: {
            right: Math.round(idRect.right),
            bottom: Math.round(idRect.bottom),
            height: Math.round(idRect.height),
          },
          overlapping,
        };
      });

      console.log(`${sym}:`, JSON.stringify(result));

      if ('error' in result) {
        throw new Error(result.error);
      }
      expect(result.overlapping, `Text overlaps identity on /elements/${sym}`).toEqual([]);
    });
  }
});

test.describe('Folio — data plate must not overlap SVG text', () => {
  for (const sym of ELEMENTS) {
    test(`/elements/${sym}`, async ({ page }) => {
      await page.goto(`/elements/${sym}`, { waitUntil: 'commit' });
      await page.waitForSelector('[data-testid="data-plate"]', { timeout: 15000 });
      await page.waitForTimeout(800);

      const result = await page.evaluate(() => {
        const plate = document.querySelector('[data-testid="data-plate"]');
        const svg = document.querySelector('svg[aria-label="Element summary"]');
        if (!plate || !svg) return { error: 'Missing elements' };

        const plateRect = plate.getBoundingClientRect();
        const texts = svg.querySelectorAll('text');
        const overlapping: string[] = [];

        for (const t of texts) {
          const tRect = t.getBoundingClientRect();
          const hOverlap = tRect.left < plateRect.right - 2 && tRect.right > plateRect.left + 2;
          const vOverlap = tRect.top < plateRect.bottom - 2 && tRect.bottom > plateRect.top + 2;
          if (hOverlap && vOverlap) {
            overlapping.push(
              `"${(t.textContent || '').slice(0, 30)}" at (${Math.round(tRect.left)},${Math.round(tRect.top)})`
            );
          }
        }

        return { overlapping };
      });

      console.log(`${sym} plate:`, JSON.stringify(result));

      if ('error' in result) {
        throw new Error(result.error);
      }
      expect(result.overlapping, `Text overlaps data plate on /elements/${sym}`).toEqual([]);
    });
  }
});

test.describe('Folio — data plate must not overlap rank rows', () => {
  for (const sym of ELEMENTS) {
    test(`/elements/${sym}`, async ({ page }) => {
      await page.goto(`/elements/${sym}`, { waitUntil: 'commit' });
      await page.waitForSelector('[data-testid="data-plate"]', { timeout: 15000 });
      await page.waitForTimeout(800);

      const result = await page.evaluate(() => {
        const plate = document.querySelector('[data-testid="data-plate"]');
        const rankRows = document.querySelector('.folio-rank-rows');
        if (!plate || !rankRows) return { error: 'Missing elements' };

        const plateBottom = plate.getBoundingClientRect().bottom;
        const rankTop = rankRows.getBoundingClientRect().top;
        return { plateBottom: Math.round(plateBottom), rankTop: Math.round(rankTop), gap: Math.round(rankTop - plateBottom) };
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      console.log(`${sym}: plate bottom=${result.plateBottom}, rank top=${result.rankTop}, gap=${result.gap}`);
      expect(result.gap, `Data plate overlaps rank rows on /elements/${sym} (gap=${result.gap}px)`).toBeGreaterThanOrEqual(0);
    });
  }
});

test.describe('Folio — identity block is compact', () => {
  test('Fe: identity height is under 120px', async ({ page }) => {
    await page.goto('/elements/Fe', { waitUntil: 'commit' });
    await page.waitForSelector('.folio-identity', { timeout: 15000 });
    await page.waitForTimeout(800);

    const height = await page.evaluate(() => {
      const identity = document.querySelector('.folio-identity');
      return identity ? Math.round(identity.getBoundingClientRect().height) : -1;
    });

    console.log('Fe identity height:', height);
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThan(120);
  });
});
