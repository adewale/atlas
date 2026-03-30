import { Link, useLocation } from 'react-router';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from '../lib/theme';

const VIZ_PAGES = [
  { to: '/', label: 'Table', colour: BLACK },
  { to: '/phase-landscape', label: 'Phase', colour: WARM_RED },
  { to: '/neighborhood-graph', label: 'Neighbours', colour: BLACK },
  { to: '/anomaly-explorer', label: 'Anomalies', colour: MUSTARD },
  { to: '/property-scatter', label: 'Scatter', colour: DEEP_BLUE },
  { to: '/discovery-timeline', label: 'Timeline', colour: WARM_RED },
  { to: '/etymology-map', label: 'Etymology', colour: DEEP_BLUE },
  { to: '/discoverer-network', label: 'Discoverers', colour: MUSTARD },
] as const;

/**
 * Horizontal nav bar for switching between visualisation pages.
 * Active page is highlighted with a solid background.
 * Uses viewTransitionName for shared-element morphing between pages.
 */
export default function VizNav() {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        viewTransitionName: 'viz-nav',
      }}
      aria-label="Visualisation pages"
    >
      {VIZ_PAGES.map(({ to, label, colour }) => {
        const isActive = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '5px 10px',
              border: `1.5px solid ${colour}`,
              background: isActive ? colour : 'transparent',
              color: isActive ? PAPER : colour,
              textDecoration: 'none',
              minHeight: 'unset',
              minWidth: 'unset',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                background: isActive ? PAPER : colour,
                display: 'inline-block',
                flexShrink: 0,
                transition: 'background 150ms var(--ease-snap)',
              }}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
