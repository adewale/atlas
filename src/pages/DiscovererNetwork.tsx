import { useState, useMemo, useEffect } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { WARM_RED, MUSTARD, BLACK, PAPER, INSCRIPTION_STYLE, STROKE_HAIRLINE } from '../lib/theme';
import { VT } from '../lib/transitions';
import ElementSquare from '../components/ElementSquare';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT, measureLines } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const INTRO_TEXT =
  'Some scientists discovered a single element. Others reshaped the periodic table. Glenn Seaborg discovered ten elements. Humphry Davy electrolysed his way to six. This chart maps the prolific discoverers.';

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
  useDocumentTitle('Discoverer Network', 'Network graph of scientists and their element discoveries, showing collaboration clusters and prolific discoverers.');
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

  const { dropCap: introDC, lines, lineHeight } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: INTRO_MAX_W,
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

  // Layout measurements
  const introTextHeight = lines.length * lineHeight + 16;
  const legendY = introTextHeight + 16;          // clear gap below intro text
  const legendHeight = SQ + 12;                   // legend row height
  const introHeight = legendY + legendHeight + 12; // total intro section
  const antiquityStartY = introHeight + 8;
  const antiquityHeight = antiquity ? ROW_HEIGHT + 16 : 0;
  const barsStartY = antiquityStartY + antiquityHeight + 8;
  const totalRows = prolific.length;
  const totalHeight = barsStartY + totalRows * ROW_HEIGHT + 40;

  return (
    <PageShell vizNav>
      <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discoverer Network</h1>

      {/* bar-grow keyframe in globals.css */}
      <div className="pt-scroll-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          overflow="visible"
          role="img"
          aria-label="Chart showing which scientists discovered which elements"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pan-x pan-y pinch-zoom',
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
            dropCap={{ fontSize: 72, fill: MUSTARD, char: introDC.char }}
          />

          {/* Block colour legend */}
          <g transform={`translate(0, ${legendY})`}>
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
                  const ex = j * (SQ + SQ_GAP);
                  return (
                    <ElementSquare
                      key={sym}
                      symbol={sym}
                      color={fill}
                      size={SQ}
                      x={ex}
                      y={0}
                      title={el.name}
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
                      onPointerDown={(e) => {
                        if (e.pointerType === 'touch') {
                          e.preventDefault();
                          setHovered((prev) =>
                            prev?.symbol === sym
                              ? null
                              : {
                                  symbol: sym,
                                  name: el.name,
                                  year: el.discoveryYear,
                                  x: LEFT_COL + ex + SQ / 2,
                                  y: antiquityStartY,
                                },
                          );
                        }
                      }}
                    />
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
                    const ex = j * (SQ + SQ_GAP);
                    return (
                      <ElementSquare
                        key={sym}
                        symbol={sym}
                        color={fill}
                        size={SQ}
                        x={ex}
                        y={0}
                        title={el.name}
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
                        onPointerDown={(e) => {
                          if (e.pointerType === 'touch') {
                            e.preventDefault();
                            setHovered((prev) =>
                              prev?.symbol === sym
                                ? null
                                : {
                                    symbol: sym,
                                    name: el.name,
                                    year: el.discoveryYear,
                                    x: LEFT_COL + ex + SQ / 2,
                                    y: rowY,
                                  },
                            );
                          }
                        }}
                      />
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
                  strokeWidth={STROKE_HAIRLINE}
                  opacity={0.15}
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hovered && (() => {
            const tipText = hovered.name + (hovered.year != null ? ` (${hovered.year})` : '');
            const measured = measureLines(tipText, '11px system-ui, sans-serif', 9999, 16);
            const tipW = (measured[0]?.width ?? 80) + 16;
            return (
              <g
                transform={`translate(${hovered.x}, ${hovered.y - 10})`}
                style={{ pointerEvents: 'none' }}
              >
                <rect
                  x={-tipW / 2}
                  y={-28}
                  width={tipW}
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
                  {tipText}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </PageShell>
  );
}
