import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { MUSTARD, BLACK } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
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
      <PageHeader title="All Discoverers" color={MUSTARD} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
