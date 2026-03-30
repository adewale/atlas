import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { BlockData } from '../lib/types';
import SiteNav from '../components/SiteNav';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AtlasBlock() {
  const { block } = useParams();
  const { blocks } = useLoaderData() as { blocks: BlockData[] };

  const found = blocks.find((b) => b.block === block);
  const elements = found ? found.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = block ? blockColor(block) : BLACK;

  return (
    <main>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>{block}-block</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`${block}-block elements`} captionColor={color} />
      )}
      <SiteNav />
    </main>
  );
}
