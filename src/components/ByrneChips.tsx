/**
 * Byrne-style chip toggles for faceted filtering.
 *
 * Renders a row of compact ByrnePill toggles with an optional
 * section label. Active = filled, inactive = outlined.
 */
import { GREY_MID } from '../lib/theme';
import ByrnePill from './ByrnePill';

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
            color: GREY_MID,
            marginBottom: '4px',
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {options.map((opt) => (
          <ByrnePill
            key={opt.value}
            label={opt.label}
            colour={opt.colour}
            active={selected.has(opt.value)}
            count={opt.count}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
