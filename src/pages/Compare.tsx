import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { useIsMobile } from '../hooks/useIsMobile';
import { BACK_LINK_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import CompareView from '../components/CompareView';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Compare() {
  const { symbol, other } = useParams();
  const gridElA = symbol ? getElement(symbol) : undefined;
  const gridElB = other ? getElement(other) : undefined;
  const loaderData = useLoaderData() as { elements: ElementRecord[] } | undefined;
  const bySymbol = new Map(loaderData?.elements.map((e) => [e.symbol, e]));
  const elementA = symbol ? bySymbol.get(symbol) : undefined;
  const elementB = other ? bySymbol.get(other) : undefined;
  const vertical = useIsMobile(600);
  useDocumentTitle(
    gridElA && gridElB ? `${gridElA.name} vs ${gridElB.name}` : 'Compare Not Found',
    gridElA && gridElB
      ? `Side-by-side comparison of ${gridElA.name} and ${gridElB.name} — mass, electronegativity, ionisation energy, and atomic radius.`
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
      <Link to={`/elements/${symbol}`} style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← {elementA.name}</Link>
      <div style={{ marginTop: '16px' }}>
        <CompareView elementA={elementA} elementB={elementB} vertical={vertical} />
      </div>

      {/* Keyframes now in globals.css */}
    </PageShell>
  );
}
