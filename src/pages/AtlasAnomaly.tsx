import { useParams } from 'react-router';

export default function AtlasAnomaly() {
  const { slug } = useParams();
  return (
    <main>
      <h1>Atlas — Anomaly {slug}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
