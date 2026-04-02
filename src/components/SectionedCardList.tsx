import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { getElement } from '../lib/data';
import { PAPER, BLACK, GREY_MID, INSCRIPTION_STYLE } from '../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SectionItem = {
  symbol: string;
  description: string;
};

export type Section = {
  id: string;
  label: string;
  color: string;
  items: SectionItem[];
};

type SectionedCardListProps = {
  sections: Section[];
  /** Enable accordion expand/collapse on section headers. */
  accordion?: boolean;
  /** When accordion is true, start with all sections collapsed. */
  defaultCollapsed?: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CARD_W = 80;
const CARD_H = 48;
const CARD_GAP = 8;
const HEADER_H = 40;
const SECTION_GAP = 24;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const sectionHeaderStyle = (color: string): React.CSSProperties => ({
  width: '100%',
  height: HEADER_H,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  background: color,
  color: PAPER,
  fontWeight: 'bold',
  fontSize: '15px',
  letterSpacing: '0.03em',
  textTransform: 'capitalize',
  boxSizing: 'border-box',
  margin: 0,
  border: 'none',
  cursor: 'default',
});

const cardGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: CARD_GAP,
  padding: '12px 0',
};

const cardStyle = (color: string, delay: number, visible: boolean): React.CSSProperties => ({
  width: CARD_W,
  height: CARD_H,
  border: `2px solid ${color}`,
  borderRadius: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  textDecoration: 'none',
  color: BLACK,
  background: PAPER,
  overflow: 'hidden',
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(10px)',
  transition: `opacity 300ms var(--ease-out) ${delay}ms, transform 300ms var(--ease-out) ${delay}ms`,
});

const symbolStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: 18,
  lineHeight: 1.1,
};

const descStyle: React.CSSProperties = {
  fontSize: 9,
  lineHeight: 1.2,
  color: GREY_MID,
  textAlign: 'center',
  padding: '0 4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: CARD_W - 8,
};

const countStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontWeight: 400,
  fontSize: 13,
  opacity: 0.85,
};

const chevronStyle = (expanded: boolean): React.CSSProperties => ({
  width: 12,
  height: 12,
  marginLeft: 8,
  transition: 'transform 200ms var(--ease-out)',
  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SectionedCardList({
  sections,
  accordion = false,
  defaultCollapsed = false,
}: SectionedCardListProps) {
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Accordion state: set of expanded section IDs
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (!accordion || !defaultCollapsed) {
      return new Set(sections.map(s => s.id));
    }
    return new Set();
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Keep expanded set in sync if sections change
  useEffect(() => {
    if (!accordion) {
      setExpanded(new Set(sections.map(s => s.id)));
    }
  }, [sections, accordion]);

  const toggleSection = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(sections.map(s => s.id)));
  }, [sections]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const allExpanded = expanded.size === sections.length;

  return (
    <div>
      {accordion && sections.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
            style={{
              ...INSCRIPTION_STYLE,
              fontSize: 11,
              background: 'none',
              border: `1px solid ${BLACK}`,
              padding: '4px 12px',
              cursor: 'pointer',
              color: BLACK,
            }}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}

      {sections.map((section, sectionIdx) => {
        const isExpanded = expanded.has(section.id);
        const headerProps = accordion
          ? {
              as: 'button' as const,
              onClick: () => toggleSection(section.id),
              'aria-expanded': isExpanded,
              'aria-label': `Toggle ${section.label}`,
              style: {
                ...sectionHeaderStyle(section.color),
                cursor: 'pointer',
              },
            }
          : {
              style: sectionHeaderStyle(section.color),
            };

        return (
          <section
            key={section.id}
            id={section.id}
            role="region"
            aria-label={section.label}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            style={{ marginBottom: SECTION_GAP }}
          >
            {accordion ? (
              <h2 style={{ margin: 0 }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle ${section.label}`}
                  style={{
                    ...sectionHeaderStyle(section.color),
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span>{section.label}</span>
                  <span style={countStyle}>{section.items.length}</span>
                  <svg
                    viewBox="0 0 12 12"
                    style={chevronStyle(isExpanded)}
                    aria-hidden="true"
                  >
                    <path d="M4 2 L8 6 L4 10" fill="none" stroke={PAPER} strokeWidth={2} />
                  </svg>
                </button>
              </h2>
            ) : (
              <h2 style={sectionHeaderStyle(section.color)}>
                <span>{section.label}</span>
                <span style={countStyle}>{section.items.length}</span>
              </h2>
            )}

            {isExpanded && (
              <div style={cardGridStyle}>
                {section.items.map((item, cardIdx) => {
                  const stagger = sectionIdx * 30 + cardIdx * 25;
                  return (
                    <Link
                      key={item.symbol}
                      to={`/elements/${item.symbol}`}
                      title={`${getElement(item.symbol)?.name ?? item.symbol}: ${item.description}`}
                      className="etymology-card"
                      style={cardStyle(section.color, stagger, hasLoaded)}
                      aria-label={`${item.symbol} — ${item.description}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSymbol(item.symbol);
                        transitionNavigate(`/elements/${item.symbol}`);
                      }}
                    >
                      <span
                        style={{
                          ...symbolStyle,
                          viewTransitionName:
                            activeSymbol === item.symbol
                              ? 'element-symbol'
                              : undefined,
                        } as React.CSSProperties}
                      >
                        {item.symbol}
                      </span>
                      <span style={descStyle}>{item.description}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
