import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { MUSTARD, BLACK, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { DiscovererData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function DiscovererIndex() {
  useDocumentTitle('All Discoverers');
  const { discoverers } = useLoaderData() as { discoverers: DiscovererData[] };

  const sections: Section[] = discoverers.map((d) => {
    const firstEl = d.elements.length > 0 ? getElement(d.elements[0]) : null;
    const color = firstEl ? blockColor(firstEl.block) : BLACK;
    return {
      id: d.name,
      label: `${d.name} (${d.elements.length})`,
      color,
      items: d.elements.map((sym) => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    };
  });

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: MUSTARD }}>All Discoverers</h1>
      <div style={{ borderTop: `4px solid ${MUSTARD}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
