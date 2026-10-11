/**
 * Shared Playwright fixtures. Specs import `test` and `expect` from here, not
 * from '@playwright/test' (scripts/lint-e2e.ts enforces it).
 *
 * Every browser context answers the Google Fonts requests in index.html from
 * committed font files (tests/fonts/), so E2E results do not depend on
 * fonts.googleapis.com / fonts.gstatic.com being reachable. Any other Google
 * Fonts request is aborted rather than sent to the network.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { test as base, type BrowserContext } from '@playwright/test';
import { CINZEL_FACES, FONT_DIR, cinzelStylesheet } from '../fonts';

export * from '@playwright/test';

const LOCAL_FONT_BASE = 'https://fonts.gstatic.com/atlas-test-fonts';
const SERVED_FILES = new Set(CINZEL_FACES.map((f) => f.file));

export async function serveFontsLocally(context: BrowserContext): Promise<void> {
  await context.route('https://fonts.googleapis.com/**', async (route) => {
    const url = new URL(route.request().url());
    const families = url.searchParams.getAll('family');
    if (url.pathname !== '/css2' || families.length !== 1 || !families[0].startsWith('Cinzel:')) {
      // A new Google Fonts request needs a committed copy first.
      return route.abort('blockedbyclient');
    }
    await route.fulfill({
      contentType: 'text/css; charset=utf-8',
      headers: { 'access-control-allow-origin': '*' },
      body: cinzelStylesheet(LOCAL_FONT_BASE),
    });
  });
  await context.route('https://fonts.gstatic.com/**', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    if (!SERVED_FILES.has(file)) return route.abort('blockedbyclient');
    await route.fulfill({
      contentType: 'font/ttf',
      headers: { 'access-control-allow-origin': '*' },
      body: readFileSync(join(FONT_DIR, file)),
    });
  });
}

export const test = base.extend({
  context: async ({ context }, provide) => {
    await serveFontsLocally(context);
    await provide(context);
  },
});
