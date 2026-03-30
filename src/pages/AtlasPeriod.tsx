import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import AtlasPlate from '../components/AtlasPlate';
import type { PeriodData } from '../lib/types';

export default function AtlasPeriod() {
  const { n } = useParams();
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const period = periods.find((p) => p.n === Number(n));
  const elements = period ? period.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  const colors = ['#9e1c2c', '#133e7c'];
  const color = colors[(Number(n) - 1) % 2];

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0' }}>Period {n}</h1>
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Period ${n}`} captionColor={color} />
      )}
    </main>
  );
}
