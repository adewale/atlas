import { useState, useEffect, useRef } from 'react';
import { usePretextLines } from '../hooks/usePretextLines';
import { PRETEXT_SANS } from '../lib/pretext';
import PretextSvg from './PretextSvg';
import { BLACK, PAPER, GREY_MID, MONO_FONT } from '../lib/theme';

const PANEL_WIDTH = 480;
const INTRO_FONT = `14px ${PRETEXT_SANS}`;

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: '← → ↑ ↓', action: 'Navigate grid' },
  { keys: 'Enter / Space', action: 'Open element folio' },
  { keys: '/', action: 'Focus search' },
  { keys: 'Esc', action: 'Close overlay or clear search' },
  { keys: '?', action: 'Toggle this overlay' },
];

const INTRO_TEXT =
  'Atlas is keyboard-first. The periodic table is a navigable grid — arrow keys move between cells, Enter opens the full folio for any element. 118 elements across 7 periods, 18 groups, and 4 blocks.';

/**
 * Global help overlay triggered by the ? key.
 * Fixed position, covers entire viewport with a semi-transparent backdrop.
 */
export default function HelpOverlay() {
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && openRef.current) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 15, 15, 0.6)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <HelpPanel onClose={() => setOpen(false)} />
    </div>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
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
      style={{
        border: `2px solid ${BLACK}`,
        background: PAPER,
        padding: '16px',
        maxWidth: PANEL_WIDTH,
        width: '90vw',
        opacity: 0,
        animation: 'help-panel-enter 250ms var(--ease-out) forwards',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: BLACK }}>
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
            color: GREY_MID,
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

      <svg width={PANEL_WIDTH - 32} height={svgH} overflow="visible" style={{ maxWidth: '100%', display: 'block' }}>
        <PretextSvg
          lines={introLines}
          lineHeight={introLH}
          fontSize={14}
          maxWidth={PANEL_WIDTH - 32}
          showRules
          animationStagger={20}
        />
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
              <line
                x1={0}
                y1={y}
                x2={PANEL_WIDTH - 32}
                y2={y}
                stroke={BLACK}
                strokeWidth={0.5}
                opacity={0.15}
                style={{
                  clipPath: 'inset(0 100% 0 0)',
                  animation: `rule-draw 400ms var(--ease-out) ${delay}ms forwards`,
                }}
              />
              <text
                x={0}
                y={y + 20}
                fontSize={13}
                fontFamily={MONO_FONT}
                fontWeight="bold"
                fill={BLACK}
              >
                {s.keys}
              </text>
              <text
                x={PANEL_WIDTH - 32}
                y={y + 20}
                textAnchor="end"
                fontSize={13}
                fill={GREY_MID}
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
