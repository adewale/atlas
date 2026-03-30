import type { PositionedLine } from '../lib/pretext';

export type InlineSparklineConfig = {
  lineIndex: number; // which line to attach to (-1 = last line)
  values: (number | null)[];
  highlightIndex?: number;
  color?: string;
};

/** Build an SVG polyline points string and highlight coords from sparkline data. */
function buildSparklinePoints(
  values: (number | null)[],
  width: number,
  height: number,
  highlightIndex?: number
): { points: string; dotX: number; dotY: number } | null {
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length < 2) return null;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min || 1;

  const pts: string[] = [];
  let dotX = 0;
  let dotY = 0;

  values.forEach((v, i) => {
    if (v == null) return;
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    pts.push(`${x},${y}`);
    if (i === highlightIndex) {
      dotX = x;
      dotY = y;
    }
  });

  return { points: pts.join(' '), dotX, dotY };
}

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
  textAlign?: 'left' | 'center';
  animationStagger?: number;
  className?: string;
  inlineSparkline?: InlineSparklineConfig;
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
  textAlign = 'left',
  animationStagger,
  className,
  inlineSparkline,
}: PretextSvgProps) {
  // Resolve target line index for inline sparkline (-1 = last line)
  const sparklineTargetLine =
    inlineSparkline != null
      ? inlineSparkline.lineIndex === -1
        ? lines.length - 1
        : inlineSparkline.lineIndex
      : -1;

  return (
    <g className={className} transform={`translate(${x}, ${y})`}>
      {lines.map((line, i) => {
        const lineY = line.y + lineHeight;
        const staggerDelay = animationStagger != null ? i * animationStagger : undefined;
        const lineX =
          textAlign === 'center' && maxWidth
            ? line.x + (maxWidth - line.width) / 2
            : line.x;

        // Inline sparkline rendering for this line
        const MIN_SPARKLINE_WIDTH = 40;
        const SPARKLINE_GAP = 8;
        const SPARKLINE_HEIGHT = 12;
        const showSparkline =
          inlineSparkline != null &&
          maxWidth != null &&
          i === sparklineTargetLine &&
          maxWidth - (lineX + line.width + SPARKLINE_GAP) > MIN_SPARKLINE_WIDTH;

        const sparklineWidth = showSparkline
          ? maxWidth! - (lineX + line.width + SPARKLINE_GAP)
          : 0;

        const sparklineData = showSparkline
          ? buildSparklinePoints(
              inlineSparkline!.values,
              sparklineWidth,
              SPARKLINE_HEIGHT,
              inlineSparkline!.highlightIndex
            )
          : null;

        return (
          <g key={`line-${line.y}`}>
            {showRules && i > 0 && maxWidth && (
              <line
                x1={0}
                y1={line.y}
                x2={maxWidth}
                y2={line.y}
                stroke={ruleColor}
                strokeWidth={0.5}
                opacity={0.2}
                style={
                  staggerDelay != null
                    ? {
                        clipPath: 'inset(0 100% 0 0)',
                        animation: `rule-draw 400ms var(--ease-out) ${staggerDelay}ms forwards`,
                      }
                    : undefined
                }
              />
            )}
            <text
              x={lineX}
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
            {sparklineData && (
              <g
                transform={`translate(${lineX + line.width + SPARKLINE_GAP}, ${lineY - SPARKLINE_HEIGHT + 2})`}
                style={
                  staggerDelay != null
                    ? {
                        opacity: 0,
                        animation: `folio-line-reveal 400ms var(--ease-out) ${staggerDelay + 100}ms forwards`,
                      }
                    : undefined
                }
              >
                <polyline
                  points={sparklineData.points}
                  fill="none"
                  stroke={inlineSparkline!.color || '#0f0f0f'}
                  strokeWidth={1}
                  opacity={0.6}
                />
                {inlineSparkline!.highlightIndex != null && (
                  <circle
                    cx={sparklineData.dotX}
                    cy={sparklineData.dotY}
                    r={2}
                    fill={inlineSparkline!.color || '#0f0f0f'}
                  />
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
