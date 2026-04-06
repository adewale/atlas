import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { getElement } from '../lib/data';
import { WARM_RED, MUSTARD, BLACK, DEEP_BLUE, MOBILE_VIZ_BREAKPOINT, VIZ_MAX_WIDTH } from '../lib/theme';
import IntroBlock from '../components/IntroBlock';
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

const INTRO_MAX_W = VIZ_MAX_WIDTH;

/* Colour cycle for discoverer sections */
const DISCOVERER_COLORS = [WARM_RED, DEEP_BLUE, MUSTARD, BLACK];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function DiscovererNetwork() {
  useDocumentTitle('Discoverer Network', 'Network graph of scientists and their element discoveries, showing collaboration clusters and prolific discoverers.');
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const { discoverers } = useLoaderData() as { discoverers: { name: string; elements: string[] }[] };

  // Separate antiquity group and prolific discoverers (2+ elements)
  const { antiquity, prolific } = useMemo(() => {
    const antiq = discoverers.find(
      (d) => d.name.toLowerCase().includes('antiquity'),
    );
    const rest = discoverers.filter(
      (d) => !d.name.toLowerCase().includes('antiquity'),
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

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: INTRO_MAX_W }}>
        <IntroBlock text={INTRO_TEXT} color={MUSTARD} dropCapSize={80} />

        <SectionedCardList sections={discovererSections} accordion defaultCollapsed={isMobile} />
      </div>
    </PageShell>
  );
}
