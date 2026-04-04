/**
 * Explore page — unified search + faceted navigation across all entity types.
 *
 * Combines:
 *  - Text search across ~300 entities
 *  - Byrne chip filters by entity type
 *  - Breadcrumb drill-down into entity children
 *  - Byrne-style entity cards with content-visibility optimization
 *  - Hover-to-highlight: hovering a card dims others, highlighting related entities
 *
 * Performance:
 *  - Loads a single pre-built entity-index.json (~121 KB, gzipped ~25 KB)
 *    instead of 9 separate JSON imports (227 KB total)
 *  - No client-side buildEntities() — corpus is pre-computed at derivation time
 *  - Viewport-relative stagger, content-visibility, two-tier card rendering
 */
import { useState, useMemo, useCallback } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  searchEntities,
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLOURS,
  type Entity,
  type EntityType,
} from '../lib/entities';
import {
  BLACK,
  DIM,
  GREY_MID,
  GREY_RULE,
  MUSTARD,
  INSCRIPTION_STYLE,
  SECTION_LABEL_STYLE,
  CONTROL_SECTION_MIN_HEIGHT,
} from '../lib/theme';
import { PRETEXT_SANS } from '../lib/pretext';
import PageShell from '../components/PageShell';
import ByrneChips from '../components/ByrneChips';
import type { ChipOption } from '../components/ByrneChips';
import EntityCard from '../components/EntityCard';
import type { CrossRef } from '../components/EntityCard';

/**
 * Maximum cards to stagger in one batch. Cards beyond this threshold
 * get index capped so they don't wait unreasonably long to appear.
 */
const MAX_STAGGER_BATCH = 24;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function Explore() {
  useDocumentTitle('Explore');

  type RefEntry = { id: string; rel: string };
  type RefLookup = Record<string, { out: RefEntry[]; in: RefEntry[] }>;

  const loaderData = useLoaderData() as { entityIndex: Entity[]; refLookup: RefLookup };
  const allEntities: Entity[] = loaderData.entityIndex;
  const refLookup: RefLookup = loaderData.refLookup;

  const transitionNavigate = useViewTransitionNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state: ?q=...&type=element,group&drill=category-nonmetal
  const query = searchParams.get('q') ?? '';
  const activeTypes = useMemo<Set<EntityType>>(() => {
    const raw = searchParams.get('type');
    if (!raw) return new Set();
    return new Set(raw.split(',').filter((t): t is EntityType => ENTITY_TYPES.includes(t as EntityType)));
  }, [searchParams]);

  // Drill chain: resolve entity ids from the URL param
  const breadcrumbs = useMemo<Entity[]>(() => {
    const raw = searchParams.get('drill');
    if (!raw) return [];
    const ids = raw.split(',');
    return ids.map((id) => allEntities.find((e) => e.id === id)).filter(Boolean) as Entity[];
  }, [searchParams, allEntities]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentDrill = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

  // Resolve cross-refs for the expanded card (non-element refs only, capped for display)
  const expandedRefs = useMemo<CrossRef[]>(() => {
    if (!expandedId) return [];
    const entry = refLookup[expandedId];
    if (!entry) return [];
    const refs: CrossRef[] = [];
    const seen = new Set<string>();
    for (const { id, rel } of [...entry.out, ...entry.in]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const target = allEntities.find((e) => e.id === id);
      if (!target) continue;
      // Skip element refs (they're already shown as mini-symbols)
      if (target.type === 'element') continue;
      refs.push({ id: target.id, name: target.name, type: target.type, colour: target.colour, href: target.href, rel });
    }
    return refs.slice(0, 12);
  }, [expandedId, refLookup, allEntities]);

  // Stagger generation: increments on each filter/search change so
  // the CSS animation replays with fresh delays
  const [staggerGen, setStaggerGen] = useState(0);
  const bumpStagger = useCallback(() => setStaggerGen((g) => g + 1), []);

  // When drilling, show child element entities
  const drillChildren: Entity[] = useMemo(() => {
    if (!currentDrill) return [];
    const symbolSet = new Set(currentDrill.elements);
    return allEntities.filter(
      (e) => e.type === 'element' && symbolSet.has(e.elements[0]),
    );
  }, [currentDrill, allEntities]);

  // Filter and search
  const filtered = useMemo(() => {
    if (currentDrill) return drillChildren;
    let pool = allEntities;
    if (activeTypes.size > 0) pool = pool.filter((e) => activeTypes.has(e.type));
    if (query.trim()) pool = searchEntities(pool, query);
    return pool;
  }, [allEntities, activeTypes, query, currentDrill, drillChildren]);

  // Type counts for chips (self-exclusion: computed from search-filtered but type-unfiltered pool)
  const typeCounts = useMemo(() => {
    const searchPool = query.trim() ? searchEntities(allEntities, query) : allEntities;
    const counts = new Map<EntityType, number>();
    for (const e of searchPool) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    return counts;
  }, [allEntities, query]);

  const chipOptions: ChipOption<EntityType>[] = ENTITY_TYPES
    .map((type) => ({
      value: type,
      label: ENTITY_TYPE_LABELS[type],
      colour: ENTITY_TYPE_COLOURS[type],
      count: typeCounts.get(type) ?? 0,
    }))
    .filter((opt) => opt.count > 0);

  // Hover-to-highlight: compute the set of element symbols belonging to the hovered entity
  const highlightSymbols = useMemo(() => {
    if (!hoveredId) return null;
    const hovered = allEntities.find((e) => e.id === hoveredId);
    if (!hovered || hovered.elements.length === 0) return null;
    return new Set(hovered.elements);
  }, [hoveredId, allEntities]);

  /** Helper: update search params (always replaces history). */
  const updateParams = useCallback((updater: (p: URLSearchParams) => void) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      updater(next);
      return next;
    }, { replace: true });
    bumpStagger();
  }, [setSearchParams, bumpStagger]);

  const handleToggleType = useCallback((type: EntityType) => {
    updateParams((p) => {
      const next = new Set(activeTypes);
      if (next.has(type)) next.delete(type); else next.add(type);
      if (next.size === 0) p.delete('type');
      else p.set('type', [...next].join(','));
      p.delete('drill');
    });
  }, [activeTypes, updateParams]);

  const handleDrill = useCallback((entity: Entity) => {
    updateParams((p) => {
      const ids = breadcrumbs.map((b) => b.id);
      ids.push(entity.id);
      p.set('drill', ids.join(','));
    });
  }, [breadcrumbs, updateParams]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    updateParams((p) => {
      if (index < 0) p.delete('drill');
      else p.set('drill', breadcrumbs.slice(0, index + 1).map((b) => b.id).join(','));
    });
  }, [breadcrumbs, updateParams]);

  const handleNavigate = useCallback(
    (href: string) => transitionNavigate(href),
    [transitionNavigate],
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateParams((p) => {
      if (e.target.value) p.set('q', e.target.value);
      else p.delete('q');
      p.delete('drill');
    });
  }, [updateParams]);

  const handleClearAll = useCallback(() => {
    updateParams((p) => {
      p.delete('q');
      p.delete('type');
      p.delete('drill');
    });
  }, [updateParams]);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleExpand = useCallback((id: string | null) => {
    setExpandedId((prev) => prev === id ? null : id);
  }, []);

  const hasActiveFilters = activeTypes.size > 0 || query.trim().length > 0 || breadcrumbs.length > 0;

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD }}>Explore</h1>

        {/* Search input */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search entities\u2026"
            aria-label="Search entities"
            style={{
              fontFamily: PRETEXT_SANS,
              fontSize: '15px',
              padding: '8px 12px',
              border: `1.5px solid ${BLACK}`,
              borderRadius: 0,
              background: 'transparent',
              color: BLACK,
              width: isMobile ? '100%' : '360px',
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

        {/* Byrne chip facets */}
        {!currentDrill && (
          <div style={{ marginBottom: '16px' }}>
            <ByrneChips
              label="Entity type"
              options={chipOptions}
              selected={activeTypes}
              onToggle={handleToggleType}
            />
          </div>
        )}
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          aria-label="Drill-down breadcrumbs"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            style={{
              ...SECTION_LABEL_STYLE,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Results
          </button>
          {breadcrumbs.map((bc, i) => (
            <span key={bc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: GREY_MID, fontSize: '11px' }}>▸</span>
              {i < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  style={{
                    ...SECTION_LABEL_STYLE,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  {bc.name}
                </button>
              ) : (
                <span style={{ ...SECTION_LABEL_STYLE, color: BLACK }}>
                  {bc.name}
                  <span style={{ color: GREY_MID, fontWeight: 400, marginLeft: '4px' }}>
                    ({bc.elements.length})
                  </span>
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Result count */}
      <div style={{ fontSize: '11px', color: GREY_MID, letterSpacing: '0.04em', marginBottom: '12px' }}>
        {filtered.length === 0
          ? 'No entities match'
          : `${filtered.length} entit${filtered.length === 1 ? 'y' : 'ies'}`}
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
        {filtered.map((entity, i) => {
          // Hover-to-highlight: dim cards that don't share elements with hovered entity
          const isDimmed = highlightSymbols != null
            && entity.id !== hoveredId
            && !entity.elements.some((sym) => highlightSymbols.has(sym));

          const isExpanded = entity.id === expandedId;

          return (
            <EntityCard
              key={entity.id}
              entity={entity}
              index={Math.min(i, MAX_STAGGER_BATCH)}
              dimmed={isDimmed}
              expanded={isExpanded}
              crossRefs={isExpanded ? expandedRefs : undefined}
              onDrill={handleDrill}
              onNavigate={handleNavigate}
              onHover={handleHover}
              onExpand={handleExpand}
            />
          );
        })}
      </div>
    </PageShell>
  );
}
