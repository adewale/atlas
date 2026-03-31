import { useParams, useLoaderData } from 'react-router';
import { blockColor } from '../lib/grid';
import { BLACK } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import type { BlockData } from '../lib/types';

export default function AtlasBlock() {
  const { block } = useParams();
  const { blocks } = useLoaderData() as { blocks: BlockData[] };

  const found = blocks.find((b) => b.block === block);
  const color = block ? blockColor(block) : BLACK;

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={`${block}-block`}
      color={color}
      viewTransitionName="data-plate-block"
      description={found?.description}
      elements={found ? found.elements : []}
      caption={`${block}-block elements`}
      captionColor={color}
    />
  );
}
