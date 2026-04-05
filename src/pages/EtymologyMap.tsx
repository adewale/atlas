import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, MINERAL_BROWN, ASTRO_PURPLE, GREY_LIGHT } from '../lib/theme';
import IntroBlock from '../components/IntroBlock';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EtymologyEntry = {
  origin: string;
  elements: { symbol: string; description: string }[];
};

// ---------------------------------------------------------------------------
// Origin → colour mapping (Byrne-style hard colour categories)
// ---------------------------------------------------------------------------
const ORIGIN_COLORS: Record<string, string> = {
  place: DEEP_BLUE,
  person: WARM_RED,
  mythology: MUSTARD,
  property: BLACK,
  mineral: MINERAL_BROWN,
  astronomical: ASTRO_PURPLE,
  unknown: GREY_LIGHT,
};

const ORIGIN_ORDER = ['place', 'person', 'mythology', 'property', 'mineral', 'astronomical', 'unknown'];

const ORIGIN_LABELS: Record<string, string> = {
  place: 'Place',
  person: 'Person',
  mythology: 'Mythology',
  property: 'Property',
  mineral: 'Mineral',
  astronomical: 'Astronomical',
  unknown: 'Unknown',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'Element names tell the story of science. Some honour places, some honour people, some invoke mythology. The etymology reveals centuries of discovery and human ambition.';

const MAX_WIDTH = 760;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EtymologyMap() {
  useDocumentTitle('Etymology Map', 'Origins of element names — grouped by language, place, person, property, and mythology.');
  const { etymology } = useLoaderData() as { etymology: EtymologyEntry[] };

  // Build sections from etymology data
  const sections: Section[] = useMemo(() => {
    const sectionMap = new Map(
      etymology.map((entry: EtymologyEntry) => [entry.origin.toLowerCase(), entry]),
    );
    return ORIGIN_ORDER
      .map(key => {
        const entry = sectionMap.get(key);
        if (!entry) return null;
        return {
          id: key,
          label: ORIGIN_LABELS[key] ?? key,
          color: ORIGIN_COLORS[key] ?? GREY_LIGHT,
          items: entry.elements.map(el => ({
            symbol: el.symbol,
            description: el.description,
          })),
        };
      })
      .filter((s): s is Section => s != null && s.items.length > 0);
  }, [etymology]);

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: MAX_WIDTH }}>
        <IntroBlock text={INTRO_TEXT} color={DEEP_BLUE} dropCapSize={80} />

        <SectionedCardList
          sections={sections}
          accordion
          defaultCollapsed={false}
        />
      </div>
    </PageShell>
  );
}
