import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import AtlasPlate from '../components/AtlasPlate';
import type { AnomalyData } from '../lib/types';

export default function AtlasAnomaly() {
  const { slug } = useParams();
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);

  useEffect(() => {
    import('../../data/generated/anomalies.json').then((m) =>
      setAnomalies(m.default as AnomalyData[]),
    );
  }, []);

  const anomaly = anomalies.find((a) => a.slug === slug);
  const elements = anomaly ? anomaly.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      {anomaly ? (
        <>
          <h1 style={{ margin: '16px 0' }}>{anomaly.label}</h1>
          <p style={{ maxWidth: '600px', marginBottom: '24px', lineHeight: 1.6 }}>
            {anomaly.description}
          </p>
          <AtlasPlate
            elements={elements}
            caption={anomaly.label}
            captionColor="#2e2e2e"
          />
        </>
      ) : (
        <p>Anomaly not found.</p>
      )}
    </main>
  );
}
