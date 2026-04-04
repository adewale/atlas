import { useLoaderData } from 'react-router';
import { blockColor } from '../lib/grid';
import { WARM_RED } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { ElementRecord } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ElementIndex() {
  useDocumentTitle('All Elements');
  const { elements } = useLoaderData() as { elements: ElementRecord[] };

  // Sort alphabetically by name, single section
  const sorted = [...elements].sort((a, b) => a.name.localeCompare(b.name));

  // Group into A–Z sections
  const byLetter = new Map<string, ElementRecord[]>();
  for (const el of sorted) {
    const letter = el.name[0].toUpperCase();
    (byLetter.get(letter) ?? byLetter.set(letter, []).get(letter)!).push(el);
  }

  const sections: Section[] = Array.from(byLetter.entries()).map(([letter, els]) => ({
    id: letter,
    label: `${letter} (${els.length})`,
    color: blockColor(els[0].block),
    items: els.map((el) => ({
      symbol: el.symbol,
      description: el.name,
    })),
  }));

  return (
    <PageShell>
      <PageHeader title="All Elements" color={WARM_RED} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
