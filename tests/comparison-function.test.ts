import { describe, expect, test, vi } from 'vitest';
import { getSeoMetadata, renderSeoHead } from '../src/lib/seo';
// The Pages Function is plain JavaScript so Wrangler can deploy it directly.
// @ts-expect-error -- no declaration file is needed for this deployment entrypoint.
import { onRequest } from '../functions/elements/[symbol]/compare/[other].js';

function context(symbol: string, other: string) {
  const rootTemplate = '<html><head><!-- atlas-seo:start -->root<!-- atlas-seo:end --></head><body></body></html>';
  return {
    params: { symbol, other },
    request: new Request(`https://atlas-48p.pages.dev/elements/${symbol}/compare/${other}`),
    next: vi.fn(() => Promise.resolve(new Response('asset'))),
    env: {
      ASSETS: {
        fetch: vi.fn(() => Promise.resolve(new Response(rootTemplate, {
          headers: { 'content-type': 'text/html' },
        }))),
      },
    },
  };
}

describe('comparison Pages Function', () => {
  test('renders canonical comparisons with bot-visible metadata', async () => {
    const requestContext = context('Mn', 'Fe');
    const response = await onRequest(requestContext);
    expect(requestContext.next).not.toHaveBeenCalled();
    expect(requestContext.env.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(renderSeoHead(getSeoMetadata('/elements/Mn/compare/Fe')!));
  });

  test('serves non-indexed comparisons with generic social metadata', async () => {
    const requestContext = context('Fe', 'Cu');
    const response = await onRequest(requestContext);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).toContain('property="og:image" content="https://atlas-48p.pages.dev/social-card.png"');
    expect(html).toContain('name="twitter:image" content="https://atlas-48p.pages.dev/social-card.png"');
  });

  test('redirects reverse and self comparisons permanently', async () => {
    const reverse = await onRequest(context('Fe', 'Mn'));
    expect(reverse.status).toBe(308);
    expect(reverse.headers.get('location')).toBe('https://atlas-48p.pages.dev/elements/Mn/compare/Fe');

    const self = await onRequest(context('Fe', 'Fe'));
    expect(self.status).toBe(308);
    expect(self.headers.get('location')).toBe('https://atlas-48p.pages.dev/elements/Fe');
  });

  test('passes invalid symbols through to the static 404 response', async () => {
    const requestContext = context('Nope', 'Fe');
    await onRequest(requestContext);
    expect(requestContext.next).toHaveBeenCalledOnce();
  });
});
