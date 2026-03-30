import { useCallback } from 'react';
import PeriodicTable from '../components/PeriodicTable';
import VizNav from '../components/VizNav';
import SiteNav from '../components/SiteNav';
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
      <SiteNav />
    </main>
  );
}
