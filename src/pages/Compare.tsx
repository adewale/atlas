import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import CompareView from '../components/CompareView';

export default function Compare() {
  const { symbolA, symbolB } = useParams();
  const elementA = symbolA ? getElement(symbolA) : undefined;
  const elementB = symbolB ? getElement(symbolB) : undefined;

  if (!elementA || !elementB) {
    return (
      <main>
        <h1>Compare — Element not found</h1>
        <p>
          Could not find one or both elements.{' '}
          <Link to="/">Back to periodic table</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '24px 0' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <div style={{ marginTop: '16px' }}>
        <CompareView elementA={elementA} elementB={elementB} />
      </div>

      <style>{`
        @keyframes compare-expand {
          from { clip-path: inset(0 50% 0 50%); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes compare-scale {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        @keyframes bar-grow {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes folio-line-reveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes compare-expand { from { clip-path: inset(0); } to { clip-path: inset(0); } }
          @keyframes compare-scale { from { transform: scale(1); } to { transform: scale(1); } }
          @keyframes bar-grow { from { clip-path: inset(0); } to { clip-path: inset(0); } }
          @keyframes folio-line-reveal { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </main>
  );
}
