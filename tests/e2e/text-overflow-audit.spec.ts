import { test, expect } from '@playwright/test';

/**
 * Text overflow audit: checks every page at desktop, mobile portrait,
 * and mobile landscape for text being clipped or overflowing its container.
 *
 * Architecture: one test per viewport that navigates to all pages sequentially.
 * After the initial cold start (~50s for JS bundle parse), subsequent SPA
 * navigations are fast. This avoids 93 × 50s cold starts.
 */

const ALL_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Credits', path: '/about/credits' },
  { name: 'Design', path: '/about/design' },
  { name: 'Animation Palette', path: '/about/animation-palette' },
  { name: 'Entity Map', path: '/about/entity-map' },
  { name: 'Element Index', path: '/elements' },
  { name: 'Element (H)', path: '/elements/H' },
  { name: 'Element (W)', path: '/elements/W' },
  { name: 'Element (Og)', path: '/elements/Og' },
  { name: 'Compare', path: '/elements/H/compare/He' },
  { name: 'Group Index', path: '/groups' },
  { name: 'Group 1', path: '/groups/1' },
  { name: 'Period Index', path: '/periods' },
  { name: 'Period 4', path: '/periods/4' },
  { name: 'Block Index', path: '/blocks' },
  { name: 'Block d', path: '/blocks/d' },
  { name: 'Category Index', path: '/categories' },
  { name: 'Category', path: '/categories/transition-metal' },
  { name: 'Property Index', path: '/properties' },
  { name: 'Property mass', path: '/properties/mass' },
  { name: 'Anomaly Index', path: '/anomalies' },
  { name: 'Anomaly Detail', path: '/anomalies/synthetic-heavy' },
  { name: 'Discoverer Index', path: '/discoverers' },
  { name: 'Discoverer Detail', path: '/discoverers/Known%20since%20antiquity' },
  { name: 'Era Index', path: '/eras' },
  { name: 'Era Detail', path: '/eras/antiquity' },
  { name: 'Phase Landscape', path: '/phase-landscape' },
  { name: 'Property Scatter', path: '/property-scatter' },
  { name: 'Anomaly Explorer', path: '/anomaly-explorer' },
  { name: 'Neighbourhood Graph', path: '/neighbourhood-graph' },
  { name: 'Discovery Timeline', path: '/discovery-timeline' },
  { name: 'Etymology Map', path: '/etymology-map' },
  { name: 'Discoverer Network', path: '/discoverer-network' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
];

interface ClippedText {
  textContent: string;
  overshoot: number;
  direction: string;
}

interface PageResult {
  page: string;
  path: string;
  bodyOverflowPx: number;
  clippedCount: number;
  clipped: ClippedText[];
}

/** Evaluate overflow checks on the current page. */
function checkOverflow() {
  return `
    (() => {
      const bodyOverflow = document.body.scrollWidth - document.documentElement.clientWidth;
      const results = [];
      document.querySelectorAll('svg').forEach((svg) => {
        const svgRect = svg.getBoundingClientRect();
        if (svgRect.width < 10 || svgRect.height < 10) return;
        const overflow = svg.getAttribute('overflow') || getComputedStyle(svg).overflow;
        if (overflow === 'visible') return;
        // Skip wordmark SVG (decorative letters that intentionally clip)
        if (svg.closest('.page-shell-wordmark')) return;
        svg.querySelectorAll('text').forEach((textEl) => {
          const r = textEl.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const right = r.right - svgRect.right;
          const left = svgRect.left - r.left;
          const bottom = r.bottom - svgRect.bottom;
          // Use 20px tolerance to accommodate CI font rendering differences
          if (right > 20) results.push({ textContent: (textEl.textContent || '').slice(0, 60), overshoot: Math.round(right), direction: 'right' });
          if (left > 20) results.push({ textContent: (textEl.textContent || '').slice(0, 60), overshoot: Math.round(left), direction: 'left' });
          if (bottom > 20) results.push({ textContent: (textEl.textContent || '').slice(0, 60), overshoot: Math.round(bottom), direction: 'bottom' });
        });
      });
      return { bodyOverflow, clipped: results };
    })()
  `;
}

for (const vp of VIEWPORTS) {
  test(`text-overflow audit @ ${vp.name} (${vp.width}×${vp.height})`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    const failures: PageResult[] = [];
    const passes: string[] = [];

    for (const pg of ALL_PAGES) {
      // Navigate — first page is slow (cold start), rest are fast SPA navigations
      await page.goto(pg.path, { waitUntil: 'commit' });

      // Wait for meaningful content: either an SVG text element or an h1/h2
      await page.waitForSelector('svg text, h1, h2, table', { timeout: 15000 }).catch(() => {});

      // Small settle time for animations / late layout
      await page.waitForTimeout(300);

      const { bodyOverflow, clipped } = await page.evaluate(checkOverflow());

      // Deduplicate clipped texts
      const seen = new Map<string, ClippedText>();
      for (const ct of clipped as ClippedText[]) {
        const key = `${ct.direction}:${ct.textContent}`;
        if (!seen.has(key) || seen.get(key)!.overshoot < ct.overshoot) {
          seen.set(key, ct);
        }
      }
      const clippedList = [...seen.values()];

      if (bodyOverflow > 2 || clippedList.length > 0) {
        failures.push({
          page: pg.name,
          path: pg.path,
          bodyOverflowPx: bodyOverflow,
          clippedCount: clippedList.length,
          clipped: clippedList.slice(0, 5),
        });
      } else {
        passes.push(pg.name);
      }
    }

    await context.close();

    // Report all results
    if (failures.length > 0) {
      console.log(`\n❌ FAILURES at ${vp.name}:`);
      for (const f of failures) {
        console.log(JSON.stringify(f));
      }
    }
    console.log(`\n✅ ${passes.length}/${ALL_PAGES.length} pages passed at ${vp.name}`);

    // Assert no failures
    expect(
      failures,
      `${failures.length} page(s) failed overflow check at ${vp.name}:\n${failures.map(f => `  ${f.page} (${f.path}): body +${f.bodyOverflowPx}px, ${f.clippedCount} clipped`).join('\n')}`
    ).toHaveLength(0);
  });
}
