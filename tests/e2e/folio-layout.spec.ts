import { test, expect } from '@playwright/test';

/**
 * Folio layout regression tests.
 * Verifies that element detail pages have correct alignment and no overlap
 * across desktop, mobile portrait, and mobile landscape viewports.
 */

const ELEMENTS = [
  { name: 'Iron (transition metal)', path: '/elements/Fe' },
  { name: 'Cobalt (neighbour)', path: '/elements/Co' },
  { name: 'Barium (alkaline earth)', path: '/elements/Ba' },
  { name: 'Hydrogen (short summary)', path: '/elements/H' },
  { name: 'Oganesson (synthetic)', path: '/elements/Og' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
];

test.describe('Folio layout — no overlap or clipping', () => {
  for (const vp of VIEWPORTS) {
    test(`[${vp.name}] data plate does not overlap rank rows`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      for (const el of ELEMENTS) {
        await page.goto(el.path, { waitUntil: 'commit' });
        await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });

        const plate = await page.$('[data-testid="data-plate"]');
        const rankRows = await page.$('.folio-rank-rows');
        if (!plate || !rankRows) continue;

        const plateBB = await plate.boundingBox();
        const rankBB = await rankRows.boundingBox();
        if (!plateBB || !rankBB) continue;

        // Data plate bottom must not extend into rank rows area
        expect(
          plateBB.y + plateBB.height,
          `${el.name} [${vp.name}]: data plate overlaps rank rows`,
        ).toBeLessThanOrEqual(rankBB.y + 2); // 2px tolerance
      }

      await context.close();
    });

    test(`[${vp.name}] category text is not clipped in data plate`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      for (const el of ELEMENTS) {
        await page.goto(el.path, { waitUntil: 'commit' });
        await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });

        // Each DataPlateRow is an SVG with viewBox — text should not overflow SVG bounds
        const overflows = await page.evaluate(() => {
          const svgs = document.querySelectorAll('[data-testid="data-plate"] svg');
          const results: string[] = [];
          svgs.forEach((svg) => {
            const svgEl = svg as SVGSVGElement;
            const texts = svgEl.querySelectorAll('text');
            texts.forEach((text) => {
              const textBB = text.getBBox();
              const viewBox = svgEl.viewBox?.baseVal;
              if (viewBox && textBB.x + textBB.width > viewBox.width + 2) {
                results.push(`${text.textContent}: ${textBB.width}px > ${viewBox.width}px viewBox`);
              }
            });
          });
          return results;
        });

        expect(overflows, `${el.name} [${vp.name}]: text overflow in data plate`).toEqual([]);
      }

      await context.close();
    });
  }
});

test.describe('Folio layout — mobile stacking', () => {
  test('mobile: layout is column flex, marginalia below main', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('/elements/Fe', { waitUntil: 'commit' });
    await page.waitForSelector('.folio-layout', { timeout: 10000 });

    const direction = await page.$eval('.folio-layout', (el) =>
      getComputedStyle(el).flexDirection,
    );
    expect(direction).toBe('column');

    const platePosition = await page.$eval('[data-testid="data-plate"]', (el) =>
      getComputedStyle(el).position,
    );
    expect(platePosition).toBe('static');

    await context.close();
  });

  test('desktop: layout is row flex, marginalia beside main', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/elements/Fe', { waitUntil: 'commit' });
    await page.waitForSelector('.folio-layout', { timeout: 10000 });

    const direction = await page.$eval('.folio-layout', (el) =>
      getComputedStyle(el).flexDirection,
    );
    expect(direction).toBe('row');

    const platePosition = await page.$eval('[data-testid="data-plate"]', (el) =>
      getComputedStyle(el).position,
    );
    expect(platePosition).toBe('absolute');

    await context.close();
  });
});
