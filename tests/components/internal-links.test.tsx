/**
 * Every internal link a page renders must land on a real page.
 *
 * React Router renders an unknown slug (e.g. /anomalies/no-such-slug) as an
 * in-app "not found" state with no HTTP error, so a dead link is invisible to
 * route-pattern checks. The oracle here is the app's own router (does any
 * route serve the path?) plus getSeoMetadata, which returns null for paths
 * that match a pattern but name no entity.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, matchRoutes } from 'react-router';
import type { ComponentType } from 'react';
import { router } from '../../src/routes';
import { getSeoMetadata } from '../../src/lib/seo';
import EntityMap from '../../src/pages/EntityMap';
import Design from '../../src/pages/Design';

afterEach(cleanup);

function deadInternalLinks(Page: ComponentType): { links: number; dead: string[] } {
  const { container } = render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  );
  const hrefs = [...container.querySelectorAll('a[href^="/"]')].map(
    (anchor) => anchor.getAttribute('href')!.split('#')[0],
  );
  const dead = [...new Set(hrefs)].filter(
    (path) => matchRoutes(router.routes, path) === null || getSeoMetadata(path) === null,
  );
  return { links: hrefs.length, dead };
}

describe('rendered internal links resolve to real pages', () => {
  it.each([
    ['Entity Map', EntityMap],
    ['Design', Design],
  ] as const)('%s page', (_name, Page) => {
    const { links, dead } = deadInternalLinks(Page);
    expect(links).toBeGreaterThan(0);
    expect(dead).toEqual([]);
  });
});
