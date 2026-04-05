import { BLACK, DEEP_BLUE, WARM_RED, MUSTARD, GREY_RULE, STROKE_THIN } from '../lib/theme';
import { DROP_CAP_FONT } from '../lib/pretext';

const LETTERS: { letter: string; color: string }[] = [
  { letter: 'A', color: WARM_RED },
  { letter: 'T', color: BLACK },
  { letter: 'L', color: DEEP_BLUE },
  { letter: 'A', color: WARM_RED },
  { letter: 'S', color: MUSTARD },
];

const FONT_SIZE = 32;
const CELL = 44;
const BAR_W = 56;
const HEIGHT = LETTERS.length * CELL + 12;
const CX = BAR_W / 2;

export const WORDMARK_WIDTH = 72;

export default function AtlasWordmark() {
  return (
    <h1
      aria-label="Atlas"
      className="page-shell-wordmark"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: `${WORDMARK_WIDTH}px`,
        margin: 0,
        padding: 0,
        userSelect: 'none',
      }}
    >
      <svg width={BAR_W} height={HEIGHT} viewBox={`0 0 ${BAR_W} ${HEIGHT}`} aria-hidden="true">
        <line x1={10} y1={2} x2={BAR_W - 10} y2={2} stroke={GREY_RULE} strokeWidth={STROKE_THIN} />
        <polygon points={`${CX},5 ${CX + 2.5},8 ${CX},11 ${CX - 2.5},8`} fill={GREY_RULE} />
        {LETTERS.map(({ letter, color }, i) => (
          <text
            key={i}
            x={CX}
            y={14 + i * CELL + FONT_SIZE}
            textAnchor="middle"
            fontSize={FONT_SIZE}
            fontFamily={DROP_CAP_FONT}
            fontWeight="900"
            fill={color}
            letterSpacing="0.15em"
          >
            {letter}
          </text>
        ))}
        <line
          x1={10}
          y1={HEIGHT - 2}
          x2={BAR_W - 10}
          y2={HEIGHT - 2}
          stroke={GREY_RULE}
          strokeWidth={STROKE_THIN}
        />
      </svg>
    </h1>
  );
}
