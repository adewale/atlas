import { useCallback } from 'react';
import { Link } from 'react-router';
import PeriodicTable from '../components/PeriodicTable';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';

export default function Home() {
  const transitionNavigate = useViewTransitionNavigate();

  const handleSelect = useCallback(
    (symbol: string) => {
      transitionNavigate(`/element/${symbol}`);
    },
    [transitionNavigate],
  );

  return (
    <main id="main-content">
      <h1 style={{ letterSpacing: '0.3em', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Atlas
      </h1>
      <PeriodicTable onSelectElement={handleSelect} />
      {/* Explore section — Byrne-style navigation to visualizations */}
      <nav style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { to: '/phase-landscape', label: 'Phase Landscape', color: '#9e1c2c' },
          { to: '/property-scatter', label: 'Property Scatter', color: '#133e7c' },
          { to: '/anomaly-explorer', label: 'Anomaly Explorer', color: '#c59b1a' },
          { to: '/neighborhood-graph', label: 'Neighbourhood Graph', color: '#0f0f0f' },
          { to: '/discovery-timeline', label: 'Discovery Timeline', color: '#9e1c2c' },
          { to: '/etymology-map', label: 'Etymology Map', color: '#133e7c' },
          { to: '/discoverer-network', label: 'Discoverer Network', color: '#c59b1a' },
        ].map(({ to, label, color }) => (
          <Link
            key={to}
            to={to}
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              border: `1.5px solid ${color}`,
              color,
              textDecoration: 'none',
              minHeight: 'unset',
              minWidth: 'unset',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', background: color, display: 'inline-block', flexShrink: 0 }} />
            {label}
          </Link>
        ))}
      </nav>
      <footer style={{ marginTop: '12px', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>118 elements · Arrow keys to navigate · Enter to open folio</span>
        <nav style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
          <Link to="/about">About</Link>
          <Link to="/credits">Credits</Link>
          <Link to="/design">Design</Link>
        </nav>
      </footer>
    </main>
  );
}
