import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { categoryColor, DEEP_BLUE, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { CategoryData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AtlasCategoryIndex() {
  useDocumentTitle('All Categories');
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const sections: Section[] = categories.map((c) => ({
    id: c.slug.replace(/\s+/g, '-'),
    label: c.label ?? c.slug,
    color: categoryColor(c.slug),
    items: c.elements.map((sym) => {
      const el = getElement(sym);
      return { symbol: sym, description: el?.name ?? sym };
    }),
  }));

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: DEEP_BLUE }}>All Categories</h1>
      <div style={{ borderTop: `4px solid ${DEEP_BLUE}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
