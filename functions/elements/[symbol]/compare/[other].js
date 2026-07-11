import {
  canonicalComparisonPath,
  getSeoMetadata,
  renderSeoHead,
} from '../../../../src/lib/seo.ts';

const SEO_BLOCK = /<!-- atlas-seo:start -->[\s\S]*?<!-- atlas-seo:end -->/;

/**
 * Collapse the ordered comparison route space to one URL per distinct pair.
 * Canonical static pages pass through; reverse and self-pairs receive a real
 * redirect before Cloudflare looks up the generated HTML asset.
 */
export async function onRequest(context) {
  const symbol = context.params.symbol;
  const other = context.params.other;
  const canonicalPath = canonicalComparisonPath(symbol, other);
  if (!canonicalPath) return context.next();

  const requestUrl = new URL(context.request.url);
  if (requestUrl.pathname !== canonicalPath) {
    requestUrl.pathname = canonicalPath;
    return Response.redirect(requestUrl.toString(), 308);
  }

  const metadata = getSeoMetadata(canonicalPath);
  if (!metadata) return context.next();

  const rootUrl = new URL('/', requestUrl);
  const rootResponse = await context.env.ASSETS.fetch(rootUrl);
  const template = await rootResponse.text();
  if (!SEO_BLOCK.test(template)) {
    return new Response('Atlas metadata template is unavailable.', { status: 500 });
  }

  const html = template.replace(
    SEO_BLOCK,
    `<!-- atlas-seo:start -->\n${renderSeoHead(metadata)}\n<!-- atlas-seo:end -->`,
  );
  const headers = new Headers(rootResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=86400');
  return new Response(html, { status: 200, headers });
}
