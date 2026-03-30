import { Link } from 'react-router';

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
        borderTop: '1px solid #ece7db',
        fontSize: '12px',
        color: '#999',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <span style={{ fontFamily: "'SF Mono', 'Cascadia Code', monospace", fontSize: '11px', color: '#999' }}>
        Press <strong style={{ color: '#666' }}>?</strong> for keyboard shortcuts
      </span>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Atlas</Link>
        <Link to="/about" style={{ color: '#999', textDecoration: 'none' }}>About</Link>
        <Link to="/credits" style={{ color: '#999', textDecoration: 'none' }}>Credits</Link>
        <Link to="/design" style={{ color: '#999', textDecoration: 'none' }}>Design</Link>
        <Link to="/entity-map" style={{ color: '#999', textDecoration: 'none' }}>Entity Map</Link>
      </div>
    </nav>
  );
}
