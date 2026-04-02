import { type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { DEEP_BLUE, GREY_MID } from '../lib/theme';

type MarginNoteProps = {
  /** Accent colour for the left border (desktop) and label (mobile). */
  color?: string;
  /** Short uppercase label shown above the note content. */
  label: string;
  /** Y offset from the top of the positioned parent (desktop only). */
  top?: number;
  children: ReactNode;
};

/**
 * Tufte-style margin note.
 *
 * - **Desktop (≥ 1100 px):** absolutely positioned in the right margin of a
 *   `position: relative` parent, using the `scatter-margin-note` class so it
 *   hides via the existing `@media (max-width: 1100px)` rule.
 *
 * - **Mobile (< 1100 px):** rendered inline as a `<details>` disclosure that
 *   the reader can tap to expand.
 */
export default function MarginNote({
  color = DEEP_BLUE,
  label,
  top = 80,
  children,
}: MarginNoteProps) {
  const isMobile = useIsMobile(1100);

  if (isMobile) {
    return (
      <details className="margin-note-disclosure">
        <summary
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color,
            cursor: 'pointer',
            listStyleType: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="margin-note-chevron">
            <path d="M2 1 L6 4 L2 7" fill="none" stroke={color} strokeWidth={1.5} />
          </svg>
        </summary>
        <div
          style={{
            fontSize: '12px',
            lineHeight: 1.6,
            color: GREY_MID,
            borderLeft: `2px solid ${color}`,
            paddingLeft: '10px',
            marginTop: '6px',
            marginBottom: '4px',
          }}
        >
          {children}
        </div>
      </details>
    );
  }

  return (
    <aside
      className="scatter-margin-note"
      style={{
        position: 'absolute',
        right: '-200px',
        top,
        width: '170px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: GREY_MID,
        borderLeft: `2px solid ${color}`,
        paddingLeft: '10px',
      }}
    >
      <strong
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color,
        }}
      >
        {label}
      </strong>
      <div style={{ marginTop: '6px' }}>{children}</div>
    </aside>
  );
}
