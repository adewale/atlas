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
    <main id="main-content">
      <h1 style={{ letterSpacing: '0.3em', marginBottom: '24px', fontSize: '24px' }}>
        A T L A S
      </h1>
      <PeriodicTable onSelectElement={handleSelect} />
      <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
        118 elements · Arrow keys to navigate · Enter to open folio
      </div>
    </main>
  );
}
