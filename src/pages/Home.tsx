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
      <h1 style={{ letterSpacing: '0.15em', marginBottom: '24px', fontSize: '24px' }}>
        A T L A S
      </h1>
      <PeriodicTable onSelectElement={handleSelect} />
      <footer style={{ marginTop: '16px', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>118 elements · Arrow keys to navigate · Enter to open folio</span>
        <nav style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
          <Link to="/about">About</Link>
          <Link to="/credits">Credits</Link>
        </nav>
      </footer>
    </main>
  );
}
