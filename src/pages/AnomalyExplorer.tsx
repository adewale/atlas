import { useState, useMemo } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
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
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, DIM, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT } from '../lib/theme';
import { VT, vt } from '../lib/transitions';
import { usePretextLines } from '../hooks/usePretextLines';
import IntroBlock from '../components/IntroBlock';
import PretextSvg from '../components/PretextSvg';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { AnomalyData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

/* ------------------------------------------------------------------ */
/* Colour key for anomaly buttons (cycle through Byrne palette)       */
/* ------------------------------------------------------------------ */
const BUTTON_COLORS = [WARM_RED, DEEP_BLUE, MUSTARD, BLACK, WARM_RED];

function buttonColorFor(index: number): string {
  return BUTTON_COLORS[index % BUTTON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Stain origin: first highlighted element's grid position            */
/* ------------------------------------------------------------------ */
function computeStainOrigin(
  highlightedSymbols: Set<string>,
): { col: number; row: number } | null {
  if (highlightedSymbols.size === 0) return null;
  // Use the first highlighted element (lowest atomic number) as origin
  for (const el of allElements) {
    if (highlightedSymbols.has(el.symbol)) {
      const pos = getCellPosition(el);
      return { col: pos.col, row: pos.row };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Intro paragraph                                                    */
/* ------------------------------------------------------------------ */
const INTRO_TEXT =
  'Not all elements follow textbook rules. Drawing on data from PubChem, Wikidata, and Wikipedia, this explorer highlights five families of anomaly — from superheavy synthetic elements that exist for mere milliseconds, to diagonal relationships that cut across groups, to electron configurations that defy the aufbau principle. These exceptions are often explained by relativistic effects, electron\u2013electron repulsion, or the near-degeneracy of energy levels in heavier atoms. Select a category below to see which elements break the rules.';
const INTRO_MAX_W = 760;

/* ------------------------------------------------------------------ */
/* Description text area dimensions                                   */
/* ------------------------------------------------------------------ */
const DESC_MAX_WIDTH = 560;
const DESC_Y_OFFSET = 24;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function AnomalyExplorer() {
  useDocumentTitle('Anomaly Explorer', 'Elements that break the expected periodic trends — diagonal relationships, relativistic effects, and the uniqueness of hydrogen.');
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const { anomalies } = useLoaderData() as { anomalies: AnomalyData[] };
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get('anomaly');
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const setSelectedSlug = (slug: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (slug) next.set('anomaly', slug);
      else next.delete('anomaly');
      return next;
    }, { replace: true });
  };

  const selected = anomalies.find((a) => a.slug === selectedSlug) ?? null;
  const highlightedSet = useMemo(
    () => new Set(selected?.elements ?? []),
    [selected],
  );

  const stainOrigin = useMemo(
    () => computeStainOrigin(highlightedSet),
    [highlightedSet],
  );

  const { lines, lineHeight } = usePretextLines({
    text: selected?.description ?? '',
    maxWidth: DESC_MAX_WIDTH,
  });

  const descSvgHeight = lines.length * lineHeight + 16;
  const totalHeight = VIEWBOX_H + DESC_Y_OFFSET + (selected ? descSvgHeight : 0);

  // Build sections for mobile view
  const anomalySections: Section[] = useMemo(() => {
    return anomalies.map((a, i) => ({
      id: a.slug,
      label: a.label,
      color: buttonColorFor(i),
      items: a.elements.map(sym => {
        const el = allElements.find(e => e.symbol === sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    }));
  }, [anomalies]);

  // ---------------------------------------------------------------------------
  // Mobile: sectioned card layout
  // ---------------------------------------------------------------------------
  if (isMobile) {
    return (
      <PageShell vizNav>
        <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          <IntroBlock text={INTRO_TEXT} color={MUSTARD} dropCapSize={80} />
        </div>

        <SectionedCardList sections={anomalySections} accordion defaultCollapsed={false} />
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop: periodic table grid with filter buttons
  // ---------------------------------------------------------------------------
  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          {/* ---- Intro paragraph with drop cap ---- */}
          <IntroBlock text={INTRO_TEXT} color={MUSTARD} dropCapSize={80} />

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
                    fontWeight: 'bold',
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
      <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${totalHeight}`}
        style={{
          width: '100%',
          minWidth: VIEWBOX_W,
          maxWidth: VIEWBOX_W,
          display: 'block',
          overflow: 'visible',
          touchAction: 'pan-x pan-y pinch-zoom',
        }}
      >
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
          const dist = stainOrigin
            ? Math.abs(pos.col - stainOrigin.col) + Math.abs(pos.row - stainOrigin.row)
            : 0;

          return (
            <g
              key={el.symbol}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => { setActiveSymbol(el.symbol); transitionNavigate(`/elements/${el.symbol}`); }}
            >
              <title>{el.name}</title>
              <rect
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                fill={fill}
                stroke={hasSelection && !isHighlighted ? DIM : BLACK}
                strokeWidth={hasSelection && !isHighlighted ? 0.5 : 1}
                rx={0}
                style={{
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms, stroke 250ms var(--ease-out)`,
                  viewTransitionName: vt(activeSymbol, el.symbol, VT.CELL_BG),
                } as React.CSSProperties}
              />
              <text
                x={CELL_WIDTH / 2}
                y={26}
                textAnchor="middle"
                fontSize={16}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                fill={textColor}
                style={{
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
                  viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL),
                } as React.CSSProperties}
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
                style={{
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
                  viewTransitionName: vt(activeSymbol, el.symbol, VT.NUMBER),
                } as React.CSSProperties}
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
