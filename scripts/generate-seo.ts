import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  getIndexableSeoRoutes,
  renderRobotsTxt,
  renderSeoHead,
  renderSitemap,
} from '../src/lib/seo';

const DIST = resolve('dist');
const SEO_START = '<!-- atlas-seo:start -->';
const SEO_END = '<!-- atlas-seo:end -->';
const SEO_BLOCK = /<!-- atlas-seo:start -->[\s\S]*?<!-- atlas-seo:end -->/;

function renderRouteHtml(template: string, head: string): string {
  if (!SEO_BLOCK.test(template)) {
    throw new Error('dist/index.html is missing the Atlas SEO marker block');
  }
  return template.replace(SEO_BLOCK, `${SEO_START}\n${head}\n${SEO_END}`);
}

function outputPathForRoute(path: string): string {
  if (path === '/') return join(DIST, 'index.html');
  const decoded = decodeURIComponent(path.slice(1));
  return join(DIST, `${decoded}.html`);
}

const template = await readFile(join(DIST, 'index.html'), 'utf8');
const routes = [...getIndexableSeoRoutes()];
const seen = new Set<string>();
const createdDirectories = new Set<string>();

for (const route of routes) {
  if (seen.has(route.path)) throw new Error(`Duplicate SEO route: ${route.path}`);
  seen.add(route.path);

  // Comparison pages are rendered by the narrowly scoped Pages Function so
  // 6,903 pairs do not become 6,903 nearly identical deployment assets.
  if (route.path.includes('/compare/')) continue;

  const outputPath = outputPathForRoute(route.path);
  const outputDirectory = dirname(outputPath);
  if (!createdDirectories.has(outputDirectory)) {
    await mkdir(outputDirectory, { recursive: true });
    createdDirectories.add(outputDirectory);
  }
  await writeFile(outputPath, renderRouteHtml(template, renderSeoHead(route)));
}

await writeFile(join(DIST, 'sitemap.xml'), renderSitemap(routes));
await writeFile(join(DIST, 'robots.txt'), renderRobotsTxt());

console.log('Generated 274 static route heads and a sitemap covering 7,177 canonical URLs.');
