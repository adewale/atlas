import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import AtlasPlate from '../components/AtlasPlate';
import type { BlockData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DESC_MAX_W = 600;

export default function AtlasBlock() {
  const { block } = useParams();
  const { blocks } = useLoaderData() as { blocks: BlockData[] };

  const found = blocks.find((b) => b.block === block);
  const elements = found ? found.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = block ? blockColor(block) : BLACK;

  useDocumentTitle(`${block}-block`);

  const { lines, lineHeight } = usePretextLines({
    text: found?.description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <PageShell>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color, viewTransitionName: 'data-plate-block' } as React.CSSProperties}>{block}-block</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {found?.description && (
        <svg
          width={DESC_MAX_W}
          height={lines.length * lineHeight + lineHeight}
          style={{ maxWidth: '100%', marginBottom: '24px' }}
          role="img"
          aria-label={found.description}
        >
          <PretextSvg lines={lines} lineHeight={lineHeight} x={0} y={0} maxWidth={DESC_MAX_W} showRules animationStagger={25} />
        </svg>
      )}
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`${block}-block elements`} captionColor={color} />
      )}
    </PageShell>
  );
}
