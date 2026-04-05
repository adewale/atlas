import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { FolioBundle } from '../lib/types';
import Folio from '../components/Folio';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { BACK_LINK_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Element() {
  const { symbol } = useParams();
  const element = symbol ? getElement(symbol) : undefined;
  const loaderData = useLoaderData() as { folioBundle: FolioBundle } | undefined;
  const folioBundle = loaderData?.folioBundle;

  const transitionNavigate = useViewTransitionNavigate();
  useDocumentTitle(
    element ? element.name : 'Element Not Found',
    element
      ? `${element.name} (${element.symbol}) — atomic number ${element.atomicNumber}, ${element.category}. Discovery, properties, and relationships.`
      : undefined,
  );

  if (!element) {
    return (
      <PageShell>
        <h1>Element not found</h1>
        <p>
          No element with symbol &ldquo;{symbol}&rdquo;.{' '}
          <Link to="/">Back to periodic table</Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        to="/"
        onClick={(e) => { e.preventDefault(); transitionNavigate('/'); }}
        style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}
      >
        ← Table
      </Link>
      <article>
        <Folio element={element} folioBundle={folioBundle} animate={true} />
      </article>
    </PageShell>
  );
}
