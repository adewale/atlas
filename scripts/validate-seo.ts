import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  getIndexableSeoRoutes,
  renderRobotsTxt,
  renderSeoHead,
  renderSitemap,
} from '../src/lib/seo';

const DIST = resolve('dist');

function outputPathForRoute(path: string): string {
  if (path === '/') return join(DIST, 'index.html');
  return join(DIST, `${decodeURIComponent(path.slice(1))}.html`);
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function fail(message: string): never {
  throw new Error(`SEO validation failed: ${message}`);
}

const routes = [...getIndexableSeoRoutes()];
const paths = new Set(routes.map((route) => route.path));
if (routes.length !== 7_177) fail(`expected 7,177 canonical URLs, found ${routes.length}`);
if (paths.size !== routes.length) fail('canonical route inventory contains duplicates');

for (const route of routes) {
  const expectedHead = renderSeoHead(route);
  const isEdgeRenderedComparison = route.path.includes('/compare/');
  const html = isEdgeRenderedComparison
    ? expectedHead
    : await readFile(outputPathForRoute(route.path), 'utf8');
  if (!isEdgeRenderedComparison && !html.includes(expectedHead)) {
    fail(`${route.path} does not contain its generated metadata block`);
  }

  const singletonNeedles = [
    '<title>',
    'name="description"',
    'name="robots"',
    'rel="canonical"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
    'id="atlas-structured-data"',
  ];
  for (const needle of singletonNeedles) {
    if (occurrences(html, needle) !== 1) fail(`${route.path} must contain exactly one ${needle}`);
  }

  const jsonLdMatch = html.match(/<script id="atlas-structured-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!jsonLdMatch) fail(`${route.path} has no JSON-LD payload`);
  const structuredData = JSON.parse(jsonLdMatch[1]) as { '@context'?: string; '@graph'?: unknown[] };
  if (structuredData['@context'] !== 'https://schema.org') fail(`${route.path} has the wrong Schema.org context`);
  if (!Array.isArray(structuredData['@graph']) || structuredData['@graph'].length < 2) {
    fail(`${route.path} has an incomplete Schema.org graph`);
  }
  if (!JSON.stringify(structuredData).includes(route.canonicalUrl)) {
    fail(`${route.path} structured data does not identify its canonical URL`);
  }
}

const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
if (sitemap !== renderSitemap(routes)) fail('sitemap.xml differs from the canonical route inventory');
if (occurrences(sitemap, '<url>') !== routes.length) fail('sitemap.xml URL count is incomplete');

const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
if (robots !== renderRobotsTxt()) fail('robots.txt is not the generated policy');

const notFound = await readFile(join(DIST, '404.html'), 'utf8');
if (!notFound.includes('name="robots" content="noindex,follow"')) fail('404.html must be noindex');

const card = await readFile(join(DIST, 'social-card.png'));
if (card.length < 10_000) fail('social-card.png is unexpectedly small');
if (card.toString('ascii', 1, 4) !== 'PNG') fail('social-card.png is not a PNG file');
if (card.readUInt32BE(16) !== 1200 || card.readUInt32BE(20) !== 630) {
  fail('social-card.png must be 1200×630');
}

await access(resolve('functions/elements/[symbol]/compare/[other].js'));
try {
  await access(join(DIST, '_redirects'));
  fail('the wildcard _redirects file would override route-specific HTML');
} catch (error) {
  if (error instanceof Error && error.message.startsWith('SEO validation failed')) throw error;
}

console.log('Validated 274 static pages, 6,903 edge-rendered comparisons, and all 7,177 sitemap URLs.');
