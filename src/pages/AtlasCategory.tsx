import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { fromSlug, categoryColor } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { CategoryData } from '../lib/types';

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const label = fromSlug(slug ?? '');
  const cat = categories.find((c) => c.slug === label);
  const elements = cat ? cat.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = categoryColor(label);

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0', textTransform: 'capitalize' }}>{label}</h1>
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={label} captionColor={color} />
      )}
    </main>
  );
}
