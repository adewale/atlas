import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EtymologyEntry = {
  origin: string;
  elements: { symbol: string; description: string }[];
};

// ---------------------------------------------------------------------------
// Origin → color mapping (Byrne-style hard color categories)
// ---------------------------------------------------------------------------
const ORIGIN_COLORS: Record<string, string> = {
  place: DEEP_BLUE,
  person: WARM_RED,
  mythology: MUSTARD,
  property: BLACK,
  mineral: '#5a3e1b',
  astronomical: '#4a0e6b',
  unknown: '#999',
};

function originColor(origin: string): string {
  return ORIGIN_COLORS[origin.toLowerCase()] ?? '#999';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const INTRO_TEXT =
  'Element names tell the story of science. Some honor places, some honor people, some invoke mythology. The etymology reveals centuries of discovery and human ambition.';

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
    maxWidth: MAX_WIDTH,
    margin: '0 auto',
    padding: '24px 16px 64px',
    fontFamily: 'system-ui, sans-serif',
    background: PAPER,
    minHeight: '100vh',
  } as React.CSSProperties,

  backLink: {
    fontSize: '14px',
    color: BLACK,
  } as React.CSSProperties,

  title: {
    margin: '16px 0 8px',
    fontSize: '28px',
    fontWeight: 700,
    color: BLACK,
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
      color: '#fff',
      fontWeight: 700,
      fontSize: '15px',
      letterSpacing: '0.03em',
      textTransform: 'capitalize',
      boxSizing: 'border-box',
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
    fontWeight: 700,
    fontSize: 18,
    lineHeight: 1.1,
  } as React.CSSProperties,

  desc: {
    fontSize: 9,
    lineHeight: 1.2,
    color: '#555',
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
  const { etymology } = useLoaderData() as { etymology: EtymologyEntry[] };
  const [hasLoaded, setHasLoaded] = useState(false);

  const { lines, lineHeight } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: MAX_WIDTH,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Order sections by the canonical list
  const ORDER = ['place', 'person', 'mythology', 'property', 'mineral', 'astronomical', 'unknown'];
  const sectionMap = new Map(
    etymology.map((entry) => [entry.origin.toLowerCase(), entry]),
  );
  const orderedSections = ORDER.map((key) => sectionMap.get(key)).filter(
    Boolean,
  ) as EtymologyEntry[];

  const introSvgHeight = lines.length * lineHeight + 8;

  return (
    <main style={styles.page}>
      <Link to="/" style={styles.backLink}>
        ← Periodic Table
      </Link>

      <h1 style={styles.title}>Etymology Map</h1>

      <svg
        viewBox={`0 0 ${MAX_WIDTH} ${introSvgHeight}`}
        style={styles.introSvg}
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
        />
      </svg>

      {orderedSections.map((section, sectionIdx) => {
        const color = originColor(section.origin);
        return (
          <section
            key={section.origin}
            style={{ marginBottom: SECTION_GAP }}
          >
            <div style={styles.sectionHeader(color)}>
              <span>{section.origin}</span>
              <span style={styles.count}>{section.elements.length}</span>
            </div>

            <div style={styles.cardGrid}>
              {section.elements.map((el, cardIdx) => {
                const stagger = sectionIdx * 30 + cardIdx * 25;
                return (
                  <Link
                    key={el.symbol}
                    to={`/element/${el.symbol}`}
                    style={styles.card(color, stagger, hasLoaded)}
                    aria-label={`${el.symbol} — ${el.description}`}
                  >
                    <span style={styles.symbol}>{el.symbol}</span>
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
    </main>
  );
}
