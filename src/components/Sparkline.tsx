type GroupTrendProps = {
  values: (number | null)[];
  highlightIndex: number;
  width?: number;
  height?: number;
  color?: string;
};

/**
 * Group trend sparkline: polyline of property values across the group.
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

  return (
    <svg width={width} height={height} role="img" aria-label={`Group trend: ${values.map((v) => v !== null ? v.toFixed(1) : '—').join(', ')}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      <circle cx={highlightX} cy={highlightY} r={3} fill={color} />
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
      <circle cx={x} cy={height / 2} r={3} fill={color} />
    </svg>
  );
}
