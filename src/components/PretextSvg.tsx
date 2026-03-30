import type { PositionedLine } from '../lib/pretext';

type PretextSvgProps = {
  lines: PositionedLine[];
  lineHeight: number;
  x?: number;
  y?: number;
  fontSize?: number;
  fill?: string;
  font?: string;
  showRules?: boolean;
  ruleColor?: string;
  maxWidth?: number;
  animationStagger?: number;
  className?: string;
};

/**
 * Renders Pretext-measured lines as positioned SVG <text> elements.
 * Supports thin rules between lines and per-line reveal animation.
 */
export default function PretextSvg({
  lines,
  lineHeight,
  x = 0,
  y = 0,
  fontSize = 16,
  fill = '#0f0f0f',
  showRules = false,
  ruleColor = '#0f0f0f',
  maxWidth,
  animationStagger,
  className,
}: PretextSvgProps) {
  return (
    <g className={className} transform={`translate(${x}, ${y})`}>
      {lines.map((line, i) => {
        const lineY = line.y + lineHeight;
        const staggerDelay = animationStagger != null ? i * animationStagger : undefined;
        return (
          <g key={i}>
            {showRules && i > 0 && maxWidth && (
              <line
                x1={0}
                y1={line.y}
                x2={maxWidth}
                y2={line.y}
                stroke={ruleColor}
                strokeWidth={0.5}
                opacity={0.2}
              />
            )}
            <text
              x={line.x}
              y={lineY}
              fontSize={fontSize}
              fill={fill}
              fontFamily="system-ui, sans-serif"
              style={
                staggerDelay != null
                  ? {
                      opacity: 0,
                      transform: 'translateY(6px)',
                      animation: `folio-line-reveal 300ms var(--ease-out) ${staggerDelay}ms forwards`,
                    }
                  : undefined
              }
            >
              {line.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
