/**
 * Shared periodic table SVG grid — reusable across all pages that
 * render the IUPAC 18-column layout.
 *
 * Each consumer provides a fillFn to colour cells and an onClick handler.
 * The grid handles: cell positioning, load animation, period rules,
 * view transitions, contrast text, and keyboard navigation.
 */
import { memo } from 'react';
import type { ReactNode } from 'react';
import type { GridElement } from '../lib/types';
import { allElements } from '../lib/data';
import {
  getCellPosition,
  contrastTextColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { VT, vt } from '../lib/transitions';
import { BLACK, WARM_RED, STROKE_HAIRLINE, STROKE_MEDIUM } from '../lib/theme';

type PeriodicTableGridProps = {
  /** Determines the fill colour for each element cell. */
  fillFn: (el: GridElement) => string;
  /** Called when an element cell is clicked. */
  onClick: (symbol: string) => void;
  /** Called when an element cell is hovered. */
  onHover?: (symbol: string) => void;
  /** Symbol of the currently active/selected element. */
  activeSymbol?: string | null;
  /** Whether the load stagger animation has completed. */
  hasLoaded?: boolean;
  /** Extra SVG height below the grid (for description text etc.). */
  extraHeight?: number;
  /** Children rendered inside the SVG (overlays, descriptions). */
  children?: ReactNode;
  /** Additional CSS class on the SVG element. */
  className?: string;
  /** Distance-based stagger origin for fill transitions. */
  staggerOrigin?: { col: number; row: number } | null;
  /** Custom stroke for non-active cells. */
  strokeFn?: (el: GridElement) => { color: string; width: number };
};

// Pre-compute cell positions once
const CELL_POSITIONS = new Map(
  allElements.map((el) => [el.symbol, getCellPosition(el)]),
);

const POINTER_STYLE = { cursor: 'pointer' } as const;

type CellProps = {
  el: GridElement;
  x: number;
  y: number;
  fill: string;
  textColor: string;
  isActive: boolean;
  hasLoaded: boolean;
  dist: number;
  strokeColor: string;
  strokeWidth: number;
  onClick: (symbol: string) => void;
  onHover?: (symbol: string) => void;
};

const GridCell = memo(function GridCell({
  el,
  x,
  y,
  fill,
  textColor,
  isActive,
  hasLoaded,
  dist,
  strokeColor,
  strokeWidth,
  onClick,
  onHover,
}: CellProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick(el.symbol)}
      onMouseEnter={onHover ? () => onHover(el.symbol) : undefined}
      role="button"
      aria-label={`${el.symbol} ${el.atomicNumber} ${el.name} ${el.category}`}
      tabIndex={-1}
      style={POINTER_STYLE}
    >
      <title>{`${el.symbol} ${el.atomicNumber} ${el.name}`}</title>
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
          stroke={isActive ? WARM_RED : strokeColor}
          strokeWidth={isActive ? STROKE_MEDIUM : strokeWidth}
          style={{
            transition: `fill 250ms var(--ease-out) ${dist * 8}ms`,
            viewTransitionName: vt(isActive ? el.symbol : null, el.symbol, VT.CELL_BG),
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
            viewTransitionName: vt(isActive ? el.symbol : null, el.symbol, VT.NUMBER),
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
            viewTransitionName: vt(isActive ? el.symbol : null, el.symbol, VT.SYMBOL),
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
          opacity={0.7}
        >
          {el.name.length > 9 ? el.name.slice(0, 8) + '\u2026' : el.name}
        </text>
      </g>
    </g>
  );
});

export default function PeriodicTableGrid({
  fillFn,
  onClick,
  onHover,
  activeSymbol,
  hasLoaded = true,
  extraHeight = 0,
  children,
  className,
  staggerOrigin,
  strokeFn,
}: PeriodicTableGridProps) {
  const totalHeight = VIEWBOX_H + extraHeight;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${totalHeight}`}
      role="img"
      aria-label="Periodic table of elements"
      className={className}
      style={{
        width: '100%',
        minWidth: VIEWBOX_W,
        maxWidth: VIEWBOX_W,
        display: 'block',
        touchAction: 'pan-x pan-y pinch-zoom',
      }}
    >
      {/* Thin rules between periods */}
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
      {/* Dashed rule before f-block */}
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
        const isActive = el.symbol === (activeSymbol ?? null);
        const fill = fillFn(el);
        const textColor = contrastTextColor(fill);
        const dist = staggerOrigin
          ? Math.abs(pos.col - staggerOrigin.col) + Math.abs(pos.row - staggerOrigin.row)
          : 0;
        const stroke = strokeFn
          ? strokeFn(el)
          : { color: BLACK, width: STROKE_HAIRLINE };

        return (
          <GridCell
            key={el.symbol}
            el={el}
            x={pos.x}
            y={pos.y}
            fill={fill}
            textColor={textColor}
            isActive={isActive}
            hasLoaded={hasLoaded}
            dist={dist}
            strokeColor={stroke.color}
            strokeWidth={stroke.width}
            onClick={onClick}
            onHover={onHover}
          />
        );
      })}
      {children}
    </svg>
  );
}
