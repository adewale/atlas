import { afterEach, describe, expect, test } from 'vitest';
import {
  SITE_ORIGIN,
  SOCIAL_IMAGE_URL,
  applySeoMetadata,
  canonicalComparisonPath,
  elementSocialImagePath,
  getCanonicalComparisonSeoRoutes,
  getIndexableComparisonPaths,
  getIndexableSeoRoutes,
  getNotFoundMetadata,
  getSeoMetadata,
  renderRobotsTxt,
  renderSeoHead,
  renderSitemap,
} from '../src/lib/seo';

afterEach(() => {
  document.head.querySelectorAll('[data-atlas-seo]').forEach((element) => element.remove());
  document.title = '';
});

describe('canonical SEO route inventory', () => {
  test('covers every canonical URL exactly once', () => {
    const routes = [...getIndexableSeoRoutes()];
    const paths = routes.map((route) => route.path);

    expect(routes).toHaveLength(391);
    expect(new Set(paths).size).toBe(routes.length);
    expect(paths.filter((path) => path.includes('/compare/'))).toHaveLength(117);
    expect(paths).toContain('/');
    expect(paths).toContain('/elements/H');
    expect(paths).toContain('/groups/18');
    expect(paths).toContain('/discoverers/Marie%20Curie%20%26%20Pierre%20Curie');
    expect(paths).toContain('/elements/H/compare/He');
    expect(paths).toContain('/elements/Mn/compare/Fe');
    expect(paths).not.toContain('/elements/Fe/compare/Cu');
    expect(paths).not.toContain('/elements/He/compare/H');
    expect(getIndexableComparisonPaths()).toHaveLength(117);
  });

  test('resolves every generated route to complete, self-consistent metadata', () => {
    for (const expected of getIndexableSeoRoutes()) {
      const actual = getSeoMetadata(expected.path);
      expect(actual, expected.path).not.toBeNull();
      expect(actual!.canonicalUrl, expected.path).toBe(`${SITE_ORIGIN}${expected.path === '/' ? '/' : expected.path}`);
      expect(actual!.title.length, expected.path).toBeGreaterThan(10);
      expect(actual!.description.length, expected.path).toBeGreaterThan(50);
      expect(actual!.description.length, expected.path).toBeLessThanOrEqual(200);
      expect(actual!.robots, expected.path).toContain('index,follow');
      expect(JSON.stringify(actual!.schema), expected.path).toContain(actual!.canonicalUrl);
    }
  });

  test('rejects malformed and unknown dynamic routes', () => {
    expect(getSeoMetadata('/groups/01')).toBeNull();
    expect(getSeoMetadata('/groups/999')).toBeNull();
    expect(getSeoMetadata('/periods/8')).toBeNull();
    expect(getSeoMetadata('/blocks/x')).toBeNull();
    expect(getSeoMetadata('/elements/fe')).toBeNull();
    expect(getSeoMetadata('/not-an-atlas-route')).toBeNull();
    expect(getNotFoundMetadata('/groups/999').robots).toBe('noindex,follow');
  });

  test('uses source labels and scientific Schema.org types', () => {
    const category = getSeoMetadata('/categories/transition-metal');
    expect(category?.title).toBe('Transition metals — Atlas');

    const iron = getSeoMetadata('/elements/Fe');
    const graph = iron?.schema['@graph'] as Array<Record<string, unknown>>;
    const chemical = graph.find((node) => node['@type'] === 'ChemicalSubstance');
    const image = graph.find((node) => node['@type'] === 'ImageObject');
    expect(chemical).toMatchObject({
      name: 'Iron',
      alternateName: 'Fe',
      chemicalComposition: 'Fe',
      image: `${SITE_ORIGIN}${elementSocialImagePath('Fe')}`,
    });
    expect(image).toMatchObject({
      url: `${SITE_ORIGIN}${elementSocialImagePath('Fe')}`,
      contentUrl: `${SITE_ORIGIN}${elementSocialImagePath('Fe')}`,
      width: 1200,
      height: 630,
    });
    expect(chemical?.sameAs).toContain('https://www.wikidata.org/wiki/Q677');
  });

  test('gives exactly the 118 element routes unique versioned cards', () => {
    const routes = [...getIndexableSeoRoutes()];
    const elementRoutes = routes.filter((route) => /^\/elements\/[A-Z][a-z]?$/.test(route.path));
    const imageUrls = elementRoutes.map((route) => route.imageUrl);

    expect(elementRoutes).toHaveLength(118);
    expect(new Set(imageUrls).size).toBe(118);
    for (const route of elementRoutes) {
      const symbol = route.path.split('/').at(-1)!;
      expect(route.imageUrl).toBe(`${SITE_ORIGIN}${elementSocialImagePath(symbol)}`);
      expect(route.imageAlt).toContain(symbol);
    }

    expect(getSeoMetadata('/')?.imageUrl).toBe(SOCIAL_IMAGE_URL);
    expect(getSeoMetadata('/groups/8')?.imageUrl).toBe(SOCIAL_IMAGE_URL);
    expect(getSeoMetadata('/elements/Mn/compare/Fe')?.imageUrl).toBe(SOCIAL_IMAGE_URL);
  });

  test('keeps all 6,903 comparisons available while indexing only the 117 folio-linked pairs', () => {
    const comparisons = [...getCanonicalComparisonSeoRoutes()];
    const paths = comparisons.map((route) => route.path);
    const indexed = comparisons.filter((route) => route.robots.startsWith('index,follow'));
    const noindex = comparisons.filter((route) => route.robots === 'noindex,follow');

    expect(comparisons).toHaveLength(6_903);
    expect(new Set(paths).size).toBe(6_903);
    expect(indexed).toHaveLength(117);
    expect(noindex).toHaveLength(6_786);
    expect(new Set(indexed.map((route) => route.path))).toEqual(new Set(getIndexableComparisonPaths()));
    expect(comparisons.every((route) => route.imageUrl === SOCIAL_IMAGE_URL)).toBe(true);
    expect(getSeoMetadata('/elements/Mn/compare/Fe')?.robots).toContain('index,follow');
    expect(getSeoMetadata('/elements/Fe/compare/Cu')?.robots).toBe('noindex,follow');
  });
});

describe('comparison canonicalization', () => {
  test('uses atomic-number order and collapses self-comparisons', () => {
    expect(canonicalComparisonPath('Fe', 'Mn')).toBe('/elements/Mn/compare/Fe');
    expect(canonicalComparisonPath('Mn', 'Fe')).toBe('/elements/Mn/compare/Fe');
    expect(canonicalComparisonPath('Fe', 'Fe')).toBe('/elements/Fe');
    expect(canonicalComparisonPath('Nope', 'Fe')).toBeNull();
  });

  test('reverse comparison metadata points at the canonical pair', () => {
    const forward = getSeoMetadata('/elements/Mn/compare/Fe');
    const reverse = getSeoMetadata('/elements/Fe/compare/Mn');
    expect(reverse?.canonicalPath).toBe('/elements/Mn/compare/Fe');
    expect(reverse?.canonicalUrl).toBe(forward?.canonicalUrl);
    expect(reverse?.title).toBe(forward?.title);
  });

  test('reverse non-indexed comparisons canonicalize to a noindex page', () => {
    const forward = getSeoMetadata('/elements/Fe/compare/Cu');
    const reverse = getSeoMetadata('/elements/Cu/compare/Fe');
    expect(reverse?.canonicalPath).toBe('/elements/Fe/compare/Cu');
    expect(reverse?.canonicalUrl).toBe(forward?.canonicalUrl);
    expect(forward?.robots).toBe('noindex,follow');
    expect(reverse?.robots).toBe('noindex,follow');
  });
});

describe('head, sitemap, and robots rendering', () => {
  test('renders all required Search, Open Graph, Twitter, and JSON-LD tags', () => {
    const metadata = getSeoMetadata('/elements/Fe');
    expect(metadata).not.toBeNull();
    const head = renderSeoHead(metadata!);

    for (const required of [
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
    ]) {
      expect(head).toContain(required);
    }
  });

  test('updates one stable set of tags during client navigation', () => {
    const iron = getSeoMetadata('/elements/Fe')!;
    const gold = getSeoMetadata('/elements/Au')!;

    applySeoMetadata(iron);
    applySeoMetadata(gold);

    expect(document.title).toBe(gold.title);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="twitter:card"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('script#atlas-structured-data')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(gold.canonicalUrl);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(gold.imageUrl);
    expect(gold.imageUrl).not.toBe(iron.imageUrl);
    expect(JSON.parse(document.querySelector('#atlas-structured-data')?.textContent ?? '{}')['@context']).toBe('https://schema.org');
  });

  test('sitemap and robots expose only the selected canonical inventory', () => {
    const routes = [...getIndexableSeoRoutes()];
    const sitemap = renderSitemap(routes);
    expect(sitemap.match(/<url>/g)).toHaveLength(391);
    expect(sitemap).toContain('<loc>https://atlas-48p.pages.dev/elements/H</loc>');
    expect(sitemap).toContain('<loc>https://atlas-48p.pages.dev/elements/H/compare/He</loc>');
    expect(sitemap).not.toContain('<loc>https://atlas-48p.pages.dev/elements/Fe/compare/Cu</loc>');
    expect(sitemap).not.toContain('<loc>https://atlas-48p.pages.dev/elements/He/compare/H</loc>');
    expect(renderRobotsTxt()).toContain('Sitemap: https://atlas-48p.pages.dev/sitemap.xml');
  });
});
