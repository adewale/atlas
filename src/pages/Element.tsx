import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord, ElementSources, GroupData, AnomalyData } from '../lib/types';
import Folio from '../components/Folio';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';

export default function Element() {
  const { symbol } = useParams();
  const element = symbol ? getElement(symbol) : undefined;
  const loaderData = useLoaderData() as
    | { element: ElementRecord; groups: GroupData[]; anomalies: AnomalyData[] }
    | undefined;

  const sources: ElementSources | undefined = loaderData?.element?.sources;
  const groups: GroupData[] | undefined = loaderData?.groups;
  const anomalies: AnomalyData[] | undefined = loaderData?.anomalies;
  const transitionNavigate = useViewTransitionNavigate();

  if (!element) {
    return (
      <main>
        <h1>Element not found</h1>
        <p>
          No element with symbol &ldquo;{symbol}&rdquo;.{' '}
          <Link to="/">Back to periodic table</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '16px' }}>
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); transitionNavigate('/'); }}
          style={{ fontSize: '14px' }}
        >
          ← Periodic Table
        </a>
      </div>
      <article>
        <Folio element={element} sources={sources} groups={groups} anomalies={anomalies} animate={true} />
      </article>

      {/* Keyframes now in globals.css */}
    </main>
  );
}
