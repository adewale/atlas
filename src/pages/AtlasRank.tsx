import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import AtlasPlate from '../components/AtlasPlate';
import type { RankingsData } from '../lib/types';

const LABELS: Record<string, string> = {
  mass: 'Atomic Mass',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionization Energy',
  radius: 'Atomic Radius',
};

export default function AtlasRank() {
  const { property } = useParams();
  const { rankings } = useLoaderData() as { rankings: RankingsData };

  const symbols = property ? rankings[property] ?? [] : [];
  const elements = symbols.map((s) => getElement(s)!).filter(Boolean);
  const label = property ? LABELS[property] ?? property : '';

  return (
    <main>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0' }}>Ranked by {label}</h1>
      {elements.length > 0 && (
        <AtlasPlate
          elements={elements}
          caption={`All 118 elements by ${label}`}
          captionColor="#133e7c"
          propertyKey={property}
        />
      )}
    </main>
  );
}
