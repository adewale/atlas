import type { ElementRecord } from '../lib/types';
import { generateComparisonNotes } from '../lib/compare';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from './PretextSvg';

const DEEP_BLUE = '#133e7c';
const WARM_RED = '#9e1c2c';
const PAPER = '#f7f2e8';
const DEFAULT_WIDTH = 800;
const SPLIT_H = 280;

const PROPERTIES = [
  { key: 'mass', label: 'Atomic Mass' },
  { key: 'electronegativity', label: 'Electronegativity' },
  { key: 'ionizationEnergy', label: 'Ionization Energy' },
  { key: 'radius', label: 'Atomic Radius' },
] as const;

type CompareViewProps = {
  elementA: ElementRecord;
  elementB: ElementRecord;
  animate?: boolean;
  vertical?: boolean;
};

/**
 * Split-screen dramatic compare view.
 * Horizontal: Left half deep blue, right half warm red.
 * Vertical (mobile): Top half deep blue, bottom half warm red.
 * Comparison bands below with horizontal bars per property.
 */
export default function CompareView({
  elementA,
  elementB,
  animate = true,
  vertical = false,
}: CompareViewProps) {
  const WIDTH = DEFAULT_WIDTH;
  const notes = generateComparisonNotes(elementA, elementB);
  const notesText = notes.join(' ');

  const { lines: notesLines, lineHeight: notesLineHeight } = usePretextLines({
    text: notesText,
    maxWidth: WIDTH - 8,
    font: '14px system-ui',
  });

  // Compute max values for bars
  const bandH = 48;
  const bandGap = 4;
  const splitH = vertical ? SPLIT_H * 2 : SPLIT_H;
  const bandsY = splitH + 24;
  const bandsH = PROPERTIES.length * (bandH + bandGap);
  const notesY = bandsY + bandsH + 24;
  const notesBlockH = notesLines.length * notesLineHeight;
  const totalH = notesY + notesBlockH + 24;

  // Layout helpers for horizontal vs vertical
  const halfW = WIDTH / 2;
  const halfSplitH = SPLIT_H;

  // Element A panel position
  const panelA = vertical
    ? { x: 0, y: 0, w: WIDTH, h: halfSplitH }
    : { x: 0, y: 0, w: halfW, h: SPLIT_H };

  // Element B panel position
  const panelB = vertical
    ? { x: 0, y: halfSplitH, w: WIDTH, h: halfSplitH }
    : { x: halfW, y: 0, w: halfW, h: SPLIT_H };

  // Center coords for element text
  const aCx = panelA.x + panelA.w / 2;
  const aCy = panelA.y;
  const bCx = panelB.x + panelB.w / 2;
  const bCy = panelB.y;

  return (
    <div className="compare-svg">
      <svg
        width={WIDTH}
        height={totalH}
        viewBox={`0 0 ${WIDTH} ${totalH}`}
        role="img"
        style={{ width: '100%', maxWidth: WIDTH }}
        aria-label={`Comparison of ${elementA.name} and ${elementB.name}`}
      >
        {/* Panel A — deep blue */}
        <rect
          x={panelA.x}
          y={panelA.y}
          width={panelA.w}
          height={panelA.h}
          fill={DEEP_BLUE}
          style={
            animate
              ? {
                  clipPath: vertical
                    ? 'inset(0 0 50% 0)'
                    : 'inset(0 50% 0 0)',
                  animation: 'compare-expand 300ms var(--ease-out) forwards',
                }
              : undefined
          }
        />
        {/* Panel B — warm red */}
        <rect
          x={panelB.x}
          y={panelB.y}
          width={panelB.w}
          height={panelB.h}
          fill={WARM_RED}
          style={
            animate
              ? {
                  clipPath: vertical
                    ? 'inset(50% 0 0 0)'
                    : 'inset(0 0 0 50%)',
                  animation: 'compare-expand 300ms var(--ease-out) forwards',
                }
              : undefined
          }
        />

        {/* Element A */}
        <text
          x={aCx}
          y={aCy + 80}
          textAnchor="middle"
          fontSize={10}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementA.atomicNumber}
        </text>
        <text
          x={aCx}
          y={aCy + 150}
          textAnchor="middle"
          fontSize={72}
          fontWeight="bold"
          fill={PAPER}
          fontFamily="system-ui"
          style={animate ? { transform: 'scale(0.95)', transformOrigin: `${aCx}px ${aCy + 150}px`, animation: 'compare-scale 300ms var(--ease-out) forwards' } : undefined}
        >
          {elementA.symbol}
        </text>
        <text
          x={aCx}
          y={aCy + 190}
          textAnchor="middle"
          fontSize={18}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementA.name}
        </text>
        <text
          x={aCx}
          y={aCy + 220}
          textAnchor="middle"
          fontSize={11}
          fill={PAPER}
          opacity={0.8}
          fontFamily="system-ui"
        >
          {elementA.category} · {elementA.block}-block
        </text>

        {/* Element B */}
        <text
          x={bCx}
          y={bCy + 80}
          textAnchor="middle"
          fontSize={10}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementB.atomicNumber}
        </text>
        <text
          x={bCx}
          y={bCy + 150}
          textAnchor="middle"
          fontSize={72}
          fontWeight="bold"
          fill={PAPER}
          fontFamily="system-ui"
          style={animate ? { transform: 'scale(0.95)', transformOrigin: `${bCx}px ${bCy + 150}px`, animation: 'compare-scale 300ms var(--ease-out) forwards' } : undefined}
        >
          {elementB.symbol}
        </text>
        <text
          x={bCx}
          y={bCy + 190}
          textAnchor="middle"
          fontSize={18}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementB.name}
        </text>
        <text
          x={bCx}
          y={bCy + 220}
          textAnchor="middle"
          fontSize={11}
          fill={PAPER}
          opacity={0.8}
          fontFamily="system-ui"
        >
          {elementB.category} · {elementB.block}-block
        </text>

        {/* Comparison bands */}
        {PROPERTIES.map((prop, i) => {
          const valA = elementA[prop.key] as number | null;
          const valB = elementB[prop.key] as number | null;
          if (valA == null && valB == null) return null;

          const max = Math.max(valA ?? 0, valB ?? 0) || 1;
          const barMax = WIDTH - 120;
          const barA = valA != null ? (valA / max) * barMax : 0;
          const barB = valB != null ? (valB / max) * barMax : 0;
          const y = bandsY + i * (bandH + bandGap);
          const delay = animate ? 100 + i * 50 : 0;

          return (
            <g key={prop.key}>
              <text
                x={4}
                y={y + 14}
                fontSize={10}
                fill="#0f0f0f"
                fontFamily="system-ui"
              >
                {prop.label}
              </text>
              {/* Bar A */}
              <rect
                x={4}
                y={y + 18}
                width={barA}
                height={10}
                fill={DEEP_BLUE}
                style={
                  animate
                    ? {
                        clipPath: 'inset(0 100% 0 0)',
                        animation: `bar-grow 300ms var(--ease-out) ${delay}ms forwards`,
                      }
                    : undefined
                }
              />
              <text
                x={Math.max(barA + 8, 60)}
                y={y + 27}
                fontSize={9}
                fill="#0f0f0f"
                fontFamily="'SF Mono', monospace"
              >
                {valA != null ? valA : '—'}
              </text>
              {/* Bar B */}
              <rect
                x={4}
                y={y + 32}
                width={barB}
                height={10}
                fill={WARM_RED}
                style={
                  animate
                    ? {
                        clipPath: 'inset(0 100% 0 0)',
                        animation: `bar-grow 300ms var(--ease-out) ${delay + 25}ms forwards`,
                      }
                    : undefined
                }
              />
              <text
                x={Math.max(barB + 8, 60)}
                y={y + 41}
                fontSize={9}
                fill="#0f0f0f"
                fontFamily="'SF Mono', monospace"
              >
                {valB != null ? valB : '—'}
              </text>
            </g>
          );
        })}

        {/* Relationship notes — Pretext Tier 1 */}
        <PretextSvg
          lines={notesLines}
          lineHeight={notesLineHeight}
          x={4}
          y={notesY}
          fontSize={14}
          fill="#0f0f0f"
          maxWidth={WIDTH - 8}
          animationStagger={animate ? 30 : undefined}
        />
      </svg>
    </div>
  );
}
