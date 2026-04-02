import { Link } from 'react-router';
import { MUSTARD, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PROPERTIES = [
  { key: 'mass', label: 'Atomic Mass', description: 'Elements ranked by atomic mass (u)' },
  { key: 'electronegativity', label: 'Electronegativity', description: 'Pauling scale electronegativity ranking' },
  { key: 'ionizationEnergy', label: 'Ionisation Energy', description: 'First ionisation energy (eV)' },
  { key: 'radius', label: 'Atomic Radius', description: 'Empirical atomic radius (pm)' },
  { key: 'density', label: 'Density', description: 'Density at STP (g/cm³)' },
  { key: 'meltingPoint', label: 'Melting Point', description: 'Melting point (K)' },
  { key: 'boilingPoint', label: 'Boiling Point', description: 'Boiling point (K)' },
];

export default function RankIndex() {
  useDocumentTitle('All Rankings');

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: MUSTARD }}>Rankings</h1>
      <div style={{ borderTop: `4px solid ${MUSTARD}`, marginBottom: '16px' }} />
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {PROPERTIES.map((p) => (
          <li key={p.key}>
            <Link
              to={`/ranks/${p.key}`}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderLeft: `3px solid ${MUSTARD}`,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong>{p.label}</strong>
              <br />
              <span style={{ fontSize: '13px', opacity: 0.7 }}>{p.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
