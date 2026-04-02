import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { WARM_RED, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { AnomalyData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AnomalyIndex() {
  useDocumentTitle('All Anomalies');
  const { anomalies } = useLoaderData() as { anomalies: AnomalyData[] };

  const sections: Section[] = anomalies.map((a) => {
    const firstEl = a.elements.length > 0 ? getElement(a.elements[0]) : null;
    const color = firstEl ? blockColor(firstEl.block) : WARM_RED;
    return {
      id: a.slug,
      label: a.label,
      color,
      items: a.elements.map((sym) => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    };
  });

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: WARM_RED }}>All Anomalies</h1>
      <div style={{ borderTop: `4px solid ${WARM_RED}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
