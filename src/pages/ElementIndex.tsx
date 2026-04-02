import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { blockColor } from '../lib/grid';
import { BACK_LINK_STYLE, INSCRIPTION_STYLE, WARM_RED } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
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
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: WARM_RED }}>All Elements</h1>
      <div style={{ borderTop: `4px solid ${WARM_RED}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
