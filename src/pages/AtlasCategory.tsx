import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import AtlasPlate from '../components/AtlasPlate';
import type { CategoryData } from '../lib/types';

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const cat = categories.find((c) => c.slug === slug);
  const elements = cat ? cat.elements.map((s) => getElement(s)!).filter(Boolean) : [];
  const label = slug?.replace(/-/g, ' ') ?? '';

  // Category coloring: metal=blue, nonmetal/noble=red, metalloid=mustard
  let color = '#133e7c';
  if (label.includes('nonmetal') || label.includes('noble')) color = '#9e1c2c';
  else if (label.includes('metalloid')) color = '#c59b1a';

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
