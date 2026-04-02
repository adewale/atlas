import { useSearchParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import { useIsMobile } from '../hooks/useIsMobile';
import { BACK_LINK_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import CompareView from '../components/CompareView';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const symbolA = searchParams.get('a');
  const symbolB = searchParams.get('b');
  const elementA = symbolA ? getElement(symbolA) : undefined;
  const elementB = symbolB ? getElement(symbolB) : undefined;
  const vertical = useIsMobile(600);
  useDocumentTitle(
    elementA && elementB ? `${elementA.name} vs ${elementB.name}` : 'Compare Not Found',
    elementA && elementB
      ? `Side-by-side comparison of ${elementA.name} and ${elementB.name} — mass, electronegativity, ionisation energy, and atomic radius.`
      : undefined,
  );

  if (!elementA || !elementB) {
    return (
      <PageShell>
        <h1>Compare — Element not found</h1>
        <p>
          Could not find one or both elements.{' '}
          <Link to="/">Back to periodic table</Link>
        </p>
    </PageShell>
    );
  }

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <div style={{ marginTop: '16px' }}>
        <CompareView elementA={elementA} elementB={elementB} vertical={vertical} />
      </div>

      {/* Keyframes now in globals.css */}
    </PageShell>
  );
}
