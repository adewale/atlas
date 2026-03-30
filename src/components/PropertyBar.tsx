type PropertyBarProps = {
  label: string;
  rank: number;
  total?: number;
  color: string;
  width?: number;
  height?: number;
  animate?: boolean;
  delay?: number;
};

/**
 * Horizontal bar showing where an element falls on a 1-N scale.
 * Filled in block color against paper background. Byrne-style: the bar IS the data.
 */
export default function PropertyBar({
  label,
  rank,
  total = 118,
  color,
  width = 200,
  height = 18,
  animate = false,
  delay = 0,
}: PropertyBarProps) {
  // rank=1 is highest, so bar should be longest for rank 1
  const fraction = rank > 0 ? (total - rank + 1) / total : 0;
  const barWidth = fraction * width;

  return (
    <svg width={width + 60} height={height + 14} aria-label={`${label}: rank ${rank} of ${total}`}>
      <text
        x={0}
        y={10}
        fontSize={10}
        fill="#0f0f0f"
        fontFamily="'SF Mono', 'Cascadia Code', 'Fira Code', monospace"
      >
        {label}
      </text>
      <rect
        x={0}
        y={14}
        width={width}
        height={height}
        fill="#f7f2e8"
        stroke="#0f0f0f"
        strokeWidth={0.5}
      />
      <rect
        x={0}
        y={14}
        width={barWidth}
        height={height}
        fill={color}
        style={
          animate
            ? {
                clipPath: `inset(0 ${100 - fraction * 100}% 0 0)`,
                animation: `bar-grow 300ms var(--ease-out) ${delay}ms forwards`,
              }
            : undefined
        }
      />
    </svg>
  );
}
