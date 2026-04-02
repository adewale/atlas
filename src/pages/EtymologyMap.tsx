import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, MINERAL_BROWN, ASTRO_PURPLE, GREY_LIGHT, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

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

const MAX_WIDTH = 960;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EtymologyMap() {
  useDocumentTitle('Etymology Map', 'Origins of element names — grouped by language, place, person, property, and mythology.');
  const isMobile = useIsMobile();
  const { etymology } = useLoaderData() as { etymology: EtymologyEntry[] };

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: isMobile ? 360 : MAX_WIDTH,
    dropCapFont: `72px ${DROP_CAP_FONT}`,
  });

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

  const introSvgHeight = lines.length * lineHeight + 16;

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: MAX_WIDTH }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: DEEP_BLUE, margin: '0 0 16px', viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Etymology Map</h1>

        <svg
          viewBox={`0 0 ${isMobile ? 360 : MAX_WIDTH} ${Math.max(introSvgHeight, 76)}`}
          overflow="visible"
          style={{ width: '100%', maxWidth: MAX_WIDTH, marginBottom: 12 }}
          role="img"
          aria-label="Introduction to etymology map"
        >
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            fill={BLACK}
            maxWidth={isMobile ? 360 : MAX_WIDTH}
            animationStagger={40}
            dropCap={{ fontSize: 72, fill: DEEP_BLUE, char: introDC.char }}
          />
        </svg>

        <SectionedCardList
          sections={sections}
          accordion
          defaultCollapsed={isMobile}
        />
      </div>
    </PageShell>
  );
}
