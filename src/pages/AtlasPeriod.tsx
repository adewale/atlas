import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { WARM_RED, DEEP_BLUE } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { PeriodData } from '../lib/types';

export default function AtlasPeriod() {
  const { n } = useParams();
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const period = periods.find((p) => p.n === Number(n));
  const elements = period ? period.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  const color = (Number(n) - 1) % 2 === 0 ? WARM_RED : DEEP_BLUE;

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
