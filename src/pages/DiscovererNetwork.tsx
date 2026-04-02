import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { WARM_RED, MUSTARD, BLACK, DEEP_BLUE, INSCRIPTION_STYLE, MOBILE_VIZ_BREAKPOINT } from '../lib/theme';
import { VT } from '../lib/transitions';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const INTRO_TEXT =
  'Some scientists discovered a single element. Others reshaped the periodic table. Glenn Seaborg discovered ten elements. Humphry Davy electrolysed his way to six. This chart maps the prolific discoverers.';

const INTRO_MAX_W = 760;

/* Colour cycle for discoverer sections */
const DISCOVERER_COLORS = [WARM_RED, DEEP_BLUE, MUSTARD, BLACK];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function DiscovererNetwork() {
  useDocumentTitle('Discoverer Network', 'Network graph of scientists and their element discoveries, showing collaboration clusters and prolific discoverers.');
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const { discoverers } = useLoaderData() as { discoverers: { name: string; elements: string[] }[] };

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: isMobile ? 360 : INTRO_MAX_W,
    dropCapFont: `72px ${DROP_CAP_FONT}`,
  });

  // Separate antiquity group and prolific discoverers (2+ elements)
  const { antiquity, prolific } = useMemo(() => {
    const antiq = discoverers.find(
      (d) => d.name.toLowerCase().includes('antiquity'),
    );
    const rest = discoverers.filter(
      (d) => !d.name.toLowerCase().includes('antiquity') && d.elements.length >= 2,
    );
    return { antiquity: antiq, prolific: rest };
  }, [discoverers]);

  // Build sections for card list
  const discovererSections: Section[] = useMemo(() => {
    const all = [
      ...(antiquity ? [antiquity] : []),
      ...prolific,
    ];
    return all.map((disc, i) => ({
      id: disc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: disc.name,
      color: DISCOVERER_COLORS[i % DISCOVERER_COLORS.length],
      items: disc.elements.map(sym => {
        const el = getElement(sym);
        return { symbol: sym, description: el?.name ?? sym };
      }),
    }));
  }, [antiquity, prolific]);

  const introTextHeight = lines.length * lineHeight + 16;
  const introH = Math.max(introTextHeight, 76);
  const introWidth = isMobile ? 360 : INTRO_MAX_W;

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: INTRO_MAX_W }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discoverer Network</h1>

        <svg
          viewBox={`0 0 ${introWidth} ${introH}`}
          style={{ width: '100%', maxWidth: introWidth, display: 'block', marginBottom: '12px' }}
        >
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            fontSize={16}
            fill={BLACK}
            maxWidth={introWidth}
            animationStagger={40}
            dropCap={{ fontSize: 72, fill: MUSTARD, char: introDC.char }}
          />
        </svg>

        <SectionedCardList sections={discovererSections} accordion defaultCollapsed={isMobile} />
      </div>
    </PageShell>
  );
}
