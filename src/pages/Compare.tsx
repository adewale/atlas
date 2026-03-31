import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import { useIsMobile } from '../hooks/useIsMobile';
import { BACK_LINK_STYLE } from '../lib/theme';
import CompareView from '../components/CompareView';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Compare() {
  const { symbolA, symbolB } = useParams();
  const elementA = symbolA ? getElement(symbolA) : undefined;
  const elementB = symbolB ? getElement(symbolB) : undefined;
  const vertical = useIsMobile(600);
  useDocumentTitle(elementA && elementB ? `${elementA.name} vs ${elementB.name}` : 'Compare Not Found');

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
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <div style={{ marginTop: '16px' }}>
        <CompareView elementA={elementA} elementB={elementB} vertical={vertical} />
      </div>

      {/* Keyframes now in globals.css */}
    </PageShell>
  );
}
