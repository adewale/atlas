import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { categoryColor, DEEP_BLUE } from '../lib/theme';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
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
      <PageHeader title="All Categories" color={DEEP_BLUE} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
