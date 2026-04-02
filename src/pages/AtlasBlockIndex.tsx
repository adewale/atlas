import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
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
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: BLACK }}>All Blocks</h1>
      <div style={{ borderTop: `4px solid ${BLACK}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
