import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from './PretextSvg';

const PANEL_WIDTH = 480;
const INTRO_FONT = '14px system-ui';

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: '← → ↑ ↓', action: 'Navigate grid' },
  { keys: 'Enter / Space', action: 'Open element folio' },
  { keys: '/', action: 'Focus search' },
  { keys: 'Esc', action: 'Clear search or close panel' },
  { keys: '?', action: 'Toggle this panel' },
];

const INTRO_TEXT =
  'Atlas is keyboard-first. The periodic table is a navigable grid — arrow keys move between cells, Enter opens the full folio for any element.';

type KeyboardHelpProps = {
  onClose: () => void;
};

export default function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  const { lines: introLines, lineHeight: introLH } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: PANEL_WIDTH - 32,
    font: INTRO_FONT,
  });

  const introH = introLines.length * introLH + introLH;
  const rowH = 32;
  const tableH = SHORTCUTS.length * rowH;
  const svgH = introH + 16 + tableH + 8;

  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      style={{
        marginBottom: '16px',
        border: '2px solid #0f0f0f',
        background: '#f7f2e8',
        padding: '16px',
        maxWidth: PANEL_WIDTH,
        opacity: 0,
        animation: 'help-panel-enter 250ms var(--ease-out) forwards',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f0f0f' }}>
          Keyboard Controls
        </div>
        <button
          onClick={onClose}
          aria-label="Close keyboard help"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            color: '#666',
            fontFamily: 'system-ui',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Esc
        </button>
      </div>

      <svg width={PANEL_WIDTH - 32} height={svgH} style={{ maxWidth: '100%', display: 'block' }}>
        {/* Intro text — Pretext measured */}
        <PretextSvg
          lines={introLines}
          lineHeight={introLH}
          fontSize={14}
          maxWidth={PANEL_WIDTH - 32}
          showRules
          animationStagger={20}
        />

        {/* Shortcut table */}
        {SHORTCUTS.map((s, i) => {
          const y = introH + 16 + i * rowH;
          const delay = (introLines.length + i) * 20;
          return (
            <g
              key={s.keys}
              style={{
                opacity: 0,
                animation: `folio-line-reveal 300ms var(--ease-out) ${delay}ms forwards`,
              }}
            >
              {/* Separator rule */}
              <line
                x1={0}
                y1={y}
                x2={PANEL_WIDTH - 32}
                y2={y}
                stroke="#0f0f0f"
                strokeWidth={0.5}
                opacity={0.15}
                style={{
                  clipPath: 'inset(0 100% 0 0)',
                  animation: `rule-draw 400ms var(--ease-out) ${delay}ms forwards`,
                }}
              />
              {/* Key badge */}
              <text
                x={0}
                y={y + 20}
                fontSize={13}
                fontFamily="'SF Mono', 'Cascadia Code', monospace"
                fontWeight="bold"
                fill="#0f0f0f"
              >
                {s.keys}
              </text>
              {/* Action description */}
              <text
                x={PANEL_WIDTH - 32}
                y={y + 20}
                textAnchor="end"
                fontSize={13}
                fill="#666"
                fontFamily="system-ui"
              >
                {s.action}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
