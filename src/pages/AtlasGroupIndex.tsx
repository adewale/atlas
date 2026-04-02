import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE, INSCRIPTION_STYLE, DEEP_BLUE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { GroupData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AtlasGroupIndex() {
  useDocumentTitle('All Groups');
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const sections: Section[] = groups.map((g) => {
    const firstEl = g.elements.length > 0 ? getElement(g.elements[0]) : null;
    const color = firstEl ? blockColor(firstEl.block) : BLACK;
    return {
      id: `group-${g.n}`,
      label: `Group ${g.n}`,
      color,
      items: g.elements.map((sym) => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    };
  });

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: DEEP_BLUE }}>All Groups</h1>
      <div style={{ borderTop: `4px solid ${DEEP_BLUE}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
