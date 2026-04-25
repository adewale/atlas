/**
 * ViewToggle — Table / List toggle for visualisation pages.
 *
 * Pages with both a wide SVG ("table") view and a compact card-list ("list") view
 * use this to let users override the automatic mobile/desktop choice. The chosen
 * mode is persisted to the `view` query param so deep-links preserve user intent.
 */
import { useSearchParams } from 'react-router';
import { useCallback } from 'react';
import { BLACK, PAPER, GREY_MID } from '../lib/theme';

export type ViewMode = 'table' | 'list';

const VIEW_PARAM = 'view';

/** Read the current view mode from URL, falling back to the auto-detected default. */
export function useViewMode(autoMode: ViewMode): [ViewMode, (next: ViewMode) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get(VIEW_PARAM);
  const mode: ViewMode = param === 'table' || param === 'list' ? param : autoMode;

  const setMode = useCallback(
    (next: ViewMode) => {
      const nextParams = new URLSearchParams(searchParams);
      if (next === autoMode) {
        // Clearing returns to auto-detection: cleaner shareable URLs.
        nextParams.delete(VIEW_PARAM);
      } else {
        nextParams.set(VIEW_PARAM, next);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams, autoMode],
  );

  return [mode, setMode];
}

type ViewToggleProps = {
  mode: ViewMode;
  onChange: (next: ViewMode) => void;
  /** Aria label for the radiogroup (e.g. "Phase landscape view") */
  ariaLabel: string;
};

export default function ViewToggle({ mode, onChange, ariaLabel }: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        border: `1px solid ${BLACK}`,
        marginBottom: '12px',
      }}
    >
      <ToggleButton
        active={mode === 'table'}
        onClick={() => onChange('table')}
        label="Table"
      />
      <ToggleButton
        active={mode === 'list'}
        onClick={() => onChange('list')}
        label="List"
      />
    </div>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: active ? BLACK : PAPER,
        color: active ? PAPER : GREY_MID,
        border: 'none',
        cursor: 'pointer',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      {label}
    </button>
  );
}
