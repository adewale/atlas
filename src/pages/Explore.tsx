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
import { useLoaderData } from 'react-router';
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

  const loaderData = useLoaderData() as { entityIndex: Entity[] };
  const allEntities: Entity[] = loaderData.entityIndex;

  const transitionNavigate = useViewTransitionNavigate();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<Entity[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const currentDrill = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

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

  const handleToggleType = useCallback((type: EntityType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
    setBreadcrumbs([]);
    bumpStagger();
  }, [bumpStagger]);

  const handleDrill = useCallback((entity: Entity) => {
    setBreadcrumbs((prev) => [...prev, entity]);
    bumpStagger();
  }, [bumpStagger]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    setBreadcrumbs(index < 0 ? [] : (prev) => prev.slice(0, index + 1));
    bumpStagger();
  }, [bumpStagger]);

  const handleNavigate = useCallback(
    (href: string) => transitionNavigate(href),
    [transitionNavigate],
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setBreadcrumbs([]);
    bumpStagger();
  }, [bumpStagger]);

  const handleClearAll = useCallback(() => {
    setQuery('');
    setActiveTypes(new Set());
    setBreadcrumbs([]);
    bumpStagger();
  }, [bumpStagger]);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
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

          return (
            <EntityCard
              key={entity.id}
              entity={entity}
              index={Math.min(i, MAX_STAGGER_BATCH)}
              dimmed={isDimmed}
              onDrill={handleDrill}
              onNavigate={handleNavigate}
              onHover={handleHover}
            />
          );
        })}
      </div>
    </PageShell>
  );
}
