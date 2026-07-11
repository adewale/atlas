import { expect, test } from '@playwright/test';

const REQUIRED_HEAD_MARKERS = [
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:image"',
  'name="twitter:card"',
  'name="twitter:title"',
  'name="twitter:description"',
  'name="twitter:image"',
  'type="application/ld+json"',
];

test.describe('bot-visible search and social metadata', () => {
  for (const [path, titleFragment, schemaType] of [
    ['/', 'Interactive Periodic Table', 'WebApplication'],
    ['/elements/Fe', 'Iron (Fe)', 'ChemicalSubstance'],
    ['/groups/8', 'Group 8', 'CollectionPage'],
    ['/discoverers/Humphry%20Davy', 'Humphry Davy', 'CollectionPage'],
    ['/elements/Mn/compare/Fe', 'Manganese vs Iron', 'ItemList'],
  ] as const) {
    test(`${path} exposes route-specific metadata in its raw response`, async ({ request }) => {
      const response = await request.get(path, {
        headers: { 'user-agent': 'Twitterbot/1.0' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      const html = await response.text();

      expect(html).toContain(titleFragment);
      expect(html).toContain(`"@type":"${schemaType}"`);
      for (const marker of REQUIRED_HEAD_MARKERS) expect(html).toContain(marker);
      expect((html.match(/rel="canonical"/g) ?? [])).toHaveLength(1);
      expect((html.match(/id="atlas-structured-data"/g) ?? [])).toHaveLength(1);
    });
  }

  test('sitemap and robots advertise the full canonical inventory', async ({ request }) => {
    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    expect(sitemapResponse.headers()['content-type']).toContain('application/xml');
    const sitemap = await sitemapResponse.text();
    expect((sitemap.match(/<url>/g) ?? [])).toHaveLength(7_177);
    expect(sitemap).toContain('<loc>https://atlas-48p.pages.dev/elements/Fe</loc>');
    expect(sitemap).not.toContain('/elements/Fe/compare/Mn');

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);
    expect(robotsResponse.headers()['content-type']).toContain('text/plain');
    expect(await robotsResponse.text()).toContain('Sitemap: https://atlas-48p.pages.dev/sitemap.xml');
  });

  test('duplicates redirect and unknown routes return a real 404', async ({ request }) => {
    const reverse = await request.get('/elements/Fe/compare/Mn', { maxRedirects: 0 });
    expect(reverse.status()).toBe(308);
    expect(new URL(reverse.headers().location).pathname).toBe('/elements/Mn/compare/Fe');

    const self = await request.get('/elements/Fe/compare/Fe', { maxRedirects: 0 });
    expect(self.status()).toBe(308);
    expect(new URL(self.headers().location).pathname).toBe('/elements/Fe');

    const missing = await request.get('/groups/999');
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toContain('name="robots" content="noindex,follow"');
  });

  test('hydration preserves a single current metadata set', async ({ page }) => {
    await page.goto('/elements/Fe');
    await expect(page).toHaveTitle(/Iron \(Fe\)/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    await expect(page.locator('script#atlas-structured-data')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://atlas-48p.pages.dev/elements/Fe',
    );
  });
});
