/**
 * Condition waits that replace fixed sleeps (page.waitForTimeout).
 *
 * A sleep is both slow and flaky: it waits the full time when the page is
 * ready early, and not long enough when the machine is loaded. These helpers
 * wait for the conditions the sleeps stood in for (docs/lessons-learned.md
 * #29). scripts/lint-e2e.ts stops new waitForTimeout calls.
 */
import type { Page } from '@playwright/test';

/** Resolve after `count` rendered animation frames. */
export async function nextFrames(page: Page, count = 2): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
        step(n);
      }),
    count,
  );
}

/** Wait until every web font the document requested has loaded (or failed). */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * Wait until no finite animation is running: CSS animations, CSS transitions
 * (including ones still in their delay) and Web Animations. Infinite loops
 * (spinners, pulses) are ignored. Two frames first, so state set in a
 * requestAnimationFrame callback (the app's `hasLoaded` flags) has started
 * its transitions before we look.
 */
export async function waitForAnimations(page: Page, timeout = 15_000): Promise<void> {
  await nextFrames(page, 2);
  await page.waitForFunction(
    () =>
      document.getAnimations().every((animation) => {
        if (animation.playState !== 'running') return true;
        return animation.effect?.getComputedTiming().iterations === Infinity;
      }),
    undefined,
    { timeout, polling: 'raf' },
  );
}

/**
 * After a navigation (page.goto, or a click that changes the route): wait for
 * the network to go quiet (lazy route chunks), fonts, and entry animations.
 * For a client-side route change, wait for the URL first
 * (`await page.waitForURL(...)`), since there is no new load event.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await waitForFonts(page);
  await waitForAnimations(page);
}
