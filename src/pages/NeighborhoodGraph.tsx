import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { allElements, getElement } from '../lib/data';
import {
  getCellPosition,
  blockColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { PAPER, BLACK, DIM } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'Every element has neighbors \u2014 elements adjacent in the periodic table. This graph maps those relationships. Hover to see an element\u2019s neighborhood.';

const SVG_WIDTH = VIEWBOX_W;
const INTRO_HEIGHT = 80;
const TABLE_OFFSET_Y = INTRO_HEIGHT + 16;
const NODE_RADIUS = 8;

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
  const navigate = useNavigate();
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { lines, lineHeight } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: SVG_WIDTH,
  });

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

  const totalHeight = TABLE_OFFSET_Y + VIEWBOX_H + 24;

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>
        &larr; Periodic Table
      </Link>
      <h1 style={{ margin: '16px 0', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: BLACK }}>Neighborhood Graph</h1>

      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          role="img"
          aria-label="Force-directed-style network graph of element neighborhoods in the periodic table"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Intro text */}
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            fontSize={16}
            fill={BLACK}
            maxWidth={SVG_WIDTH}
            animationStagger={40}
          />

          {/* Graph */}
          <g transform={`translate(0, ${TABLE_OFFSET_Y})`}>
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
                      : '#ccc'
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
                  onClick={() => navigate(`/element/${el.symbol}`)}
                  role="button"
                  aria-label={`${el.name} (${el.symbol}), ${el.neighbors.length} neighbors`}
                >
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
                    y={cy - NODE_RADIUS - 2}
                    textAnchor="middle"
                    fontSize={6}
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
          </g>
        </svg>
      </div>
    </main>
  );
}
