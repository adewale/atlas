/**
 * Tests for the Atlas search API client.
 *
 * The search client calls the hybrid search Worker (D1 FTS5 + Vectorize).
 * All querying goes through the API — no client-side scoring.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atlasSearch, type SearchResult, type SearchRequest } from '../src/lib/search';

/* ------------------------------------------------------------------ */
/* Mock fetch                                                         */
/* ------------------------------------------------------------------ */

const CURIE_RESULTS: SearchResult[] = [
  { id: 'discoverer-Marie Curie', type: 'discoverer', name: 'Marie Curie', path: '/discoverers/Marie%20Curie', snippet: 'Polonium, Radium · 1890s', elements: ['Po', 'Ra'] },
  { id: 'element-Cm', type: 'element', name: 'Curium', path: '/elements/Cm', snippet: 'Named after Marie and Pierre Curie', elements: ['Cm'] },
  { id: 'era-1890s', type: 'era', name: '1890s', path: '/eras/1890', snippet: 'Marie Curie, Pierre Curie', elements: ['Po', 'Ra'] },
];

function mockFetch(results: SearchResult[] = CURIE_RESULTS) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ results, total: results.length }),
  });
}

describe('atlasSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends query to the search endpoint', async () => {
    const fetch = mockFetch();
    const req: SearchRequest = { q: 'Curie' };
    await atlasSearch(req, { fetch });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('/api/search');
    expect(url).toContain('q=Curie');
  });

  it('returns parsed search results', async () => {
    const fetch = mockFetch();
    const { results } = await atlasSearch({ q: 'Curie' }, { fetch });

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('Marie Curie');
    expect(results[0].type).toBe('discoverer');
  });

  it('sends facet filters as query params', async () => {
    const fetch = mockFetch([]);
    await atlasSearch({ q: 'metal', type: ['element', 'category'], block: ['d'] }, { fetch });

    const [url] = fetch.mock.calls[0];
    expect(url).toContain('type=element%2Ccategory');
    expect(url).toContain('block=d');
  });

  it('returns empty results for empty query with no facets', async () => {
    const fetch = mockFetch([]);
    const { results } = await atlasSearch({ q: '' }, { fetch });
    // Empty query should still call the API (returns all, or faceted subset)
    expect(results).toEqual([]);
  });

  it('propagates network errors', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(atlasSearch({ q: 'test' }, { fetch })).rejects.toThrow('Network error');
  });

  it('throws on non-ok response', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(atlasSearch({ q: 'test' }, { fetch })).rejects.toThrow(/500/);
  });

  it('sends era facet as query param', async () => {
    const fetch = mockFetch([]);
    await atlasSearch({ q: '', era: ['1890s'] }, { fetch });

    const [url] = fetch.mock.calls[0];
    expect(url).toContain('era=1890s');
  });

  it('sends phase facet as query param', async () => {
    const fetch = mockFetch([]);
    await atlasSearch({ q: '', phase: ['solid', 'gas'] }, { fetch });

    const [url] = fetch.mock.calls[0];
    expect(url).toContain('phase=solid%2Cgas');
  });

  it('sends etymology facet as query param', async () => {
    const fetch = mockFetch([]);
    await atlasSearch({ q: '', etymologyOrigin: ['mythology'] }, { fetch });

    const [url] = fetch.mock.calls[0];
    expect(url).toContain('etymologyOrigin=mythology');
  });

  it('includes total count in response', async () => {
    const fetch = mockFetch();
    const { total } = await atlasSearch({ q: 'Curie' }, { fetch });
    expect(total).toBe(3);
  });

  it('includes facet counts in response when returned by API', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: CURIE_RESULTS,
        total: 3,
        facets: {
          type: { discoverer: 1, element: 1, era: 1 },
          block: { d: 1, f: 1 },
        },
      }),
    });
    const { facets } = await atlasSearch({ q: 'Curie' }, { fetch });
    expect(facets?.type).toEqual({ discoverer: 1, element: 1, era: 1 });
    expect(facets?.block).toEqual({ d: 1, f: 1 });
  });
});
