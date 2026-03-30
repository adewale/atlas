import { BLACK, PAPER, GREY_LIGHT, MONO_FONT } from '../lib/theme';

type PropertyBarProps = {
  label: string;
  rank: number;
  total?: number;
  color: string;
  width?: number;
  height?: number;
  animate?: boolean;
  delay?: number;
  value?: number | null;
  unit?: string;
};

/**
 * Horizontal bar showing where an element falls on a 1-N scale.
 * Tufte principle: the bar IS the data, and we label it with the actual
 * measurement so nothing requires a legend or guesswork.
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
  value,
  unit,
}: PropertyBarProps) {
  // rank=1 is highest, so bar should be longest for rank 1
  const fraction = rank > 0 ? (total - rank + 1) / total : 0;
  const barWidth = fraction * width;

  const rankLabel = rank > 0 ? `#${rank} of ${total}` : '';
  const valueLabel = value != null ? `${value}${unit ? ' ' + unit : ''}` : '';

  return (
    <svg width={width + 80} height={height + 14} role="img" aria-label={`${label}: ${valueLabel || '—'}, ranked ${rank} of ${total}`}>
      <text
        x={0}
        y={10}
        fontSize={10}
        fill={BLACK}
        fontFamily={MONO_FONT}
      >
        {label}
      </text>
      <rect
        x={0}
        y={14}
        width={width}
        height={height}
        fill={PAPER}
        stroke={BLACK}
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
      {/* Tufte: value + unit at bar end, rank context below */}
      {rank > 0 && (
        <>
          <text
            x={barWidth + 4}
            y={14 + height - 4}
            fontSize={9}
            fill={BLACK}
            fontFamily={MONO_FONT}
          >
            {valueLabel}
          </text>
          <text
            x={width + 4}
            y={10}
            fontSize={8}
            fill={GREY_LIGHT}
            fontFamily={MONO_FONT}
          >
            {rankLabel}
          </text>
        </>
      )}
    </svg>
  );
}
