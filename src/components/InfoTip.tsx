import { useState, useRef, useCallback, type ReactNode } from 'react';
import { BLACK, PAPER, GREY_MID, GREY_LIGHT } from '../lib/theme';

type InfoTipProps = {
  label: string;
  children: ReactNode;
};

/**
 * Educational inline tooltip. Renders a small (?) icon that expands
 * a Tufte-style sidenote on hover/focus. Animated with folio-line-reveal.
 */
export default function InfoTip({ label, children }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline' }}>
      <span>{children}</span>
      <button
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          height: '14px',
          minWidth: 'unset',
          minHeight: 'unset',
          marginLeft: '3px',
          borderRadius: '50%',
          border: `1px solid ${GREY_LIGHT}`,
          background: 'none',
          color: GREY_MID,
          fontSize: '9px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          cursor: 'help',
          lineHeight: 1,
          verticalAlign: 'super',
          padding: 0,
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            padding: '8px 10px',
            background: BLACK,
            color: PAPER,
            fontSize: '12px',
            lineHeight: 1.5,
            fontFamily: 'system-ui',
            zIndex: 100,
            pointerEvents: 'auto',
            opacity: 0,
            animation: 'folio-line-reveal 200ms var(--ease-out) forwards',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
