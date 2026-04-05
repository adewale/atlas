import { Link } from 'react-router';
import { DIM, GREY_MID, GREY_LIGHT, MONO_FONT } from '../lib/theme';

const NAV_LINKS: { to: string; label: string }[] = [
  { to: '/about', label: 'About' },
  { to: '/about/credits', label: 'Credits' },
  { to: '/about/design', label: 'Design' },
  { to: '/about/animation-palette', label: 'Animation' },
  { to: '/about/entity-map', label: 'Entity Map' },
];

export default function SiteNav() {
  return (
    <nav
      aria-label="Site navigation"
      style={{
        marginTop: '48px',
        paddingTop: '12px',
        borderTop: `1px solid ${DIM}`,
        fontSize: '12px',
        color: GREY_LIGHT,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <span style={{ fontFamily: MONO_FONT, fontSize: '11px', color: GREY_LIGHT }}>
        Press <strong style={{ color: GREY_MID }}>?</strong> for keyboard shortcuts
      </span>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/" aria-label="Atlas home" style={{ color: GREY_MID, textDecoration: 'none' }}>Atlas</Link>
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} style={{ color: GREY_LIGHT, textDecoration: 'none' }}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
