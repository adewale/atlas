import { useParams, useLoaderData } from 'react-router';
import { blockColor } from '../lib/grid';
import { BLACK } from '../lib/theme';
import { VT } from '../lib/transitions';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
import type { BlockData } from '../lib/types';

const BLOCK_NOTES: Record<string, string> = {
  s: 'The s-block includes groups 1–2 and helium. These elements have their outermost electron in an s orbital — they tend to be highly reactive metals (except helium).',
  p: 'The p-block spans groups 13–18. It contains the most diverse chemistry: metals, metalloids, nonmetals, and all the noble gases.',
  d: 'The d-block (groups 3–12) contains the transition metals. Their partially filled d orbitals give them variable oxidation states and coloured compounds.',
  f: 'The f-block includes the lanthanides and actinides. Their deeply buried f electrons make them chemically similar within each series — and notoriously hard to separate.',
};

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
      viewTransitionName={VT.DATA_PLATE_BLOCK}
      description={found?.description}
      elements={found ? found.elements : []}
      caption={`${block}-block elements`}
      captionColor={color}
      marginNote={block && BLOCK_NOTES[block] ? (
        <MarginNote label={`${block}-block`} color={color} top={60}>
          <p style={{ margin: 0 }}>{BLOCK_NOTES[block]}</p>
        </MarginNote>
      ) : undefined}
    />
  );
}
