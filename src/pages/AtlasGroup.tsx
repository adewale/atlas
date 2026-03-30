import { useParams } from 'react-router';

export default function AtlasGroup() {
  const { n } = useParams();
  return (
    <main>
      <h1>Atlas — Group {n}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
