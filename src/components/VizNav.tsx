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
        gap: '3px',
        flexWrap: 'wrap',
        marginBottom: '10px',
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
              fontSize: '9px',
              fontWeight: 'bold',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '6px 8px',
              border: `1px solid ${colour}`,
              background: isActive ? colour : 'transparent',
              color: isActive ? PAPER : colour,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'background 150ms var(--ease-snap), color 150ms var(--ease-snap)',
            }}
          >
            <span
              style={{
                width: '4px',
                height: '4px',
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
