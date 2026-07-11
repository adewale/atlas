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

  test('sitemap and robots advertise only the 117 surfaced comparisons', async ({ request }) => {
    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    expect(sitemapResponse.headers()['content-type']).toContain('application/xml');
    const sitemap = await sitemapResponse.text();
    expect((sitemap.match(/<url>/g) ?? [])).toHaveLength(391);
    expect(sitemap).toContain('<loc>https://atlas-48p.pages.dev/elements/Fe</loc>');
    expect(sitemap).toContain('/elements/Mn/compare/Fe');
    expect(sitemap).not.toContain('/elements/Fe/compare/Cu');
    expect(sitemap).not.toContain('/elements/Fe/compare/Mn');

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);
    expect(robotsResponse.headers()['content-type']).toContain('text/plain');
    expect(await robotsResponse.text()).toContain('Sitemap: https://atlas-48p.pages.dev/sitemap.xml');
  });

  test('non-indexed comparisons remain available with the static generic card', async ({ request }) => {
    const response = await request.get('/elements/Fe/compare/Cu', {
      headers: { 'user-agent': 'Twitterbot/1.0' },
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).toContain('property="og:image" content="https://atlas-48p.pages.dev/social-card.png"');
    expect(html).toContain('name="twitter:image" content="https://atlas-48p.pages.dev/social-card.png"');
    expect(html).toContain('id="atlas-structured-data"');
  });

  test('element pages expose distinct, cacheable static social cards', async ({ request }) => {
    const imagePaths: string[] = [];
    const imageBodies: Buffer[] = [];

    for (const [symbol, name] of [['Fe', 'Iron'], ['Pm', 'Promethium']] as const) {
      const pageResponse = await request.get(`/elements/${symbol}`);
      const html = await pageResponse.text();
      const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      expect(imageUrl).toBe(`https://atlas-48p.pages.dev/social/elements/v1/${symbol}.png`);
      expect(html).toContain(`name="twitter:image" content="${imageUrl}"`);
      expect(html).toContain(`property="og:image:alt" content="Atlas element card for ${name} (${symbol})`);

      const imagePath = new URL(imageUrl!).pathname;
      const imageResponse = await request.get(imagePath);
      expect(imageResponse.status()).toBe(200);
      expect(imageResponse.headers()['content-type']).toContain('image/png');
      expect(imageResponse.headers()['cache-control']).toContain('immutable');
      const body = await imageResponse.body();
      expect(body.toString('ascii', 1, 4)).toBe('PNG');
      imagePaths.push(imagePath);
      imageBodies.push(body);
    }

    expect(new Set(imagePaths).size).toBe(2);
    expect(imageBodies[0].equals(imageBodies[1])).toBe(false);

    const groupHtml = await (await request.get('/groups/8')).text();
    expect(groupHtml).toContain('property="og:image" content="https://atlas-48p.pages.dev/social-card.png"');
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
