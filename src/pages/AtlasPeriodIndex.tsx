import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, WARM_RED, DEEP_BLUE, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
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
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: WARM_RED }}>All Periods</h1>
      <div style={{ borderTop: `4px solid ${WARM_RED}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
