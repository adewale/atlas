import { useParams, useLoaderData } from 'react-router';
import { DEEP_BLUE } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import type { RankingsData } from '../lib/types';

const LABELS: Record<string, string> = {
  mass: 'Atomic Mass',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionisation Energy',
  radius: 'Atomic Radius',
};

export default function AtlasRank() {
  const { property } = useParams();
  const { rankings } = useLoaderData() as { rankings: RankingsData };

  const symbols = property ? rankings[property] ?? [] : [];
  const label = property ? LABELS[property] ?? property : '';

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Table', to: '/' }}
      heading={`Ranked by ${label}`}
      color={DEEP_BLUE}
      elements={symbols}
      caption={`All 118 elements by ${label}`}
      captionColor={DEEP_BLUE}
      propertyKey={property}
    />
  );
}
