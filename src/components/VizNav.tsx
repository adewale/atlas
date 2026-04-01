import { Link, useLocation } from 'react-router';
import { PAPER } from '../lib/theme';
import { VT } from '../lib/transitions';
import { VIZ_PAGES } from '../lib/routeMeta';

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
        viewTransitionName: VT.VIZ_NAV,
      }}
      aria-label="Visualisation pages"
    >
      {VIZ_PAGES.map(({ path, label, colour }) => {
        const isActive = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '12px 10px',
              border: `1.5px solid ${colour}`,
              background: isActive ? colour : 'transparent',
              color: isActive ? PAPER : colour,
              textDecoration: 'none',
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
