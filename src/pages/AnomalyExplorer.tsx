import { useState, useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { allElements } from '../lib/data';
import {
  getCellPosition,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
  contrastTextColor,
} from '../lib/grid';
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, DIM, CONTROL_SECTION_MIN_HEIGHT } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import type { AnomalyData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* ------------------------------------------------------------------ */
/* Colour key for anomaly buttons (cycle through Byrne palette)       */
/* ------------------------------------------------------------------ */
const BUTTON_COLORS = [WARM_RED, DEEP_BLUE, MUSTARD, BLACK, WARM_RED];

function buttonColorFor(index: number): string {
  return BUTTON_COLORS[index % BUTTON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Ripple delay: distance from centroid of highlighted set             */
/* ------------------------------------------------------------------ */
function computeRippleDelays(
  highlightedSymbols: Set<string>,
): Map<string, number> {
  const delays = new Map<string, number>();
  if (highlightedSymbols.size === 0) return delays;

  // Compute centroid of highlighted elements
  let cx = 0;
  let cy = 0;
  let count = 0;
  for (const el of allElements) {
    if (highlightedSymbols.has(el.symbol)) {
      const pos = getCellPosition(el);
      cx += pos.x + CELL_WIDTH / 2;
      cy += pos.y + CELL_HEIGHT / 2;
      count++;
    }
  }
  cx /= count;
  cy /= count;

  // Compute distances for highlighted elements
  let maxDist = 0;
  for (const el of allElements) {
    if (highlightedSymbols.has(el.symbol)) {
      const pos = getCellPosition(el);
      const dx = pos.x + CELL_WIDTH / 2 - cx;
      const dy = pos.y + CELL_HEIGHT / 2 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) maxDist = dist;
      delays.set(el.symbol, dist);
    }
  }

  // Normalize to 0..300ms
  if (maxDist > 0) {
    for (const [sym, dist] of delays) {
      delays.set(sym, (dist / maxDist) * 300);
    }
  }

  return delays;
}

/* ------------------------------------------------------------------ */
/* Description text area dimensions                                   */
/* ------------------------------------------------------------------ */
const DESC_MAX_WIDTH = 560;
const DESC_Y_OFFSET = 24;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function AnomalyExplorer() {
  useDocumentTitle('Anomaly Explorer');
  const { anomalies } = useLoaderData() as { anomalies: AnomalyData[] };
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const selected = anomalies.find((a) => a.slug === selectedSlug) ?? null;
  const highlightedSet = useMemo(
    () => new Set(selected?.elements ?? []),
    [selected],
  );

  const rippleDelays = useMemo(
    () => computeRippleDelays(highlightedSet),
    [highlightedSet],
  );

  const { lines, lineHeight } = usePretextLines({
    text: selected?.description ?? '',
    maxWidth: DESC_MAX_WIDTH,
  });

  const descSvgHeight = lines.length * lineHeight + 16;
  const totalHeight = VIEWBOX_H + DESC_Y_OFFSET + (selected ? descSvgHeight : 0);

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: MUSTARD,
            margin: '0 0 16px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          Anomaly Explorer
        </h1>

        {/* ---- Byrne colour key: one bold button per anomaly ---- */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {anomalies.map((a, i) => {
            const isActive = selectedSlug === a.slug;
            const bg = buttonColorFor(i);
            return (
              <button
                key={a.slug}
                onClick={() => setSelectedSlug(isActive ? null : a.slug)}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: isActive ? contrastTextColor(bg) : BLACK,
                  background: isActive ? bg : 'transparent',
                  border: `2px solid ${bg}`,
                  borderRadius: 0,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'background 200ms var(--ease-out), color 200ms var(--ease-out)',
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Periodic table grid ---- */}
      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${totalHeight}`}
        style={{
          width: '100%',
          minWidth: VIEWBOX_W,
          maxWidth: VIEWBOX_W,
          display: 'block',
          overflow: 'visible',
          touchAction: 'pinch-zoom',
        }}
      >
        {/* Keyframes in globals.css + anomaly-ripple below */}
        <style>{`
          @keyframes anomaly-ripple {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {allElements.map((el) => {
          const pos = getCellPosition(el);
          const isHighlighted = highlightedSet.has(el.symbol);
          const hasSelection = selected !== null;

          let fill: string;
          if (!hasSelection) {
            fill = PAPER;
          } else if (isHighlighted) {
            fill = WARM_RED;
          } else {
            fill = DIM;
          }

          const textColor = contrastTextColor(fill);
          const delay = rippleDelays.get(el.symbol) ?? 0;

          return (
            <g
              key={el.symbol}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{
                cursor: 'pointer',
                ...(isHighlighted
                  ? {
                      transformOrigin: `${pos.x + CELL_WIDTH / 2}px ${pos.y + CELL_HEIGHT / 2}px`,
                      animation: `anomaly-ripple 350ms ease-out ${delay}ms both`,
                    }
                  : {}),
              }}
              onClick={() => { setActiveSymbol(el.symbol); transitionNavigate(`/element/${el.symbol}`); }}
            >
              <title>{el.name}</title>
              <rect
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                fill={fill}
                stroke={hasSelection && !isHighlighted ? DIM : BLACK}
                strokeWidth={hasSelection && !isHighlighted ? 0.5 : 1}
                rx={0}
                style={{ transition: 'fill 250ms var(--ease-out), stroke 250ms var(--ease-out)' }}
              />
              <text
                x={CELL_WIDTH / 2}
                y={26}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
                fill={textColor}
                style={{ transition: 'fill 250ms var(--ease-out)', viewTransitionName: activeSymbol === el.symbol ? 'element-symbol' : undefined } as React.CSSProperties}
              >
                {el.symbol}
              </text>
              <text
                x={CELL_WIDTH / 2}
                y={42}
                textAnchor="middle"
                fontSize={8}
                fontFamily="system-ui, sans-serif"
                fill={textColor}
                opacity={0.7}
                style={{ transition: 'fill 250ms var(--ease-out)' }}
              >
                {el.atomicNumber}
              </text>
            </g>
          );
        })}

        {/* ---- Description text below the grid ---- */}
        {selected && lines.length > 0 && (
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={VIEWBOX_H + DESC_Y_OFFSET}
            fontSize={16}
            fill={BLACK}
            showRules
            ruleColor={BLACK}
            maxWidth={DESC_MAX_WIDTH}
            animationStagger={60}
          />
        )}
      </svg>
      </div>
    </PageShell>
  );
}
