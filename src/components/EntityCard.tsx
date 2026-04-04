/**
 * Byrne-style entity card — HTML div with SVG mini-symbols.
 *
 * Every entity type gets the same treatment:
 *  - Solid colour header band with type label + name
 *  - Description text (CSS-clamped, no manual measurement)
 *  - Child element symbols as mini block-coloured squares (expanded tier only)
 *  - Drill affordance (▸)
 *
 * Progressive disclosure (enrichment spec §4):
 *  - Level 1 (card): name, description, element chips — static bundle only
 *  - Level 2 (expanded): cross-ref Byrne chips + "Read more" link — in-place
 *  - Level 3 (folio): full sections — navigates to entity detail page
 *
 * Performance:
 *  - content-visibility: auto skips layout/paint for off-screen cards
 *  - contain-intrinsic-size hints give the browser a size estimate
 *  - Two-tier rendering: compact (no symbols) until IntersectionObserver fires
 *  - Stagger index is viewport-relative, not absolute list position
 *
 * Interaction:
 *  - Hover-to-highlight: onHover callback enables Explore to dim unrelated cards
 *  - dimmed prop fades the card to 15% opacity (Victor's "illuminate, don't filter")
 *  - Click expands in-place; second click collapses or drills
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Entity, EntityType } from '../lib/entities';
import { ENTITY_TYPE_LABELS } from '../lib/entities';
import { blockColor, contrastTextColor } from '../lib/gridColors';
import { PAPER, BLACK, GREY_MID, GREY_RULE, MONO_FONT } from '../lib/theme';
import { PRETEXT_SANS } from '../lib/pretext';
import symbolBlocks from '../../data/generated/symbol-blocks.json';

const SYMBOL_SIZE = 24;
const SYMBOL_GAP = 3;
const MAX_SYMBOLS = 9;

const ESTIMATED_CARD_HEIGHT_WITH_SYMBOLS = 158;
const ESTIMATED_CARD_HEIGHT_WITHOUT_SYMBOLS = 134;

/** Cross-reference resolved for display. */
export type CrossRef = {
  id: string;
  name: string;
  type: EntityType;
  colour: string;
  href: string | null;
  rel: string;
};

type EntityCardProps = {
  entity: Entity;
  /** Viewport-relative index for stagger animation (not absolute list index). */
  index: number;
  /** When true, card fades to ghosted state (hover-to-highlight). */
  dimmed?: boolean;
  /** When true, card is in expanded (progressive disclosure level 2) state. */
  expanded?: boolean;
  /** Cross-references to show when expanded (non-element related entities). */
  crossRefs?: CrossRef[];
  onDrill?: (entity: Entity) => void;
  onNavigate?: (href: string) => void;
  /** Called with entity id on mouseenter, null on mouseleave. */
  onHover?: (id: string | null) => void;
  /** Called to toggle expansion. */
  onExpand?: (id: string | null) => void;
};

export default function EntityCard({
  entity,
  index,
  dimmed = false,
  expanded: isExpanded = false,
  crossRefs,
  onDrill,
  onNavigate,
  onHover,
  onExpand,
}: EntityCardProps) {
  const showSymbols = entity.elements.length > 0 && entity.type !== 'element';
  const typeLabel = ENTITY_TYPE_LABELS[entity.type];
  const cardRef = useRef<HTMLDivElement>(null);
  const [symbolsVisible, setSymbolsVisible] = useState(false);

  // Two-tier rendering: show symbols when card enters viewport
  useEffect(() => {
    if (!showSymbols) {
      setSymbolsVisible(true);
      return;
    }

    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setSymbolsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSymbolsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSymbols]);

  const visibleSymbols = symbolsVisible ? entity.elements.slice(0, MAX_SYMBOLS) : [];
  const overflow = entity.elements.length - MAX_SYMBOLS;

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If clicking a link inside the expanded area, let it propagate
    if ((e.target as HTMLElement).closest('a, button[data-ref]')) return;

    if (entity.type === 'element' && entity.href && onNavigate) {
      onNavigate(entity.href);
    } else if (onExpand && entity.type !== 'element') {
      // Toggle expansion for non-element cards
      onExpand(isExpanded ? null : entity.id);
    } else if (entity.href && onNavigate) {
      onNavigate(entity.href);
    }
  }, [entity, isExpanded, onExpand, onNavigate]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(entity.id);
  }, [onHover, entity.id]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: 'pointer',
        background: PAPER,
        border: `0.5px solid ${BLACK}`,
        borderWidth: isExpanded ? '1.5px' : '0.5px',
        borderColor: isExpanded ? entity.colour : BLACK,
        opacity: 0,
        animation: `card-enter 250ms var(--ease-out) ${index * 15}ms forwards`,
        filter: dimmed ? 'opacity(0.15)' : 'none',
        transition: 'filter 150ms var(--ease-snap), border-color 150ms var(--ease-snap)',
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${showSymbols ? ESTIMATED_CARD_HEIGHT_WITH_SYMBOLS : ESTIMATED_CARD_HEIGHT_WITHOUT_SYMBOLS}px`,
        // Expanded card spans full row in the grid
        ...(isExpanded ? { gridColumn: '1 / -1' } : {}),
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: entity.colour,
          padding: '8px 10px',
        }}
      >
        <div
          style={{
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: contrastTextColor(entity.colour),
            opacity: 0.7,
          }}
        >
          {typeLabel}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: contrastTextColor(entity.colour),
            fontFamily: PRETEXT_SANS,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entity.name}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px' }}>
        {/* Description — full text when expanded, clamped otherwise */}
        <div
          style={{
            fontSize: '12px',
            lineHeight: '16px',
            color: BLACK,
            fontFamily: PRETEXT_SANS,
            ...(isExpanded
              ? {}
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }),
            marginBottom: showSymbols || isExpanded ? '8px' : '4px',
          }}
        >
          {entity.description}
        </div>

        {/* Child element symbols — fixed-height container prevents layout shift */}
        {showSymbols && (
          <div style={{ height: `${SYMBOL_SIZE}px`, display: 'flex', alignItems: 'center', gap: `${SYMBOL_GAP}px`, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {symbolsVisible ? (
              <>
                {visibleSymbols.map((sym) => {
                  const block = (symbolBlocks as Record<string, string>)[sym];
                  const fill = block ? blockColor(block) : BLACK;
                  return (
                    <svg key={sym} width={SYMBOL_SIZE} height={SYMBOL_SIZE} style={{ flexShrink: 0 }}>
                      <rect width={SYMBOL_SIZE} height={SYMBOL_SIZE} fill={fill} />
                      <text
                        x={SYMBOL_SIZE / 2}
                        y={SYMBOL_SIZE / 2 + 4}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill={contrastTextColor(fill)}
                        fontFamily="system-ui"
                      >
                        {sym}
                      </text>
                    </svg>
                  );
                })}
                {overflow > 0 && (
                  <span style={{ fontSize: '10px', color: GREY_MID, fontFamily: MONO_FONT, flexShrink: 0 }}>
                    +{overflow}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: '10px', color: GREY_MID, fontFamily: MONO_FONT }}>
                {entity.elements.length} element{entity.elements.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        {/* Expanded: cross-reference Byrne chips */}
        {isExpanded && crossRefs && crossRefs.length > 0 && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${GREY_RULE}`, paddingTop: '8px' }}>
            <div
              style={{
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: GREY_MID,
                marginBottom: '6px',
              }}
            >
              Related
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {crossRefs.map((ref) => (
                <button
                  key={ref.id}
                  data-ref={ref.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (ref.href && onNavigate) onNavigate(ref.href);
                  }}
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: ref.colour,
                    background: 'transparent',
                    border: `1px solid ${ref.colour}`,
                    borderRadius: 0,
                    padding: '3px 7px',
                    cursor: ref.href ? 'pointer' : 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      background: ref.colour,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {ref.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expanded: drill + navigate actions */}
        {isExpanded && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            {showSymbols && onDrill && (
              <button
                data-ref="drill"
                onClick={(e) => {
                  e.stopPropagation();
                  onDrill(entity);
                }}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: entity.colour,
                  background: 'transparent',
                  border: `1px solid ${entity.colour}`,
                  borderRadius: 0,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Show elements ▸
              </button>
            )}
            {entity.href && onNavigate && (
              <button
                data-ref="navigate"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(entity.href!);
                }}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: entity.colour,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  padding: '4px 0',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Read more →
              </button>
            )}
          </div>
        )}

        {/* Footer (collapsed state only) */}
        {!isExpanded && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
            }}
          >
            <span style={{ fontSize: '10px', color: GREY_MID, fontFamily: MONO_FONT }}>
              {entity.elements.length > 0
                ? `${entity.elements.length} element${entity.elements.length === 1 ? '' : 's'}`
                : ''}
            </span>
            {(showSymbols || entity.href) && (
              <span style={{ fontSize: '12px', color: entity.colour }}>▸</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
