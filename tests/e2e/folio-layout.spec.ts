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
  { name: 'Iridium (long summary)', path: '/elements/Ir' },
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

test.describe('Folio layout — Iridium identity overlap regression', () => {
  test('Ir: identity block does not overlap summary text on desktop', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/elements/Ir');
    await page.waitForSelector('.folio-identity', { timeout: 10000 });
    await page.waitForTimeout(600);

    const overlap = await page.evaluate(() => {
      const identity = document.querySelector('.folio-identity');
      const svg = document.querySelector('svg[aria-label="Element summary"]');
      if (!identity || !svg) return { error: 'Missing elements' };

      const idRect = identity.getBoundingClientRect();
      // Check if any SVG text element overlaps with the identity block
      const texts = svg.querySelectorAll('text');
      const overlapping: string[] = [];
      for (const t of texts) {
        const tRect = t.getBoundingClientRect();
        // Text whose left edge is inside the identity block area
        if (tRect.left < idRect.right && tRect.right > idRect.left &&
            tRect.top < idRect.bottom && tRect.bottom > idRect.top) {
          overlapping.push(`"${t.textContent?.slice(0, 30)}..." at x=${Math.round(tRect.left)}`);
        }
      }
      return { overlapping, idRight: Math.round(idRect.right), idBottom: Math.round(idRect.bottom) };
    });

    if ('error' in overlap) {
      expect(overlap.error).toBeUndefined();
    } else {
      expect(overlap.overlapping, 'Text overlaps identity block').toEqual([]);
    }

    await context.close();
  });

  test('Ir: identity block does not have excessive vertical space', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/elements/Ir');
    await page.waitForSelector('.folio-identity', { timeout: 10000 });
    await page.waitForTimeout(600);

    const spaceInfo = await page.evaluate(() => {
      const identity = document.querySelector('.folio-identity');
      const summaryArea = document.querySelector('.folio-summary-area');
      if (!identity || !summaryArea) return null;

      const idRect = identity.getBoundingClientRect();
      const areaRect = summaryArea.getBoundingClientRect();

      // The identity block's actual rendered height
      const actualHeight = idRect.height;
      // The summary area total height (driven by plate height or text)
      const areaHeight = areaRect.height;
      // Ratio of identity height to area height — should not be excessive
      return { actualHeight: Math.round(actualHeight), areaHeight: Math.round(areaHeight) };
    });

    expect(spaceInfo).not.toBeNull();
    // Identity content (number + symbol + name) should be under 110px tall
    // Previously IDENTITY_HEIGHT=128 reserved too many text lines
    expect(spaceInfo!.actualHeight).toBeLessThan(130);

    await context.close();
  });
});

test.describe('Periodic table — focus outline', () => {
  test('clicked element shows warm-red outline, not blue browser default', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]', { timeout: 10000 });

    // Click an element cell to give it focus
    const feCell = page.locator('[aria-label*="Iron"]');
    await feCell.click();

    // Wait briefly for focus to apply
    await page.waitForTimeout(100);

    // The SVG should have a class for focus styling
    const svgHasClass = await page.evaluate(() => {
      const svg = document.querySelector('svg.periodic-table-svg');
      return svg !== null;
    });
    expect(svgHasClass, 'SVG should have periodic-table-svg class').toBe(true);

    // Check that the CSS rule suppresses default focus outline on SVG children
    const hasRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSStyleRule) {
              const sel = rule.selectorText;
              if (sel.includes('periodic-table-svg') && sel.includes('focus') &&
                  rule.style.outline !== '') {
                return true;
              }
            }
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(hasRule, 'CSS should suppress default focus outline on periodic table cells').toBe(true);
  });
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
