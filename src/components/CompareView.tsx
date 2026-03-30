import type { ElementRecord } from '../lib/types';
import { generateComparisonNotes } from '../lib/compare';

const DEEP_BLUE = '#133e7c';
const WARM_RED = '#9e1c2c';
const PAPER = '#f7f2e8';
const WIDTH = 800;
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
};

/**
 * Split-screen dramatic compare view.
 * Left half deep blue, right half warm red.
 * Comparison bands below with horizontal bars per property.
 */
export default function CompareView({
  elementA,
  elementB,
  animate = true,
}: CompareViewProps) {
  const notes = generateComparisonNotes(elementA, elementB);

  // Compute max values for bars
  const bandH = 48;
  const bandGap = 4;
  const bandsY = SPLIT_H + 24;
  const bandsH = PROPERTIES.length * (bandH + bandGap);
  const notesY = bandsY + bandsH + 24;
  const totalH = notesY + notes.length * 22 + 24;

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
        {/* Left half — deep blue */}
        <rect
          x={0}
          y={0}
          width={WIDTH / 2}
          height={SPLIT_H}
          fill={DEEP_BLUE}
          style={
            animate
              ? {
                  clipPath: 'inset(0 50% 0 0)',
                  animation: 'compare-expand 300ms var(--ease-out) forwards',
                }
              : undefined
          }
        />
        {/* Right half — warm red */}
        <rect
          x={WIDTH / 2}
          y={0}
          width={WIDTH / 2}
          height={SPLIT_H}
          fill={WARM_RED}
          style={
            animate
              ? {
                  clipPath: 'inset(0 0 0 50%)',
                  animation: 'compare-expand 300ms var(--ease-out) forwards',
                }
              : undefined
          }
        />

        {/* Element A — left side */}
        <text
          x={WIDTH / 4}
          y={80}
          textAnchor="middle"
          fontSize={10}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementA.atomicNumber}
        </text>
        <text
          x={WIDTH / 4}
          y={150}
          textAnchor="middle"
          fontSize={72}
          fontWeight="bold"
          fill={PAPER}
          fontFamily="system-ui"
          style={animate ? { transform: 'scale(0.95)', transformOrigin: `${WIDTH / 4}px 150px`, animation: 'compare-scale 300ms var(--ease-out) forwards' } : undefined}
        >
          {elementA.symbol}
        </text>
        <text
          x={WIDTH / 4}
          y={190}
          textAnchor="middle"
          fontSize={18}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementA.name}
        </text>
        <text
          x={WIDTH / 4}
          y={220}
          textAnchor="middle"
          fontSize={11}
          fill={PAPER}
          opacity={0.8}
          fontFamily="system-ui"
        >
          {elementA.category} · {elementA.block}-block
        </text>

        {/* Element B — right side */}
        <text
          x={(3 * WIDTH) / 4}
          y={80}
          textAnchor="middle"
          fontSize={10}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementB.atomicNumber}
        </text>
        <text
          x={(3 * WIDTH) / 4}
          y={150}
          textAnchor="middle"
          fontSize={72}
          fontWeight="bold"
          fill={PAPER}
          fontFamily="system-ui"
          style={animate ? { transform: 'scale(0.95)', transformOrigin: `${(3 * WIDTH) / 4}px 150px`, animation: 'compare-scale 300ms var(--ease-out) forwards' } : undefined}
        >
          {elementB.symbol}
        </text>
        <text
          x={(3 * WIDTH) / 4}
          y={190}
          textAnchor="middle"
          fontSize={18}
          fill={PAPER}
          fontFamily="system-ui"
        >
          {elementB.name}
        </text>
        <text
          x={(3 * WIDTH) / 4}
          y={220}
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

        {/* Relationship notes */}
        {notes.map((note, i) => (
          <text
            key={i}
            x={4}
            y={notesY + i * 22}
            fontSize={14}
            fill="#0f0f0f"
            fontFamily="system-ui"
            style={
              animate
                ? {
                    opacity: 0,
                    animation: `folio-line-reveal 300ms var(--ease-out) ${300 + i * 30}ms forwards`,
                  }
                : undefined
            }
          >
            {note}
          </text>
        ))}
      </svg>
    </div>
  );
}
