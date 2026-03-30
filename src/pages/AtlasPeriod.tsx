import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { WARM_RED, DEEP_BLUE, BACK_LINK_STYLE } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { PeriodData } from '../lib/types';
import SiteNav from '../components/SiteNav';

export default function AtlasPeriod() {
  const { n } = useParams();
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const period = periods.find((p) => p.n === Number(n));
  const elements = period ? period.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  const color = (Number(n) - 1) % 2 === 0 ? WARM_RED : DEEP_BLUE;

  return (
    <main>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>Period {n}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Period ${n}`} captionColor={color} />
      )}
      <SiteNav />
    </main>
  );
}
