import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import type { BlockData } from '../lib/types';

export default function AtlasBlock() {
  const { block } = useParams();
  const [blocks, setBlocks] = useState<BlockData[]>([]);

  useEffect(() => {
    import('../../data/generated/blocks.json').then((m) => setBlocks(m.default as BlockData[]));
  }, []);

  const found = blocks.find((b) => b.block === block);
  const elements = found ? found.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = block ? blockColor(block) : '#0f0f0f';

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0' }}>{block}-block</h1>
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`${block}-block elements`} captionColor={color} />
      )}
    </main>
  );
}
