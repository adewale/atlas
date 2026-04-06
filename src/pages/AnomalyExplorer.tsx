import { useState, useMemo } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { allElements } from '../lib/data';
import { getCellPosition, contrastTextColor, VIEWBOX_H } from '../lib/grid';
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, DIM, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, VIZ_MAX_WIDTH } from '../lib/theme';
import PeriodicTableGrid from '../components/PeriodicTableGrid';
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
const INTRO_MAX_W = VIZ_MAX_WIDTH;

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
      <PeriodicTableGrid
        fillFn={(el) => {
          if (!selected) return PAPER;
          return highlightedSet.has(el.symbol) ? WARM_RED : DIM;
        }}
        strokeFn={(el) => {
          if (selected && !highlightedSet.has(el.symbol)) return { color: DIM, width: 0.5 };
          return { color: BLACK, width: 1 };
        }}
        onClick={(symbol) => { setActiveSymbol(symbol); transitionNavigate(`/elements/${symbol}`); }}
        activeSymbol={activeSymbol}
        staggerOrigin={stainOrigin}
        extraHeight={selected ? DESC_Y_OFFSET + descSvgHeight : 0}
      >
        {/* Description text below the grid */}
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
      </PeriodicTableGrid>
      </div>
    </PageShell>
  );
}
