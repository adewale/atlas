import { useCallback } from 'react';
import { Link } from 'react-router';
import PeriodicTable from '../components/PeriodicTable';
import VizNav from '../components/VizNav';
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
      <h1 style={{ letterSpacing: '0.3em', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Atlas
      </h1>
      <VizNav />
      <PeriodicTable onSelectElement={handleSelect} />
      <footer style={{ marginTop: '12px', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'SF Mono', monospace", fontSize: '11px' }}>Press <strong>?</strong> for keyboard shortcuts</span>
        <nav style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
          <Link to="/about">About</Link>
          <Link to="/credits">Credits</Link>
          <Link to="/design">Design</Link>
        </nav>
      </footer>
    </main>
  );
}
