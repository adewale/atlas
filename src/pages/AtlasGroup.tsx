import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import type { GroupData } from '../lib/types';
import SiteNav from '../components/SiteNav';

export default function AtlasGroup() {
  const { n } = useParams();
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const group = groups.find((g) => g.n === Number(n));
  const elements = group ? group.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = elements.length > 0 ? blockColor(elements[0].block) : '#0f0f0f';

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>Group {n}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Group ${n}`} captionColor={color} />
      )}
      <SiteNav />
    </main>
  );
}
