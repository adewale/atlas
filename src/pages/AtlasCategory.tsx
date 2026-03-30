import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { fromSlug, categoryColor } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { CategoryData } from '../lib/types';
import SiteNav from '../components/SiteNav';

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const label = fromSlug(slug ?? '');
  const cat = categories.find((c) => c.slug === label);
  const elements = cat ? cat.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const color = categoryColor(label);

  return (
    <main>
      <Link to="/" style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', color: '#666' }}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color }}>{label}</h1>
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={label} captionColor={color} />
      )}
      <SiteNav />
    </main>
  );
}
