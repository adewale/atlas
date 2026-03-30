import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { GroupData } from '../lib/types';
import SiteNav from '../components/SiteNav';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AtlasGroup() {
  const { n } = useParams();
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const group = groups.find((g) => g.n === Number(n));
  const elements = group ? group.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = elements.length > 0 ? blockColor(elements[0].block) : BLACK;

  useDocumentTitle(`Group ${n}`);

  return (
    <main id="main-content">
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>Group {n}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Group ${n}`} captionColor={color} />
      )}
      <SiteNav />
    </main>
  );
}
