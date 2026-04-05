import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router';
import type { ElementRecord } from '../lib/types';
import { allElements } from '../lib/data';
import {
  getCellPosition,
  contrastTextColor,
  blockColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { useGridNavigation } from '../hooks/useGridNavigation';
import { VT } from '../lib/transitions';

// ---------------------------------------------------------------------------
// Highlight modes
// ---------------------------------------------------------------------------
type HighlightMode = 'none' | 'group' | 'period' | 'block' | 'category' | 'property';
type NumericProperty = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'radius';

const HIGHLIGHT_OPTIONS: { value: HighlightMode; label: string }[] = [
  { value: 'group', label: 'Group' },
  { value: 'period', label: 'Period' },
  { value: 'block', label: 'Block' },
  { value: 'category', label: 'Category' },
  { value: 'property', label: 'Property' },
];

const PROPERTY_OPTIONS: { value: NumericProperty; label: string }[] = [
  { value: 'mass', label: 'Mass' },
  { value: 'electronegativity', label: 'Electronegativity' },
  { value: 'ionizationEnergy', label: 'Ionisation Energy' },
  { value: 'radius', label: 'Radius' },
];

import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, GREY_MID, GREY_RULE, categoryColor, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, STROKE_HAIRLINE, STROKE_MEDIUM } from '../lib/theme';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from './PretextSvg';
import { useIsMobile } from '../hooks/useIsMobile';

const INTRO_TEXT =
  'One hundred and eighteen elements make up all known matter. Forty are transition metals, 28 occupy the f-block as lanthanides and actinides, and just 7 are noble gases. Use the buttons below to colour the table by group, period, block, category, or numeric property.';
const INTRO_MAX_W = 760;

// Pre-compute cell positions once at module level (they never change)
const CELL_POSITIONS = new Map(allElements.map(el => [el.symbol, getCellPosition(el)]));

// Pre-compute property ranges once at module level (data never changes)
const PROPERTY_RANGES: Record<NumericProperty, { min: number; max: number }> = (() => {
  const keys: NumericProperty[] = ['mass', 'electronegativity', 'ionizationEnergy', 'radius'];
  const ranges = {} as Record<NumericProperty, { min: number; max: number }>;
  for (const key of keys) {
    const values = allElements.map((e) => e[key]).filter((v): v is number => v != null);
    ranges[key] = { min: Math.min(...values), max: Math.max(...values) };
  }
  return ranges;
})();

function getCellFill(el: ElementRecord, mode: HighlightMode, property: NumericProperty): string {
  switch (mode) {
    case 'none':
      return PAPER;
    case 'group':
      return el.group !== null ? (el.group % 2 === 0 ? MUSTARD : DEEP_BLUE) : DEEP_BLUE;
    case 'period':
      return el.period % 2 === 0 ? DEEP_BLUE : WARM_RED;
    case 'block':
      return blockColor(el.block);
    case 'category':
      return categoryColor(el.category);
    case 'property': {
      const val = el[property];
      if (val == null) return PAPER;
      const { min, max } = PROPERTY_RANGES[property];
      if (max === min) return PAPER;
      const t = (val - min) / (max - min);
      return interpolateColor(PAPER_RGB, DEEP_BLUE_RGB, t);
    }
  }
}

// Pre-parse static hex endpoints to avoid repeated parseInt in hot path
function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
const PAPER_RGB = parseHex(PAPER);
const DEEP_BLUE_RGB = parseHex(DEEP_BLUE);

const POINTER_STYLE = { cursor: 'pointer' } as const;

function interpolateColor(fromRgb: [number, number, number], toRgb: [number, number, number], t: number): string {
  const r = Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * t);
  const g = Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * t);
  const b = Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Memoized cell component — only re-renders when its own props change
// ---------------------------------------------------------------------------
type ElementCellProps = {
  symbol: string;
  atomicNumber: number;
  name: string;
  category: string;
  x: number;
  y: number;
  fill: string;
  textColor: string;
  isActive: boolean;
  hasLoaded: boolean;
  dist: number;
  onClick: (symbol: string) => void;
  onHover: (symbol: string) => void;
};

const ElementCell = memo(
  function ElementCell({
    symbol,
    atomicNumber,
    name,
    category,
    x,
    y,
    fill,
    textColor,
    isActive,
    hasLoaded,
    dist,
    onClick,
    onHover,
  }: ElementCellProps) {
    const displayName = name.length > 9 ? name.slice(0, 8) + '\u2026' : name;
    return (
      <g
        transform={`translate(${x}, ${y})`}
        onClick={() => onClick(symbol)}
        onMouseEnter={() => onHover(symbol)}
        role="button"
        aria-label={`${symbol} ${atomicNumber} ${name} ${category}`}
        tabIndex={-1}
        style={POINTER_STYLE}
      >
        <title>{`${symbol} ${atomicNumber} ${name} ${category}`}</title>
        <g
          style={{
            opacity: hasLoaded ? 1 : 0,
            transform: hasLoaded ? 'none' : 'translateY(4px)',
            transition: hasLoaded
              ? `opacity 200ms var(--ease-spring) ${atomicNumber * 4}ms, transform 200ms var(--ease-spring) ${atomicNumber * 4}ms`
              : 'none',
          }}
        >
          <rect
            x={1}
            y={1}
            width={CELL_WIDTH - 2}
            height={CELL_HEIGHT - 2}
            fill={fill}
            stroke={isActive ? WARM_RED : BLACK}
            strokeWidth={isActive ? STROKE_MEDIUM : STROKE_HAIRLINE}
            style={{
              transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
              viewTransitionName: isActive ? VT.CELL_BG : undefined,
            } as React.CSSProperties}
          />
          <text
            x={4}
            y={13}
            fontSize={9}
            fill={textColor}
            fontFamily="system-ui, sans-serif"
            style={{
              fontVariantNumeric: 'tabular-nums',
              viewTransitionName: isActive ? VT.NUMBER : undefined,
            } as React.CSSProperties}
          >
            {atomicNumber}
          </text>
          <text
            x={CELL_WIDTH / 2}
            y={36}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill={textColor}
            fontFamily="system-ui, sans-serif"
            style={{
              viewTransitionName: isActive ? VT.SYMBOL : undefined,
            } as React.CSSProperties}
          >
            {symbol}
          </text>
          <text
            x={CELL_WIDTH / 2}
            y={52}
            textAnchor="middle"
            fontSize={7}
            fill={textColor}
            fontFamily="system-ui, sans-serif"
            style={{
              viewTransitionName: isActive ? VT.NAME : undefined,
            } as React.CSSProperties}
          >
            {displayName}
          </text>
        </g>
      </g>
    );
  },
  (prev, next) =>
    prev.symbol === next.symbol &&
    prev.fill === next.fill &&
    prev.textColor === next.textColor &&
    prev.isActive === next.isActive &&
    prev.hasLoaded === next.hasLoaded &&
    prev.dist === next.dist,
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type PeriodicTableProps = {
  onSelectElement: (symbol: string) => void;
};

export default function PeriodicTable({ onSelectElement }: PeriodicTableProps) {
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightMode = (searchParams.get('highlight') as HighlightMode) || 'none';
  const property = (searchParams.get('property') as NumericProperty) || 'mass';
  const [hasLoaded, setHasLoaded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const introMaxW = isMobile ? 360 : INTRO_MAX_W;
  const { dropCap: introDC, lines: introLines, lineHeight: introLH } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: introMaxW,
    dropCapFont: `80px ${DROP_CAP_FONT}`,
  });
  const DROP_CAP_SIZE = 80;
  const introHeight = Math.max(introLines.length * introLH + 16, DROP_CAP_SIZE + 4);

  const setHighlightMode = useCallback((mode: HighlightMode) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (mode === 'none') {
        next.delete('highlight');
        next.delete('property');
      } else {
        next.set('highlight', mode);
        if (mode === 'property') next.set('property', property);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, property]);

  const setProperty = useCallback((prop: NumericProperty) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('property', prop);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const { activeSymbol, setActiveSymbol, onKeyDown } = useGridNavigation({
    onActivate: onSelectElement,
  });

  // Pre-compute all 118 fills and text colours so cells don't recompute on hover
  const { fillMap, textColorMap } = useMemo(() => {
    const fills = new Map<string, string>();
    const textColors = new Map<string, string>();
    for (const el of allElements) {
      const f = getCellFill(el, highlightMode, property);
      fills.set(el.symbol, f);
      textColors.set(el.symbol, contrastTextColor(f));
    }
    return { fillMap: fills, textColorMap: textColors };
  }, [highlightMode, property]);

  // Find focused element position for ripple distance calculation
  const focusedPos = useMemo(() => {
    if (!activeSymbol) return null;
    return CELL_POSITIONS.get(activeSymbol) ?? null;
  }, [activeSymbol]);

  useEffect(() => {
    // Trigger load animation
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Prefetch shared route data after the table has painted, so the first
  // element click doesn't stall on network requests for groups/anomalies.
  useEffect(() => {
    const prefetch = () => {
      import('../../data/generated/groups.json');
      import('../../data/generated/anomalies.json');
      import('../pages/Element');
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 1000);
    return () => clearTimeout(id);
  }, []);

  const handleCellClick = useCallback(
    (symbol: string) => {
      setActiveSymbol(symbol);
      onSelectElement(symbol);
    },
    [setActiveSymbol, onSelectElement],
  );

  return (
    <div>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
      {/* Intro paragraph with drop cap */}
      <svg
        viewBox={`0 0 ${introMaxW} ${introHeight}`}
        style={{ width: '100%', maxWidth: introMaxW, display: 'block', marginBottom: '12px' }}
      >
        <PretextSvg
          lines={introLines}
          lineHeight={introLH}
          x={0}
          y={0}
          fill={BLACK}
          maxWidth={introMaxW}
          animationStagger={40}
          dropCap={{ fontSize: DROP_CAP_SIZE, fill: BLACK, char: introDC.char }}
        />
      </svg>

      {/* Colour mode chips */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {HIGHLIGHT_OPTIONS.map((o) => {
          const isActive = highlightMode === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setHighlightMode(isActive && o.value !== 'none' ? 'none' : o.value)}
              aria-pressed={isActive}
              style={{
                fontSize: isMobile ? '12px' : '10px',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: isMobile ? '8px 12px' : '6px 10px',
                border: `1.5px solid ${isActive ? BLACK : GREY_RULE}`,
                background: isActive ? BLACK : 'transparent',
                color: isActive ? PAPER : GREY_MID,
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '44px',
                fontFamily: 'inherit',
                transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap), border-color 150ms var(--ease-snap)',
              }}
            >
              {o.label}
            </button>
          );
        })}

      </div>

      {/* Property sub-selector — drops down from the Property button */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: highlightMode === 'property' ? '120px' : '0px',
          opacity: highlightMode === 'property' ? 1 : 0,
          transform: highlightMode === 'property' ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'max-height 250ms var(--ease-in-out), opacity 200ms var(--ease-in-out), transform 250ms var(--ease-in-out), margin-top 250ms var(--ease-in-out)',
          marginTop: highlightMode === 'property' ? '8px' : '0px',
          transformOrigin: 'top right',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {PROPERTY_OPTIONS.map((o) => {
            const isActive = property === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setProperty(o.value)}
                aria-pressed={isActive}
                tabIndex={highlightMode === 'property' ? 0 : -1}
                style={{
                  fontSize: isMobile ? '12px' : '10px',
                  fontWeight: 'bold',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: isMobile ? '8px 12px' : '6px 10px',
                  border: `1.5px solid ${isActive ? BLACK : GREY_RULE}`,
                  background: isActive ? BLACK : 'transparent',
                  color: isActive ? PAPER : GREY_MID,
                  cursor: 'pointer',
                  minHeight: '44px',
                  minWidth: '44px',
                  fontFamily: 'inherit',
                  transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap), border-color 150ms var(--ease-snap)',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
      </div>
      <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom', contain: 'layout style paint' }}>
      <svg
        ref={svgRef}
        className="periodic-table-svg"
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        role="img"
        aria-label="Periodic table of elements"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          minWidth: VIEWBOX_W,
          maxWidth: VIEWBOX_W,
          touchAction: 'pan-x pan-y pinch-zoom',
        }}
      >
        {/* Byrne: thin rules between periods — structure through negative space */}
        {[1, 2, 3, 4, 5, 6].map((period) => (
          <line
            key={`rule-${period}`}
            x1={0}
            y1={period * CELL_HEIGHT}
            x2={18 * CELL_WIDTH}
            y2={period * CELL_HEIGHT}
            stroke={BLACK}
            strokeWidth={0.5}
            opacity={0.15}
          />
        ))}
        {/* Heavier rule before f-block gap — the void speaks */}
        <line
          x1={3 * CELL_WIDTH}
          y1={7 * CELL_HEIGHT + CELL_HEIGHT * 0.5}
          x2={17 * CELL_WIDTH}
          y2={7 * CELL_HEIGHT + CELL_HEIGHT * 0.5}
          stroke={BLACK}
          strokeWidth={0.5}
          opacity={0.2}
          strokeDasharray="4 4"
        />
        {allElements.map((el) => {
          const pos = CELL_POSITIONS.get(el.symbol)!;
          const isActive = el.symbol === activeSymbol;
          const fill = fillMap.get(el.symbol)!;
          const textColor = textColorMap.get(el.symbol)!;
          const dist = focusedPos
            ? Math.abs(pos.col - focusedPos.col) + Math.abs(pos.row - focusedPos.row)
            : 0;

          return (
            <ElementCell
              key={el.symbol}
              symbol={el.symbol}
              atomicNumber={el.atomicNumber}
              name={el.name}
              category={el.category}
              x={pos.x}
              y={pos.y}
              fill={fill}
              textColor={textColor}
              isActive={isActive}
              hasLoaded={hasLoaded}
              dist={dist}
              onClick={handleCellClick}
              onHover={setActiveSymbol}
            />
          );
        })}
      </svg>
      </div>
    </div>
  );
}
