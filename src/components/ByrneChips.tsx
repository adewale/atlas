/**
 * Byrne-style chip toggles for faceted filtering.
 *
 * Active = solid filled rectangle with contrast text.
 * Inactive = outlined rectangle with colour text.
 * Matches the existing VizNav / AnomalyExplorer button pattern.
 */
import { PAPER, BLACK } from '../lib/theme';
import { contrastTextColor } from '../lib/grid';

export type ChipOption<T extends string = string> = {
  value: T;
  label: string;
  colour: string;
  count?: number;
};

type ByrneChipsProps<T extends string = string> = {
  options: ChipOption<T>[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  /** Section label shown above chips. */
  label?: string;
};

export default function ByrneChips<T extends string>({
  options,
  selected,
  onToggle,
  label,
}: ByrneChipsProps<T>) {
  return (
    <div>
      {label && (
        <div
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#666',
            marginBottom: '6px',
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {options.map((opt) => {
          const isActive = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: isActive ? contrastTextColor(opt.colour) : opt.colour,
                background: isActive ? opt.colour : 'transparent',
                border: `1.5px solid ${opt.colour}`,
                borderRadius: 0,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition:
                  'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  background: isActive ? contrastTextColor(opt.colour) : opt.colour,
                  display: 'inline-block',
                  flexShrink: 0,
                  transition: 'background 150ms var(--ease-snap)',
                }}
              />
              {opt.label}
              {opt.count != null && (
                <span style={{ opacity: 0.7, fontWeight: 400 }}>({opt.count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
