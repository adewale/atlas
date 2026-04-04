/**
 * Atlas search API client.
 *
 * All querying goes through the hybrid search Worker (D1 FTS5 + Vectorize).
 * No client-side scoring — the Worker handles synonym expansion, BM25,
 * semantic similarity, and Reciprocal Rank Fusion.
 */

/** A single result from the search API. */
export type SearchResult = {
  id: string;
  type: string;
  name: string;
  path: string;
  snippet: string;
  elements: string[];
  /** Section that matched (enrichment search). */
  matchedSection?: string;
};

/** Facet counts returned alongside results (self-exclusion). */
export type FacetCounts = Record<string, Record<string, number>>;

/** Shape of the search API response. */
export type SearchResponse = {
  results: SearchResult[];
  total: number;
  facets?: FacetCounts;
};

/** Search request parameters — query + facet filters. */
export type SearchRequest = {
  q: string;
  type?: string[];
  block?: string[];
  era?: string[];
  phase?: string[];
  etymologyOrigin?: string[];
};

type SearchOptions = {
  /** Inject fetch for testing. Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
  /** Base URL for the search API. Defaults to '/api/search'. */
  baseUrl?: string;
};

/**
 * Call the Atlas hybrid search API.
 *
 * Encodes the query and all active facet filters as URL params,
 * sends a GET request, and returns parsed results with facet counts.
 */
export async function atlasSearch(
  req: SearchRequest,
  opts: SearchOptions = {},
): Promise<SearchResponse> {
  const fetchFn = opts.fetch ?? globalThis.fetch;
  const baseUrl = opts.baseUrl ?? '/api/search';

  const params = new URLSearchParams();
  if (req.q) params.set('q', req.q);
  if (req.type?.length) params.set('type', req.type.join(','));
  if (req.block?.length) params.set('block', req.block.join(','));
  if (req.era?.length) params.set('era', req.era.join(','));
  if (req.phase?.length) params.set('phase', req.phase.join(','));
  if (req.etymologyOrigin?.length) params.set('etymologyOrigin', req.etymologyOrigin.join(','));

  const url = `${baseUrl}?${params.toString()}`;
  const res = await fetchFn(url);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    results: data.results ?? [],
    total: data.total ?? 0,
    facets: data.facets,
  };
}
