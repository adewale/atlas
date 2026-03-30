import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import type { ElementRecord } from '../lib/types';
import { allElements, searchElements } from '../lib/data';
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

// ---------------------------------------------------------------------------
// Highlight modes
// ---------------------------------------------------------------------------
type HighlightMode = 'none' | 'group' | 'period' | 'block' | 'category' | 'property';
type NumericProperty = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'radius';

const HIGHLIGHT_OPTIONS: { value: HighlightMode; label: string }[] = [
  { value: 'none', label: 'None' },
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

import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, DIM, GREY_MID, GREY_LIGHT, GREY_RULE, MONO_FONT, categoryColor } from '../lib/theme';

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
      return interpolateColor(PAPER, DEEP_BLUE, t);
    }
  }
}

function interpolateColor(from: string, to: string, t: number): string {
  const fr = parseInt(from.slice(1, 3), 16);
  const fg = parseInt(from.slice(3, 5), 16);
  const fb = parseInt(from.slice(5, 7), 16);
  const tr = parseInt(to.slice(1, 3), 16);
  const tg = parseInt(to.slice(3, 5), 16);
  const tb = parseInt(to.slice(5, 7), 16);
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Grid distance for ripple delay
// ---------------------------------------------------------------------------
function gridDistance(a: ElementRecord, b: ElementRecord): number {
  const pa = getCellPosition(a);
  const pb = getCellPosition(b);
  return Math.abs(pa.col - pb.col) + Math.abs(pa.row - pb.row);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type PeriodicTableProps = {
  onSelectElement: (symbol: string) => void;
};

export default function PeriodicTable({ onSelectElement }: PeriodicTableProps) {
  const [query, setQuery] = useState('');
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('none');
  const [property, setProperty] = useState<NumericProperty>('mass');
  const [hasLoaded, setHasLoaded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { activeSymbol, setActiveSymbol, onKeyDown } = useGridNavigation({
    onActivate: onSelectElement,
  });

  const { filteredSymbols, isFiltering, matchCount } = useMemo(() => {
    const results = searchElements(query);
    const symbols = new Set(results.map((e) => e.symbol));
    const filtering = query.trim().length > 0;
    return { filteredSymbols: symbols, isFiltering: filtering, matchCount: filtering ? symbols.size : null };
  }, [query]);

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

  // Local keyboard shortcuts: / to focus search, Escape to clear
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

      if (e.key === 'Escape' && query) {
        setQuery('');
        return;
      }
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [query]);

  const handleCellClick = useCallback(
    (symbol: string) => {
      setActiveSymbol(symbol);
      onSelectElement(symbol);
    },
    [setActiveSymbol, onSelectElement],
  );

  return (
    <div>
      {/* Unified filter bar: text filter + colour chips */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Text filter */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <label htmlFor="pt-search" style={{
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: GREY_MID,
            position: 'absolute',
            left: '10px',
            pointerEvents: 'none',
          }}>
            {query ? '' : 'Filter'}
          </label>
          <input
            ref={searchRef}
            id="pt-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation();
                setQuery('');
              }
            }}
            aria-describedby="pt-search-desc"
            aria-label={matchCount != null ? `Filter elements — ${matchCount} of 118 match` : 'Filter elements by name or symbol'}
            style={{
              width: query ? '180px' : '90px',
              padding: query ? '6px 48px 6px 10px' : '6px 10px',
              border: `1.5px solid ${isFiltering ? BLACK : GREY_RULE}`,
              background: PAPER,
              fontFamily: 'inherit',
              fontSize: '13px',
              minHeight: '44px',
              transition: 'width 200ms var(--ease-out), border-color 200ms var(--ease-out)',
            }}
          />
          {matchCount != null && (
            <span
              aria-live="polite"
              style={{
                position: 'absolute',
                right: '8px',
                fontSize: '10px',
                fontFamily: MONO_FONT,
                color: matchCount === 0 ? WARM_RED : GREY_MID,
                pointerEvents: 'none',
              }}
            >
              {matchCount}/{118}
            </span>
          )}
          <span id="pt-search-desc" className="sr-only">
            Filter elements by name or symbol. Press / to focus, Escape to clear.
          </span>
        </div>

        {/* Colour mode chips */}
        {HIGHLIGHT_OPTIONS.map((o) => {
          const isActive = highlightMode === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setHighlightMode(isActive && o.value !== 'none' ? 'none' : o.value)}
              aria-pressed={isActive}
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '6px 10px',
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

        {/* Property sub-selector — appears when Property mode is active */}
        {highlightMode === 'property' && PROPERTY_OPTIONS.map((o) => {
          const isActive = property === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setProperty(o.value)}
              aria-pressed={isActive}
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '6px 10px',
                border: `1.5px solid ${isActive ? DEEP_BLUE : GREY_RULE}`,
                background: isActive ? DEEP_BLUE : 'transparent',
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
      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        role="img"
        aria-label="Periodic table of elements"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          minWidth: VIEWBOX_W,
          maxWidth: VIEWBOX_W,
          touchAction: 'pinch-zoom',
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
            strokeWidth={0.3}
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
          const isDimmed = isFiltering && !filteredSymbols.has(el.symbol);
          const fill = isDimmed ? DIM : getCellFill(el, highlightMode, property);
          const textColor = isDimmed ? GREY_LIGHT : contrastTextColor(fill);
          const dist = focusedPos
            ? Math.abs(pos.col - focusedPos.col) + Math.abs(pos.row - focusedPos.row)
            : 0;

          return (
            <g
              key={el.symbol}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleCellClick(el.symbol)}
              onMouseEnter={() => setActiveSymbol(el.symbol)}
              role="button"
              aria-label={`${el.name}, atomic number ${el.atomicNumber}, ${el.category}`}
              tabIndex={-1}
              style={{
                cursor: 'pointer',
              }}
            >
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
                stroke={isActive ? WARM_RED : BLACK}
                strokeWidth={isActive ? 2 : 0.5}
                style={{
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
                }}
              />
              <text
                x={4}
                y={13}
                fontSize={9}
                fill={textColor}
                fontFamily="system-ui, sans-serif"
                style={{
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
                  viewTransitionName: isActive ? 'element-number' : undefined,
                } as React.CSSProperties}
              >
                {el.atomicNumber}
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
                  transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
                  viewTransitionName: isActive ? 'element-symbol' : undefined,
                } as React.CSSProperties}
              >
                {el.symbol}
              </text>
              <text
                x={CELL_WIDTH / 2}
                y={52}
                textAnchor="middle"
                fontSize={7}
                fill={textColor}
                fontFamily="system-ui, sans-serif"
                style={{ transition: `fill 250ms var(--ease-out) ${dist * 8}ms` }}
              >
                {el.name.length > 9 ? el.name.slice(0, 8) + '…' : el.name}
              </text>
            </g>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
