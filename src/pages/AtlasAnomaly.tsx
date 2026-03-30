import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { BLACK, WARM_RED } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import AtlasPlate from '../components/AtlasPlate';
import type { AnomalyData } from '../lib/types';
import SiteNav from '../components/SiteNav';

const DESC_MAX_W = 600;

export default function AtlasAnomaly() {
  const { slug } = useParams();
  const { anomalies } = useLoaderData() as { anomalies: AnomalyData[] };

  const anomaly = anomalies.find((a) => a.slug === slug);
  const elements = anomaly ? anomaly.elements.map((s) => getElement(s)!).filter(Boolean) : [];

  const { lines, lineHeight } = usePretextLines({
    text: anomaly?.description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      {anomaly ? (
        <>
          <h1 style={{ margin: '16px 0', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: WARM_RED }}>{anomaly.label}</h1>
          <div style={{ borderTop: `4px solid ${WARM_RED}`, marginBottom: '16px' }} />
          <svg
            width={DESC_MAX_W}
            height={lines.length * lineHeight + lineHeight}
            style={{ maxWidth: '100%', marginBottom: '24px' }}
            role="img"
            aria-label={anomaly.description}
          >
            <PretextSvg lines={lines} lineHeight={lineHeight} x={0} y={0} maxWidth={DESC_MAX_W} showRules animationStagger={25} />
          </svg>
          <AtlasPlate
            elements={elements}
            caption={anomaly.label}
            captionColor={WARM_RED}
          />
        </>
      ) : (
        <p>Anomaly not found.</p>
      )}
      <SiteNav />
    </main>
  );
}
