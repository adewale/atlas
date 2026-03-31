import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import AtlasPlate from '../components/AtlasPlate';
import type { GroupData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DESC_MAX_W = 600;

export default function AtlasGroup() {
  const { n } = useParams();
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const group = groups.find((g) => g.n === Number(n));
  const elements = group ? group.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = elements.length > 0 ? blockColor(elements[0].block) : BLACK;

  useDocumentTitle(`Group ${n}`);

  const { lines, lineHeight } = usePretextLines({
    text: group?.description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <PageShell>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color, viewTransitionName: 'data-plate-group' } as React.CSSProperties}>Group {n}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {group?.description && (
        <svg
          width={DESC_MAX_W}
          height={lines.length * lineHeight + lineHeight}
          style={{ maxWidth: '100%', marginBottom: '24px' }}
          role="img"
          aria-label={group.description}
        >
          <PretextSvg lines={lines} lineHeight={lineHeight} x={0} y={0} maxWidth={DESC_MAX_W} showRules animationStagger={25} />
        </svg>
      )}
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Group ${n}`} captionColor={color} />
      )}
    </PageShell>
  );
}
