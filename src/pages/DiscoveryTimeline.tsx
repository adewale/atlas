import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import VizNav from '../components/VizNav';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, PAPER, MUSTARD, DEEP_BLUE, WARM_RED, GREY_MID } from '../lib/theme';
import { useDropCapText } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import SiteNav from '../components/SiteNav';

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
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 50;

const YEAR_MIN = 1650;
const YEAR_MAX = 2030;
const DECADE_BIN = 10;
const SQ = 14; // square size
const SQ_GAP = 2;

const INTRO_TEXT =
  'The periodic table was built over centuries. Ancient peoples knew gold, iron, and copper. The 18th century brought the gas rush. The 20th century saw the synthetic era.';

const ERA_LABELS: { x: number; label: string }[] = [
  { x: 30, label: 'Ancient' },
  { x: 260, label: '1700s: Gases & Alkalis' },
  { x: 480, label: '1800s: Spectroscopy era' },
  { x: 720, label: '1900s+: Nuclear synthesis' },
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
  const { antiquity, timeline } = useLoaderData() as TimelineData;
  const navigate = useNavigate();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  const { lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: SVG_WIDTH,
    dropCapFont: '80px system-ui',
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
  const { squares, antiquitySquares, minYear } = useMemo(() => {
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

    return { squares: sqs, antiquitySquares: antSqs, minYear: mYear };
  }, [antiquity, timeline, axisY]);

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
      navigate(`/element/${symbol}`);
    },
    [navigate],
  );

  const centuryMarks = [1700, 1800, 1900, 2000];

  const introHeight = lines.length * lineHeight + 16;
  const eraLabelY = SVG_HEIGHT + introHeight + 16;
  const totalHeight = eraLabelY + 30;

  return (
    <main>
      <VizNav />
      <h1 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: WARM_RED }}>Discovery Timeline</h1>

      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          role="img"
          aria-label="Timeline of element discoveries from antiquity to the present"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Pretext intro */}
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            fontSize={16}
            fill={BLACK}
            maxWidth={SVG_WIDTH}
            animationStagger={40}
            dropCap={{ fontSize: 80, fill: WARM_RED }}
          />

          {/* Timeline chart offset below intro */}
          <g transform={`translate(0, ${introHeight})`}>
            {/* X axis line */}
            <line
              x1={MARGIN_LEFT}
              y1={axisY}
              x2={SVG_WIDTH - MARGIN_RIGHT}
              y2={axisY}
              stroke={BLACK}
              strokeWidth={0.75}
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
                    strokeWidth={0.75}
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
                <g key={`antiq-${sq.entry.symbol}`}>
                  <title>{el?.name ?? sq.entry.symbol}</title>
                  <rect
                    x={sq.x}
                    y={sq.y}
                    width={SQ}
                    height={SQ}
                    fill={sq.color}
                    stroke={BLACK}
                    strokeWidth={0.25}
                    style={{
                      cursor: 'pointer',
                      opacity: hasLoaded ? 1 : 0,
                      transition: hasLoaded
                        ? `opacity 300ms var(--ease-out) ${sq.delay}ms`
                        : 'none',
                    }}
                    onMouseEnter={() =>
                      handleSquareEnter(sq, sq.x + SQ / 2, sq.y)
                    }
                    onMouseLeave={handleSquareLeave}
                    onClick={() => handleSquareClick(sq.entry.symbol)}
                    role="button"
                    aria-label={`${el?.name ?? sq.entry.symbol}, known since antiquity`}
                  />
                </g>
              );
            })}

            {/* Timeline squares */}
            {squares.map((sq) => {
              const el = getElement(sq.entry.symbol);
              return (
                <g key={`tl-${sq.entry.symbol}`}>
                  <title>{el?.name ?? sq.entry.symbol}</title>
                  <rect
                    x={sq.x}
                    y={sq.y}
                    width={SQ}
                    height={SQ}
                    fill={sq.color}
                    stroke={BLACK}
                    strokeWidth={0.25}
                    style={{
                      cursor: 'pointer',
                      opacity: hasLoaded ? 1 : 0,
                      transition: hasLoaded
                        ? `opacity 300ms var(--ease-out) ${sq.delay}ms`
                        : 'none',
                    }}
                    onMouseEnter={() =>
                      handleSquareEnter(sq, sq.x + SQ / 2, sq.y)
                    }
                    onMouseLeave={handleSquareLeave}
                    onClick={() => handleSquareClick(sq.entry.symbol)}
                    role="button"
                    aria-label={`${el?.name ?? sq.entry.symbol}, discovered ${sq.entry.year} by ${sq.entry.discoverer}`}
                  />
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <g
                transform={`translate(${tooltip.x}, ${tooltip.y})`}
                style={{ pointerEvents: 'none' }}
              >
                <rect
                  x={-70}
                  y={-52}
                  width={140}
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
                  {tooltip.name} ({tooltip.year})
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
                  {tooltip.discoverer}
                </text>
              </g>
            )}
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

      {/* Era browse links */}
      <section style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', color: GREY_MID, marginBottom: '8px' }}>
          Browse by Era
        </h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Link
            to="/timeline/antiquity"
            title="View the Antiquity discovery era"
            style={{
              fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '4px 10px',
              border: `1.5px solid ${DEEP_BLUE}`, color: DEEP_BLUE,
              textDecoration: 'none', minHeight: 'unset', minWidth: 'unset',
            }}
          >
            Antiquity
          </Link>
          {allDecades.map((d) => (
            <Link
              key={d}
              to={`/timeline/${d}`}
              title={`View the ${d}s discovery era`}
              style={{
                fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.08em',
                padding: '4px 10px',
                border: `1.5px solid ${DEEP_BLUE}`, color: DEEP_BLUE,
                textDecoration: 'none', minHeight: 'unset', minWidth: 'unset',
              }}
            >
              {d}s
            </Link>
          ))}
        </div>
      </section>
      <SiteNav />
    </main>
  );
}
