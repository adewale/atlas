import { useParams } from 'react-router';

export default function AtlasPeriod() {
  const { n } = useParams();
  return (
    <main>
      <h1>Atlas — Period {n}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
