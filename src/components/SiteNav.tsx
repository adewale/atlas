import { Link } from 'react-router';
import { DIM, GREY_MID, GREY_LIGHT, MONO_FONT } from '../lib/theme';

/**
 * Consistent site-wide footer navigation. Renders on every page including Home.
 * Provides keyboard shortcut hint and links to meta pages.
 */
export default function SiteNav() {
  return (
    <nav
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
        <Link to="/" style={{ color: GREY_MID, textDecoration: 'none' }}>Atlas</Link>
        <Link to="/about" style={{ color: GREY_LIGHT, textDecoration: 'none' }}>About</Link>
        <Link to="/credits" style={{ color: GREY_LIGHT, textDecoration: 'none' }}>Credits</Link>
        <Link to="/design" style={{ color: GREY_LIGHT, textDecoration: 'none' }}>Design</Link>
        <Link to="/animation-palette" style={{ color: GREY_LIGHT, textDecoration: 'none' }}>Animation</Link>
        <Link to="/entity-map" style={{ color: GREY_LIGHT, textDecoration: 'none' }}>Entity Map</Link>
      </div>
    </nav>
  );
}
