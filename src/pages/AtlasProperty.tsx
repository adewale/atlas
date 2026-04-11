import { useParams, useLoaderData } from 'react-router';
import { DEEP_BLUE } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
import type { RankingsData } from '../lib/types';

const LABELS: Record<string, string> = {
  mass: 'Atomic Mass',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionisation Energy',
  radius: 'Atomic Radius',
};

const RANK_NOTES: Record<string, string> = {
  mass: 'Atomic mass increases roughly with atomic number, but isotope stability and binding energy create exceptions — notably, tellurium (52) is heavier than iodine (53).',
  electronegativity: 'Electronegativity increases across a period and decreases down a group. Fluorine is the most electronegative element; francium the least.',
  ionizationEnergy: 'Ionisation energy reflects how tightly an atom holds its outermost electron. Noble gases top the list; alkali metals sit at the bottom.',
  radius: 'Atomic radius shrinks across a period as increasing nuclear charge pulls electrons closer. It grows down a group as new electron shells are added.',
};

export default function AtlasProperty() {
  const { property } = useParams();
  const { rankings } = useLoaderData() as { rankings: RankingsData };

  const symbols = property ? rankings[property] ?? [] : [];
  const label = property ? LABELS[property] ?? property : '';

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Properties', to: '/properties' }}
      heading={`Ranked by ${label}`}
      color={DEEP_BLUE}
      elements={symbols}
      caption={`All 118 elements by ${label}`}
      captionColor={DEEP_BLUE}
      propertyKey={property}
      marginNote={property && RANK_NOTES[property] ? (
        <MarginNote label={label} color={DEEP_BLUE} top={60}>
          <p style={{ margin: 0 }}>{RANK_NOTES[property]}</p>
        </MarginNote>
      ) : undefined}
    />
  );
}
