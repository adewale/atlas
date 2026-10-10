/**
 * Layout shift measured with the browser's Layout Instability API: the same
 * `layout-shift` performance entries that Cumulative Layout Shift (CLS) is
 * built from.
 *
 * Why not compare screenshots? Two reasons (atlas #37):
 * - Opacity fades, transforms and colour changes are not layout shift, but they
 *   change pixels. The API counts only boxes that move in layout.
 * - In Chromium a fullPage screenshot (captureBeyondViewport) briefly reports
 *   the window as 1x1 px. useIsMobile reads that as a phone, so the page
 *   re-renders its mobile layout and back. IntroBlock then remounts its lines
 *   and replays their reveal animation, and the screenshot captures the
 *   replay. The measurement changes the page it measures.
 *
 * Usage: `await recordLayoutShifts(page)` before `page.goto`, then
 * `await takeLayoutShifts(page)`. The recorder is installed before any page
 * script runs, so it sees every shift from navigation start.
 */
import type { Page } from '@playwright/test';

export type RecordedLayoutShift = {
  /** Layout shift score of this entry (impact fraction x distance fraction). */
  value: number;
  /** ms since navigation start. */
  startTime: number;
  /** The boxes that moved: `tag.class y a -> b, x c -> d, h e -> f`. */
  sources: string[];
};

const RECORDER = '__atlasLayoutShifts';

/** Start recording layout shifts for every document this page loads. */
export async function recordLayoutShifts(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    type Source = { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly };
    type Entry = PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: Source[] };

    if (!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) return;

    const recorded: RecordedLayoutShift[] = [];
    const describe = (node: Node | null) => {
      if (!(node instanceof Element)) return node?.nodeName ?? '(removed node)';
      const cls = typeof node.className === 'string' && node.className ? `.${node.className.split(' ')[0]}` : '';
      return `${node.tagName.toLowerCase()}${cls}`;
    };
    const record = (entries: PerformanceEntryList) => {
      for (const entry of entries as Entry[]) {
        // Shifts right after user input are expected and excluded from CLS.
        if (entry.hadRecentInput) continue;
        recorded.push({
          value: entry.value,
          startTime: Math.round(entry.startTime),
          sources: (entry.sources ?? []).map((s) => {
            const p = s.previousRect;
            const c = s.currentRect;
            return `${describe(s.node)} y ${Math.round(p.y)} -> ${Math.round(c.y)}, x ${Math.round(p.x)} -> ${Math.round(c.x)}, h ${Math.round(p.height)} -> ${Math.round(c.height)}`;
          }),
        });
      }
    };
    const observer = new PerformanceObserver((list) => record(list.getEntries()));
    observer.observe({ type: 'layout-shift', buffered: true });
    (window as unknown as Record<string, () => RecordedLayoutShift[]>)[key] = () => {
      record(observer.takeRecords());
      return recorded;
    };
  }, RECORDER);
}

/**
 * Every layout shift since navigation start, excluding shifts caused by recent
 * input. Throws if the recorder is missing (recordLayoutShifts was not called
 * before navigating, or the engine has no Layout Instability API), so the
 * check can never pass by measuring nothing.
 */
export async function takeLayoutShifts(page: Page): Promise<RecordedLayoutShift[]> {
  const shifts = await page.evaluate((key) => {
    const take = (window as unknown as Record<string, (() => RecordedLayoutShift[]) | undefined>)[key];
    return take ? take() : null;
  }, RECORDER);
  if (shifts === null) {
    throw new Error(
      'No layout-shift recorder on this page: call recordLayoutShifts(page) before page.goto, in a browser with the Layout Instability API (Chromium).',
    );
  }
  return shifts;
}
