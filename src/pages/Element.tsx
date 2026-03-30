import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord, ElementSources, GroupData } from '../lib/types';
import Folio from '../components/Folio';

export default function Element() {
  const { symbol } = useParams();
  const element = symbol ? getElement(symbol) : undefined;
  const [sources, setSources] = useState<ElementSources | undefined>();
  const [groups, setGroups] = useState<GroupData[] | undefined>();

  useEffect(() => {
    if (!symbol) return;
    // Load per-element JSON with sources
    import(`../../data/generated/element-${symbol}.json`)
      .then((mod) => {
        const data = mod.default as ElementRecord;
        if (data.sources) setSources(data.sources);
      })
      .catch(() => {
        // sources not available
      });
    // Load groups data for sparkline
    import('../../data/generated/groups.json')
      .then((mod) => {
        setGroups(mod.default as GroupData[]);
      })
      .catch(() => {
        // groups not available
      });
  }, [symbol]);

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
        <Link to="/" style={{ fontSize: '14px' }}>
          ← Periodic Table
        </Link>
      </div>
      <Folio element={element} sources={sources} groups={groups} animate={true} />

      {/* Folio entry animations CSS */}
      <style>{`
        @keyframes folio-line-reveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes plate-wipe {
          from {
            clip-path: inset(0 0 0 100%);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes bar-grow {
          from {
            clip-path: inset(0 100% 0 0);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes folio-line-reveal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes plate-wipe {
            from { clip-path: inset(0); }
            to { clip-path: inset(0); }
          }
          @keyframes bar-grow {
            from { clip-path: inset(0); }
            to { clip-path: inset(0); }
          }
        }
      `}</style>
    </main>
  );
}
