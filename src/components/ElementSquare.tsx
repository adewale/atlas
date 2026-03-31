/**
 * ElementSquare — unified small element representation for use inside SVG.
 *
 * Returns a <g> element (not a standalone <svg>) so it can be composed
 * inside any SVG canvas. The caller positions it via x/y or a wrapping
 * transform.
 */
import { useState } from 'react';
import { BLACK, WARM_RED } from '../lib/theme';
import { contrastTextColor } from '../lib/grid';

export interface ElementSquareProps {
  /** Chemical symbol, e.g. "He" */
  symbol: string;
  /** Block colour fill */
  color: string;
  /** Side length in SVG user units (default 24) */
  size?: number;
  /** Show a WARM_RED highlight stroke (e.g. active / selected state) */
  highlighted?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Extra props forwarded to the outer <g> */
  x?: number;
  y?: number;
  /** Optional CSS style applied to the outer <g> */
  style?: React.CSSProperties;
  /** Optional className */
  className?: string;
  /** Optional accessible label for the title element */
  title?: string;
  /** Optional extra props spread onto the <rect> (e.g. role, aria-label) */
  rectProps?: React.SVGProps<SVGRectElement>;
  /** Mouse-enter handler */
  onMouseEnter?: React.MouseEventHandler<SVGGElement>;
  /** Mouse-leave handler */
  onMouseLeave?: React.MouseEventHandler<SVGGElement>;
  /** Pointer-down handler (useful for touch-friendly tooltips) */
  onPointerDown?: React.PointerEventHandler<SVGGElement>;
}

export default function ElementSquare({
  symbol,
  color,
  size = 24,
  highlighted = false,
  onClick,
  x = 0,
  y = 0,
  style,
  className,
  title,
  rectProps,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
}: ElementSquareProps) {
  const [hovered, setHovered] = useState(false);

  const strokeColor = highlighted ? WARM_RED : BLACK;
  const strokeWidth = highlighted ? 2 : hovered ? 2 : 0.5;
  const textFill = contrastTextColor(color);
  // Scale font size proportionally: 8px at size=24
  const fontSize = Math.max(5, Math.round((size / 24) * 8));

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      onPointerDown={onPointerDown}
    >
      {title && <title>{title}</title>}
      <rect
        width={size}
        height={size}
        fill={color}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        {...rectProps}
      />
      <text
        x={size / 2}
        y={size / 2 + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill={textFill}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
      >
        {symbol}
      </text>
    </g>
  );
}
