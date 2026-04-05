import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { WARM_RED } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
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
      <PageHeader title="All Anomalies" color={WARM_RED} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
