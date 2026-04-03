import { test, expect } from '@playwright/test';

/**
 * Text overflow audit: checks every page at desktop, mobile portrait,
 * and mobile landscape for text being clipped or overflowing its container.
 */

// Only run in the desktop project — we manually set viewport per test
test.use({ viewport: null as any });

const ALL_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Credits', path: '/credits' },
  { name: 'Design', path: '/design' },
  { name: 'Element (H)', path: '/element/H' },
  { name: 'Element (W)', path: '/element/W' },
  { name: 'Element (Og)', path: '/element/Og' },
  { name: 'Compare', path: '/compare/H/He' },
  { name: 'Entity Map', path: '/entity-map' },
  { name: 'Phase Landscape', path: '/phase-landscape' },
  { name: 'Property Scatter', path: '/property-scatter' },
  { name: 'Anomaly Explorer', path: '/anomaly-explorer' },
  { name: 'Neighborhood Graph', path: '/neighborhood-graph' },
  { name: 'Discovery Timeline', path: '/discovery-timeline' },
  { name: 'Etymology Map', path: '/etymology-map' },
  { name: 'Discoverer Network', path: '/discoverer-network' },
  { name: 'Atlas Group 1', path: '/atlas/group/1' },
  { name: 'Atlas Period 4', path: '/atlas/period/4' },
  { name: 'Atlas Block d', path: '/atlas/block/d' },
  { name: 'Atlas Category', path: '/atlas/category/transition-metal' },
  { name: 'Atlas Rank mass', path: '/atlas/rank/mass' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
];

for (const vp of VIEWPORTS) {
  for (const pg of ALL_PAGES) {
    test(`${vp.name} | ${pg.name} (${pg.path})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Check 1: No horizontal body overflow
      const bodyOverflow = await page.evaluate(() => {
        return document.body.scrollWidth - document.documentElement.clientWidth;
      });

      // Check 2: Find SVG <text> elements that extend beyond their parent <svg>
      const clippedTexts = await page.evaluate(() => {
        const results: {
          textContent: string;
          overshoot: number;
          direction: string;
        }[] = [];

        const svgs = document.querySelectorAll('svg');
        svgs.forEach((svg) => {
          const svgRect = svg.getBoundingClientRect();
          if (svgRect.width < 10 || svgRect.height < 10) return;
          // Skip SVGs with overflow="visible"
          const overflow = svg.getAttribute('overflow') || getComputedStyle(svg).overflow;
          if (overflow === 'visible') return;

          const texts = svg.querySelectorAll('text');
          texts.forEach((textEl) => {
            const textRect = textEl.getBoundingClientRect();
            if (textRect.width === 0 || textRect.height === 0) return;

            const overshootRight = textRect.right - svgRect.right;
            const overshootLeft = svgRect.left - textRect.left;
            const overshootBottom = textRect.bottom - svgRect.bottom;

            if (overshootRight > 2) {
              results.push({
                textContent: (textEl.textContent || '').slice(0, 60),
                overshoot: Math.round(overshootRight),
                direction: 'right',
              });
            }
            if (overshootLeft > 2) {
              results.push({
                textContent: (textEl.textContent || '').slice(0, 60),
                overshoot: Math.round(overshootLeft),
                direction: 'left',
              });
            }
            if (overshootBottom > 2) {
              results.push({
                textContent: (textEl.textContent || '').slice(0, 60),
                overshoot: Math.round(overshootBottom),
                direction: 'bottom',
              });
            }
          });
        });

        return results;
      });

      // Deduplicate clipped texts (keep worst per direction)
      const uniqueClipped = clippedTexts.reduce((acc, ct) => {
        const key = `${ct.direction}:${ct.textContent}`;
        if (!acc.has(key) || acc.get(key)!.overshoot < ct.overshoot) {
          acc.set(key, ct);
        }
        return acc;
      }, new Map<string, typeof clippedTexts[0]>());

      const clippedList = [...uniqueClipped.values()];

      // Log for the results table
      if (bodyOverflow > 2 || clippedList.length > 0) {
        console.log(JSON.stringify({
          page: pg.name,
          path: pg.path,
          viewport: vp.name,
          bodyOverflowPx: bodyOverflow,
          clippedCount: clippedList.length,
          clipped: clippedList.slice(0, 5),
        }));
      }

      expect(
        bodyOverflow,
        `Body overflows by ${bodyOverflow}px`
      ).toBeLessThanOrEqual(2);

      expect(
        clippedList.length,
        `${clippedList.length} text(s) clipped: ${clippedList.map(c => `"${c.textContent}" +${c.overshoot}px ${c.direction}`).join('; ')}`
      ).toBe(0);
    });
  }
}
