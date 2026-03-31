import { useParams, useLoaderData } from 'react-router';
import { fromSlug, categoryColor } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import type { CategoryData } from '../lib/types';

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const label = fromSlug(slug ?? '');
  const cat = categories.find((c) => c.slug === label);
  const color = categoryColor(label);

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={label}
      color={color}
      elements={cat ? cat.elements : []}
      caption={label}
      captionColor={color}
      description={cat?.description}
    />
  );
}
