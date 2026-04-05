import { useParams, useLoaderData } from 'react-router';
import { categoryColor } from '../lib/theme';
import { fromUrlSlug } from '../lib/slugs';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
import type { CategoryData } from '../lib/types';

export default function AtlasCategory() {
  const { slug } = useParams();
  const { categories } = useLoaderData() as { categories: CategoryData[] };

  const label = fromUrlSlug(slug ?? '');
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
      marginNote={
        <MarginNote label="Categories" color={color} top={60}>
          <p style={{ margin: 0 }}>
            Element categories group elements by shared physical and chemical properties — metals, nonmetals, metalloids, and noble gases each behave distinctly.
          </p>
        </MarginNote>
      }
    />
  );
}
