import { expect, type Page, type Locator } from '@playwright/test';

/**
 * Shared e2e test helpers.
 *
 * Centralises patterns that were previously duplicated across spec files:
 * - waiting for page content instead of arbitrary timeouts
 * - filtering benign console/page errors in the sandbox environment
 */

// ---------------------------------------------------------------------------
// Page-ready helpers (replace waitForTimeout with locator-based waits)
// ---------------------------------------------------------------------------

/**
 * Wait for a page to be "ready" by awaiting a meaningful locator.
 * Use this instead of `page.waitForTimeout(N)`.
 */
export async function waitForPageReady(page: Page, readyLocator: Locator) {
  await expect(readyLocator).toBeVisible({ timeout: 10_000 });
}

/**
 * Navigate to a page and wait for a specific element to appear.
 * Combines goto + waitForPageReady.
 */
export async function gotoAndWait(page: Page, url: string, readyLocator: Locator) {
  await page.goto(url);
  await waitForPageReady(page, readyLocator);
}

/**
 * Collect page errors during navigation and assert none occurred.
 * Re-usable version of the pattern from data-plate-navigation.spec.ts.
 */
export async function expectNoPageErrors(page: Page, readyLocator: Locator) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await expect(readyLocator).toBeVisible({ timeout: 10_000 });
  expect(errors).toEqual([]);
}

// ---------------------------------------------------------------------------
// Error filtering (for console-error collection tests)
// ---------------------------------------------------------------------------

/** Known-benign console messages that appear in the sandbox test env. */
const BENIGN_PATTERNS = [
  'favicon',
  'net::',
  'Failed to load resource',
  'DevTools',
] as const;

/**
 * Filter out console error strings that are benign in the test environment.
 * Use this everywhere you collect `page.on('console')` errors.
 */
export function filterBenignErrors(errors: string[]): string[] {
  return errors.filter(
    (msg) => !BENIGN_PATTERNS.some((pattern) => msg.includes(pattern)),
  );
}

// ---------------------------------------------------------------------------
// Screenshot directory
// ---------------------------------------------------------------------------

export const SCREENSHOT_DIR = 'tests/e2e/screenshots';
