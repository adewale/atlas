import { useLoaderData } from 'react-router';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, DEEP_BLUE, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import type { TimelineData } from '../lib/types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function TimelineIndex() {
  useDocumentTitle('All Timeline Eras');
  const data = useLoaderData() as TimelineData;

  // Build decade groups from timeline entries
  const decades = new Map<string, { label: string; era: string; symbols: string[] }>();

  // Antiquity first
  if (data.antiquity.length > 0) {
    decades.set('antiquity', {
      label: `Antiquity (${data.antiquity.length} elements)`,
      era: 'antiquity',
      symbols: data.antiquity.map((e) => e.symbol),
    });
  }

  // Group timeline entries by decade
  for (const entry of data.timeline) {
    if (entry.year == null) continue;
    const decade = Math.floor(entry.year / 10) * 10;
    const key = String(decade);
    if (!decades.has(key)) {
      decades.set(key, {
        label: `${decade}s`,
        era: key,
        symbols: [],
      });
    }
    decades.get(key)!.symbols.push(entry.symbol);
  }

  const sections: Section[] = Array.from(decades.values()).map((d) => {
    const firstEl = d.symbols.length > 0 ? getElement(d.symbols[0]) : null;
    const color = firstEl ? blockColor(firstEl.block) : BLACK;
    return {
      id: d.era,
      label: d.label,
      color,
      items: d.symbols.map((sym) => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    };
  });

  return (
    <PageShell>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px', color: DEEP_BLUE }}>Discovery Timeline</h1>
      <div style={{ borderTop: `4px solid ${DEEP_BLUE}`, marginBottom: '16px' }} />
      <SectionedCardList sections={sections} accordion defaultCollapsed />
    </PageShell>
  );
}
