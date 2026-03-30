import { Link } from 'react-router';
import type { ElementRecord } from '../lib/types';
import { blockColor, contrastTextColor } from '../lib/grid';
import { fitLabel, measureLines } from '../lib/pretext';
import { useIsMobile } from '../hooks/useIsMobile';
import PretextSvg from './PretextSvg';

const CARD_W = 100;
const CARD_H = 80;
const GAP = 4;
const NAME_FONT = '8px system-ui';
const NAME_MAX_W = CARD_W - 12; // 6px padding each side
const CAPTION_FONT = 'bold 16px system-ui, sans-serif';
const CAPTION_PADDING = 12;

const UNITS: Record<string, string> = {
  mass: 'Da',
  electronegativity: '',
  ionizationEnergy: 'eV',
  radius: 'pm',
};

const UNIT_TOOLTIPS: Record<string, string> = {
  Da: 'Daltons — atomic mass unit',
  eV: 'Electron volts — ionisation energy',
  pm: 'Picometres — atomic radius',
};

const ABBREV: Record<string, string> = {
  'transition metal': 'trans. metal',
  'alkali metal': 'alkali',
  'alkaline earth metal': 'alk. earth',
  'noble gas': 'noble gas',
  'post-transition metal': 'post-trans.',
  'reactive nonmetal': 'nonmetal',
};

function truncateToFit(name: string, font: string, maxWidth: number): string {
  if (fitLabel(name, font, maxWidth)) return name;

  // Try abbreviation first
  const abbrev = ABBREV[name];
  if (abbrev && fitLabel(abbrev, font, maxWidth)) return abbrev;

  // Last resort: truncate with ellipsis (using abbreviation if available, else original)
  const base = abbrev ?? name;
  for (let i = base.length - 1; i > 0; i--) {
    const truncated = base.slice(0, i) + '\u2026';
    if (fitLabel(truncated, font, maxWidth)) return truncated;
  }
  return base[0] + '\u2026';
}


type AtlasPlateProps = {
  elements: ElementRecord[];
  caption: string;
  captionColor?: string;
  propertyKey?: string;
  columns?: number;
  sparklineValues?: (number | null)[];
  sparklineHighlight?: number;
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
  sparklineValues,
  sparklineHighlight,
}: AtlasPlateProps) {
  const isMobile = useIsMobile();
  const cols = isMobile ? 2 : columns;
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
        {/* Caption strip — solid colour band with Pretext-measured text */}
        <rect x={0} y={0} width={gridW} height={captionH} fill={captionColor} />
        <PretextSvg
          lines={captionLines}
          lineHeight={20}
          x={CAPTION_PADDING}
          y={CAPTION_PADDING}
          fontSize={16}
          fill={contrastTextColor(captionColor)}
          maxWidth={gridW - CAPTION_PADDING * 2}
          inlineSparkline={
            sparklineValues
              ? {
                  lineIndex: -1,
                  values: sparklineValues,
                  highlightIndex: sparklineHighlight,
                  color: contrastTextColor(captionColor),
                }
              : undefined
          }
        />

        {/* Cards */}
        {elements.map((el, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (CARD_W + GAP);
          const y = captionH + 8 + row * (CARD_H + GAP);
          const fill = blockColor(el.block);
          const textFill = contrastTextColor(fill);
          const propVal = el[propertyKey as keyof ElementRecord];
          const rawVal =
            propVal != null && typeof propVal !== 'object' ? String(propVal) : '—';
          const unit = UNITS[propertyKey] ?? '';
          const displayVal = rawVal !== '—' && unit ? `${rawVal} ${unit}` : rawVal;

          const label = truncateToFit(el.category, NAME_FONT, NAME_MAX_W);

          return (
            <g
              key={el.symbol}
              role="link"
              aria-label={`${el.name}, ${el.symbol}`}
              style={{
                opacity: 0,
                animation: `card-enter 250ms var(--ease-out) ${i * 15}ms forwards`,
              }}
            >
              <Link to={`/element/${el.symbol}`}>
                <rect x={x} y={y} width={CARD_W} height={CARD_H} fill={fill} />
                <text
                  x={x + 6}
                  y={y + 14}
                  fontSize={9}
                  fill={textFill}
                  fontFamily="system-ui"
                >
                  {String(el.atomicNumber).padStart(3, '0')}
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
                  {label !== el.category && <title>{el.category}</title>}
                  {label}
                </text>
                <text
                  x={x + 6}
                  y={y + 70}
                  fontSize={10}
                  fill={textFill}
                  fontFamily="'SF Mono', monospace"
                >
                  {unit && UNIT_TOOLTIPS[unit] && <title>{UNIT_TOOLTIPS[unit]}</title>}
                  {displayVal}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: '6px', fontSize: '11px', color: '#666', letterSpacing: '0.02em' }}>
        {elements.map(el => el.symbol).join(' · ')}
      </div>
    </div>
  );
}
