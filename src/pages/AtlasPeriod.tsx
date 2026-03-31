import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { WARM_RED, DEEP_BLUE, BACK_LINK_STYLE } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import AtlasPlate from '../components/AtlasPlate';
import type { PeriodData } from '../lib/types';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DESC_MAX_W = 600;

export default function AtlasPeriod() {
  const { n } = useParams();
  useDocumentTitle(`Period ${n}`);
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const period = periods.find((p) => p.n === Number(n));
  const elements = period ? period.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  const color = (Number(n) - 1) % 2 === 0 ? WARM_RED : DEEP_BLUE;

  const { lines, lineHeight } = usePretextLines({
    text: period?.description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <PageShell>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color, viewTransitionName: 'data-plate-period' } as React.CSSProperties}>Period {n}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {period?.description && (
        <svg
          width={DESC_MAX_W}
          height={lines.length * lineHeight + lineHeight}
          style={{ maxWidth: '100%', marginBottom: '24px' }}
          role="img"
          aria-label={period.description}
        >
          <PretextSvg lines={lines} lineHeight={lineHeight} x={0} y={0} maxWidth={DESC_MAX_W} showRules animationStagger={25} />
        </svg>
      )}
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={`Period ${n}`} captionColor={color} />
      )}
    </PageShell>
  );
}
