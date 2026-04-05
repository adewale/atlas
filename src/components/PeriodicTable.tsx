import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { GridElement } from '../lib/types';
import { allElements } from '../lib/data';
import {
  getCellPosition,
  blockColor,
} from '../lib/grid';
import { useGridNavigation } from '../hooks/useGridNavigation';
import PeriodicTableGrid from './PeriodicTableGrid';

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

import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, GREY_MID, GREY_RULE, categoryColor, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT } from '../lib/theme';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from './PretextSvg';
import { useIsMobile } from '../hooks/useIsMobile';

const INTRO_TEXT =
  'One hundred and eighteen elements make up all known matter. Forty are transition metals, 28 occupy the f-block as lanthanides and actinides, and just 7 are noble gases. Use the buttons below to colour the table by group, period, block, category, or numeric property.';
const INTRO_MAX_W = 760;

// Pre-compute cell positions once at module level
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

function getCellFill(el: GridElement, mode: HighlightMode, property: NumericProperty): string {
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

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
const PAPER_RGB = parseHex(PAPER);
const DEEP_BLUE_RGB = parseHex(DEEP_BLUE);

function interpolateColor(fromRgb: [number, number, number], toRgb: [number, number, number], t: number): string {
  const r = Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * t);
  const g = Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * t);
  const b = Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

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

  const setPropertyValue = useCallback((prop: NumericProperty) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('property', prop);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const { activeSymbol, setActiveSymbol, onKeyDown } = useGridNavigation({
    onActivate: onSelectElement,
  });

  const fillFn = useCallback(
    (el: ElementRecord) => getCellFill(el, highlightMode, property),
    [highlightMode, property],
  );

  const focusedPos = useMemo(() => {
    if (!activeSymbol) return null;
    return CELL_POSITIONS.get(activeSymbol) ?? null;
  }, [activeSymbol]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Prefetch shared route data after the table has painted
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

      {/* Property sub-selector */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: highlightMode === 'property' ? '120px' : '0px',
          opacity: highlightMode === 'property' ? 1 : 0,
          transform: highlightMode === 'property' ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'max-height 250ms var(--ease-in-out), opacity 200ms var(--ease-in-out), transform 250ms var(--ease-in-out), margin 250ms var(--ease-in-out)',
          marginTop: highlightMode === 'property' ? '4px' : '0px',
          marginBottom: highlightMode === 'property' ? '16px' : '0px',
          transformOrigin: 'top right',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {PROPERTY_OPTIONS.map((o) => {
            const isActive = property === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setPropertyValue(o.value)}
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
      <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom', contain: 'layout style paint' }} onKeyDown={onKeyDown} tabIndex={0}>
        <PeriodicTableGrid
          fillFn={fillFn}
          onClick={handleCellClick}
          onHover={setActiveSymbol}
          activeSymbol={activeSymbol}
          hasLoaded={hasLoaded}
          staggerOrigin={focusedPos}
          className="periodic-table-svg"
        />
      </div>
    </div>
  );
}
