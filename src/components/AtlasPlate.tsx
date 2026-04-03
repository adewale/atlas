import { useState, useRef, useCallback, useMemo } from 'react';
import type { ElementRecord } from '../lib/types';
import { blockColor, contrastTextColor } from '../lib/grid';
import { BLACK, GREY_MID, MONO_FONT } from '../lib/theme';
import { fitLabel, measureLines, PRETEXT_SANS } from '../lib/pretext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useFontsReady } from '../hooks/useFontsReady';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { VT, vt } from '../lib/transitions';
import PretextSvg from './PretextSvg';

const CARD_W = 100;
const CARD_H = 80;
const GAP = 4;
const NAME_FONT = `8px ${PRETEXT_SANS}`;
const NAME_MAX_W = CARD_W - 12; // 6px padding each side
const CAPTION_FONT = `bold 16px ${PRETEXT_SANS}`;
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

  // Binary search for the longest prefix + ellipsis that fits
  const base = abbrev ?? name;
  let lo = 1;
  let hi = base.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fitLabel(base.slice(0, mid) + '\u2026', font, maxWidth)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best > 0 ? base.slice(0, best) + '\u2026' : base[0] + '\u2026';
}


export type PlateHoverInfo = {
  element: ElementRecord;
  rect: { top: number; left: number; width: number; height: number };
} | null;

type AtlasPlateProps = {
  elements: ElementRecord[];
  caption: string;
  captionColor?: string;
  propertyKey?: string;
  columns?: number;
  sparklineValues?: (number | null)[];
  sparklineHighlight?: number;
  onHover?: (info: PlateHoverInfo) => void;
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
  captionColor = BLACK,
  propertyKey = 'mass',
  columns = 4,
  sparklineValues,
  sparklineHighlight,
  onHover,
}: AtlasPlateProps) {
  const isMobile = useIsMobile();
  const fontsReady = useFontsReady();
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maxCols = isMobile ? 2 : columns;
  const cols = Math.min(maxCols, elements.length || 1);
  const rows = Math.ceil(elements.length / cols);
  const gridW = cols * (CARD_W + GAP) - GAP;

  // Measure caption text with Pretext (re-measure when fonts load)
  const { captionLines, captionH } = useMemo(() => {
    const lines = measureLines(caption, CAPTION_FONT, gridW - CAPTION_PADDING * 2, 20);
    const textH = lines.length * 20;
    return { captionLines: lines, captionH: textH + CAPTION_PADDING * 2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fontsReady busts the cache so measureLines re-measures with real font metrics
  }, [caption, gridW, fontsReady]);

  const gridH = rows * (CARD_H + GAP) - GAP;
  const totalH = captionH + 8 + gridH;

  // Convert SVG-local card coordinates to page-relative rect for tooltip positioning
  const handleCardEnter = useCallback(
    (el: ElementRecord, svgX: number, svgY: number) => {
      if (!onHover || !svgRef.current) return;
      const svg = svgRef.current;
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / gridW;
      const scaleY = svgRect.height / totalH;
      onHover({
        element: el,
        rect: {
          left: svgRect.left + svgX * scaleX,
          top: svgRect.top + svgY * scaleY,
          width: CARD_W * scaleX,
          height: CARD_H * scaleY,
        },
      });
    },
    [onHover, gridW, totalH],
  );

  const handleCardLeave = useCallback(() => {
    if (onHover) onHover(null);
  }, [onHover]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        ref={svgRef}
        width={gridW}
        height={totalH}
        viewBox={`0 0 ${gridW} ${totalH}`}
        role="img"
        aria-label={caption}
        style={{ maxWidth: '100%', height: 'auto' }}
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
              aria-label={`${el.symbol} — ${el.name}`}
              style={{
                opacity: 0,
                animation: `card-enter 250ms var(--ease-out) ${i * 15}ms forwards`,
              }}
            >
              <g
                style={{ cursor: 'pointer' }}
                role="link"
                onClick={(e) => { e.preventDefault(); setActiveSymbol(el.symbol); transitionNavigate(`/elements/${el.symbol}`); }}
                onMouseEnter={() => handleCardEnter(el, x, y)}
                onMouseLeave={handleCardLeave}
              >
                <title>{el.name}</title>
                <rect x={x} y={y} width={CARD_W} height={CARD_H} fill={fill} style={{ viewTransitionName: vt(activeSymbol, el.symbol, VT.CELL_BG) } as React.CSSProperties} />
                <text
                  x={x + 6}
                  y={y + 14}
                  fontSize={9}
                  fill={textFill}
                  fontFamily="system-ui, sans-serif"
                  style={{ viewTransitionName: vt(activeSymbol, el.symbol, VT.NUMBER) } as React.CSSProperties}
                >
                  {String(el.atomicNumber).padStart(3, '0')}
                </text>
                <text
                  x={x + 6}
                  y={y + 38}
                  fontSize={20}
                  fontWeight="bold"
                  fill={textFill}
                  fontFamily="system-ui, sans-serif"
                  style={{ viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL) } as React.CSSProperties}
                >
                  {el.symbol}
                </text>
                <text
                  x={x + 6}
                  y={y + 54}
                  fontSize={8}
                  fill={textFill}
                  fontFamily={PRETEXT_SANS}
                >
                  {label !== el.category && <title>{el.category}</title>}
                  {label}
                </text>
                <text
                  x={x + 6}
                  y={y + 70}
                  fontSize={10}
                  fill={textFill}
                  fontFamily={MONO_FONT}
                >
                  {unit && UNIT_TOOLTIPS[unit] && <title>{UNIT_TOOLTIPS[unit]}</title>}
                  {displayVal}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: '6px', fontSize: '11px', color: GREY_MID, letterSpacing: '0.02em' }}>
        {elements.map(el => el.symbol).join(' · ')}
      </div>
    </div>
  );
}
