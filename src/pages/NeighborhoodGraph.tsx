import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { allElements, getElement } from '../lib/data';
import {
  getCellPosition,
  blockColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { BLACK, GREY_RULE, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT } from '../lib/theme';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'Every element has neighbours — elements adjacent in the periodic table. This graph maps those relationships. Hover to see an element\u2019s neighbourhood.';

const SVG_WIDTH = VIEWBOX_W;
const NODE_RADIUS = 10;

// ---------------------------------------------------------------------------
// Pre-compute edges (deduplicated: only draw A->B once, not B->A too)
// ---------------------------------------------------------------------------
type Edge = {
  sourceSymbol: string;
  targetSymbol: string;
  sourceAtomicNumber: number;
};

const edges: Edge[] = [];
const edgeSet = new Set<string>();

for (const el of allElements) {
  for (const neighborSym of el.neighbors) {
    const key =
      el.symbol < neighborSym
        ? `${el.symbol}-${neighborSym}`
        : `${neighborSym}-${el.symbol}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        sourceSymbol: el.symbol,
        targetSymbol: neighborSym,
        sourceAtomicNumber: el.atomicNumber,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function NeighborhoodGraph() {
  useDocumentTitle('Neighbourhood Graph');
  const navigate = useNavigate();
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Build the set of highlighted symbols (hovered element + its neighbors)
  const highlightSet = useMemo(() => {
    const set = new Set<string>();
    if (hoveredSymbol) {
      set.add(hoveredSymbol);
      const hoveredEl = getElement(hoveredSymbol);
      if (hoveredEl) {
        for (const n of hoveredEl.neighbors) {
          set.add(n);
        }
      }
    }
    return set;
  }, [hoveredSymbol]);

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: BLACK }}>Neighbourhood Graph</h1>

        <p style={{ fontSize: '14px', lineHeight: 1.6, color: BLACK, maxWidth: '600px', marginBottom: '16px' }}>
          {INTRO_TEXT}
        </p>
      </div>

      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${VIEWBOX_H + 24}`}
          overflow="visible"
          role="img"
          aria-label="Force-directed-style network graph of element neighbourhoods in the periodic table"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Edges (lines between neighbors) */}
          {edges.map((edge) => {
            const sourceEl = getElement(edge.sourceSymbol);
            const targetEl = getElement(edge.targetSymbol);
            if (!sourceEl || !targetEl) return null;

            const sp = getCellPosition(sourceEl);
            const tp = getCellPosition(targetEl);

            const sx = sp.x + CELL_WIDTH / 2;
            const sy = sp.y + CELL_HEIGHT / 2;
            const tx = tp.x + CELL_WIDTH / 2;
            const ty = tp.y + CELL_HEIGHT / 2;

            const isHighlighted =
              hoveredSymbol != null &&
              highlightSet.has(edge.sourceSymbol) &&
              highlightSet.has(edge.targetSymbol);

            const isDimmed = hoveredSymbol != null && !isHighlighted;
            const hoveredEl = hoveredSymbol ? getElement(hoveredSymbol) : null;

            return (
              <line
                key={`${edge.sourceSymbol}-${edge.targetSymbol}`}
                x1={sx}
                y1={sy}
                x2={tx}
                y2={ty}
                stroke={
                  isHighlighted && hoveredEl
                    ? blockColor(hoveredEl.block)
                    : GREY_RULE
                }
                strokeWidth={isHighlighted ? 1.5 : 0.5}
                opacity={isDimmed ? 0.15 : 1}
                style={{
                  transition: 'opacity 200ms var(--ease-out), stroke-width 200ms var(--ease-out), stroke 200ms var(--ease-out)',
                  clipPath: hasLoaded ? 'none' : 'inset(0 100% 0 0)',
                  animation: hasLoaded
                    ? undefined
                    : `rule-draw 400ms var(--ease-out) ${edge.sourceAtomicNumber * 6}ms forwards`,
                }}
              />
            );
          })}

          {/* Nodes (circles + labels) */}
          {allElements.map((el) => {
            const pos = getCellPosition(el);
            const cx = pos.x + CELL_WIDTH / 2;
            const cy = pos.y + CELL_HEIGHT / 2;
            const fill = blockColor(el.block);

            const isHighlighted = highlightSet.has(el.symbol);
            const isDimmed = hoveredSymbol != null && !isHighlighted;

            return (
              <g
                key={el.symbol}
                style={{
                  cursor: 'pointer',
                  opacity: isDimmed ? 0.15 : 1,
                  transition: 'opacity 200ms var(--ease-out)',
                }}
                onMouseEnter={() => setHoveredSymbol(el.symbol)}
                onMouseLeave={() => setHoveredSymbol(null)}
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch') {
                    e.preventDefault();
                    setHoveredSymbol(hoveredSymbol === el.symbol ? null : el.symbol);
                  }
                }}
                onClick={() => navigate(`/element/${el.symbol}`)}
                role="button"
                aria-label={`${el.symbol} — ${el.name}, ${el.neighbors.length} neighbours`}
              >
                <title>{el.name}</title>
                <circle
                  cx={cx}
                  cy={cy}
                  r={NODE_RADIUS}
                  fill={fill}
                  style={{
                    opacity: hasLoaded ? 1 : 0,
                    transition: hasLoaded
                      ? 'opacity 200ms var(--ease-out)'
                      : 'none',
                    animation: hasLoaded
                      ? undefined
                      : `folio-line-reveal 300ms var(--ease-out) ${el.atomicNumber * 6}ms forwards`,
                  }}
                />
                <text
                  x={cx}
                  y={cy - NODE_RADIUS - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill={BLACK}
                  fontFamily="system-ui, sans-serif"
                  style={{
                    pointerEvents: 'none',
                    opacity: hasLoaded ? 1 : 0,
                    animation: hasLoaded
                      ? undefined
                      : `folio-line-reveal 300ms var(--ease-out) ${el.atomicNumber * 6}ms forwards`,
                  }}
                >
                  {el.symbol}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </PageShell>
  );
}
