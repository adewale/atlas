/**
 * Explore page — faceted search across all entity types.
 *
 * Filters the static entity index client-side. 118 elements + ~200
 * entities fit in memory; no backend needed.
 *
 * Facets compose with AND across dimensions, OR within a dimension.
 * State lives entirely in the URL: /explore?q=curie&type=element&block=d
 *
 * Follows Olsen's faceted navigation state machine:
 *  - No dead ends: zero-count chips are disabled, not hidden
 *  - Self-exclusion counting: counts for facet F ignore F's selection
 *  - URL as source of truth: deep linking and reproducibility
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLOURS,
  type EntityType,
} from '../lib/entities';
import { parseSearchParams, buildSearchParams, type FacetState, type FacetKey } from '../lib/facets';
import type { SearchResponse } from '../../shared/search-types';
import {
  BLACK,
  PAPER,
  GREY_MID,
  GREY_RULE,
  MUSTARD,
  WARM_RED,
  INSCRIPTION_STYLE,
  CONTROL_SECTION_MIN_HEIGHT,
} from '../lib/theme';
import { PRETEXT_SANS } from '../lib/pretext';
import { ERA_BINS } from '../../shared/era-bins';
import PageShell from '../components/PageShell';
import EntityCard from '../components/EntityCard';
import type { CrossRef } from '../components/EntityCard';

const MAX_STAGGER_BATCH = 24;

/** Facet dimensions rendered as chip rows (era is a slider, not chips). */
const FACET_DIMENSIONS: { key: FacetKey; label: string }[] = [
  { key: 'block', label: 'Block' },
  { key: 'phase', label: 'Phase' },
  { key: 'etymologyOrigin', label: 'Etymology' },
];

/** Display labels for facet values. */
const FACET_VALUE_LABELS: Record<string, Record<string, string>> = {
  type: Object.fromEntries(ENTITY_TYPES.map((t) => [t, ENTITY_TYPE_LABELS[t]])),
  block: { s: 's-block', p: 'p-block', d: 'd-block', f: 'f-block' },
  phase: { solid: 'Solid', liquid: 'Liquid', gas: 'Gas' },
  era: Object.fromEntries(ERA_BINS.map(b => [b.slug, b.label])),
};

/** Colour for a facet chip. */
function facetChipColour(key: string, value: string): string {
  if (key === 'type') return ENTITY_TYPE_COLOURS[value as EntityType] ?? BLACK;
  return BLACK;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Explore() {
  useDocumentTitle('Explore');

  type RefEntry = { id: string; rel: string };
  type RefLookup = Record<string, { out: RefEntry[]; in: RefEntry[] }>;

  const loaderData = useLoaderData() as {
    search: (req: import('../lib/search').SearchRequest) => Promise<SearchResponse>;
    refLookup: RefLookup;
  };
  const searchFn = loaderData.search;
  const refLookup: RefLookup = loaderData.refLookup;

  const transitionNavigate = useViewTransitionNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL into facet state
  const facetState = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  // Search results from the API
  const [response, setResponse] = useState<SearchResponse>({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch results whenever facet state changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchFn(facetState).then((res) => {
      if (!cancelled) {
        setResponse(res);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [facetState, searchFn]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Track whether this is the first render — stagger only on initial load
  const isInitialLoad = useRef(true);
  useEffect(() => {
    // After first search completes, mark as no longer initial
    if (!loading && isInitialLoad.current) {
      const id = setTimeout(() => { isInitialLoad.current = false; }, 500);
      return () => clearTimeout(id);
    }
  }, [loading]);

  // Resolve cross-refs for expanded card
  const expandedRefs = useMemo<CrossRef[]>(() => {
    if (!expandedId) return [];
    const entry = refLookup[expandedId];
    if (!entry) return [];
    const refs: CrossRef[] = [];
    const seen = new Set<string>();
    // Use full entity list from response for lookups
    const entityMap = new Map(response.results.map((r) => [r.id, r]));
    for (const { id, rel } of [...entry.out, ...entry.in]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const target = entityMap.get(id);
      if (!target || target.type === 'element') continue;
      refs.push({
        id: target.id,
        name: target.name,
        type: target.type as EntityType,
        colour: ENTITY_TYPE_COLOURS[target.type as EntityType] ?? BLACK,
        href: target.path || null,
        rel,
      });
    }
    return refs.slice(0, 12);
  }, [expandedId, refLookup, response.results]);


  /** Update a single facet dimension in the URL. */
  const setFacet = useCallback((key: FacetKey, values: string[]) => {
    const next: FacetState = { ...facetState };
    if (values.length > 0) next[key] = values;
    else delete next[key];
    setSearchParams(buildSearchParams(next), { replace: true });
  }, [facetState, setSearchParams]);

  /** Toggle a single value within a facet dimension. */
  const toggleFacetValue = useCallback((key: FacetKey, value: string) => {
    const current = facetState[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFacet(key, next);
  }, [facetState, setFacet]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next: FacetState = { ...facetState, q: e.target.value };
    setSearchParams(buildSearchParams(next), { replace: true });
  }, [facetState, setSearchParams]);

  const handleClearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setExpandedId(null);
  }, [setSearchParams]);

  const handleNavigate = useCallback(
    (href: string) => transitionNavigate(href),
    [transitionNavigate],
  );


  const handleExpand = useCallback((id: string | null) => {
    setExpandedId((prev) => prev === id ? null : id);
  }, []);

  /** Clicking a non-element card sets its type as a facet. */
  const handleCardDrill = useCallback((entity: { id: string; type: string; name: string }) => {
    // Instead of drill: set the entity type as a facet filter
    // For specific entities (discoverer, era, etc.), we could add
    // entity-specific facets in the future. For now, set the type facet.
    toggleFacetValue('type', entity.type);
  }, [toggleFacetValue]);

  const hasActiveFilters = facetState.q.length > 0
    || Object.keys(facetState).some((k) => k !== 'q' && (facetState as Record<string, unknown>)[k]);

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD }}>Explore</h1>

        {/* Search input */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={facetState.q}
            onChange={handleQueryChange}
            placeholder="Search entities…"
            aria-label="Search entities"
            style={{
              fontFamily: PRETEXT_SANS,
              fontSize: '15px',
              padding: '8px 12px',
              border: `1.5px solid ${BLACK}`,
              borderRadius: 0,
              background: 'transparent',
              color: BLACK,
              flex: 1,
              minWidth: isMobile ? '100%' : '300px',
              outline: 'none',
            }}
          />
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              style={{
                fontFamily: 'system-ui',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: GREY_MID,
                background: 'transparent',
                border: `1px solid ${GREY_RULE}`,
                borderRadius: 0,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Facet chip rows */}
        {FACET_DIMENSIONS.map(({ key, label }) => {
          const counts = response.facets?.[key] ?? {};
          const activeValues = facetState[key] ?? [];

          // Get all values that have counts, plus any currently active values
          const allValues = [...new Set([...Object.keys(counts), ...activeValues])].sort();
          if (allValues.length === 0) return null;

          return (
            <div key={key} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: GREY_MID,
                  marginBottom: '4px',
                }}
              >
                {label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {allValues.map((value) => {
                  const count = counts[value] ?? 0;
                  const isActive = activeValues.includes(value);
                  const isDisabled = count === 0 && !isActive;
                  const colour = facetChipColour(key, value);
                  const displayLabel = FACET_VALUE_LABELS[key]?.[value] ?? value;

                  return (
                    <button
                      key={value}
                      onClick={() => !isDisabled && toggleFacetValue(key, value)}
                      disabled={isDisabled}
                      aria-pressed={isActive}
                      style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: isDisabled ? GREY_MID : isActive ? PAPER : colour,
                        background: isActive ? colour : 'transparent',
                        border: `1.5px solid ${isDisabled ? GREY_RULE : colour}`,
                        borderRadius: 0,
                        padding: '5px 9px',
                        cursor: isDisabled ? 'default' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          background: isDisabled ? GREY_MID : isActive ? PAPER : colour,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      {displayLabel}
                      <span style={{
                        opacity: 0.7,
                        fontWeight: 400,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: '24px',
                        textAlign: 'right',
                      }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Era bar chart — Byrne-style 8-column selector */}
        {(() => {
          const eraCounts = response.facets?.era ?? {};
          const activeEras = facetState.era ?? [];
          const activeSlug = activeEras.length > 0 ? activeEras[0] : null;
          const activeBin = ERA_BINS.find(b => b.slug === activeSlug);
          const activeCount = activeSlug ? (eraCounts[activeSlug] ?? 0) : 0;

          return (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '0.15em', color: GREY_MID, marginBottom: '4px',
                display: 'flex', alignItems: 'baseline', gap: '8px',
              }}>
                Discovery Era
                {activeBin && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: WARM_RED, textTransform: 'none', letterSpacing: 0 }}>
                    {activeBin.label} · {activeCount} result{activeCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Bar chart */}
              <div style={{ display: 'flex', gap: '2px', height: '64px', alignItems: 'flex-end' }}>
                {ERA_BINS.map((bin) => {
                  const count = eraCounts[bin.slug] ?? 0;
                  const isActive = bin.slug === activeSlug;
                  const barH = Math.max(4, Math.round((count / 25) * 48));
                  return (
                    <button
                      key={bin.slug}
                      onClick={() => isActive ? setFacet('era', []) : setFacet('era', [bin.slug])}
                      aria-pressed={isActive}
                      aria-label={`${bin.label}: ${count} results`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '64px',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: '80%',
                        height: `${barH}px`,
                        background: isActive ? WARM_RED : MUSTARD,
                        opacity: isActive ? 1 : 0.4,
                      }} />
                      <span style={{
                        fontSize: '8px',
                        color: GREY_MID,
                        fontFamily: 'system-ui, sans-serif',
                        marginTop: '2px',
                        lineHeight: '14px',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}>
                        {bin.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Result count */}
      <div style={{ fontSize: '11px', color: GREY_MID, letterSpacing: '0.04em', marginBottom: '12px' }}>
        {loading
          ? 'Searching\u2026'
          : response.total === 0
            ? 'No entities match'
            : `${response.total} entit${response.total === 1 ? 'y' : 'ies'}`}
      </div>

      {/* Entity card grid — fixed min-height prevents layout shift */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '8px',
          minHeight: '400px',
          alignContent: 'start',
        }}
      >
        {response.results.map((result, i) => {
          const isExpanded = result.id === expandedId;

          // Map SearchResult to Entity shape for EntityCard
          const entity = {
            id: result.id,
            type: result.type as EntityType,
            name: result.name,
            description: result.snippet,
            colour: ENTITY_TYPE_COLOURS[result.type as EntityType] ?? BLACK,
            elements: result.elements,
            href: result.path || null,
          };

          return (
            <EntityCard
              key={result.id}
              entity={entity}
              index={isInitialLoad.current ? Math.min(i, MAX_STAGGER_BATCH) : 0}
              expanded={isExpanded}
              crossRefs={isExpanded ? expandedRefs : undefined}
              onDrill={handleCardDrill}
              onNavigate={handleNavigate}
              onExpand={handleExpand}
              compact
            />
          );
        })}
      </div>
    </PageShell>
  );
}
