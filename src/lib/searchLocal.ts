/**
 * Client-side search — filters the static entity index in memory.
 *
 * All 118 elements + ~200 entity records fit in a single JSON bundle.
 * Faceted filtering, scoring, and count computation happen client-side
 * with zero network requests.
 */
import type { SearchRequest, SearchResponse, SearchResult, FacetCounts } from '../../shared/search-types';

type EntityEntry = {
  id: string;
  type: string;
  name: string;
  description: string;
  colour: string;
  elements: string[];
  href: string | null;
};

type ElementEntry = {
  symbol: string;
  block: string;
  phase: string;
  etymologyOrigin?: string;
  discoveryYear?: number | null;
};

type EntityMeta = EntityEntry & {
  blocks: Set<string>;
  phases: Set<string>;
  etymologyOrigins: Set<string>;
  eras: Set<string>;
};

/** Score a single entity against a query string. Returns 0 or negative for non-matches. */
function scoreEntity(entity: EntityMeta, q: string, terms: string[]): number {
  const nameL = entity.name.toLowerCase();
  const descL = entity.description.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (nameL === term) score += 100;
    else if (nameL.startsWith(term)) score += 50;
    else if (nameL.includes(term)) score += 20;
    else if (descL.includes(term)) score += 5;
    else if (entity.type.includes(term)) score += 2;
    else score -= 100;
  }
  if (entity.type === 'element' && entity.elements[0]?.toLowerCase() === q) {
    score += 200;
  }
  return score;
}

/** Facet dimension extractors keyed by SearchRequest field. */
const FACET_EXTRACTORS: Record<string, (e: EntityMeta) => Iterable<string>> = {
  type: (e) => [e.type],
  block: (e) => e.blocks,
  era: (e) => e.eras,
  phase: (e) => e.phases,
  etymologyOrigin: (e) => e.etymologyOrigins,
};

/** Apply all facet filters (AND across dimensions, OR within). */
function applyFacets(pool: EntityMeta[], req: SearchRequest): EntityMeta[] {
  for (const [key, extractor] of Object.entries(FACET_EXTRACTORS)) {
    const values = (req as unknown as Record<string, string[] | undefined>)[key];
    if (!values?.length) continue;
    const set = new Set(values);
    pool = pool.filter((e) => {
      for (const v of extractor(e)) {
        if (set.has(v)) return true;
      }
      return false;
    });
  }
  return pool;
}

/**
 * Create a local search function bound to the static data.
 * Called once at loader time; returns a function matching atlasSearch's signature.
 */
export function createLocalSearch(
  entities: EntityEntry[],
  elements: ElementEntry[],
) {
  // Build lookup maps once
  const elementBySymbol = new Map(elements.map((e) => [e.symbol, e]));

  const enriched: EntityMeta[] = entities.map((entity) => {
    const blocks = new Set<string>();
    const phases = new Set<string>();
    const etymologyOrigins = new Set<string>();
    const eras = new Set<string>();

    for (const sym of entity.elements) {
      const el = elementBySymbol.get(sym);
      if (!el) continue;
      blocks.add(el.block);
      phases.add(el.phase);
      if (el.etymologyOrigin) etymologyOrigins.add(el.etymologyOrigin);
      if (el.discoveryYear != null) {
        const decade = Math.floor(el.discoveryYear / 10) * 10;
        eras.add(`${decade}s`);
      } else {
        eras.add('Antiquity');
      }
    }
    return { ...entity, blocks, phases, etymologyOrigins, eras };
  });

  /** Filter pool by text query, returning scored & sorted results. */
  function textFilter(pool: EntityMeta[], q: string | undefined): EntityMeta[] {
    if (!q?.trim()) return pool;
    const normalized = q.toLowerCase().trim();
    const terms = normalized.split(/\s+/);
    return pool
      .map((entity) => ({ ...entity, _score: scoreEntity(entity, normalized, terms) }))
      .filter((e) => e._score > 0)
      .sort((a, b) => b._score - a._score);
  }

  return async function localSearch(req: SearchRequest): Promise<SearchResponse> {
    // Text search then facet filtering
    let pool = textFilter(enriched, req.q);
    pool = applyFacets(pool, req);

    // Build facet counts with self-exclusion
    const facets: FacetCounts = {};
    for (const [key, extractor] of Object.entries(FACET_EXTRACTORS)) {
      // Rebuild pool without this dimension's filter
      const reqWithout = { ...req, [key]: undefined };
      const selfExcludedPool = applyFacets(textFilter(enriched, req.q), reqWithout);

      const counts: Record<string, number> = {};
      for (const e of selfExcludedPool) {
        for (const val of extractor(e)) {
          counts[val] = (counts[val] ?? 0) + 1;
        }
      }
      facets[key] = counts;
    }

    const results: SearchResult[] = pool.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      path: e.href ?? '',
      snippet: e.description,
      elements: e.elements,
    }));

    return { results, total: results.length, facets };
  };
}
