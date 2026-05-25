import { Link } from 'react-router';
import { MUSTARD, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import { ALL_PROPERTIES, type NumericElementKey } from '../lib/properties';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PROPERTY_DESCRIPTIONS: Record<NumericElementKey, string> = {
  mass: 'Elements ordered by atomic mass (Da)',
  electronegativity: 'Pauling scale electronegativity values',
  ionizationEnergy: 'First ionisation energy (eV)',
  radius: 'Empirical atomic radius (pm)',
  density: 'Density at STP (g/cm³)',
  meltingPoint: 'Melting point (K)',
  boilingPoint: 'Boiling point (K)',
};

const PROPERTIES = ALL_PROPERTIES.map((property) => ({
  ...property,
  description: PROPERTY_DESCRIPTIONS[property.key],
}));

export default function PropertyIndex() {
  useDocumentTitle('All Properties');

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: MUSTARD }}>Properties</h1>
      <div style={{ borderTop: `4px solid ${MUSTARD}`, marginBottom: '16px' }} />
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {PROPERTIES.map((p) => (
          <li key={p.key}>
            <Link
              to={`/properties/${p.key}`}
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
