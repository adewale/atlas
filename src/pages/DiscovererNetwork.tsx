import { useState, useMemo, useEffect } from 'react';
import { useLoaderData, Link, useNavigate } from 'react-router';
import VizNav from '../components/VizNav';
import { getElement } from '../lib/data';
import { blockColor, contrastTextColor } from '../lib/grid';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from '../lib/theme';
import { useDropCapText } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import SiteNav from '../components/SiteNav';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const INTRO_TEXT =
  'Some scientists discovered a single element. Others reshaped the periodic table. Glenn Seaborg discovered ten elements. Humphry Davy electrolyzed his way to six. This chart maps the prolific discoverers.';

const SVG_WIDTH = 900;
const LEFT_COL = 200;
const SQ = 24;
const SQ_GAP = 3;
const ROW_HEIGHT = 36;
const INTRO_Y = 0;
const INTRO_MAX_W = SVG_WIDTH;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function DiscovererNetwork() {
  useDocumentTitle('Discoverer Network');
  const { discoverers } = useLoaderData() as { discoverers: { name: string; elements: string[] }[] };
  const navigate = useNavigate();

  const [hovered, setHovered] = useState<{
    symbol: string;
    name: string;
    year: number | null;
    x: number;
    y: number;
  } | null>(null);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: INTRO_MAX_W,
    dropCapFont: '72px system-ui',
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

  // Layout measurements
  const introHeight = lines.length * lineHeight + 24;
  const antiquityStartY = introHeight + 8;
  const antiquityHeight = antiquity ? ROW_HEIGHT + 16 : 0;
  const barsStartY = antiquityStartY + antiquityHeight + 8;
  const totalRows = prolific.length;
  const totalHeight = barsStartY + totalRows * ROW_HEIGHT + 40;

  return (
    <main id="main-content">
      <VizNav />
      <h1 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: MUSTARD }}>Discoverer Network</h1>

      {/* bar-grow keyframe in globals.css */}
      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          role="img"
          aria-label="Chart showing which scientists discovered which elements"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Intro text */}
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={INTRO_Y}
            fontSize={16}
            fill={BLACK}
            maxWidth={INTRO_MAX_W}
            animationStagger={40}
            dropCap={{ fontSize: 72, fill: MUSTARD }}
          />

          {/* Block colour legend */}
          <g transform={`translate(0, ${introHeight - 8})`}>
            {[
              { label: 's-block', block: 's' },
              { label: 'p-block', block: 'p' },
              { label: 'd-block', block: 'd' },
              { label: 'f-block', block: 'f' },
            ].map((item, i) => {
              const xOff = i * 130;
              const fill = blockColor(item.block);
              return (
                <g key={item.block} transform={`translate(${xOff}, 0)`}>
                  <rect x={0} y={2} width={SQ} height={SQ} fill={fill} />
                  <text
                    x={SQ + 6}
                    y={SQ - 4}
                    fontSize={13}
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Antiquity group */}
          {antiquity && (
            <g transform={`translate(0, ${antiquityStartY})`}>
              <a href={`/discoverer/${encodeURIComponent(antiquity.name)}`}>
                <title>{`View elements discovered by ${antiquity.name}`}</title>
                <text
                  x={0}
                  y={SQ - 2}
                  fontSize={14}
                  fontWeight="bold"
                  fill={WARM_RED}
                  fontFamily="system-ui, sans-serif"
                  style={{ cursor: 'pointer' }}
                >
                  {antiquity.name}
                </text>
              </a>
              <g
                transform={`translate(${LEFT_COL}, 0)`}
                style={{
                  clipPath: hasLoaded ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transition: 'clip-path 600ms var(--ease-out)',
                }}
              >
                {antiquity.elements.map((sym, j) => {
                  const el = getElement(sym);
                  if (!el) return null;
                  const fill = blockColor(el.block);
                  const textFill = contrastTextColor(fill);
                  const ex = j * (SQ + SQ_GAP);
                  return (
                    <g
                      key={sym}
                      transform={`translate(${ex}, 0)`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/element/${sym}`)}
                      onMouseEnter={() =>
                        setHovered({
                          symbol: sym,
                          name: el.name,
                          year: el.discoveryYear,
                          x: LEFT_COL + ex + SQ / 2,
                          y: antiquityStartY,
                        })
                      }
                      onMouseLeave={() => setHovered(null)}
                    >
                      <title>{el.name}</title>
                      <rect width={SQ} height={SQ} fill={fill} rx={2} />
                      <text
                        x={SQ / 2}
                        y={SQ / 2 + 3}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight="bold"
                        fill={textFill}
                        fontFamily="system-ui, sans-serif"
                      >
                        {sym}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          )}

          {/* Prolific discoverers rows */}
          {prolific.map((disc, rowIdx) => {
            const rowY = barsStartY + rowIdx * ROW_HEIGHT;
            const delay = rowIdx * 40;
            return (
              <g key={disc.name} transform={`translate(0, ${rowY})`}>
                {/* Discoverer name — links to detail page */}
                <a href={`/discoverer/${encodeURIComponent(disc.name)}`}>
                  <title>{`View elements discovered by ${disc.name}`}</title>
                  <text
                    x={0}
                    y={SQ - 2}
                    fontSize={13}
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                    style={{
                      cursor: 'pointer',
                      opacity: hasLoaded ? 1 : 0,
                      transition: `opacity 300ms var(--ease-out) ${delay}ms`,
                    }}
                  >
                    {disc.name.length > 24
                      ? disc.name.slice(0, 22) + '…'
                      : disc.name}
                  </text>
                </a>

                {/* Element squares with bar-grow animation */}
                <g
                  transform={`translate(${LEFT_COL}, 0)`}
                  style={{
                    animation: hasLoaded
                      ? `bar-grow 500ms var(--ease-out) ${delay}ms both`
                      : 'none',
                    clipPath: hasLoaded ? undefined : 'inset(0 100% 0 0)',
                  }}
                >
                  {disc.elements.map((sym, j) => {
                    const el = getElement(sym);
                    if (!el) return null;
                    const fill = blockColor(el.block);
                    const textFill = contrastTextColor(fill);
                    const ex = j * (SQ + SQ_GAP);
                    return (
                      <g
                        key={sym}
                        transform={`translate(${ex}, 0)`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/element/${sym}`)}
                        onMouseEnter={() =>
                          setHovered({
                            symbol: sym,
                            name: el.name,
                            year: el.discoveryYear,
                            x: LEFT_COL + ex + SQ / 2,
                            y: rowY,
                          })
                        }
                        onMouseLeave={() => setHovered(null)}
                      >
                        <title>{el.name}</title>
                        <rect width={SQ} height={SQ} fill={fill} rx={2} />
                        <text
                          x={SQ / 2}
                          y={SQ / 2 + 3}
                          textAnchor="middle"
                          fontSize={8}
                          fontWeight="bold"
                          fill={textFill}
                          fontFamily="system-ui, sans-serif"
                        >
                          {sym}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Subtle separator */}
                <line
                  x1={LEFT_COL}
                  y1={SQ + 6}
                  x2={LEFT_COL + disc.elements.length * (SQ + SQ_GAP)}
                  y2={SQ + 6}
                  stroke={BLACK}
                  strokeWidth={0.3}
                  opacity={0.15}
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hovered && (
            <g
              transform={`translate(${hovered.x}, ${hovered.y - 10})`}
              style={{ pointerEvents: 'none' }}
            >
              <rect
                x={-60}
                y={-28}
                width={120}
                height={24}
                rx={3}
                fill={BLACK}
                opacity={0.92}
              />
              <text
                x={0}
                y={-12}
                textAnchor="middle"
                fontSize={11}
                fill={PAPER}
                fontFamily="system-ui, sans-serif"
              >
                {hovered.name}
                {hovered.year != null ? ` (${hovered.year})` : ''}
              </text>
            </g>
          )}
        </svg>
      </div>
      <SiteNav />
    </main>
  );
}
