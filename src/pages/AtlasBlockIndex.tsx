import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { BlockData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const BLOCK_ORDER = ['s', 'p', 'd', 'f'];

export default function AtlasBlockIndex() {
  useDocumentTitle('All Blocks');
  const { blocks } = useLoaderData() as { blocks: BlockData[] };

  const sorted = [...blocks].sort(
    (a, b) => BLOCK_ORDER.indexOf(a.block) - BLOCK_ORDER.indexOf(b.block),
  );

  const sections: Section[] = sorted.map((b) => ({
    id: `block-${b.block}`,
    label: `${b.block}-block`,
    color: blockColor(b.block),
    items: b.elements.map((sym) => {
      const el = getElement(sym);
      return { symbol: sym, description: el?.name ?? sym };
    }),
  }));

  return (
    <PageShell>
      <PageHeader title="All Blocks" color={BLACK} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
