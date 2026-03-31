import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { fromSlug, categoryColor, BACK_LINK_STYLE } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import AtlasPlate from '../components/AtlasPlate';
import type { CategoryData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DESC_MAX_W = 600;

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const label = fromSlug(slug ?? '');
  useDocumentTitle(label);
  const cat = categories.find((c) => c.slug === label);
  const elements = cat ? cat.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = categoryColor(label);

  const { lines, lineHeight } = usePretextLines({
    text: cat?.description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <PageShell>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>{label}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {cat?.description && (
        <svg
          width={DESC_MAX_W}
          height={lines.length * lineHeight + lineHeight}
          style={{ maxWidth: '100%', marginBottom: '24px' }}
          role="img"
          aria-label={cat.description}
        >
          <PretextSvg lines={lines} lineHeight={lineHeight} x={0} y={0} maxWidth={DESC_MAX_W} showRules animationStagger={25} />
        </svg>
      )}
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={label} captionColor={color} />
      )}
    </PageShell>
  );
}
