import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import PeriodicTable from '../components/PeriodicTable';

export default function Home() {
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (symbol: string) => {
      navigate(`/element/${symbol}`);
    },
    [navigate],
  );

  return (
    <main>
      <h1 style={{ letterSpacing: '0.3em', marginBottom: '24px', fontSize: '24px' }}>
        A T L A S
      </h1>
      <PeriodicTable onSelectElement={handleSelect} />
    </main>
  );
}
