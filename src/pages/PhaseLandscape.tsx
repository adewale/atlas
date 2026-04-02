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
import { BLACK, DEEP_BLUE, WARM_RED, MUSTARD, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT, GREY_MID, GREY_LIGHT, STROKE_HAIRLINE } from '../lib/theme';
import { VT, vt } from '../lib/transitions';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';
import { phaseAtTemperature } from '../lib/phase';
import type { Phase } from '../lib/phase';

// ---------------------------------------------------------------------------
// Phase → colour mapping (Byrne: hard colour fields, no gradients)
// ---------------------------------------------------------------------------
const PHASE_COLORS: Record<Phase, string> = {
  solid: BLACK,
  liquid: DEEP_BLUE,
  gas: WARM_RED,
  unknown: GREY_LIGHT,
};

// ---------------------------------------------------------------------------
// Phase order and labels
// ---------------------------------------------------------------------------
const PHASE_ORDER: Phase[] = ['solid', 'liquid', 'gas', 'unknown'];

const PHASE_LABELS: Record<Phase, string> = {
  solid: 'Solid',
  liquid: 'Liquid',
  gas: 'Gas',
  unknown: 'Unknown',
};

// ---------------------------------------------------------------------------
// Temperature constants
// ---------------------------------------------------------------------------
const DEFAULT_TEMP = 273; // STP in Kelvin
const TEMP_MIN = 0;
const TEMP_MAX = 6000;
const TEMP_STEP = 10;

/** Notable temperature landmarks for the slider. */
const TEMP_TICKS = [
  { k: 0, label: '0 K' },
  { k: 273, label: 'STP' },
  { k: 373, label: 'H₂O boils' },
  { k: 1811, label: 'Fe melts' },
  { k: 3695, label: 'W melts' },
  { k: 5778, label: 'Sun surface' },
];

// ---------------------------------------------------------------------------
// Legend and intro constants
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { phase: 'Solid', color: BLACK },
  { phase: 'Liquid', color: DEEP_BLUE },
  { phase: 'Gas', color: WARM_RED },
  { phase: 'Unknown', color: GREY_LIGHT },
];

const INTRO_TEXT =
  'At standard temperature and pressure, only 2 elements are liquid — mercury (Hg) and bromine (Br). Just 11 elements exist as gases, all nonmetals or noble gases. The remaining 105 elements are solid, the vast majority of which are metals.';

const SVG_WIDTH = VIEWBOX_W;
const INTRO_MAX_W = VIEWBOX_W;

// ---------------------------------------------------------------------------
// Slider styles
// ---------------------------------------------------------------------------
const sliderContainerStyle: React.CSSProperties = {
  marginBottom: 16,
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: GREY_MID,
  outline: 'none',
  cursor: 'pointer',
};

const tempDisplayStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 8,
};

const tempValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 'bold',
  fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
  color: BLACK,
};

const tempUnitStyle: React.CSSProperties = {
  fontSize: 13,
  color: GREY_MID,
};

const tickContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 4,
  fontSize: 9,
  color: GREY_MID,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PhaseLandscape() {
  useDocumentTitle('Phase Landscape', 'Melting and boiling points of all 118 elements visualised as a landscape, coloured by block.');
  const isMobile = useIsMobile();
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tempK, setTempK] = useState(DEFAULT_TEMP);

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: isMobile ? 360 : INTRO_MAX_W,
    dropCapFont: `80px ${DROP_CAP_FONT}`,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Compute phase for each element at current temperature
  const elementPhases = useMemo(() => {
    const map = new Map<string, Phase>();
    for (const el of allElements) {
      map.set(el.symbol, phaseAtTemperature(tempK, el.meltingPoint, el.boilingPoint));
    }
    return map;
  }, [tempK]);

  // Build sections for mobile view
  const phaseSections: Section[] = useMemo(() => {
    const grouped = new Map<Phase, { symbol: string; description: string }[]>();
    for (const phase of PHASE_ORDER) {
      grouped.set(phase, []);
    }
    for (const el of allElements) {
      const phase = elementPhases.get(el.symbol) ?? 'unknown';
      grouped.get(phase)!.push({ symbol: el.symbol, description: el.name });
    }
    return PHASE_ORDER
      .map(phase => ({
        id: phase,
        label: PHASE_LABELS[phase],
        color: PHASE_COLORS[phase],
        items: grouped.get(phase) ?? [],
      }))
      .filter(s => s.items.length > 0);
  }, [elementPhases]);

  const tempC = tempK - 273;
  const DROP_CAP_SIZE = 80;
  const introHeight = Math.max(lines.length * lineHeight + 16, DROP_CAP_SIZE + 4);

  const isAtSTP = tempK === DEFAULT_TEMP;

  // ---- Temperature slider (shared between mobile and desktop) ----
  const temperatureSlider = (
    <div style={sliderContainerStyle}>
      <div style={tempDisplayStyle}>
        <div data-testid="temp-display">
          <span style={tempValueStyle}>{tempK} K</span>
          <span style={tempUnitStyle}> / {tempC}°C</span>
        </div>
        {!isAtSTP && (
          <button
            onClick={() => setTempK(DEFAULT_TEMP)}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              background: 'none',
              border: `1px solid ${BLACK}`,
              padding: '2px 8px',
              cursor: 'pointer',
              color: BLACK,
            }}
          >
            Reset to STP
          </button>
        )}
      </div>
      <input
        type="range"
        min={TEMP_MIN}
        max={TEMP_MAX}
        step={TEMP_STEP}
        value={tempK}
        onChange={(e) => setTempK(Number(e.target.value))}
        aria-label="Temperature in Kelvin"
        style={sliderStyle}
      />
      <div style={tickContainerStyle}>
        {TEMP_TICKS.map(t => (
          <span key={t.k}>{t.label}</span>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell vizNav>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: WARM_RED, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>
          Phase Landscape{isAtSTP ? ' at STP' : ''}
        </h1>

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

        {temperatureSlider}

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
                const phase = elementPhases.get(el.symbol) ?? 'unknown';
                const fill = PHASE_COLORS[phase];
                const textColor = contrastTextColor(fill);

                return (
                  <g
                    key={el.symbol}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    role="button"
                    aria-label={`${el.symbol} — ${el.name}, ${phase} at ${tempK} K`}
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
            {isAtSTP
              ? 'STP = Standard Temperature and Pressure (0°C, 1 atm). Most elements are solid metals at room temperature.'
              : `Showing element phases at ${tempK} K (${tempC}°C). Drag the slider to explore how matter changes state.`}
          </p>
        </>
      )}
    </PageShell>
  );
}
