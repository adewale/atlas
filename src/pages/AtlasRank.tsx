import { useParams } from 'react-router';

export default function AtlasRank() {
  const { property } = useParams();
  return (
    <main>
      <h1>Atlas — Rank by {property}</h1>
      <p>Atlas plate — to be implemented.</p>
    </main>
  );
}
