import { useParams } from 'react-router';

export default function Element() {
  const { symbol } = useParams();
  return (
    <main>
      <h1>Element — {symbol}</h1>
      <p>Folio — to be implemented.</p>
    </main>
  );
}
