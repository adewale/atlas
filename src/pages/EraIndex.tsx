import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, DEEP_BLUE } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { TimelineData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ERA_BINS, yearInEra } from '../../shared/era-bins';

export default function EraIndex() {
  useDocumentTitle('All Eras');
  const data = useLoaderData() as TimelineData;

  const allEntries = [...data.antiquity, ...data.timeline];

  const sections: Section[] = ERA_BINS.map((bin) => {
    const symbols = allEntries
      .filter((e) => yearInEra(e.year, bin))
      .map((e) => e.symbol);
    if (symbols.length === 0) return null;
    const firstEl = getElement(symbols[0]);
    const color = firstEl ? blockColor(firstEl.block) : BLACK;
    return {
      id: bin.slug,
      label: `${bin.label} (${symbols.length} elements)`,
      color,
      items: symbols.map((sym) => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    };
  }).filter((s): s is Section => s != null);

  return (
    <PageShell>
      <PageHeader title="Discovery Eras" color={DEEP_BLUE} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
