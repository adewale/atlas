/**
 * Shared search types — single source of truth for the search contract.
 */

/** Search request — query string + optional facet filters. */
export type SearchRequest = {
  q: string;
  type?: string[];
  block?: string[];
  era?: string[];
  phase?: string[];
  etymologyOrigin?: string[];
};

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

/** All facet dimension keys. */
export const FACET_KEYS = ['type', 'block', 'era', 'phase', 'etymologyOrigin'] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
