import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import elementsJson from '../data/generated/elements.json';
import {
  SITE_ORIGIN,
  SOCIAL_IMAGE_URL,
  getCanonicalComparisonSeoRoutes,
  getIndexableComparisonPaths,
  getIndexableSeoRoutes,
  renderRobotsTxt,
  renderSeoHead,
  renderSitemap,
  type SeoMetadata,
} from '../src/lib/seo';
import { ELEMENT_SOCIAL_CARD_VERSION, elementSocialImagePath } from '../src/lib/socialImages';
import type { ElementRecord } from '../src/lib/types';
import type { SocialCardManifest } from './generate-social-card';

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

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function validateSocialPng(card: Buffer, label: string): void {
  if (card.length < 10_000) fail(`${label} is unexpectedly small`);
  if (card.toString('ascii', 1, 4) !== 'PNG') fail(`${label} is not a PNG file`);
  if (card.readUInt32BE(16) !== 1200 || card.readUInt32BE(20) !== 630) {
    fail(`${label} must be 1200×630`);
  }
}

function validateMetadataDocument(route: SeoMetadata, html: string): void {
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

const routes = [...getIndexableSeoRoutes()];
const paths = new Set(routes.map((route) => route.path));
if (routes.length !== 391) fail(`expected 391 indexable canonical URLs, found ${routes.length}`);
if (paths.size !== routes.length) fail('canonical route inventory contains duplicates');

const expectedIndexableComparisonPaths = new Set(getIndexableComparisonPaths());
const indexableComparisonRoutes = routes.filter((route) => route.path.includes('/compare/'));
if (indexableComparisonRoutes.length !== 117) {
  fail(`expected 117 indexable comparisons, found ${indexableComparisonRoutes.length}`);
}
if (
  indexableComparisonRoutes.some((route) => !expectedIndexableComparisonPaths.has(route.path)) ||
  expectedIndexableComparisonPaths.size !== indexableComparisonRoutes.length
) {
  fail('indexable comparisons differ from the folio-linked comparison set');
}

for (const route of routes) {
  const expectedHead = renderSeoHead(route);
  const isEdgeRenderedComparison = route.path.includes('/compare/');
  const html = isEdgeRenderedComparison
    ? expectedHead
    : await readFile(outputPathForRoute(route.path), 'utf8');
  if (!isEdgeRenderedComparison && !html.includes(expectedHead)) {
    fail(`${route.path} does not contain its generated metadata block`);
  }
  validateMetadataDocument(route, html);
}

const allComparisonRoutes = [...getCanonicalComparisonSeoRoutes()];
const allComparisonPaths = new Set(allComparisonRoutes.map((route) => route.path));
if (allComparisonRoutes.length !== 6_903 || allComparisonPaths.size !== 6_903) {
  fail('expected 6,903 unique canonical comparison metadata routes');
}

let indexedComparisons = 0;
let noindexComparisons = 0;
for (const route of allComparisonRoutes) {
  const shouldIndex = expectedIndexableComparisonPaths.has(route.path);
  if (shouldIndex && !route.robots.startsWith('index,follow')) {
    fail(`${route.path} is folio-linked but not indexable`);
  }
  if (!shouldIndex && route.robots !== 'noindex,follow') {
    fail(`${route.path} is not folio-linked and must be noindex`);
  }
  if (route.imageUrl !== SOCIAL_IMAGE_URL) {
    fail(`${route.path} must use the static generic social card`);
  }
  if (shouldIndex) indexedComparisons += 1;
  else noindexComparisons += 1;
  validateMetadataDocument(route, renderSeoHead(route));
}
if (indexedComparisons !== 117 || noindexComparisons !== 6_786) {
  fail(`expected a 117/6,786 comparison indexing split, found ${indexedComparisons}/${noindexComparisons}`);
}

const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
if (sitemap !== renderSitemap(routes)) fail('sitemap.xml differs from the canonical route inventory');
if (occurrences(sitemap, '<url>') !== routes.length) fail('sitemap.xml URL count is incomplete');

const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
if (robots !== renderRobotsTxt()) fail('robots.txt is not the generated policy');

const notFound = await readFile(join(DIST, '404.html'), 'utf8');
if (!notFound.includes('name="robots" content="noindex,follow"')) fail('404.html must be noindex');

const card = await readFile(join(DIST, 'social-card.png'));
validateSocialPng(card, 'social-card.png');

const elements = elementsJson as ElementRecord[];
const manifest = JSON.parse(
  await readFile(resolve('assets', 'social-cards', 'manifest.json'), 'utf8'),
) as SocialCardManifest;
if (manifest.schemaVersion !== 1 || manifest.versions[ELEMENT_SOCIAL_CARD_VERSION] == null) {
  fail(`social-card manifest must contain ${ELEMENT_SOCIAL_CARD_VERSION}`);
}
if (sha256(card) !== manifest.versions[ELEMENT_SOCIAL_CARD_VERSION].defaultCardSha256) {
  fail('social-card.png differs from the immutable manifest');
}

const elementCardsRoot = join(DIST, 'social', 'elements');
const cardVersionEntries = await readdir(elementCardsRoot, { withFileTypes: true });
if (cardVersionEntries.some((entry) => !entry.isDirectory() || !/^v[1-9]\d*$/.test(entry.name))) {
  fail('element social cards contain an invalid version entry');
}
const cardVersions = cardVersionEntries.map((entry) => entry.name).sort();
const manifestVersions = Object.keys(manifest.versions).sort();
if (JSON.stringify(cardVersions) !== JSON.stringify(manifestVersions)) {
  fail('element social-card directories differ from the immutable manifest');
}

const expectedElementCards = elements.map((element) => `${element.symbol}.png`).sort();
const elementCardHashes = new Set<string>();
let elementCardBytes = 0;
for (const version of cardVersions) {
  const elementCardsDirectory = join(elementCardsRoot, version);
  const actualElementCards = (await readdir(elementCardsDirectory)).sort();
  if (JSON.stringify(actualElementCards) !== JSON.stringify(expectedElementCards)) {
    fail(`${version} must contain exactly ${elements.length} element social cards`);
  }

  const versionManifest = manifest.versions[version];
  const manifestSymbols = Object.keys(versionManifest.elementCardSha256).sort();
  const expectedSymbols = elements.map((element) => element.symbol).sort();
  if (JSON.stringify(manifestSymbols) !== JSON.stringify(expectedSymbols)) {
    fail(`${version} manifest must identify exactly ${elements.length} element cards`);
  }

  for (const element of elements) {
    const relativePath = `/social/elements/${version}/${element.symbol}.png`;
    const elementCard = await readFile(join(DIST, relativePath.slice(1)));
    validateSocialPng(elementCard, relativePath);
    const hash = sha256(elementCard);
    if (hash !== versionManifest.elementCardSha256[element.symbol]) {
      fail(`${relativePath} differs from the immutable manifest`);
    }

    if (version === ELEMENT_SOCIAL_CARD_VERSION) {
      const metadata = routes.find((route) => route.path === `/elements/${element.symbol}`);
      if (metadata?.imageUrl !== `${SITE_ORIGIN}${elementSocialImagePath(element.symbol)}`) {
        fail(`${element.symbol} metadata does not reference its element social card`);
      }
      elementCardBytes += elementCard.byteLength;
      elementCardHashes.add(hash);
    }
  }
}
if (elementCardHashes.size !== elements.length) {
  fail('element social cards must be visually unique');
}

await access(resolve('functions/elements/[symbol]/compare/[other].js'));
try {
  await access(join(DIST, '_redirects'));
  fail('the wildcard _redirects file would override route-specific HTML');
} catch (error) {
  if (error instanceof Error && error.message.startsWith('SEO validation failed')) throw error;
}

console.log(
  `Validated 274 static pages, 117 indexed and 6,786 noindex comparisons, all 391 sitemap URLs, and 118 unique element cards (${(elementCardBytes / 1024 / 1024).toFixed(1)} MiB).`,
);
