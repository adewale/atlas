/**
 * Local search adapter — stand-in for the hybrid search Worker.
 *
 * Operates on the static entity-index.json until the D1 + Vectorize
 * Worker is deployed. Implements the same SearchRequest → SearchResponse
 * contract as atlasSearch() so the Explore page doesn't care which
 * backend is active.
 *
 * This will be deleted when the Worker goes live — the only change
 * needed is swapping the import in routes.tsx.
 */
import type { SearchRequest, SearchResponse, SearchResult, FacetCounts } from './search';

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

  // Compute element-level facet values for each entity
  type EntityMeta = EntityEntry & {
    blocks: Set<string>;
    phases: Set<string>;
    etymologyOrigins: Set<string>;
    eras: Set<string>;
  };

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

  return async function localSearch(req: SearchRequest): Promise<SearchResponse> {
    let pool = enriched;

    // Text search (simple scoring, mirrors the old searchEntities logic)
    if (req.q?.trim()) {
      const q = req.q.toLowerCase().trim();
      const terms = q.split(/\s+/);
      pool = pool
        .map((entity) => {
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
          return { ...entity, _score: score };
        })
        .filter((e) => e._score > 0)
        .sort((a, b) => b._score - a._score);
    }

    // Apply facet filters (AND across dimensions, OR within)
    if (req.type?.length) {
      const set = new Set(req.type);
      pool = pool.filter((e) => set.has(e.type));
    }
    if (req.block?.length) {
      const set = new Set(req.block);
      pool = pool.filter((e) => [...e.blocks].some((b) => set.has(b)));
    }
    if (req.era?.length) {
      const set = new Set(req.era);
      pool = pool.filter((e) => [...e.eras].some((era) => set.has(era)));
    }
    if (req.phase?.length) {
      const set = new Set(req.phase);
      pool = pool.filter((e) => [...e.phases].some((p) => set.has(p)));
    }
    if (req.etymologyOrigin?.length) {
      const set = new Set(req.etymologyOrigin);
      pool = pool.filter((e) => [...e.etymologyOrigins].some((o) => set.has(o)));
    }

    // Build facet counts (self-exclusion: counts for facet F ignore F's selection)
    const facets: FacetCounts = {};

    // For each facet dimension, compute counts on the pool filtered by everything EXCEPT that dimension
    const computeCounts = (
      key: string,
      extractor: (e: EntityMeta) => string[],
      excluded: keyof SearchRequest,
    ) => {
      // Rebuild pool without the excluded facet
      let selfExcludedPool = enriched;
      if (req.q?.trim()) {
        const q = req.q.toLowerCase().trim();
        const terms = q.split(/\s+/);
        selfExcludedPool = selfExcludedPool.filter((entity) => {
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
          return score > 0;
        });
      }
      // Apply all facets except the excluded one
      if (excluded !== 'type' && req.type?.length) {
        const set = new Set(req.type);
        selfExcludedPool = selfExcludedPool.filter((e) => set.has(e.type));
      }
      if (excluded !== 'block' && req.block?.length) {
        const set = new Set(req.block);
        selfExcludedPool = selfExcludedPool.filter((e) => [...e.blocks].some((b) => set.has(b)));
      }
      if (excluded !== 'era' && req.era?.length) {
        const set = new Set(req.era);
        selfExcludedPool = selfExcludedPool.filter((e) => [...e.eras].some((era) => set.has(era)));
      }
      if (excluded !== 'phase' && req.phase?.length) {
        const set = new Set(req.phase);
        selfExcludedPool = selfExcludedPool.filter((e) => [...e.phases].some((p) => set.has(p)));
      }
      if (excluded !== 'etymologyOrigin' && req.etymologyOrigin?.length) {
        const set = new Set(req.etymologyOrigin);
        selfExcludedPool = selfExcludedPool.filter((e) => [...e.etymologyOrigins].some((o) => set.has(o)));
      }

      const counts: Record<string, number> = {};
      for (const e of selfExcludedPool) {
        for (const val of extractor(e)) {
          counts[val] = (counts[val] ?? 0) + 1;
        }
      }
      facets[key] = counts;
    };

    computeCounts('type', (e) => [e.type], 'type');
    computeCounts('block', (e) => [...e.blocks], 'block');
    computeCounts('era', (e) => [...e.eras], 'era');
    computeCounts('phase', (e) => [...e.phases], 'phase');
    computeCounts('etymologyOrigin', (e) => [...e.etymologyOrigins], 'etymologyOrigin');

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
