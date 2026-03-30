import { useState, useRef, useEffect, useCallback } from 'react';
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
type NumericProperty = 'mass' | 'electronegativity' | 'ionizationEnergy';

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
  { value: 'ionizationEnergy', label: 'Ionization Energy' },
];

const DEEP_BLUE = '#133e7c';
const WARM_RED = '#9e1c2c';
const MUSTARD = '#c59b1a';
const PAPER = '#f7f2e8';
const BLACK = '#0f0f0f';
const DIM = '#ece7db';

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
    case 'category': {
      const cat = el.category.toLowerCase();
      if (cat.includes('metalloid')) return MUSTARD;
      if (cat.includes('nonmetal') || cat.includes('noble gas')) return WARM_RED;
      return DEEP_BLUE; // metal-containing
    }
    case 'property': {
      const val = el[property];
      if (val == null) return PAPER;
      // Find min/max across all elements for this property
      const values = allElements
        .map((e) => e[property])
        .filter((v): v is number => v != null);
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max === min) return PAPER;
      const t = (val - min) / (max - min);
      // Interpolate from paper to deep blue
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

  const { activeSymbol, setActiveSymbol, onKeyDown } = useGridNavigation({
    onActivate: onSelectElement,
  });

  const filteredSymbols = new Set(searchElements(query).map((e) => e.symbol));
  const isFiltering = query.trim().length > 0;

  // Find focused element for ripple distance calculation
  const focusedElement = allElements.find((e) => e.symbol === activeSymbol);

  useEffect(() => {
    // Trigger load animation
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
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
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label htmlFor="pt-search" className="sr-only">Search elements</label>
          <input
            id="pt-search"
            type="search"
            placeholder="Search name or symbol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby="pt-search-desc"
            style={{
              padding: '8px 12px',
              border: '1px solid #0f0f0f',
              background: PAPER,
              fontFamily: 'inherit',
              fontSize: '14px',
              minHeight: '44px',
            }}
          />
          <span id="pt-search-desc" className="sr-only">
            Filter elements by name or symbol
          </span>
        </div>
        <div>
          <label htmlFor="pt-highlight" className="sr-only">Highlight mode</label>
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
        </div>
        {highlightMode === 'property' && (
          <div>
            <label htmlFor="pt-property" className="sr-only">Property</label>
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
          </div>
        )}
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
        {allElements.map((el) => {
          const pos = getCellPosition(el);
          const isActive = el.symbol === activeSymbol;
          const isDimmed = isFiltering && !filteredSymbols.has(el.symbol);
          const fill = isDimmed ? DIM : getCellFill(el, highlightMode, property);
          const textColor = isDimmed ? '#999' : contrastTextColor(fill);
          const dist = focusedElement ? gridDistance(el, focusedElement) : 0;

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
                  transition: `fill 250ms ease ${dist * 8}ms`,
                }}
              />
              <text
                x={4}
                y={13}
                fontSize={9}
                fill={textColor}
                fontFamily="system-ui, sans-serif"
                style={{ transition: `fill 250ms ease ${dist * 8}ms` }}
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
                style={{ transition: `fill 250ms ease ${dist * 8}ms` }}
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
                style={{ transition: `fill 250ms ease ${dist * 8}ms` }}
              >
                {el.name.length > 9 ? el.name.slice(0, 8) + '…' : el.name}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
