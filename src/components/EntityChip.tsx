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
};

function BaseChip({ to, borderColor, primary, secondary, title, 'aria-label': ariaLabel }: BaseChipProps) {
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
        minWidth: '120px',
        maxWidth: '160px',
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
};

export function DiscovererChip({ name, elementCount, yearRange }: DiscovererChipProps) {
  const secondary = yearRange
    ? yearRange
    : elementCount != null
      ? `${elementCount} element${elementCount !== 1 ? 's' : ''}`
      : '';

  return (
    <BaseChip
      to={`/discoverer/${encodeURIComponent(name)}`}
      borderColor={MUSTARD}
      primary={name}
      secondary={secondary}
      title={`View elements discovered by ${name}`}
      aria-label={`Discoverer: ${name}`}
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
};

export function AnomalyChip({ slug, label, elementCount }: AnomalyChipProps) {
  const secondary = elementCount != null
    ? `${elementCount} element${elementCount !== 1 ? 's' : ''}`
    : '';

  return (
    <BaseChip
      to={`/atlas/anomaly/${slug}`}
      borderColor={WARM_RED}
      primary={label}
      secondary={secondary}
      title={`${label} — view anomaly details`}
      aria-label={`Anomaly: ${label}`}
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
};

export function NeighbourChip({ symbol, name, color, direction }: NeighbourChipProps) {
  return (
    <BaseChip
      to={`/element/${symbol}`}
      borderColor={color}
      primary={`${symbol} — ${name}`}
      secondary={direction ?? 'neighbour'}
      title={`${name} (${symbol})`}
      aria-label={`Neighbour: ${name} (${symbol})`}
    />
  );
}
