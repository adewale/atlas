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
import { useState, useMemo, useCallback, useEffect } from 'react';
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

/** All era values sorted chronologically for the slider. */
const ERA_VALUES = [
  'Antiquity', '1250s', '1660s', '1730s', '1740s', '1750s', '1760s',
  '1770s', '1780s', '1790s', '1800s', '1810s', '1820s', '1830s',
  '1840s', '1860s', '1870s', '1880s', '1890s', '1900s', '1910s',
  '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s',
  '1990s', '2000s', '2010s',
];

/** Key tick marks to label on the slider. */
const ERA_TICKS = ['Antiquity', '1750s', '1800s', '1850s', '1900s', '1950s', '2000s'];

/** Display labels for facet values. */
const FACET_VALUE_LABELS: Record<string, Record<string, string>> = {
  type: Object.fromEntries(ENTITY_TYPES.map((t) => [t, ENTITY_TYPE_LABELS[t]])),
  block: { s: 's-block', p: 'p-block', d: 'd-block', f: 'f-block' },
  phase: { solid: 'Solid', liquid: 'Liquid', gas: 'Gas' },
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

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [staggerGen, setStaggerGen] = useState(0);
  const bumpStagger = useCallback(() => setStaggerGen((g) => g + 1), []);

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

  // Hover-to-highlight
  const highlightSymbols = useMemo(() => {
    if (!hoveredId) return null;
    const hovered = response.results.find((r) => r.id === hoveredId);
    if (!hovered || hovered.elements.length === 0) return null;
    return new Set(hovered.elements);
  }, [hoveredId, response.results]);

  /** Update a single facet dimension in the URL. */
  const setFacet = useCallback((key: FacetKey, values: string[]) => {
    const next: FacetState = { ...facetState };
    if (values.length > 0) next[key] = values;
    else delete next[key];
    setSearchParams(buildSearchParams(next), { replace: true });
    bumpStagger();
  }, [facetState, setSearchParams, bumpStagger]);

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
    bumpStagger();
  }, [facetState, setSearchParams, bumpStagger]);

  const handleClearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setExpandedId(null);
    bumpStagger();
  }, [setSearchParams, bumpStagger]);

  const handleNavigate = useCallback(
    (href: string) => transitionNavigate(href),
    [transitionNavigate],
  );

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

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
            <div key={key} style={{ marginBottom: '8px' }}>
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
                        opacity: isDisabled ? 0.4 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          background: isDisabled ? GREY_MID : isActive ? PAPER : colour,
                          display: 'inline-block',
                          flexShrink: 0,
                          transition: 'background 150ms var(--ease-snap)',
                        }}
                      />
                      {displayLabel}
                      <span style={{ opacity: 0.7, fontWeight: 400 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Era slider — horizontal timeline with clickable decade ticks */}
        {(() => {
          const eraCounts = response.facets?.era ?? {};
          const activeEras = facetState.era ?? [];
          const maxCount = Math.max(1, ...Object.values(eraCounts));

          return (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '0.15em', color: GREY_MID, marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                Discovery Era
                {activeEras.length > 0 && (
                  <button
                    onClick={() => {
                      const next = { ...facetState, era: undefined };
                      setSearchParams(buildSearchParams(next), { replace: true });
                    }}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: '10px', color: WARM_RED, cursor: 'pointer',
                      textDecoration: 'underline', padding: 0,
                    }}
                  >
                    clear
                  </button>
                )}
              </div>
              <div style={{
                display: 'flex', gap: 0, width: '100%',
                borderBottom: `1.5px solid ${GREY_RULE}`,
                minHeight: '48px', alignItems: 'flex-end',
              }}>
                {ERA_VALUES.map((era) => {
                  const count = eraCounts[era] ?? 0;
                  const isActive = activeEras.includes(era);
                  const barH = count > 0 ? Math.max(4, Math.round((count / maxCount) * 32)) : 0;
                  const isLabelled = ERA_TICKS.includes(era);

                  return (
                    <button
                      key={era}
                      onClick={() => toggleFacetValue('era', era)}
                      title={`${era}: ${count} result${count !== 1 ? 's' : ''}`}
                      aria-pressed={isActive}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? `3px solid ${WARM_RED}` : '3px solid transparent',
                        padding: '0 0 2px',
                        cursor: count > 0 || isActive ? 'pointer' : 'default',
                        opacity: count === 0 && !isActive ? 0.3 : 1,
                        minWidth: 0,
                        transition: 'border-color 120ms ease-out',
                      }}
                    >
                      {/* Bar showing count */}
                      <div style={{
                        width: '100%',
                        maxWidth: '12px',
                        height: barH,
                        background: isActive ? WARM_RED : MUSTARD,
                        marginBottom: '2px',
                        transition: 'height 200ms ease-out, background 120ms ease-out',
                      }} />
                      {/* Label for key decades */}
                      {isLabelled && (
                        <span style={{
                          fontSize: '9px',
                          color: isActive ? WARM_RED : GREY_MID,
                          fontFamily: 'system-ui, sans-serif',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {era === 'Antiquity' ? 'Anc.' : era.replace('s', '')}
                        </span>
                      )}
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

      {/* Entity card grid */}
      <div
        key={staggerGen}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '8px',
        }}
      >
        {response.results.map((result, i) => {
          const isDimmed = highlightSymbols != null
            && result.id !== hoveredId
            && !result.elements.some((sym) => highlightSymbols.has(sym));

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
              index={Math.min(i, MAX_STAGGER_BATCH)}
              dimmed={isDimmed}
              expanded={isExpanded}
              crossRefs={isExpanded ? expandedRefs : undefined}
              onDrill={handleCardDrill}
              onNavigate={handleNavigate}
              onHover={handleHover}
              onExpand={handleExpand}
              compact
            />
          );
        })}
      </div>
    </PageShell>
  );
}
