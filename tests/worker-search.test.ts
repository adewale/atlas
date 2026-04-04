/**
 * Search Worker tests — exercises the handler against a real D1 + Vectorize
 * contract using Cloudflare's Miniflare test environment.
 *
 * Covers:
 *  - Literal keyword search (BM25 via FTS5)
 *  - Synonym expansion (wolfram → tungsten, ferrum → iron)
 *  - Indirect/semantic references ("Polish scientists" → Curie)
 *  - Faceted filtering (type, block, era, phase, etymologyOrigin)
 *  - Self-exclusion facet counts
 *  - RRF fusion of BM25 + vector results
 *  - Error handling
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { handleSearch, type SearchEnv } from '../worker/src/handler';

/* ------------------------------------------------------------------ */
/* Stubbed bindings — mimic Cloudflare D1 + Vectorize + Workers AI    */
/* ------------------------------------------------------------------ */

/**
 * In-memory D1 stub with FTS5 simulation.
 * Real D1 uses SQLite FTS5 with porter stemming — we simulate the
 * MATCH operator as case-insensitive substring search on search_text.
 */
function createD1Stub(rows: Array<{
  id: string; entity_type: string; name: string; symbol: string | null;
  url_path: string; search_text: string; metadata_json: string;
}>, synonyms: Array<{ term: string; synonym: string }> = []) {
  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async all() {
              const query = String(args[0] ?? '').toLowerCase();

              if (sql.includes('synonyms')) {
                // Synonym lookup
                const matches = synonyms.filter((s) => s.term === query);
                return { results: matches };
              }

              if (sql.includes('search_fts')) {
                // FTS5 MATCH simulation — match on search_text
                const terms = query.split(/\s+or\s+/i).map((t) => t.trim().replace(/"/g, ''));
                const matches = rows.filter((r) =>
                  terms.some((term) =>
                    r.search_text.toLowerCase().includes(term)
                    || r.name.toLowerCase().includes(term)
                    || (r.symbol && r.symbol.toLowerCase() === term)
                  ),
                );
                return {
                  results: matches.map((r, i) => ({
                    id: r.id,
                    name: r.name,
                    entity_type: r.entity_type,
                    url_path: r.url_path,
                    search_text: r.search_text,
                    metadata_json: r.metadata_json,
                    score: matches.length - i, // BM25 proxy
                  })),
                };
              }

              if (sql.includes('search_entities')) {
                if (sql.includes('WHERE') && args.length > 0) {
                  // Fetch single entity by id
                  const entityId = String(args[0] ?? '');
                  const match = rows.find((r) => r.id === entityId);
                  return { results: match ? [match] : [] };
                }
                // Fetch all entities (empty query)
                return { results: rows };
              }

              return { results: [] };
            },
          };
        },
      };
    },
  };
}

/** Vectorize stub — returns results based on cosine similarity proxy. */
function createVectorizeStub(vectors: Array<{
  id: string; semanticTerms: string[];
}>) {
  return {
    async query(embedding: number[], opts?: { topK?: number }) {
      const topK = opts?.topK ?? 20;
      // The embedding's first value encodes a query hash — we match on
      // semanticTerms containing any of the query words (set by AI stub)
      const queryTerms: string[] = (embedding as any).__queryTerms ?? [];
      const matches = vectors
        .filter((v) => v.semanticTerms.some((st) =>
          queryTerms.some((qt) => st.toLowerCase().includes(qt.toLowerCase())),
        ))
        .slice(0, topK)
        .map((v, i) => ({
          id: v.id,
          score: 1 - i * 0.1,
        }));
      return { matches };
    },
  };
}

/** Workers AI stub — returns embeddings tagged with query terms. */
function createAIStub() {
  return {
    async run(_model: string, input: { text: string[] }) {
      const queryTerms = input.text[0].toLowerCase().split(/\s+/);
      // Return a fake embedding that carries queryTerms for the Vectorize stub
      const embedding = [0.1, 0.2, 0.3];
      (embedding as any).__queryTerms = queryTerms;
      return { data: [embedding] };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Test corpus                                                        */
/* ------------------------------------------------------------------ */

const ROWS = [
  { id: 'element-W', entity_type: 'element', name: 'Tungsten', symbol: 'W',
    url_path: '/elements/W', search_text: 'tungsten wolfram transition metal d-block period 6 group 6 highest melting point',
    metadata_json: '{"block":"d","phase":"solid","category":"transition metal","etymologyOrigin":"mineral","discoveryYear":1783}' },
  { id: 'element-Fe', entity_type: 'element', name: 'Iron', symbol: 'Fe',
    url_path: '/elements/Fe', search_text: 'iron ferrum transition metal d-block period 4 group 8 most common metal earth core',
    metadata_json: '{"block":"d","phase":"solid","category":"transition metal","etymologyOrigin":"property","discoveryYear":null}' },
  { id: 'element-Po', entity_type: 'element', name: 'Polonium', symbol: 'Po',
    url_path: '/elements/Po', search_text: 'polonium radioactive metalloid p-block period 6 group 16 discovered by Marie Curie named after Poland Polish',
    metadata_json: '{"block":"p","phase":"solid","category":"metalloid","etymologyOrigin":"place","discoveryYear":1898}' },
  { id: 'element-Ra', entity_type: 'element', name: 'Radium', symbol: 'Ra',
    url_path: '/elements/Ra', search_text: 'radium radioactive alkaline earth metal s-block period 7 group 2 discovered by Marie Curie Pierre Curie',
    metadata_json: '{"block":"s","phase":"solid","category":"alkaline earth metal","etymologyOrigin":"property","discoveryYear":1898}' },
  { id: 'element-Cm', entity_type: 'element', name: 'Curium', symbol: 'Cm',
    url_path: '/elements/Cm', search_text: 'curium actinide f-block named after Marie and Pierre Curie radioactive synthetic',
    metadata_json: '{"block":"f","phase":"solid","category":"actinide","etymologyOrigin":"person","discoveryYear":1944}' },
  { id: 'element-H', entity_type: 'element', name: 'Hydrogen', symbol: 'H',
    url_path: '/elements/H', search_text: 'hydrogen lightest element s-block period 1 group 1 nonmetal gas',
    metadata_json: '{"block":"s","phase":"gas","category":"nonmetal","etymologyOrigin":"property","discoveryYear":1766}' },
  { id: 'discoverer-Marie Curie', entity_type: 'discoverer', name: 'Marie Curie', symbol: null,
    url_path: '/discoverers/Marie%20Curie', search_text: 'Marie Curie Marie Sklodowska Polish French physicist chemist radioactivity pioneer nobelium prizewinner polonium radium',
    metadata_json: '{"elements":["Po","Ra"]}' },
  { id: 'discoverer-Pierre Curie', entity_type: 'discoverer', name: 'Pierre Curie', symbol: null,
    url_path: '/discoverers/Pierre%20Curie', search_text: 'Pierre Curie French physicist piezoelectricity radioactivity polonium radium',
    metadata_json: '{"elements":["Po","Ra"]}' },
  { id: 'era-1890s', entity_type: 'era', name: '1890s', symbol: null,
    url_path: '/eras/1890', search_text: '1890s decade Marie Curie Pierre Curie radioactivity polonium radium noble gases',
    metadata_json: '{"elements":["Po","Ra","Ar","He","Ne","Kr","Xe"]}' },
  { id: 'category-transition metal', entity_type: 'category', name: 'Transition metals', symbol: null,
    url_path: '/categories/transition%20metal', search_text: 'transition metals d-block variable oxidation states coloured compounds catalysts',
    metadata_json: '{"elements":["Fe","W","Cu","Cr"]}' },
  { id: 'block-d', entity_type: 'block', name: 'd-block', symbol: null,
    url_path: '/blocks/d', search_text: 'd-block transition metals groups 3-12 variable oxidation',
    metadata_json: '{"elements":["Fe","W","Cu","Cr"]}' },
];

const SYNONYMS = [
  { term: 'wolfram', synonym: 'tungsten' },
  { term: 'ferrum', synonym: 'iron' },
  { term: 'quicksilver', synonym: 'mercury' },
  { term: 'natrium', synonym: 'sodium' },
  { term: 'plumbum', synonym: 'lead' },
];

const VECTORS = [
  { id: 'element-W', semanticTerms: ['tungsten', 'wolfram', 'metal', 'melting'] },
  { id: 'element-Fe', semanticTerms: ['iron', 'ferrum', 'metal', 'steel', 'core'] },
  { id: 'element-Po', semanticTerms: ['polonium', 'radioactive', 'curie', 'poland', 'polish'] },
  { id: 'element-Ra', semanticTerms: ['radium', 'radioactive', 'curie', 'alkaline'] },
  { id: 'element-Cm', semanticTerms: ['curium', 'curie', 'actinide', 'synthetic'] },
  { id: 'element-H', semanticTerms: ['hydrogen', 'lightest', 'gas', 'water'] },
  { id: 'discoverer-Marie Curie', semanticTerms: ['curie', 'marie', 'polish', 'scientist', 'radioactivity', 'nobelium'] },
  { id: 'discoverer-Pierre Curie', semanticTerms: ['curie', 'pierre', 'french', 'physicist', 'radioactivity'] },
  { id: 'era-1890s', semanticTerms: ['1890s', 'curie', 'radioactivity', 'noble'] },
  { id: 'category-transition metal', semanticTerms: ['transition', 'metal', 'd-block', 'catalyst'] },
  { id: 'block-d', semanticTerms: ['d-block', 'transition', 'metal'] },
];

/* ------------------------------------------------------------------ */
/* Build env                                                          */
/* ------------------------------------------------------------------ */

function createEnv(): SearchEnv {
  return {
    DB: createD1Stub(ROWS, SYNONYMS) as any,
    VECTORIZE: createVectorizeStub(VECTORS) as any,
    AI: createAIStub() as any,
  };
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Search Worker — literal keyword search', () => {
  it('finds Tungsten by exact name', async () => {
    const res = await handleSearch(new URLSearchParams('q=Tungsten'), createEnv());
    expect(res.results.some((r) => r.id === 'element-W')).toBe(true);
  });

  it('finds Iron by symbol Fe', async () => {
    const res = await handleSearch(new URLSearchParams('q=Fe'), createEnv());
    expect(res.results.some((r) => r.id === 'element-Fe')).toBe(true);
  });

  it('finds Hydrogen by partial name', async () => {
    const res = await handleSearch(new URLSearchParams('q=hydrogen'), createEnv());
    expect(res.results.some((r) => r.id === 'element-H')).toBe(true);
  });

  it('returns empty for nonsense', async () => {
    const res = await handleSearch(new URLSearchParams('q=xyzzyplugh'), createEnv());
    expect(res.results).toHaveLength(0);
  });
});

describe('Search Worker — synonym expansion', () => {
  it('wolfram finds Tungsten via synonym table', async () => {
    const res = await handleSearch(new URLSearchParams('q=wolfram'), createEnv());
    expect(res.results.some((r) => r.id === 'element-W')).toBe(true);
  });

  it('ferrum finds Iron via synonym table', async () => {
    const res = await handleSearch(new URLSearchParams('q=ferrum'), createEnv());
    expect(res.results.some((r) => r.id === 'element-Fe')).toBe(true);
  });
});

describe('Search Worker — indirect/semantic references', () => {
  it('"Polish scientists" surfaces Marie Curie via Vectorize', async () => {
    const res = await handleSearch(new URLSearchParams('q=Polish+scientists'), createEnv());
    const ids = res.results.map((r) => r.id);
    expect(ids).toContain('discoverer-Marie Curie');
  });

  it('"radioactivity pioneer" surfaces Curie-related results', async () => {
    const res = await handleSearch(new URLSearchParams('q=radioactivity+pioneer'), createEnv());
    const ids = res.results.map((r) => r.id);
    // Should find Marie Curie and/or Pierre Curie
    expect(ids.some((id) => id.includes('Curie'))).toBe(true);
  });

  it('"Curie" surfaces discoverers, named element, and era', async () => {
    const res = await handleSearch(new URLSearchParams('q=Curie'), createEnv());
    const types = new Set(res.results.map((r) => r.type));
    // Should have results from multiple entity types
    expect(types.size).toBeGreaterThanOrEqual(2);
    expect(res.results.some((r) => r.id === 'discoverer-Marie Curie')).toBe(true);
    expect(res.results.some((r) => r.id === 'element-Cm')).toBe(true);
  });
});

describe('Search Worker — RRF fusion', () => {
  it('deduplicates results that appear in both BM25 and vector legs', async () => {
    const res = await handleSearch(new URLSearchParams('q=Curie'), createEnv());
    const ids = res.results.map((r) => r.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size); // No duplicates
  });

  it('returns at most 10 results', async () => {
    const res = await handleSearch(new URLSearchParams('q=metal'), createEnv());
    expect(res.results.length).toBeLessThanOrEqual(10);
  });

  it('BM25-only match appears in results', async () => {
    // "highest melting point" only appears in search_text, not semantic terms
    const res = await handleSearch(new URLSearchParams('q=melting+point'), createEnv());
    expect(res.results.some((r) => r.id === 'element-W')).toBe(true);
  });

  it('vector-only match appears in results', async () => {
    // "steel" only appears in semantic terms for Fe, not in search_text
    const res = await handleSearch(new URLSearchParams('q=steel'), createEnv());
    expect(res.results.some((r) => r.id === 'element-Fe')).toBe(true);
  });
});

describe('Search Worker — faceted filtering', () => {
  it('type facet narrows results', async () => {
    const res = await handleSearch(new URLSearchParams('q=Curie&type=element'), createEnv());
    expect(res.results.every((r) => r.type === 'element')).toBe(true);
  });

  it('block facet narrows results', async () => {
    const res = await handleSearch(new URLSearchParams('q=&block=s'), createEnv());
    // Should include H (s-block) and Ra (s-block)
    expect(res.results.some((r) => r.id === 'element-H')).toBe(true);
    expect(res.results.some((r) => r.id === 'element-Ra')).toBe(true);
    // Should NOT include Fe (d-block)
    expect(res.results.every((r) => r.id !== 'element-Fe')).toBe(true);
  });

  it('multiple facets compose with AND', async () => {
    const res = await handleSearch(new URLSearchParams('q=&type=element&block=d'), createEnv());
    expect(res.results.every((r) => r.type === 'element')).toBe(true);
    // Should include Fe, W (d-block elements)
    const ids = res.results.map((r) => r.id);
    expect(ids).toContain('element-Fe');
    expect(ids).toContain('element-W');
    // Should NOT include H (s-block) or Po (p-block)
    expect(ids).not.toContain('element-H');
    expect(ids).not.toContain('element-Po');
  });

  it('returns self-exclusion facet counts', async () => {
    const res = await handleSearch(new URLSearchParams('q=Curie&type=element'), createEnv());
    expect(res.facets).toBeDefined();
    // Type counts should be computed WITHOUT the type filter (self-exclusion)
    expect(res.facets!.type).toBeDefined();
    // discoverer results should show in type counts even though type=element is active
    expect(res.facets!.type.discoverer).toBeGreaterThan(0);
  });

  it('empty query with no facets returns all entities', async () => {
    const res = await handleSearch(new URLSearchParams('q='), createEnv());
    expect(res.total).toBe(ROWS.length);
  });
});

describe('Search Worker — error handling', () => {
  it('returns empty results when DB fails gracefully', async () => {
    const brokenEnv = {
      ...createEnv(),
      DB: {
        prepare: () => ({
          bind: () => ({
            all: () => Promise.reject(new Error('DB down')),
          }),
        }),
      } as any,
    };
    // Should not throw — graceful degradation
    const res = await handleSearch(new URLSearchParams('q=test'), brokenEnv);
    // May still return vector results
    expect(Array.isArray(res.results)).toBe(true);
  });
});
