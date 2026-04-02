import { useState, useMemo, useEffect } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import { WARM_RED, MUSTARD, BLACK, PAPER, DEEP_BLUE, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, STROKE_HAIRLINE } from '../lib/theme';
import { VT } from '../lib/transitions';
import ElementSquare from '../components/ElementSquare';
import { useDropCapText } from '../hooks/usePretextLines';
import { DROP_CAP_FONT, measureLines } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import MarginNote from '../components/MarginNote';
import SectionedCardList from '../components/SectionedCardList';
import type { Section } from '../components/SectionedCardList';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

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

  // Build sections for mobile view
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

  // Layout measurements (legend moved to margin — no longer in SVG)
  const introTextHeight = lines.length * lineHeight + 16;
  const introHeight = introTextHeight + 12;
  const antiquityStartY = introHeight + 8;
  const antiquityHeight = antiquity ? ROW_HEIGHT + 16 : 0;
  const barsStartY = antiquityStartY + antiquityHeight + 8;
  const totalRows = prolific.length;
  const totalHeight = barsStartY + totalRows * ROW_HEIGHT + 40;

  // ---------------------------------------------------------------------------
  // Mobile: sectioned card layout
  // ---------------------------------------------------------------------------
  if (isMobile) {
    const introH = Math.max(introTextHeight, 76);
    return (
      <PageShell vizNav>
        <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
          <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discoverer Network</h1>

          <svg
            width="100%"
            viewBox={`0 0 360 ${introH}`}
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
              dropCap={{ fontSize: 72, fill: MUSTARD, char: introDC.char }}
            />
          </svg>

          {!isMobile && (
            <MarginNote label="Block colours" color={MUSTARD}>
              {[
                { label: 's-block', block: 's' },
                { label: 'p-block', block: 'p' },
                { label: 'd-block', block: 'd' },
                { label: 'f-block', block: 'f' },
              ].map((item) => (
                <div key={item.block} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ width: '20px', height: '14px', background: blockColor(item.block), display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.label}</span>
                </div>
              ))}
            </MarginNote>
          )}
        </div>

        <SectionedCardList sections={discovererSections} accordion defaultCollapsed={false} />
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop: SVG bar chart
  // ---------------------------------------------------------------------------
  return (
    <PageShell vizNav>
      <div style={{ maxWidth: INTRO_MAX_W, position: 'relative' }}>
        <MarginNote label="Block colours" color={MUSTARD} top={40}>
          {[
            { label: 's-block', block: 's' },
            { label: 'p-block', block: 'p' },
            { label: 'd-block', block: 'd' },
            { label: 'f-block', block: 'f' },
          ].map((item) => (
            <div key={item.block} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ width: '20px', height: '14px', background: blockColor(item.block), display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.label}</span>
            </div>
          ))}
        </MarginNote>
        <h1 style={{ ...INSCRIPTION_STYLE, color: MUSTARD, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Discoverer Network</h1>
      </div>

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
