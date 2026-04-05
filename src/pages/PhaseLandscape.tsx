import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { allElements } from '../lib/data';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { VIEWBOX_W, CELL_WIDTH, CELL_HEIGHT } from '../lib/grid';
import { BLACK, DEEP_BLUE, WARM_RED, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, GREY_MID, GREY_LIGHT, GREY_RULE, PAPER, STROKE_THIN, MONO_FONT } from '../lib/theme';
import PeriodicTableGrid from '../components/PeriodicTableGrid';
import IntroBlock from '../components/IntroBlock';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import MarginNote from '../components/MarginNote';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';
import { phaseAtTemperature } from '../lib/phase';
import type { Phase } from '../lib/phase';

// ---------------------------------------------------------------------------
// Phase → colour mapping
// ---------------------------------------------------------------------------
const PHASE_COLORS: Record<Phase, string> = {
  solid: BLACK,
  liquid: DEEP_BLUE,
  gas: WARM_RED,
  unknown: GREY_LIGHT,
};

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
const DEFAULT_TEMP = 273;
const TEMP_MIN = 0;
const TEMP_MAX = 6000;

/** Landmark temperatures — the "story stops".
 *  Minimum gap ~15% of axis to prevent label overlap at 375px. */
const LANDMARKS = [
  { k: 273, label: 'STP (0 °C)', color: BLACK },
  { k: 1811, label: 'Fe melts', color: BLACK },
  { k: 3695, label: 'W melts', color: BLACK },
  { k: 5778, label: '☉ surface', color: WARM_RED },
];

// ---------------------------------------------------------------------------
// Pre-compute sparkline: count of phase transitions at each temperature
// ---------------------------------------------------------------------------
const SPARKLINE_BINS = 120;
const BIN_WIDTH = TEMP_MAX / SPARKLINE_BINS;

function buildTransitionSparkline(): number[] {
  const transitions: number[] = [];
  for (const el of allElements) {
    if (el.meltingPoint != null) transitions.push(el.meltingPoint);
    if (el.boilingPoint != null) transitions.push(el.boilingPoint);
  }
  const counts = new Array(SPARKLINE_BINS).fill(0);
  for (const t of transitions) {
    const bin = Math.min(Math.floor(t / BIN_WIDTH), SPARKLINE_BINS - 1);
    counts[bin]++;
  }
  return counts;
}

const SPARKLINE_DATA = buildTransitionSparkline();
const SPARKLINE_MAX = Math.max(...SPARKLINE_DATA);

// ---------------------------------------------------------------------------
// Legend items
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { phase: 'Solid', color: BLACK },
  { phase: 'Liquid', color: DEEP_BLUE },
  { phase: 'Gas', color: WARM_RED },
  { phase: 'Unknown', color: GREY_LIGHT },
];

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'At standard temperature and pressure, only 2 elements are liquid — mercury (Hg) and bromine (Br). Just 11 elements exist as gases, all nonmetals or noble gases. The remaining 105 elements are solid, the vast majority of which are metals.';

const SVG_WIDTH = VIEWBOX_W;
const INTRO_MAX_W = 760;

// ---------------------------------------------------------------------------
// Sparkline Ruler constants
// ---------------------------------------------------------------------------
const SPARK_H = 24;
const SPARK_Y = 0;
const SVG_RULER_H = SPARK_H + 6; // sparkline + baseline + cap

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PhaseLandscape() {
  useDocumentTitle('Phase Landscape', 'Melting and boiling points of all 118 elements visualised as a landscape, coloured by block.');
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tempK, setTempK] = useState(DEFAULT_TEMP);
  const rulerRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);


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

  // Phase counts for the ruler annotation
  const phaseCounts = useMemo(() => {
    const counts: Record<Phase, number> = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
    for (const phase of elementPhases.values()) {
      counts[phase]++;
    }
    return counts;
  }, [elementPhases]);

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
  const isAtSTP = tempK === DEFAULT_TEMP;

  // ---- Ruler interaction: convert pointer position to temperature ----
  const tempFromPointer = useCallback((clientX: number) => {
    const svg = rulerRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const t = Math.round((x / rect.width) * TEMP_MAX / 10) * 10;
    setTempK(Math.max(TEMP_MIN, Math.min(TEMP_MAX, t)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    tempFromPointer(e.clientX);
  }, [tempFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    tempFromPointer(e.clientX);
  }, [tempFromPointer]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Snap to landmark
  const snapToLandmark = useCallback((k: number) => {
    setTempK(k);
  }, []);

  // ---- Ruler width adapts to context ----
  const rulerWidth = isMobile ? 360 : 700;

  // ---- Sparkline path ----
  const sparklinePath = useMemo(() => {
    const points = SPARKLINE_DATA.map((count, i) => {
      const x = (i / SPARKLINE_BINS) * rulerWidth;
      const y = SPARK_Y + SPARK_H - (count / SPARKLINE_MAX) * SPARK_H;
      return `${x},${y}`;
    });
    // Close the area path
    return `M0,${SPARK_Y + SPARK_H} L${points.join(' L')} L${rulerWidth},${SPARK_Y + SPARK_H} Z`;
  }, [rulerWidth]);

  // ---- Cursor x position ----
  const cursorX = (tempK / TEMP_MAX) * rulerWidth;

  // ---- Phase count annotation ----
  const phaseAnnotation = [
    phaseCounts.solid > 0 ? `${phaseCounts.solid} solid` : null,
    phaseCounts.liquid > 0 ? `${phaseCounts.liquid} liquid` : null,
    phaseCounts.gas > 0 ? `${phaseCounts.gas} gas` : null,
    phaseCounts.unknown > 0 ? `${phaseCounts.unknown} unknown` : null,
  ].filter(Boolean).join(' · ');

  // ---- Temperature ruler ----
  const temperatureRuler = (
    <div style={{ marginBottom: 16 }}>
      {/* Temperature readout + phase counts */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span data-testid="temp-display" style={{
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: MONO_FONT,
          fontVariantNumeric: 'tabular-nums',
          color: BLACK,
          minWidth: '12ch',
          display: 'inline-block',
        }}>
          {tempK} K <span style={{ fontWeight: 'normal', color: GREY_MID, fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>/ {tempC}°C</span>
        </span>
        <button
          onClick={() => setTempK(DEFAULT_TEMP)}
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'none',
            border: `1px solid ${BLACK}`,
            padding: '2px 8px',
            cursor: isAtSTP ? 'default' : 'pointer',
            color: BLACK,
            visibility: isAtSTP ? 'hidden' : 'visible',
          }}
        >
          STP
        </button>
      </div>

      <div style={{
        fontSize: 11,
        color: GREY_MID,
        marginBottom: 6,
        letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <div>{phaseAnnotation}</div>
        <div style={{ opacity: 0.7 }}>peaks show where elements change state</div>
      </div>

      {/* Sparkline SVG — just the chart, no text labels */}
      <svg
        ref={rulerRef}
        viewBox={`0 0 ${rulerWidth} ${SVG_RULER_H}`}
        preserveAspectRatio="none"
        width="100%"
        style={{
          display: 'block',
          height: SVG_RULER_H,
          cursor: 'ew-resize',
          touchAction: 'none',
          userSelect: 'none',
        }}
        aria-label="Temperature ruler — drag or tap to change temperature"
        role="slider"
        aria-valuemin={TEMP_MIN}
        aria-valuemax={TEMP_MAX}
        aria-valuenow={tempK}
        aria-valuetext={`${tempK} Kelvin`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Sparkline area fill */}
        <path d={sparklinePath} fill={GREY_RULE} opacity={0.5} />

        {/* Baseline */}
        <line
          x1={0} y1={SPARK_Y + SPARK_H}
          x2={rulerWidth} y2={SPARK_Y + SPARK_H}
          stroke={BLACK} strokeWidth={STROKE_THIN}
        />

        {/* Landmark tick marks on baseline */}
        {LANDMARKS.map(lm => {
          const x = (lm.k / TEMP_MAX) * rulerWidth;
          return (
            <g key={lm.k} onClick={(e) => { e.stopPropagation(); snapToLandmark(lm.k); }} style={{ cursor: 'pointer' }}>
              <rect
                x={x - 3} y={SPARK_Y + SPARK_H - 3}
                width={6} height={6}
                fill={lm.color}
              />
            </g>
          );
        })}

        {/* Cursor — vertical rule with square cap */}
        <line
          x1={cursorX} y1={0}
          x2={cursorX} y2={SPARK_Y + SPARK_H}
          stroke={BLACK} strokeWidth={1.5}
          style={{ pointerEvents: 'none' }}
        />
        <rect
          x={cursorX - 3} y={SPARK_Y + SPARK_H}
          width={6} height={4}
          fill={BLACK}
          style={{ pointerEvents: 'none' }}
        />
      </svg>

      {/* Landmark labels — rendered as HTML so they're always readable */}
      <div style={{ position: 'relative', height: 16, marginTop: 2 }}>
        {LANDMARKS.map((lm, i) => {
          const pct = (lm.k / TEMP_MAX) * 100;
          // First label: align left edge to marker; last: align right edge
          const isFirst = i === 0;
          const isLast = i === LANDMARKS.length - 1;
          const anchor = isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)';
          return (
            <button
              key={lm.k}
              onClick={() => snapToLandmark(lm.k)}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                transform: anchor,
                fontSize: 10,
                color: GREY_MID,
                background: 'none',
                border: 'none',
                padding: '0 2px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {lm.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: INTRO_MAX_W, position: 'relative' }}>
        {!isMobile && (
          <MarginNote label="Legend" color={WARM_RED} top={80}>
            {LEGEND_ITEMS.map((item) => (
              <div key={item.phase} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '20px', height: '14px', background: item.color, display: 'inline-block', border: `0.5px solid ${BLACK}`, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.phase}</span>
              </div>
            ))}
          </MarginNote>
        )}
        <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          <IntroBlock text={INTRO_TEXT} color={WARM_RED} dropCapSize={80} />

          {temperatureRuler}
        </div>
      </div>

      {isMobile ? (
        <SectionedCardList sections={phaseSections} accordion defaultCollapsed={false} />
      ) : (
        <>
          <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            <PeriodicTableGrid
              fillFn={(el) => PHASE_COLORS[elementPhases.get(el.symbol) ?? 'unknown']}
              onClick={(symbol) => { setActiveSymbol(symbol); transitionNavigate(`/elements/${symbol}`); }}
              activeSymbol={activeSymbol}
              hasLoaded={hasLoaded}
            />
          </div>

          <p style={{ fontSize: '13px', color: GREY_MID, marginTop: '12px', fontVariantNumeric: 'tabular-nums' }}>
            {isAtSTP
              ? 'STP = Standard Temperature and Pressure (0°C, 1 atm). Most elements are solid metals at room temperature.'
              : `Showing element phases at ${tempK} K (${tempC}°C). Drag the ruler to explore how matter changes state.`}
          </p>
        </>
      )}
    </PageShell>
  );
}
