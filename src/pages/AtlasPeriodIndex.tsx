import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { WARM_RED, DEEP_BLUE } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { PeriodData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AtlasPeriodIndex() {
  useDocumentTitle('All Periods');
  const { periods } = useLoaderData() as { periods: PeriodData[] };

  const sections: Section[] = periods.map((p) => ({
    id: `period-${p.n}`,
    label: `Period ${p.n}`,
    color: (p.n - 1) % 2 === 0 ? WARM_RED : DEEP_BLUE,
    items: p.elements.map((sym) => {
      const el = getElement(sym);
      return { symbol: sym, description: el?.name ?? sym };
    }),
  }));

  return (
    <PageShell>
      <PageHeader title="All Periods" color={WARM_RED} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
