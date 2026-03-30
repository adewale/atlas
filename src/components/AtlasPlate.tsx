import { Link } from 'react-router';
import type { ElementRecord } from '../lib/types';
import { blockColor, contrastTextColor } from '../lib/grid';

const CARD_W = 100;
const CARD_H = 80;
const GAP = 4;
const COLS = 4;

type AtlasPlateProps = {
  elements: ElementRecord[];
  caption: string;
  captionColor?: string;
  propertyKey?: string;
};

/**
 * SVG card grid for element sets.
 * Each card shows symbol, atomic number, and one property value.
 * Caption strip with solid color band behind Pretext-measured caption.
 */
export default function AtlasPlate({
  elements,
  caption,
  captionColor = '#0f0f0f',
  propertyKey = 'mass',
}: AtlasPlateProps) {
  const rows = Math.ceil(elements.length / COLS);
  const gridW = COLS * (CARD_W + GAP) - GAP;
  const captionH = 40;
  const gridH = rows * (CARD_H + GAP) - GAP;
  const totalH = captionH + 16 + gridH;

  return (
    <div>
      <svg width={gridW} height={totalH} aria-label={caption}>
        {/* Caption strip */}
        <rect x={0} y={0} width={gridW} height={captionH} fill={captionColor} />
        <text
          x={12}
          y={26}
          fontSize={16}
          fontWeight="bold"
          fill={contrastTextColor(captionColor)}
          fontFamily="system-ui, sans-serif"
        >
          {caption}
        </text>

        {/* Cards */}
        {elements.map((el, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = col * (CARD_W + GAP);
          const y = captionH + 16 + row * (CARD_H + GAP);
          const fill = blockColor(el.block);
          const textFill = contrastTextColor(fill);
          const propVal = el[propertyKey as keyof ElementRecord];
          const displayVal =
            propVal != null && typeof propVal !== 'object' ? String(propVal) : '—';

          // Truncate label if needed (simple fit check)
          const label =
            el.name.length > 10 ? el.name.slice(0, 9) + '…' : el.name;

          return (
            <g key={el.symbol}>
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
