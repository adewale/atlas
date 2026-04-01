import { useParams, useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK } from '../lib/theme';
import { VT } from '../lib/transitions';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import type { GroupData } from '../lib/types';

export default function AtlasGroup() {
  const { n } = useParams();
  const { groups } = useLoaderData() as { groups: GroupData[] };

  const group = groups.find((g) => g.n === Number(n));
  const symbols = group ? group.elements : [];
  const firstEl = symbols.length > 0 ? getElement(symbols[0]) : null;
  const color = firstEl ? blockColor(firstEl.block) : BLACK;

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={`Group ${n}`}
      color={color}
      viewTransitionName={VT.DATA_PLATE_GROUP}
      description={group?.description}
      elements={symbols}
      caption={`Group ${n}`}
      captionColor={color}
    />
  );
}
