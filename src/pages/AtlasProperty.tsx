import { useParams, useLoaderData } from 'react-router';
import { DEEP_BLUE } from '../lib/theme';
import AtlasBrowsePage from '../components/AtlasBrowsePage';
import MarginNote from '../components/MarginNote';
import { ALL_PROPERTIES, type NumericElementKey } from '../lib/properties';
import type { RankingsData } from '../lib/types';

const PROPERTY_BY_KEY = new Map(ALL_PROPERTIES.map((property) => [property.key, property]));

const RANK_NOTES: Record<NumericElementKey, string> = {
  mass: 'Atomic mass increases roughly with atomic number, but isotope stability and binding energy create exceptions — notably, tellurium (52) is heavier than iodine (53).',
  electronegativity: 'Electronegativity increases across a period and decreases down a group. Fluorine is the most electronegative element; francium the least.',
  ionizationEnergy: 'Ionisation energy reflects how tightly an atom holds its outermost electron. Noble gases top the list; alkali metals sit at the bottom.',
  radius: 'Atomic radius shrinks across a period as increasing nuclear charge pulls electrons closer. It grows down a group as new electron shells are added.',
  density: 'Density compares mass packed into a given volume. The densest stable metals cluster among the late transition elements.',
  meltingPoint: 'Melting point marks where a solid becomes liquid. Strong metallic and covalent bonding pushes refractory elements to the top.',
  boilingPoint: 'Boiling point marks where a liquid becomes gas. High values reveal elements whose atoms remain strongly bound even at extreme temperatures.',
};

export default function AtlasProperty() {
  const { property } = useParams();
  const { rankings } = useLoaderData() as { rankings: RankingsData };

  const propertyDef = property ? PROPERTY_BY_KEY.get(property as NumericElementKey) : undefined;
  const symbols = property ? rankings[property] ?? [] : [];
  const label = propertyDef?.label ?? property ?? '';

  return (
    <AtlasBrowsePage
      backLink={{ label: '← Properties', to: '/properties' }}
      heading={`Ranked by ${label}`}
      color={DEEP_BLUE}
      elements={symbols}
      caption={`${symbols.length} elements ranked by ${label}${propertyDef?.unit ? ` (${propertyDef.unit})` : ''}`}
      captionColor={DEEP_BLUE}
      propertyKey={property}
      marginNote={propertyDef ? (
        <MarginNote label={label} color={DEEP_BLUE} top={60}>
          <p style={{ margin: 0 }}>{RANK_NOTES[propertyDef.key]}</p>
        </MarginNote>
      ) : undefined}
    />
  );
}
