import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import type { GroupData } from '../lib/types';

export default function AtlasGroup() {
  const { n } = useParams();
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const group = groups.find((g) => g.n === Number(n));
  const elements = group ? group.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = elements.length > 0 ? blockColor(elements[0].block) : '#0f0f0f';

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0' }}>Group {n}</h1>
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Group ${n}`} captionColor={color} />
      )}
    </main>
  );
}
