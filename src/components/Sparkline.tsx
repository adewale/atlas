import { useRef, useEffect, useState } from 'react';
import { BLACK, DEEP_BLUE, WARM_RED, PAPER, GREY_LIGHT, GREY_RULE } from '../lib/theme';

type GroupTrendProps = {
  values: (number | null)[];
  highlightIndex: number;
  width?: number;
  height?: number;
  color?: string;
};

/**
 * Group trend sparkline: polyline of property values across the group.
 * Animates with stroke-dashoffset draw effect on mount.
 */
export function GroupTrendSparkline({
  values,
  highlightIndex,
  width = 300,
  height = 40,
  color = BLACK,
}: GroupTrendProps) {
  const validValues = values.filter((v): v is number => v != null);
  if (validValues.length < 2) return null;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min || 1;

  const points: string[] = [];
  let highlightX = 0;
  let highlightY = 0;

  values.forEach((v, i) => {
    if (v == null) return;
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    points.push(`${x},${y}`);
    if (i === highlightIndex) {
      highlightX = x;
      highlightY = y;
    }
  });

  const polyRef = useRef<SVGPolylineElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (polyRef.current) {
      const len = polyRef.current.getTotalLength();
      setPathLength(len);
    }
  }, [values, width, height]);

  return (
    <svg width={width} height={height} role="img" aria-label={`Group trend: ${values.map((v) => v !== null ? v.toFixed(1) : '—').join(', ')}`}>
      <polyline
        ref={polyRef}
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        style={
          pathLength > 0
            ? {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength,
                animation: `sparkline-draw 600ms var(--ease-out) 200ms forwards`,
              } as React.CSSProperties
            : undefined
        }
      />
      <circle
        cx={highlightX}
        cy={highlightY}
        r={3}
        fill={color}
        style={{
          opacity: 0,
          animation: 'folio-line-reveal 200ms var(--ease-out) 700ms forwards',
        }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Group phase strip: phase-of-matter at STP for each element in the group
// ---------------------------------------------------------------------------
const PHASE_COLORS: Record<string, string> = {
  solid: BLACK,
  liquid: DEEP_BLUE,
  gas: WARM_RED,
};

type GroupPhaseStripProps = {
  phases: (string | null)[];
  symbols: string[];
  highlightIndex: number;
  width?: number;
  height?: number;
};

/**
 * Compact strip showing phase-of-matter at STP for each group member.
 * Solid = black square, Liquid = blue, Gas = red, Unknown = outline only.
 */
export function GroupPhaseStrip({
  phases,
  symbols,
  highlightIndex,
  width = 300,
  height = 24,
}: GroupPhaseStripProps) {
  if (phases.length === 0) return null;
  const cellW = Math.min(width / phases.length, 28);
  const cellH = height - 4;
  const totalW = cellW * phases.length;

  return (
    <svg
      width={totalW}
      height={height}
      role="img"
      aria-label={`Phases at STP: ${symbols.map((s, i) => `${s} ${phases[i] ?? 'unknown'}`).join(', ')}`}
    >
      {phases.map((phase, i) => {
        const x = i * cellW;
        const isHighlight = i === highlightIndex;
        const color = phase ? PHASE_COLORS[phase] ?? GREY_LIGHT : GREY_LIGHT;
        return (
          <a key={i} href={`/element/${symbols[i]}`} style={{ cursor: 'pointer' }}>
            <rect
              x={x + 1}
              y={2}
              width={cellW - 2}
              height={cellH}
              fill={phase ? color : 'none'}
              stroke={isHighlight ? BLACK : color}
              strokeWidth={isHighlight ? 1.5 : 0.5}
              opacity={phase ? (isHighlight ? 1 : 0.6) : 0.3}
              style={{
                opacity: 0,
                animation: `folio-line-reveal 200ms var(--ease-out) ${150 + i * 30}ms forwards`,
              }}
            />
            <text
              x={x + cellW / 2}
              y={height / 2 + 3}
              textAnchor="middle"
              fontSize={8}
              fontFamily="system-ui"
              fill={phase ? PAPER : GREY_LIGHT}
              style={{
                opacity: 0,
                animation: `folio-line-reveal 200ms var(--ease-out) ${200 + i * 30}ms forwards`,
              }}
            >
              {symbols[i]}
            </text>
          </a>
        );
      })}
    </svg>
  );
}

type RankDotProps = {
  rank: number;
  total?: number;
  width?: number;
  height?: number;
  color?: string;
};

/**
 * Rank dot sparkline: single dot positioned on a 1-N scale.
 * Dot scales in on mount.
 */
export function RankDotSparkline({
  rank,
  total = 118,
  width = 40,
  height = 12,
  color = BLACK,
}: RankDotProps) {
  if (rank <= 0) return null;
  // rank 1 = rightmost (highest), rank N = leftmost
  const x = ((total - rank) / (total - 1)) * (width - 4) + 2;

  return (
    <svg width={width} height={height} role="img" aria-label={`Rank ${rank} of ${total}`}>
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={GREY_RULE} strokeWidth={0.5} />
      <circle
        cx={x}
        cy={height / 2}
        r={3}
        fill={color}
        style={{
          opacity: 0,
          animation: 'folio-line-reveal 200ms var(--ease-out) 300ms forwards',
        }}
      />
    </svg>
  );
}
