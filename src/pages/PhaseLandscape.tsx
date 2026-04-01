import { useState, useEffect, useMemo } from 'react';
import { allElements } from '../lib/data';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import {
  getCellPosition,
  contrastTextColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { BLACK, DEEP_BLUE, WARM_RED, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT, GREY_MID, STROKE_HAIRLINE } from '../lib/theme';
import { VT, vt } from '../lib/transitions';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

// ---------------------------------------------------------------------------
// Phase → colour mapping (Byrne: hard colour fields, no gradients)
// ---------------------------------------------------------------------------
const PHASE_COLORS: Record<string, string> = {
  solid: BLACK,
  liquid: DEEP_BLUE,
  gas: WARM_RED,
};

function phaseFill(phase: string): string {
  return PHASE_COLORS[phase] ?? BLACK;
}

// ---------------------------------------------------------------------------
// Phase order and labels
// ---------------------------------------------------------------------------
const PHASE_ORDER = ['solid', 'liquid', 'gas'] as const;

const PHASE_LABELS: Record<string, string> = {
  solid: 'Solid',
  liquid: 'Liquid',
  gas: 'Gas',
};

// ---------------------------------------------------------------------------
// Legend and intro constants
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { phase: 'Solid', color: BLACK },
  { phase: 'Liquid', color: DEEP_BLUE },
  { phase: 'Gas', color: WARM_RED },
];

const INTRO_TEXT =
  'At standard temperature and pressure, only 2 elements are liquid — mercury (Hg) and bromine (Br). Just 11 elements exist as gases, all nonmetals or noble gases. The remaining 105 elements are solid, the vast majority of which are metals.';

const SVG_WIDTH = VIEWBOX_W;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const INTRO_MAX_W = VIEWBOX_W;

export default function PhaseLandscape() {
  useDocumentTitle('Phase Landscape', 'Melting and boiling points of all 118 elements visualised as a landscape, coloured by block.');
  const isMobile = useIsMobile();
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: isMobile ? 360 : INTRO_MAX_W,
    dropCapFont: `80px ${DROP_CAP_FONT}`,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Build sections for mobile view
  const phaseSections: Section[] = useMemo(() => {
    const grouped = new Map<string, { symbol: string; description: string }[]>();
    for (const phase of PHASE_ORDER) {
      grouped.set(phase, []);
    }
    for (const el of allElements) {
      const phase = el.phase?.toLowerCase() ?? 'solid';
      const list = grouped.get(phase);
      if (list) {
        list.push({ symbol: el.symbol, description: el.name });
      }
    }
    return PHASE_ORDER.map(phase => ({
      id: phase,
      label: PHASE_LABELS[phase],
      color: PHASE_COLORS[phase],
      items: grouped.get(phase) ?? [],
    }));
  }, []);

  const DROP_CAP_SIZE = 80;
  const introHeight = Math.max(lines.length * lineHeight + 16, DROP_CAP_SIZE + 4);

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: WARM_RED, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Phase Landscape at STP</h1>

        <svg
          width="100%"
          viewBox={`0 0 ${isMobile ? 360 : INTRO_MAX_W} ${introHeight}`}
          style={{ display: 'block', marginBottom: '12px' }}
        >
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            fill={BLACK}
            maxWidth={isMobile ? 360 : INTRO_MAX_W}
            animationStagger={40}
            dropCap={{ fontSize: 80, fill: WARM_RED, char: introDC.char }}
          />
        </svg>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
            {LEGEND_ITEMS.map((item) => (
              <div key={item.phase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', height: '16px', background: item.color, display: 'inline-block', border: `0.5px solid ${BLACK}` }} />
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.phase}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isMobile ? (
        <SectionedCardList sections={phaseSections} accordion defaultCollapsed={false} />
      ) : (
        <>
          <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${VIEWBOX_H}`}
              role="img"
              aria-label="Periodic table coloured by element phase at standard temperature and pressure"
              style={{
                width: '100%',
                minWidth: SVG_WIDTH,
                maxWidth: SVG_WIDTH,
                touchAction: 'pan-x pan-y pinch-zoom',
              }}
            >
              {allElements.map((el) => {
                const pos = getCellPosition(el);
                const fill = phaseFill(el.phase);
                const textColor = contrastTextColor(fill);

                return (
                  <g
                    key={el.symbol}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    role="button"
                    aria-label={`${el.symbol} — ${el.name}, ${el.phase} at STP`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setActiveSymbol(el.symbol); transitionNavigate(`/element/${el.symbol}`); }}
                  >
                    <title>{el.name}</title>
                    <g
                      style={{
                        opacity: hasLoaded ? 1 : 0,
                        transform: hasLoaded ? 'none' : 'translateY(4px)',
                        transition: hasLoaded
                          ? `opacity 200ms var(--ease-spring) ${el.atomicNumber * 4}ms, transform 200ms var(--ease-spring) ${el.atomicNumber * 4}ms`
                          : 'none',
                      }}
                    >
                      <rect
                        x={1}
                        y={1}
                        width={CELL_WIDTH - 2}
                        height={CELL_HEIGHT - 2}
                        fill={fill}
                        stroke={BLACK}
                        strokeWidth={STROKE_HAIRLINE}
                        style={{ transition: 'fill 250ms var(--ease-out)', viewTransitionName: vt(activeSymbol, el.symbol, VT.CELL_BG) } as React.CSSProperties}
                      />
                      <text
                        x={CELL_WIDTH / 2}
                        y={36}
                        textAnchor="middle"
                        fontSize={16}
                        fontWeight="bold"
                        fill={textColor}
                        fontFamily="system-ui, sans-serif"
                        style={{ transition: 'fill 250ms var(--ease-out)', viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL) } as React.CSSProperties}
                      >
                        {el.symbol}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          <p style={{ fontSize: '13px', color: GREY_MID, marginTop: '12px' }}>
            STP = Standard Temperature and Pressure (0°C, 1 atm). Most elements are solid metals at room temperature.
          </p>
        </>
      )}
    </PageShell>
  );
}
