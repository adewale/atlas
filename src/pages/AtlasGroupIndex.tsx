import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, DEEP_BLUE } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
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
      <PageHeader title="All Groups" color={DEEP_BLUE} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
