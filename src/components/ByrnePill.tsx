/**
 * ByrnePill — compact Byrne-coloured toggle pill.
 *
 * A smaller primitive than the full-size chip buttons, designed for
 * dense facet rows where many values need to fit on screen without
 * dominating the layout.
 *
 * Active = solid fill with contrast text.
 * Inactive = transparent with coloured border + text.
 * Disabled = greyed-out, non-interactive.
 */
import { PAPER, GREY_MID, GREY_RULE } from '../lib/theme';
import { contrastTextColor } from '../lib/gridColors';

export interface ByrnePillProps {
  label: string;
  colour: string;
  active?: boolean;
  disabled?: boolean;
  count?: number;
  onClick?: () => void;
}

export default function ByrnePill({
  label,
  colour,
  active = false,
  disabled = false,
  count,
  onClick,
}: ByrnePillProps) {
  const fg = disabled ? GREY_MID : active ? contrastTextColor(colour) : colour;
  const bg = active ? colour : 'transparent';
  const borderColour = disabled ? GREY_RULE : colour;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1,
        color: fg,
        background: bg,
        border: `1px solid ${borderColour}`,
        borderRadius: 0,
        padding: '2px 6px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        transition:
          'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
      }}
    >
      <span
        style={{
          width: '4px',
          height: '4px',
          background: fg,
          display: 'inline-block',
          flexShrink: 0,
          transition: 'background 150ms var(--ease-snap)',
        }}
      />
      {label}
      {count != null && (
        <span
          style={{
            opacity: 0.7,
            fontWeight: 400,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ({count})
        </span>
      )}
    </button>
  );
}
