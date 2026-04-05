/**
 * Explore page layout tests — no overlapping facets or result cards.
 */
import { test, expect } from '@playwright/test';

test.describe('Explore page layout', () => {
  test('facet sections do not overlap each other', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForTimeout(1500);

    // Get bounding boxes of all facet section containers
    const sections = await page.evaluate(() => {
      const allDivs = [...document.querySelectorAll('div')];
      const labels = allDivs.filter(d => {
        const s = d.getAttribute('style') || '';
        return s.includes('uppercase') && s.includes('0.15em') && d.textContent && d.textContent.length < 20;
      });
      return labels.map(label => {
        // The facet section is the label's parent (which contains label + chips/slider)
        const parent = label.parentElement;
        if (!parent) return null;
        const r = parent.getBoundingClientRect();
        return { label: label.textContent?.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom) };
      }).filter(Boolean) as { label: string; top: number; bottom: number }[];
    });

    // Each section's top must be >= the previous section's bottom
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1];
      const curr = sections[i];
      expect(
        curr.top,
        `"${curr.label}" (top=${curr.top}) overlaps "${prev.label}" (bottom=${prev.bottom})`
      ).toBeGreaterThanOrEqual(prev.bottom - 2); // 2px tolerance
    }
  });

  test('era slider does not overlap etymology chips', async ({ page }) => {
    await page.goto('/explore?era=ancient');
    await page.waitForTimeout(1500);

    const layout = await page.evaluate(() => {
      const allDivs = [...document.querySelectorAll('div')];

      // Find Etymology chips container (last chip row before era slider)
      const etyLabel = allDivs.find(d => d.textContent?.trim() === 'Etymology' && d.getAttribute('style')?.includes('uppercase'));
      const etyChips = etyLabel?.nextElementSibling;

      // Find Era slider container
      const eraLabel = allDivs.find(d => d.textContent?.trim().startsWith('Discovery Era') && d.getAttribute('style')?.includes('uppercase'));
      const eraContainer = eraLabel?.parentElement;

      if (!etyChips || !eraContainer) return null;

      const etyBottom = Math.round(etyChips.getBoundingClientRect().bottom);
      const eraTop = Math.round(eraContainer.getBoundingClientRect().top);

      return { etyBottom, eraTop, gap: eraTop - etyBottom };
    });

    expect(layout).not.toBeNull();
    expect(layout!.gap, `Etymology chips overlap era slider by ${-layout!.gap}px`).toBeGreaterThanOrEqual(0);
  });

  test('result cards do not overflow container on era filter', async ({ page }) => {
    await page.goto('/explore?era=ancient');
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'Page has horizontal overflow').toBe(false);
  });
});
