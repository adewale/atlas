import { useParams, useLoaderData, Link } from 'react-router';
import { WARM_RED, BACK_LINK_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
import type { AnomalyData } from '../lib/types';
import PageShell from '../components/PageShell';

export default function AtlasAnomaly() {
  const { slug } = useParams();
  const { anomalies } = useLoaderData() as { anomalies: AnomalyData[] };

  const anomaly = anomalies.find((a) => a.slug === slug);

  if (!anomaly) {
    return (
      <PageShell>
        <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
        <p>Anomaly not found.</p>
      </PageShell>
    );
  }

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={anomaly.label}
      color={WARM_RED}
      description={anomaly.description}
      elements={anomaly.elements}
      caption={anomaly.label}
      captionColor={WARM_RED}
      marginNote={
        <MarginNote label="Anomalies" color={WARM_RED} top={60}>
          <p style={{ margin: 0 }}>
            Periodic anomalies reveal where simple models break down. They often point to deeper physics — relativistic effects, electron correlation, or orbital near-degeneracy.
          </p>
        </MarginNote>
      }
    />
  );
}
