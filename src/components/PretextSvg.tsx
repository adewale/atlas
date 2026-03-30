import type { PositionedLine } from '../lib/pretext';
import { BLACK } from '../lib/theme';

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

export type DropCapConfig = {
  fontSize: number;    // e.g. 48
  fill: string;        // block colour
  lineSpan?: number;   // how many body lines it spans (default: computed from fontSize / lineHeight)
};

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
  dropCap?: DropCapConfig;
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
  fill = BLACK,
  showRules = false,
  ruleColor = BLACK,
  maxWidth,
  textAlign = 'left',
  animationStagger,
  className,
  inlineSparkline,
  dropCap,
}: PretextSvgProps) {
  // Resolve target line index for inline sparkline (-1 = last line)
  const sparklineTargetLine =
    inlineSparkline != null
      ? inlineSparkline.lineIndex === -1
        ? lines.length - 1
        : inlineSparkline.lineIndex
      : -1;

  // Drop cap: extract first character from first line, render it large
  const dropCapChar = dropCap && lines.length > 0 ? lines[0].text[0] : null;
  const dropCapLineSpan = dropCap
    ? dropCap.lineSpan ?? Math.ceil(dropCap.fontSize / lineHeight)
    : 0;
  // Estimate drop cap glyph width (~0.65× fontSize for most fonts) + 8px gap
  const dropCapIndent = dropCap ? Math.ceil(dropCap.fontSize * 0.65) + 8 : 0;

  return (
    <g className={className} transform={`translate(${x}, ${y})`}>
      {/* Drop cap initial — large coloured first character */}
      {dropCapChar && dropCap && (
        <text
          x={0}
          y={lines[0].y + dropCap.fontSize * 0.82}
          fontSize={dropCap.fontSize}
          fontWeight="bold"
          fill={dropCap.fill}
          fontFamily="system-ui, sans-serif"
          style={
            animationStagger != null
              ? {
                  opacity: 0,
                  transform: 'translateY(6px)',
                  animation: `folio-line-reveal 400ms var(--ease-out) 0ms forwards`,
                }
              : undefined
          }
        >
          {dropCapChar}
        </text>
      )}
      {lines.map((line, i) => {
        const lineY = line.y + lineHeight;
        const staggerDelay = animationStagger != null ? i * animationStagger : undefined;
        // Offset lines beside the drop cap so text flows around it
        const dropCapOffset = dropCapChar && i < dropCapLineSpan ? dropCapIndent : 0;
        const baseX = line.x + dropCapOffset;
        const lineX =
          textAlign === 'center' && maxWidth
            ? baseX + (maxWidth - line.width) / 2
            : baseX;

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
              {dropCapChar && i === 0 ? line.text.slice(1) : line.text}
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
                  stroke={inlineSparkline!.color || BLACK}
                  strokeWidth={1}
                  opacity={0.6}
                />
                {inlineSparkline!.highlightIndex != null && (
                  <circle
                    cx={sparklineData.dotX}
                    cy={sparklineData.dotY}
                    r={2}
                    fill={inlineSparkline!.color || BLACK}
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
