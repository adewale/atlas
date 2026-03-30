import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import { useIsMobile } from '../hooks/useIsMobile';
import CompareView from '../components/CompareView';
import SiteNav from '../components/SiteNav';

export default function Compare() {
  const { symbolA, symbolB } = useParams();
  const elementA = symbolA ? getElement(symbolA) : undefined;
  const elementB = symbolB ? getElement(symbolB) : undefined;
  const vertical = useIsMobile(600);

  if (!elementA || !elementB) {
    return (
      <main>
        <h1>Compare — Element not found</h1>
        <p>
          Could not find one or both elements.{' '}
          <Link to="/">Back to periodic table</Link>
        </p>
        <SiteNav />
    </main>
    );
  }

  return (
    <main>
      <Link to="/" style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', color: '#666' }}>← Table</Link>
      <div style={{ marginTop: '16px' }}>
        <CompareView elementA={elementA} elementB={elementB} vertical={vertical} />
      </div>

      {/* Keyframes now in globals.css */}
      <SiteNav />
    </main>
  );
}
