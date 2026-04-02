import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, PAPER, DEEP_BLUE, WARM_RED, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, SECTION_LABEL_STYLE, STROKE_THIN } from '../lib/theme';
import NavigationPill from '../components/NavigationPill';
import { useDropCapText } from '../hooks/usePretextLines';
import { VT } from '../lib/transitions';
import { DROP_CAP_FONT, measureLines } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import ElementSquare from '../components/ElementSquare';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TimelineEntry = { symbol: string; year: number | null; discoverer: string };
type TimelineData = { antiquity: TimelineEntry[]; timeline: TimelineEntry[] };

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const SVG_WIDTH = 900;
const SVG_HEIGHT = 300;

const MARGIN_LEFT = 120; // room for antiquity cluster
const MARGIN_RIGHT = 20;
const MARGIN_BOTTOM = 50;

const YEAR_MIN = 1650;
const YEAR_MAX = 2030;
const DECADE_BIN = 10;
const SQ = 14; // square size
const SQ_GAP = 2;

const INTRO_TEXT =
  'The periodic table was built over centuries. Ancient peoples knew gold, iron, and copper. The 18th century brought the gas rush. The 20th century saw the synthetic era.';

// Antiquity cluster center: starts at x=10, 5 columns of (SQ + SQ_GAP)
const ANTIQ_CENTER_X = 10 + (5 * (SQ + SQ_GAP)) / 2;

const ERA_LABELS: { x: number; label: string }[] = [
  { x: ANTIQ_CENTER_X, label: 'Ancient' },
  { x: yearToX(1750), label: '1700s: Gases & Alkalis' },
  { x: yearToX(1850), label: '1800s: Spectroscopy era' },
  { x: yearToX(1950), label: '1900s+: Nuclear synthesis' },
];

// ---------------------------------------------------------------------------
// Era definitions for mobile sections
// ---------------------------------------------------------------------------
const ERA_SECTIONS = [
  { id: 'antiquity', label: 'Antiquity', yearRange: null as [number, number] | null },
  { id: '1700s', label: '1700s — Gases & Alkalis', yearRange: [1700, 1800] as [number, number] },
  { id: '1800s', label: '1800s — Spectroscopy Era', yearRange: [1800, 1900] as [number, number] },
  { id: '1900s', label: '1900s — Atomic Age', yearRange: [1900, 2000] as [number, number] },
  { id: '2000s', label: '2000s — Synthesis Frontier', yearRange: [2000, 2100] as [number, number] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function yearToX(year: number): number {
  const t = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  return MARGIN_LEFT + t * (SVG_WIDTH - MARGIN_LEFT - MARGIN_RIGHT);
}

function decadeOf(year: number): number {
  return Math.floor(year / DECADE_BIN) * DECADE_BIN;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
type Tooltip = { x: number; y: number; name: string; year: string; discoverer: string } | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DiscoveryTimeline() {
  useDocumentTitle('Discovery Timeline', 'Interactive timeline of element discoveries from antiquity to the present, grouped by decade and coloured by block.');
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const { antiquity, timeline } = useLoaderData() as TimelineData;
  const navigate = useNavigate();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  const introWidth = isMobile ? 360 : 760;
  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: introWidth,
    dropCapFont: `80px ${DROP_CAP_FONT}`,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const axisY = SVG_HEIGHT - MARGIN_BOTTOM;

  type PlacedSquare = {
    entry: TimelineEntry;
    x: number;
    y: number;
    color: string;
    delay: number;
  };

  // All decades with elements (for era browse links)
  const allDecades = useMemo(() => {
    const decades = new Set<number>();
    for (const e of timeline) {
      if (e.year != null) decades.add(decadeOf(e.year));
    }
    return [...decades].sort((a, b) => a - b);
  }, [timeline]);

  // Memoize all layout computations — they depend only on loader data
  const { squares, antiquitySquares } = useMemo(() => {
    // Bin timeline entries by decade
    const decadeBins = new Map<number, TimelineEntry[]>();
    for (const entry of timeline) {
      if (entry.year == null) continue;
      const d = decadeOf(entry.year);
      if (!decadeBins.has(d)) decadeBins.set(d, []);
      decadeBins.get(d)!.push(entry);
    }

    const years = timeline.filter((e) => e.year != null).map((e) => e.year!);
    const mYear = Math.min(...years);

    const sqs: PlacedSquare[] = [];
    for (const [decade, entries] of decadeBins) {
      const cx = yearToX(decade + 5);
      entries.forEach((entry, stackIdx) => {
        const el = getElement(entry.symbol);
        const color = el ? blockColor(el.block) : BLACK;
        const x = cx - SQ / 2;
        const y = axisY - SQ - stackIdx * (SQ + SQ_GAP);
        const delay = (entry.year! - mYear) * 2;
        sqs.push({ entry, x, y, color, delay });
      });
    }

    // Antiquity cluster: 2 rows x 5 columns at left
    const ANTIQ_X = 10;
    const ANTIQ_Y = axisY - SQ;
    const ANTIQ_COLS = 5;
    const antSqs: PlacedSquare[] = antiquity.map((entry, i) => {
      const col = i % ANTIQ_COLS;
      const row = Math.floor(i / ANTIQ_COLS);
      const el = getElement(entry.symbol);
      const color = el ? blockColor(el.block) : BLACK;
      return {
        entry,
        x: ANTIQ_X + col * (SQ + SQ_GAP),
        y: ANTIQ_Y - row * (SQ + SQ_GAP),
        color,
        delay: i * 40,
      };
    });

    return { squares: sqs, antiquitySquares: antSqs };
  }, [antiquity, timeline, axisY]);

  // Build sections for mobile view
  const eraSections: Section[] = useMemo(() => {
    return ERA_SECTIONS.map(era => {
      let entries: TimelineEntry[];
      if (era.yearRange === null) {
        entries = antiquity;
      } else {
        const [lo, hi] = era.yearRange;
        entries = timeline.filter(e => e.year != null && e.year >= lo && e.year < hi);
      }

      return {
        id: era.id,
        label: era.label,
        color: DEEP_BLUE,
        items: entries.map(e => {
          const el = getElement(e.symbol);
          const yearStr = e.year != null ? ` (${e.year})` : '';
          return {
            symbol: e.symbol,
            description: `${el?.name ?? e.symbol}${yearStr}`,
          };
        }),
      };
    }).filter(s => s.items.length > 0);
  }, [antiquity, timeline]);

  const handleSquareEnter = useCallback(
    (sq: PlacedSquare, svgX: number, svgY: number) => {
      const el = getElement(sq.entry.symbol);
      setTooltip({
        x: svgX,
        y: svgY - 10,
        name: el?.name ?? sq.entry.symbol,
        year: sq.entry.year != null ? String(sq.entry.year) : 'Antiquity',
        discoverer: sq.entry.discoverer,
      });
    },
    [],
  );

  const handleSquareLeave = useCallback(() => setTooltip(null), []);

  const handleSquareClick = useCallback(
    (symbol: string) => {
      navigate(`/elements/${symbol}`);
    },
    [navigate],
  );

  const centuryMarks = [1700, 1800, 1900, 2000];

  const introHeight = lines.length * lineHeight + 16;
  const eraLabelY = SVG_HEIGHT + 16;
  const totalHeight = eraLabelY + 30;

  // ---------------------------------------------------------------------------
  // Mobile: sectioned card layout
  // ---------------------------------------------------------------------------
  if (isMobile) {
    return (
      <PageShell vizNav>
        <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          <h1 style={{ ...INSCRIPTION_STYLE, color: WARM_RED, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discovery Timeline</h1>

          <svg
            width="100%"
            viewBox={`0 0 360 ${introHeight}`}
            style={{ display: 'block', marginBottom: '12px' }}
          >
            <PretextSvg
              lines={lines}
              lineHeight={lineHeight}
              x={0}
              y={0}
              fontSize={16}
              fill={BLACK}
              maxWidth={360}
              animationStagger={40}
              dropCap={{ fontSize: 80, fill: WARM_RED, char: introDC.char }}
            />
          </svg>

        </div>

        <SectionedCardList sections={eraSections} accordion defaultCollapsed={false} />
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop: SVG timeline chart
  // ---------------------------------------------------------------------------
  return (
    <PageShell vizNav>
      <div style={{ maxWidth: 760 }}>
        <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          <h1 style={{ ...INSCRIPTION_STYLE, color: WARM_RED, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discovery Timeline</h1>

          {/* Intro paragraph */}
          <svg
            viewBox={`0 0 ${introWidth} ${introHeight}`}
            style={{ width: '100%', maxWidth: introWidth, marginBottom: '16px' }}
            overflow="visible"
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
              dropCap={{ fontSize: 80, fill: WARM_RED, char: introDC.char }}
            />
          </svg>

          {/* Era browse links */}
          <section style={{ marginBottom: '16px' }}>
            <h2 style={SECTION_LABEL_STYLE}>
              Browse by Era
            </h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <NavigationPill
                to="/eras/antiquity"
                title="View the Antiquity discovery era"
                label="Antiquity"
                color={DEEP_BLUE}
                dot={false}
              />
              {allDecades.map((d) => (
                <NavigationPill
                  key={d}
                  to={`/eras/${d}`}
                  title={`View the ${d}s discovery era`}
                  label={`${d}s`}
                  color={DEEP_BLUE}
                  dot={false}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          overflow="visible"
          role="img"
          aria-label="Timeline of element discoveries from antiquity to the present"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pan-x pan-y pinch-zoom',
          }}
        >
          {/* Timeline chart */}
          <g>
            {/* X axis line */}
            <line
              x1={MARGIN_LEFT}
              y1={axisY}
              x2={SVG_WIDTH - MARGIN_RIGHT}
              y2={axisY}
              stroke={BLACK}
              strokeWidth={STROKE_THIN}
            />

            {/* Century tick marks */}
            {centuryMarks.map((yr) => {
              const x = yearToX(yr);
              return (
                <g key={yr}>
                  <line
                    x1={x}
                    y1={axisY}
                    x2={x}
                    y2={axisY + 6}
                    stroke={BLACK}
                    strokeWidth={STROKE_THIN}
                  />
                  <text
                    x={x}
                    y={axisY + 20}
                    textAnchor="middle"
                    fontSize={12}
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                  >
                    {yr}
                  </text>
                </g>
              );
            })}

            {/* "Known since antiquity" label */}
            <text
              x={10}
              y={axisY - SQ - Math.ceil(antiquity.length / 5) * (SQ + SQ_GAP) - 4}
              fontSize={11}
              fill={BLACK}
              fontFamily="system-ui, sans-serif"
              opacity={0.7}
            >
              Known since antiquity
            </text>

            {/* Antiquity squares */}
            {antiquitySquares.map((sq) => {
              const el = getElement(sq.entry.symbol);
              return (
                <ElementSquare
                  key={`antiq-${sq.entry.symbol}`}
                  symbol={sq.entry.symbol}
                  color={sq.color}
                  size={SQ}
                  x={sq.x}
                  y={sq.y}
                  title={el?.name ?? sq.entry.symbol}
                  style={{
                    opacity: hasLoaded ? 1 : 0,
                    transition: hasLoaded
                      ? `opacity 300ms var(--ease-out) ${sq.delay}ms`
                      : 'none',
                  }}
                  onMouseEnter={() =>
                    handleSquareEnter(sq, sq.x + SQ / 2, sq.y)
                  }
                  onMouseLeave={handleSquareLeave}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault();
                      setTooltip((prev) =>
                        prev?.name === (el?.name ?? sq.entry.symbol)
                          ? null
                          : {
                              x: sq.x + SQ / 2,
                              y: sq.y - 10,
                              name: el?.name ?? sq.entry.symbol,
                              year: sq.entry.year != null ? String(sq.entry.year) : 'Antiquity',
                              discoverer: sq.entry.discoverer,
                            },
                      );
                    }
                  }}
                  onClick={() => handleSquareClick(sq.entry.symbol)}
                  rectProps={{
                    role: 'button',
                    'aria-label': `${el?.name ?? sq.entry.symbol}, known since antiquity`,
                  }}
                />
              );
            })}

            {/* Timeline squares */}
            {squares.map((sq) => {
              const el = getElement(sq.entry.symbol);
              return (
                <ElementSquare
                  key={`tl-${sq.entry.symbol}`}
                  symbol={sq.entry.symbol}
                  color={sq.color}
                  size={SQ}
                  x={sq.x}
                  y={sq.y}
                  title={el?.name ?? sq.entry.symbol}
                  style={{
                    opacity: hasLoaded ? 1 : 0,
                    transition: hasLoaded
                      ? `opacity 300ms var(--ease-out) ${sq.delay}ms`
                      : 'none',
                  }}
                  onMouseEnter={() =>
                    handleSquareEnter(sq, sq.x + SQ / 2, sq.y)
                  }
                  onMouseLeave={handleSquareLeave}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.preventDefault();
                      setTooltip((prev) =>
                        prev?.name === (el?.name ?? sq.entry.symbol)
                          ? null
                          : {
                              x: sq.x + SQ / 2,
                              y: sq.y - 10,
                              name: el?.name ?? sq.entry.symbol,
                              year: sq.entry.year != null ? String(sq.entry.year) : 'Antiquity',
                              discoverer: sq.entry.discoverer,
                            },
                      );
                    }
                  }}
                  onClick={() => handleSquareClick(sq.entry.symbol)}
                  rectProps={{
                    role: 'button',
                    'aria-label': `${el?.name ?? sq.entry.symbol}, discovered ${sq.entry.year} by ${sq.entry.discoverer}`,
                  }}
                />
              );
            })}

            {/* Tooltip */}
            {tooltip && (() => {
              const line1 = `${tooltip.name} (${tooltip.year})`;
              const line2 = tooltip.discoverer;
              const m1 = measureLines(line1, 'bold 12px system-ui, sans-serif', 9999, 16);
              const m2 = measureLines(line2, '10px system-ui, sans-serif', 9999, 16);
              const tipW = Math.max(m1[0]?.width ?? 80, m2[0]?.width ?? 60) + 20;
              return (
                <g
                  transform={`translate(${tooltip.x}, ${tooltip.y})`}
                  style={{ pointerEvents: 'none' }}
                >
                  <rect
                    x={-tipW / 2}
                    y={-52}
                    width={tipW}
                    height={48}
                    fill={BLACK}
                    rx={2}
                  />
                  <text
                    x={0}
                    y={-36}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="bold"
                    fill={PAPER}
                    fontFamily="system-ui, sans-serif"
                  >
                    {line1}
                  </text>
                  <text
                    x={0}
                    y={-18}
                    textAnchor="middle"
                    fontSize={10}
                    fill={PAPER}
                    fontFamily="system-ui, sans-serif"
                    opacity={0.85}
                  >
                    {line2}
                  </text>
                </g>
              );
            })()}
          </g>

          {/* Era labels below the timeline */}
          {ERA_LABELS.map((era) => (
            <text
              key={era.label}
              x={era.x}
              y={eraLabelY}
              fontSize={12}
              fill={BLACK}
              fontFamily="system-ui, sans-serif"
              fontWeight="bold"
              opacity={0.6}
            >
              {era.label}
            </text>
          ))}
        </svg>
      </div>
    </PageShell>
  );
}
