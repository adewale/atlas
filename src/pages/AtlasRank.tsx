import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { DEEP_BLUE } from '../lib/theme';
import AtlasPlate from '../components/AtlasPlate';
import type { RankingsData } from '../lib/types';
import SiteNav from '../components/SiteNav';

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
  const elements = symbols.map((s) => getElement(s)!).filter(Boolean);
  const label = property ? LABELS[property] ?? property : '';

  return (
    <main>
      <Link to="/" style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', color: '#666' }}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: DEEP_BLUE }}>Ranked by {label}</h1>
      <div style={{ borderTop: `4px solid ${DEEP_BLUE}`, marginBottom: '16px' }} />
      {elements.length > 0 && (
        <AtlasPlate
          elements={elements}
          caption={`All 118 elements by ${label}`}
          captionColor={DEEP_BLUE}
          propertyKey={property}
        />
      )}
      <SiteNav />
    </main>
  );
}
