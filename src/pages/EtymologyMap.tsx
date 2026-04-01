import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLoaderData, useLocation } from 'react-router';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { getElement } from '../lib/data';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER, MINERAL_BROWN, ASTRO_PURPLE, GREY_LIGHT, GREY_MID, INSCRIPTION_STYLE } from '../lib/theme';
import { VT, vt } from '../lib/transitions';
import { useDropCapText } from '../hooks/usePretextLines';
import { PRETEXT_SANS } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
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

function originColor(origin: string): string {
  return ORIGIN_COLORS[origin.toLowerCase()] ?? '#999';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'Element names tell the story of science. Some honour places, some honour people, some invoke mythology. The etymology reveals centuries of discovery and human ambition.';

const CARD_W = 80;
const CARD_H = 48;
const CARD_GAP = 8;
const HEADER_H = 40;
const SECTION_GAP = 24;
const MAX_WIDTH = 960;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    background: PAPER,
    minHeight: '100vh',
  } as React.CSSProperties,

  content: {
    maxWidth: MAX_WIDTH,
  } as React.CSSProperties,

  backLink: {
    fontSize: '14px',
    color: BLACK,
  } as React.CSSProperties,

  title: {
    ...INSCRIPTION_STYLE,
    color: DEEP_BLUE,
    margin: '0 0 16px',
  } as React.CSSProperties,

  introSvg: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    marginBottom: 24,
  } as React.CSSProperties,

  sectionHeader: (color: string) =>
    ({
      width: '100%',
      height: HEADER_H,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      background: color,
      color: PAPER,
      fontWeight: 'bold',
      fontSize: '15px',
      letterSpacing: '0.03em',
      textTransform: 'capitalize',
      boxSizing: 'border-box',
      margin: 0,
    }) as React.CSSProperties,

  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    padding: '12px 0',
  } as React.CSSProperties,

  card: (color: string, delay: number, visible: boolean) =>
    ({
      width: CARD_W,
      height: CARD_H,
      border: `2px solid ${color}`,
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      textDecoration: 'none',
      color: BLACK,
      background: PAPER,
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 300ms var(--ease-out) ${delay}ms, transform 300ms var(--ease-out) ${delay}ms`,
    }) as React.CSSProperties,

  symbol: {
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 1.1,
  } as React.CSSProperties,

  desc: {
    fontSize: 9,
    lineHeight: 1.2,
    color: GREY_MID,
    textAlign: 'center',
    padding: '0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: CARD_W - 8,
  } as React.CSSProperties,

  count: {
    marginLeft: 'auto',
    fontWeight: 400,
    fontSize: 13,
    opacity: 0.85,
  } as React.CSSProperties,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EtymologyMap() {
  useDocumentTitle('Etymology Map');
  const { etymology } = useLoaderData() as { etymology: EtymologyEntry[] };
  const transitionNavigate = useViewTransitionNavigate();
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const location = useLocation();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: MAX_WIDTH,
    dropCapFont: `72px ${PRETEXT_SANS}`,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll to hash-targeted section on load
  useEffect(() => {
    const hash = location.hash.replace('#', '').toLowerCase();
    if (hash && sectionRefs.current[hash]) {
      sectionRefs.current[hash]!.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  // Order sections by the canonical list
  const orderedSections = useMemo(() => {
    const ORDER = ['place', 'person', 'mythology', 'property', 'mineral', 'astronomical', 'unknown'];
    const sectionMap = new Map(
      etymology.map((entry: EtymologyEntry) => [entry.origin.toLowerCase(), entry]),
    );
    return ORDER.map((key) => sectionMap.get(key)).filter(Boolean) as EtymologyEntry[];
  }, [etymology]);

  const introSvgHeight = lines.length * lineHeight + 16;

  return (
    <PageShell vizNav>
      <div style={styles.content}>

      <h1 style={{ ...styles.title, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Etymology Map</h1>

      <svg
        viewBox={`0 0 ${MAX_WIDTH} ${Math.max(introSvgHeight, 76)}`}
        overflow="visible"
        style={{ ...styles.introSvg, marginBottom: 12 }}
        role="img"
        aria-label="Introduction to etymology map"
      >
        <PretextSvg
          lines={lines}
          lineHeight={lineHeight}
          x={0}
          y={0}
          fill={BLACK}
          maxWidth={MAX_WIDTH}
          animationStagger={40}
          dropCap={{ fontSize: 72, fill: DEEP_BLUE, char: introDC.char }}
        />
      </svg>

      {orderedSections.map((section, sectionIdx) => {
        const color = originColor(section.origin);
        return (
          <section
            key={section.origin}
            id={section.origin.toLowerCase()}
            ref={(el) => { sectionRefs.current[section.origin.toLowerCase()] = el; }}
            style={{ marginBottom: SECTION_GAP }}
          >
            <h2 style={styles.sectionHeader(color)}>
              <span>{section.origin}</span>
              <span style={styles.count}>{section.elements.length}</span>
            </h2>

            <div style={styles.cardGrid}>
              {section.elements.map((el, cardIdx) => {
                const stagger = sectionIdx * 30 + cardIdx * 25;
                return (
                  <Link
                    key={el.symbol}
                    to={`/element/${el.symbol}`}
                    title={`${getElement(el.symbol)?.name}: ${el.description}`}
                    className="etymology-card"
                    style={styles.card(color, stagger, hasLoaded)}
                    aria-label={`${el.symbol} — ${el.description}`}
                    onClick={(e) => { e.preventDefault(); setActiveSymbol(el.symbol); transitionNavigate(`/element/${el.symbol}`); }}
                  >
                    <span style={{ ...styles.symbol, viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL) } as React.CSSProperties}>{el.symbol}</span>
                    <span style={styles.desc as React.CSSProperties}>
                      {el.description}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      </div>
    </PageShell>
  );
}
