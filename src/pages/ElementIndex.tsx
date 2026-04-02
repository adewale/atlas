import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE, INSCRIPTION_STYLE, WARM_RED } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { ElementRecord } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ElementIndex() {
  useDocumentTitle('All Elements');
  const { elements } = useLoaderData() as { elements: ElementRecord[] };

  // Group elements by block
  const byBlock: Record<string, ElementRecord[]> = {};
  for (const el of elements) {
    (byBlock[el.block] ??= []).push(el);
  }

  const blockOrder = ['s', 'p', 'd', 'f'];
  const blockLabels: Record<string, string> = { s: 's-block', p: 'p-block', d: 'd-block', f: 'f-block' };

  const sections: Section[] = blockOrder
    .filter((b) => byBlock[b])
    .map((b) => ({
      id: `block-${b}`,
      label: `${blockLabels[b]} (${byBlock[b].length} elements)`,
      color: blockColor(b),
      items: byBlock[b].map((el) => ({
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
