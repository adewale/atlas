/**
 * Byrne-style entity card — HTML div with SVG mini-symbols.
 *
 * Every entity type gets the same treatment:
 *  - Solid colour header band with type label + name
 *  - Description text (CSS-clamped, no manual measurement)
 *  - Child element symbols as mini block-coloured squares (expanded tier only)
 *  - Drill affordance (▸)
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
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Entity } from '../lib/entities';
import { ENTITY_TYPE_LABELS } from '../lib/entities';
import { blockColor, contrastTextColor } from '../lib/gridColors';
import { PAPER, BLACK, GREY_MID, MONO_FONT } from '../lib/theme';
import { PRETEXT_SANS } from '../lib/pretext';
import symbolBlocks from '../../data/generated/symbol-blocks.json';

const SYMBOL_SIZE = 24;
const SYMBOL_GAP = 3;
const MAX_SYMBOLS = 9;

/**
 * Estimated card height for content-visibility containment.
 * Header (44px) + description 3 lines (48px) + symbol row (24px) + footer (26px) + padding (16px) = ~158px
 * Cards without symbols are shorter: header + description + footer + padding = ~134px.
 * Using the taller estimate avoids scroll jumps for most cards.
 */
const ESTIMATED_CARD_HEIGHT_WITH_SYMBOLS = 158;
const ESTIMATED_CARD_HEIGHT_WITHOUT_SYMBOLS = 134;

type EntityCardProps = {
  entity: Entity;
  /** Viewport-relative index for stagger animation (not absolute list index). */
  index: number;
  /** When true, card fades to ghosted state (hover-to-highlight). */
  dimmed?: boolean;
  onDrill?: (entity: Entity) => void;
  onNavigate?: (href: string) => void;
  /** Called with entity id on mouseenter, null on mouseleave. */
  onHover?: (id: string | null) => void;
};

export default function EntityCard({
  entity,
  index,
  dimmed = false,
  onDrill,
  onNavigate,
  onHover,
}: EntityCardProps) {
  const showSymbols = entity.elements.length > 0 && entity.type !== 'element';
  const typeLabel = ENTITY_TYPE_LABELS[entity.type];
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Two-tier rendering: expand when card enters viewport
  useEffect(() => {
    if (!showSymbols) {
      setExpanded(true);
      return;
    }

    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setExpanded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setExpanded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSymbols]);

  const visibleSymbols = expanded ? entity.elements.slice(0, MAX_SYMBOLS) : [];
  const overflow = entity.elements.length - MAX_SYMBOLS;

  const handleClick = useCallback(() => {
    if (entity.type === 'element' && entity.href && onNavigate) {
      onNavigate(entity.href);
    } else if (showSymbols && onDrill) {
      onDrill(entity);
    } else if (entity.href && onNavigate) {
      onNavigate(entity.href);
    }
  }, [entity, showSymbols, onDrill, onNavigate]);

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
        // Enter animation runs independently; dimming is applied via filter
        // so the two don't conflict (animation controls opacity 0→1,
        // filter controls brightness without touching opacity).
        opacity: 0,
        animation: `card-enter 250ms var(--ease-out) ${index * 15}ms forwards`,
        filter: dimmed ? 'opacity(0.15)' : 'none',
        transition: 'filter 150ms var(--ease-snap)',
        // content-visibility: auto skips rendering for off-screen cards
        contentVisibility: 'auto',
        containIntrinsicSize: `auto ${showSymbols ? ESTIMATED_CARD_HEIGHT_WITH_SYMBOLS : ESTIMATED_CARD_HEIGHT_WITHOUT_SYMBOLS}px`,
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
        {/* Description — CSS line clamp */}
        <div
          style={{
            fontSize: '12px',
            lineHeight: '16px',
            color: BLACK,
            fontFamily: PRETEXT_SANS,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: showSymbols ? '8px' : '4px',
          }}
        >
          {entity.description}
        </div>

        {/* Child element symbols — fixed-height container prevents layout shift.
            Both tiers render into the same height so the card never changes size
            when the IntersectionObserver fires. */}
        {showSymbols && (
          <div style={{ height: `${SYMBOL_SIZE}px`, display: 'flex', alignItems: 'center', gap: `${SYMBOL_GAP}px`, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {expanded ? (
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

        {/* Footer */}
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
      </div>
    </div>
  );
}
