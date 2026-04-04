/**
 * EntityChip — compact card representations for non-element entities.
 *
 * Three variants: DiscovererChip, AnomalyChip, NeighbourChip.
 * Each renders as a small rectangle with a colored left border,
 * primary label, secondary metadata, and navigable link.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { MUSTARD, WARM_RED, GREY_MID, DIM } from '../lib/theme';

/* ------------------------------------------------------------------ */
/* Base chip                                                           */
/* ------------------------------------------------------------------ */

type BaseChipProps = {
  to: string;
  borderColor: string;
  primary: string;
  secondary: string;
  title?: string;
  'aria-label'?: string;
  /** Fixed width in px — when set, all chips in a group share this width for grid alignment. */
  fixedWidth?: number;
};

function BaseChip({ to, borderColor, primary, secondary, title, 'aria-label': ariaLabel, fixedWidth }: BaseChipProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      title={title ?? primary}
      aria-label={ariaLabel ?? title ?? primary}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...(fixedWidth
          ? { width: fixedWidth, flex: '0 0 auto' }
          : { minWidth: '120px', flex: '1 1 160px', maxWidth: '280px' }),
        height: '44px',
        padding: '4px 10px 4px 12px',
        borderLeft: `3px solid ${borderColor}`,
        background: hovered ? DIM : 'transparent',
        textDecoration: 'none',
        transition: 'background 120ms var(--ease-out)',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: borderColor,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {primary}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: GREY_MID,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {secondary}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* DiscovererChip                                                      */
/* ------------------------------------------------------------------ */

export type DiscovererChipProps = {
  name: string;
  /** Number of elements this discoverer is credited with */
  elementCount?: number;
  /** Optional year range string, e.g. "1807–1808" */
  yearRange?: string;
  /** Fixed width for grid alignment — all chips in a group share this width. */
  fixedWidth?: number;
};

export function DiscovererChip({ name, elementCount, yearRange, fixedWidth }: DiscovererChipProps) {
  const secondary = yearRange
    ? yearRange
    : elementCount != null
      ? `${elementCount} element${elementCount !== 1 ? 's' : ''}`
      : '';

  return (
    <BaseChip
      to={`/discoverers/${encodeURIComponent(name)}`}
      borderColor={MUSTARD}
      primary={name}
      secondary={secondary}
      title={`View elements discovered by ${name}`}
      aria-label={`Discoverer: ${name}`}
      fixedWidth={fixedWidth}
    />
  );
}

/* ------------------------------------------------------------------ */
/* AnomalyChip                                                         */
/* ------------------------------------------------------------------ */

export type AnomalyChipProps = {
  slug: string;
  label: string;
  /** Number of elements in this anomaly group */
  elementCount?: number;
  /** Fixed width for grid alignment — all chips in a group share this width. */
  fixedWidth?: number;
};

export function AnomalyChip({ slug, label, elementCount, fixedWidth }: AnomalyChipProps) {
  const secondary = elementCount != null
    ? `${elementCount} element${elementCount !== 1 ? 's' : ''}`
    : '';

  return (
    <BaseChip
      to={`/anomalies/${slug}`}
      borderColor={WARM_RED}
      primary={label}
      secondary={secondary}
      title={`${label} — view anomaly details`}
      aria-label={`Anomaly: ${label}`}
      fixedWidth={fixedWidth}
    />
  );
}

/* ------------------------------------------------------------------ */
/* NeighbourChip                                                       */
/* ------------------------------------------------------------------ */

export type NeighbourChipProps = {
  symbol: string;
  name: string;
  /** Block color for the left border */
  color: string;
  /** Relationship direction label, e.g. "← left" or "↑ above" */
  direction?: string;
  /** Fixed width for grid alignment — all chips in a group share this width. */
  fixedWidth?: number;
};

export function NeighbourChip({ symbol, name, color, direction, fixedWidth }: NeighbourChipProps) {
  return (
    <BaseChip
      to={`/elements/${symbol}`}
      borderColor={color}
      primary={`${symbol} — ${name}`}
      secondary={direction ?? 'neighbour'}
      title={`${name} (${symbol})`}
      aria-label={`Neighbour: ${name} (${symbol})`}
      fixedWidth={fixedWidth}
    />
  );
}
