import { useState, useEffect } from 'react';
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
import { BLACK, DEEP_BLUE, WARM_RED, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT } from '../lib/theme';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
export default function PhaseLandscape() {
  useDocumentTitle('Phase Landscape');
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: WARM_RED }}>Phase Landscape at STP</h1>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
          {LEGEND_ITEMS.map((item) => (
            <div key={item.phase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '16px', background: item.color, display: 'inline-block', border: `0.5px solid ${BLACK}` }} />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.phase}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '14px', lineHeight: 1.6, color: BLACK, maxWidth: '600px', marginBottom: '16px' }}>
          {INTRO_TEXT}
        </p>
      </div>

      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${VIEWBOX_H}`}
          role="img"
          aria-label="Periodic table coloured by element phase at standard temperature and pressure"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Periodic table grid */}
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
                    strokeWidth={0.5}
                  />
                  <text
                    x={CELL_WIDTH / 2}
                    y={36}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight="bold"
                    fill={textColor}
                    fontFamily="system-ui, sans-serif"
                    style={{ viewTransitionName: activeSymbol === el.symbol ? 'element-symbol' : undefined } as React.CSSProperties}
                  >
                    {el.symbol}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <p style={{ fontSize: '13px', color: BLACK, opacity: 0.7, marginTop: '12px' }}>
        STP = Standard Temperature and Pressure (0°C, 1 atm). Most elements are solid metals at room temperature.
      </p>
    </PageShell>
  );
}
