import { useCallback } from 'react';
import PeriodicTable from '../components/PeriodicTable';
import PageShell from '../components/PageShell';
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
    <PageShell vizNav>
      <PeriodicTable onSelectElement={handleSelect} />
    </PageShell>
  );
}
