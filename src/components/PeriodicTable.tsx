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
import KeyboardHelp from './KeyboardHelp';
import InfoTip from './InfoTip';

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

import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, DIM, categoryColor } from '../lib/theme';

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
  const [showHelp, setShowHelp] = useState(false);
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

  // Global keyboard shortcuts: ? for help, / to focus search, Escape to clear/close
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return; }
        if (query) { setQuery(''); return; }
      }
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowHelp((v) => !v);
      }
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [showHelp, query]);

  const handleCellClick = useCallback(
    (symbol: string) => {
      setActiveSymbol(symbol);
      onSelectElement(symbol);
    },
    [setActiveSymbol, onSelectElement],
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <label htmlFor="pt-search" className="sr-only">Search elements</label>
          <input
            ref={searchRef}
            id="pt-search"
            type="search"
            placeholder="Search name or symbol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation();
                setQuery('');
              }
            }}
            aria-describedby="pt-search-desc"
            aria-label={matchCount != null ? `Search elements — ${matchCount} of 118 match` : 'Search elements'}
            style={{
              padding: '8px 12px',
              paddingRight: matchCount != null ? '56px' : '12px',
              border: '1px solid #0f0f0f',
              background: PAPER,
              fontFamily: 'inherit',
              fontSize: '14px',
              minHeight: '44px',
            }}
          />
          {matchCount != null && (
            <span
              aria-live="polite"
              style={{
                position: 'absolute',
                right: '8px',
                fontSize: '11px',
                fontFamily: "'SF Mono', monospace",
                color: matchCount === 0 ? WARM_RED : '#666',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="pt-highlight" style={{ fontSize: '12px', color: '#666' }}>Color by</label>
          <select
            id="pt-highlight"
            value={highlightMode}
            onChange={(e) => setHighlightMode(e.target.value as HighlightMode)}
            style={{
              padding: '8px 12px',
              border: '1px solid #0f0f0f',
              background: PAPER,
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          >
            {HIGHLIGHT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <InfoTip label="Color each cell by group, period, block (s/p/d/f electron orbital), category (metal type), or a numeric property like mass or electronegativity. Darker = higher value in Property mode.">
            <span />
          </InfoTip>
        </div>
        {highlightMode === 'property' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="pt-property" style={{ fontSize: '12px', color: '#666' }}>Property</label>
            <select
              id="pt-property"
              value={property}
              onChange={(e) => setProperty(e.target.value as NumericProperty)}
              style={{
                padding: '8px 12px',
                border: '1px solid #0f0f0f',
                background: PAPER,
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            >
              {PROPERTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <InfoTip label="Mass: atomic weight in daltons. Electronegativity: tendency to attract electrons (Pauling scale). Ionisation energy: energy to remove an electron. Radius: size of the atom in picometres.">
              <span />
            </InfoTip>
          </div>
        )}
        <button
          onClick={() => setShowHelp((v) => !v)}
          aria-label="Keyboard shortcuts"
          aria-expanded={showHelp}
          style={{
            width: '36px',
            height: '36px',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #0f0f0f',
            background: showHelp ? BLACK : PAPER,
            color: showHelp ? PAPER : BLACK,
            fontFamily: "'SF Mono', monospace",
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
          }}
        >
          ?
        </button>
      </div>
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
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
            stroke="#0f0f0f"
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
          stroke="#0f0f0f"
          strokeWidth={0.5}
          opacity={0.2}
          strokeDasharray="4 4"
        />
        {allElements.map((el) => {
          const pos = CELL_POSITIONS.get(el.symbol)!;
          const isActive = el.symbol === activeSymbol;
          const isDimmed = isFiltering && !filteredSymbols.has(el.symbol);
          const fill = isDimmed ? DIM : getCellFill(el, highlightMode, property);
          const textColor = isDimmed ? '#999' : contrastTextColor(fill);
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
                stroke={isActive ? '#9e1c2c' : '#0f0f0f'}
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
