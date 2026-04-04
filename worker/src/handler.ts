/**
 * Atlas hybrid search handler.
 *
 * Fans out to D1 FTS5 (BM25) and Vectorize (semantic) in parallel,
 * then merges with Reciprocal Rank Fusion (k=60).
 *
 * Per search-spec.md:
 *  1. Expand synonyms from D1 synonyms table
 *  2. Fan out: FTS5 MATCH + Workers AI embed → Vectorize query
 *  3. RRF fusion, deduplicate by entity id
 *  4. Apply facet filters, compute self-exclusion counts
 *  5. Return top 10 results + facet counts
 */

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type SearchEnv = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
};

type D1Database = {
  prepare(sql: string): D1PreparedStatement;
};

type D1PreparedStatement = {
  bind(...args: unknown[]): D1BoundStatement;
};

type D1BoundStatement = {
  all(): Promise<{ results: any[] }>;
};

type VectorizeIndex = {
  query(vector: number[], opts?: { topK?: number }): Promise<{ matches: { id: string; score: number }[] }>;
};

type Ai = {
  run(model: string, input: { text: string[] }): Promise<{ data: number[][] }>;
};

export type SearchResult = {
  id: string;
  type: string;
  name: string;
  path: string;
  snippet: string;
  elements: string[];
};

export type FacetCounts = Record<string, Record<string, number>>;

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  facets?: FacetCounts;
};

/* ------------------------------------------------------------------ */
/* RRF fusion                                                         */
/* ------------------------------------------------------------------ */

const RRF_K = 60;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type ScoredId = { id: string; score: number };

/**
 * Reciprocal Rank Fusion — merges two ranked lists into one.
 * score = Σ 1/(k + rank_i) for each list where the id appears.
 */
function rrfFusion(lists: ScoredId[][]): ScoredId[] {
  const scores = new Map<string, number>();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank++) {
      const { id } = list[rank];
      scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + rank + 1));
    }
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Facet filtering + counting                                         */
/* ------------------------------------------------------------------ */

const FACET_KEYS = ['type', 'block', 'phase', 'era', 'etymologyOrigin'] as const;
type FacetKey = (typeof FACET_KEYS)[number];

type EntityMeta = {
  id: string;
  entity_type: string;
  name: string;
  url_path: string;
  search_text: string;
  metadata: Record<string, any>;
};

/** Extract facet values from entity metadata. */
function extractFacetValues(entity: EntityMeta, key: FacetKey): string[] {
  switch (key) {
    case 'type': return [entity.entity_type];
    case 'block': return entity.metadata.block ? [entity.metadata.block] : [];
    case 'phase': return entity.metadata.phase ? [entity.metadata.phase] : [];
    case 'etymologyOrigin': return entity.metadata.etymologyOrigin ? [entity.metadata.etymologyOrigin] : [];
    case 'era': {
      const year = entity.metadata.discoveryYear;
      if (year == null) return entity.metadata.elements ? [] : ['Antiquity'];
      return [`${Math.floor(year / 10) * 10}s`];
    }
    default: return [];
  }
}

/** Apply facet filters. Returns entities that pass all filters. */
function applyFacets(
  entities: EntityMeta[],
  filters: Partial<Record<FacetKey, string[]>>,
): EntityMeta[] {
  let pool = entities;
  for (const key of FACET_KEYS) {
    const values = filters[key];
    if (!values?.length) continue;
    const set = new Set(values);
    pool = pool.filter((e) => extractFacetValues(e, key).some((v) => set.has(v)));
  }
  return pool;
}

/** Compute self-exclusion facet counts. */
function computeFacetCounts(
  entities: EntityMeta[],
  filters: Partial<Record<FacetKey, string[]>>,
): FacetCounts {
  const facets: FacetCounts = {};

  for (const facetKey of FACET_KEYS) {
    // Apply all filters EXCEPT this one (self-exclusion)
    const otherFilters: Partial<Record<FacetKey, string[]>> = {};
    for (const k of FACET_KEYS) {
      if (k !== facetKey && filters[k]?.length) otherFilters[k] = filters[k];
    }
    const pool = applyFacets(entities, otherFilters);

    const counts: Record<string, number> = {};
    for (const e of pool) {
      for (const val of extractFacetValues(e, facetKey)) {
        counts[val] = (counts[val] ?? 0) + 1;
      }
    }
    facets[facetKey] = counts;
  }

  return facets;
}

/* ------------------------------------------------------------------ */
/* FTS5 sanitization                                                  */
/* ------------------------------------------------------------------ */

/** Strip FTS5 special operators and syntax from a search term. */
function sanitizeFts5Term(term: string): string {
  // Remove FTS5 operators: AND, OR, NOT, NEAR, quotes, parens, asterisks, carets
  return term
    .replace(/[*"()^{}[\]]/g, '')
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, '')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Main handler                                                       */
/* ------------------------------------------------------------------ */

export async function handleSearch(
  params: URLSearchParams,
  env: SearchEnv,
): Promise<SearchResponse> {
  const query = (params.get('q') ?? '').trim();

  // Parse facet filters from URL params
  const facetFilters: Partial<Record<FacetKey, string[]>> = {};
  for (const key of FACET_KEYS) {
    const raw = params.get(key);
    if (raw) facetFilters[key] = raw.split(',').filter(Boolean);
  }

  // Parse pagination
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') ?? '', 10) || DEFAULT_LIMIT), MAX_LIMIT);
  const offset = Math.max(0, parseInt(params.get('offset') ?? '', 10) || 0);

  // If no query and no facets, return all entities
  const hasQuery = query.length > 0;

  // Step 1: Per-term synonym expansion + FTS5 sanitization
  let expandedQuery = '';
  if (hasQuery) {
    const terms = query.split(/\s+/).filter(Boolean);
    const expandedTerms: string[][] = [];

    for (const term of terms) {
      const sanitized = sanitizeFts5Term(term);
      if (!sanitized) continue;

      const termExpansions = [sanitized];
      try {
        const synResult = await env.DB.prepare(
          'SELECT synonym FROM synonyms WHERE term = ?',
        ).bind(sanitized.toLowerCase()).all();
        for (const row of synResult.results) {
          const syn = sanitizeFts5Term((row as any).synonym);
          if (syn) termExpansions.push(syn);
        }
      } catch {
        // Synonym lookup failure is non-fatal
      }

      expandedTerms.push(termExpansions);
    }

    // Build FTS5 query: each term group OR'd internally, AND'd across terms
    // e.g. "wolfram alloy" → ("wolfram" OR "tungsten") AND "alloy"
    expandedQuery = expandedTerms
      .map((group) => {
        if (group.length === 1) return `"${group[0]}"`;
        return '(' + group.map((t) => `"${t}"`).join(' OR ') + ')';
      })
      .join(' AND ');
  }

  // Step 2: Fan out BM25 + Vectorize in parallel
  let bm25Results: Array<{ id: string; row: any }> = [];
  let vectorResults: ScoredId[] = [];

  const bm25Promise = hasQuery
    ? env.DB.prepare(
        `SELECT se.id, se.name, se.entity_type, se.url_path, se.search_text, se.metadata_json
         FROM search_fts
         JOIN search_entities se ON search_fts.rowid = se.rowid
         WHERE search_fts MATCH ?
         ORDER BY rank
         LIMIT 20`,
      ).bind(expandedQuery).all().then((res) => {
        bm25Results = res.results.map((r: any) => ({ id: r.id, row: r }));
      }).catch(() => {
        // BM25 failure is non-fatal — vector leg may still work
      })
    : // Empty query: fetch all entities
      env.DB.prepare(
        'SELECT id, name, entity_type, url_path, search_text, metadata_json FROM search_entities',
      ).bind().all().then((res) => {
        bm25Results = res.results.map((r: any) => ({ id: r.id, row: r }));
      }).catch(() => {});

  const vectorPromise = hasQuery
    ? env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] }).then(async (embedding) => {
        const vecRes = await env.VECTORIZE.query(embedding.data[0], { topK: 20 });
        vectorResults = vecRes.matches.map((m) => ({ id: m.id, score: m.score }));
      }).catch(() => {
        // Vector failure is non-fatal
      })
    : Promise.resolve();

  await Promise.all([bm25Promise, vectorPromise]);

  // Step 3: RRF fusion (or just BM25 order if no query)
  let rankedIds: string[];
  if (hasQuery) {
    const bm25Scored = bm25Results.map((r, i) => ({ id: r.id, score: bm25Results.length - i }));
    const fused = rrfFusion([bm25Scored, vectorResults]);
    rankedIds = fused.map((r) => r.id);
  } else {
    rankedIds = bm25Results.map((r) => r.id);
  }

  // Build entity map from BM25 results (the source of full data)
  const entityMap = new Map<string, EntityMeta>();
  for (const { row } of bm25Results) {
    entityMap.set(row.id, {
      id: row.id,
      entity_type: row.entity_type,
      name: row.name,
      url_path: row.url_path,
      search_text: row.search_text,
      metadata: JSON.parse(row.metadata_json || '{}'),
    });
  }

  // For vector-only results (not in BM25), we need to fetch their data
  // In production this would be another D1 query; in our test stubs the
  // BM25 leg already has all rows for empty queries. For scored queries,
  // vector-only results that aren't in BM25 need fetching.
  for (const id of rankedIds) {
    if (!entityMap.has(id)) {
      // Fetch from DB
      try {
        const res = await env.DB.prepare(
          'SELECT id, name, entity_type, url_path, search_text, metadata_json FROM search_entities WHERE id = ?',
        ).bind(id).all();
        if (res.results.length > 0) {
          const row = res.results[0] as any;
          entityMap.set(id, {
            id: row.id,
            entity_type: row.entity_type,
            name: row.name,
            url_path: row.url_path,
            search_text: row.search_text,
            metadata: JSON.parse(row.metadata_json || '{}'),
          });
        }
      } catch {
        // Skip this result
      }
    }
  }

  // Collect all entities we have data for, in ranked order
  const allRankedEntities = rankedIds
    .map((id) => entityMap.get(id))
    .filter(Boolean) as EntityMeta[];

  // Step 4: Apply facet filters
  const filteredEntities = applyFacets(allRankedEntities, facetFilters);

  // Step 5: Compute self-exclusion facet counts (over the pre-filter set)
  const facets = computeFacetCounts(allRankedEntities, facetFilters);

  // Step 6: Build response — paginated
  const top = filteredEntities.slice(offset, offset + limit);
  const results: SearchResult[] = top.map((e) => ({
    id: e.id,
    type: e.entity_type,
    name: e.name,
    path: e.url_path,
    snippet: e.search_text.slice(0, 200),
    elements: e.metadata.elements ?? (e.metadata.block ? [] : []),
  }));

  return { results, total: filteredEntities.length, facets };
}
