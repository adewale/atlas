import { Link } from 'react-router';

/**
 * Minimal site-wide footer navigation. Shows on every page except Home
 * (which has its own footer). Provides consistent access to meta pages
 * and the periodic table.
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
      <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Atlas</Link>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/about" style={{ color: '#999', textDecoration: 'none' }}>About</Link>
        <Link to="/credits" style={{ color: '#999', textDecoration: 'none' }}>Credits</Link>
        <Link to="/design" style={{ color: '#999', textDecoration: 'none' }}>Design</Link>
        <Link to="/entity-map" style={{ color: '#999', textDecoration: 'none' }}>Entity Map</Link>
      </div>
    </nav>
  );
}
