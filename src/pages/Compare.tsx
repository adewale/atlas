import { useParams } from 'react-router';

export default function Compare() {
  const { symbolA, symbolB } = useParams();
  return (
    <main>
      <h1>Compare — {symbolA} vs {symbolB}</h1>
      <p>Compare view — to be implemented.</p>
    </main>
  );
}
