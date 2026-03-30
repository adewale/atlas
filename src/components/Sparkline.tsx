import { useRef, useEffect, useState } from 'react';

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
  color = '#0f0f0f',
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
  color = '#0f0f0f',
}: RankDotProps) {
  if (rank <= 0) return null;
  // rank 1 = rightmost (highest), rank N = leftmost
  const x = ((total - rank) / (total - 1)) * (width - 4) + 2;

  return (
    <svg width={width} height={height} role="img" aria-label={`Rank ${rank} of ${total}`}>
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#ccc" strokeWidth={0.5} />
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
