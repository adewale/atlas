import { Link } from 'react-router';
import type { ElementRecord } from '../lib/types';
import { blockColor, contrastTextColor } from '../lib/grid';
import { fitLabel, measureLines } from '../lib/pretext';

const CARD_W = 100;
const CARD_H = 80;
const GAP = 4;
const NAME_FONT = '8px system-ui';
const NAME_MAX_W = CARD_W - 12; // 6px padding each side
const CAPTION_FONT = 'bold 16px system-ui, sans-serif';
const CAPTION_PADDING = 12;

function truncateToFit(name: string, font: string, maxWidth: number): string {
  if (fitLabel(name, font, maxWidth)) return name;
  for (let i = name.length - 1; i > 0; i--) {
    const truncated = name.slice(0, i) + '\u2026';
    if (fitLabel(truncated, font, maxWidth)) return truncated;
  }
  return name[0] + '\u2026';
}

type AtlasPlateProps = {
  elements: ElementRecord[];
  caption: string;
  captionColor?: string;
  propertyKey?: string;
  columns?: number;
};

/**
 * SVG card grid for element sets.
 * Each card shows symbol, atomic number, and one property value.
 * Caption strip with solid color band behind Pretext-measured caption.
 * Columns: 4 desktop, 2 mobile (passed by parent or default).
 */
export default function AtlasPlate({
  elements,
  caption,
  captionColor = '#0f0f0f',
  propertyKey = 'mass',
  columns = 4,
}: AtlasPlateProps) {
  const cols = columns;
  const rows = Math.ceil(elements.length / cols);
  const gridW = cols * (CARD_W + GAP) - GAP;

  // Measure caption text with Pretext
  const captionLines = measureLines(caption, CAPTION_FONT, gridW - CAPTION_PADDING * 2, 20);
  const captionTextH = captionLines.length * 20;
  const captionH = captionTextH + CAPTION_PADDING * 2;

  const gridH = rows * (CARD_H + GAP) - GAP;
  const totalH = captionH + 8 + gridH;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width={gridW}
        height={totalH}
        viewBox={`0 0 ${gridW} ${totalH}`}
        role="img"
        aria-label={caption}
        style={{ maxWidth: '100%' }}
      >
        {/* Caption strip — solid color band with Pretext-measured text */}
        <rect x={0} y={0} width={gridW} height={captionH} fill={captionColor} rx={2} />
        {captionLines.map((line, i) => (
          <text
            key={i}
            x={CAPTION_PADDING}
            y={CAPTION_PADDING + line.y + 16}
            fontSize={16}
            fontWeight="bold"
            fill={contrastTextColor(captionColor)}
            fontFamily="system-ui, sans-serif"
          >
            {line.text}
          </text>
        ))}

        {/* Cards */}
        {elements.map((el, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (CARD_W + GAP);
          const y = captionH + 8 + row * (CARD_H + GAP);
          const fill = blockColor(el.block);
          const textFill = contrastTextColor(fill);
          const propVal = el[propertyKey as keyof ElementRecord];
          const displayVal =
            propVal != null && typeof propVal !== 'object' ? String(propVal) : '—';

          const label = truncateToFit(el.name, NAME_FONT, NAME_MAX_W);

          return (
            <g key={el.symbol} role="link" aria-label={`${el.name}, ${el.symbol}`}>
              <Link to={`/element/${el.symbol}`}>
                <rect x={x} y={y} width={CARD_W} height={CARD_H} fill={fill} />
                <text
                  x={x + 6}
                  y={y + 14}
                  fontSize={9}
                  fill={textFill}
                  fontFamily="system-ui"
                >
                  {el.atomicNumber}
                </text>
                <text
                  x={x + 6}
                  y={y + 38}
                  fontSize={20}
                  fontWeight="bold"
                  fill={textFill}
                  fontFamily="system-ui"
                >
                  {el.symbol}
                </text>
                <text
                  x={x + 6}
                  y={y + 54}
                  fontSize={8}
                  fill={textFill}
                  fontFamily="system-ui"
                >
                  {label}
                </text>
                <text
                  x={x + 6}
                  y={y + 70}
                  fontSize={10}
                  fill={textFill}
                  fontFamily="'SF Mono', monospace"
                >
                  {displayVal}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
