/**
 * Faceted navigation state — URL ↔ state serialization.
 *
 * All Explore page state lives in the URL query string:
 *   /explore?q=curie&type=element,discoverer&block=d&era=1890s
 *
 * Facets compose with AND across dimensions, OR within a dimension.
 * No drill param — clicking a non-element card sets a facet value.
 */

/** All facet dimensions supported by the search API. */
export type FacetState = {
  q: string;
  type?: string[];
  block?: string[];
  era?: string[];
  phase?: string[];
  etymologyOrigin?: string[];
};

import { FACET_KEYS } from '../../shared/search-types';
export type { FacetKey } from '../../shared/search-types';

/**
 * Serialize facet state to URLSearchParams.
 * Empty arrays and empty query strings are omitted.
 */
export function buildSearchParams(state: FacetState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set('q', state.q);

  for (const key of FACET_KEYS) {
    const values = state[key];
    if (values && values.length > 0) {
      params.set(key, values.join(','));
    }
  }

  return params;
}

/**
 * Parse URLSearchParams into facet state.
 * Unknown params (including legacy 'drill') are ignored.
 */
export function parseSearchParams(params: URLSearchParams): FacetState {
  const state: FacetState = { q: params.get('q') ?? '' };

  for (const key of FACET_KEYS) {
    const raw = params.get(key);
    if (raw) {
      state[key] = raw.split(',').filter(Boolean);
    }
  }

  return state;
}
