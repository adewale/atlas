import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import VizNav from '../components/VizNav';
import { allElements } from '../lib/data';
import {
  getCellPosition,
  contrastTextColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../lib/grid';
import { BLACK, DEEP_BLUE, WARM_RED, PAPER } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import SiteNav from '../components/SiteNav';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ---------------------------------------------------------------------------
// Phase → colour mapping (Byrne: hard colour fields, no gradients)
// ---------------------------------------------------------------------------
const PHASE_COLORS: Record<string, string> = {
  solid: BLACK,
  liquid: DEEP_BLUE,
  gas: WARM_RED,
};

function phaseFill(phase: string): string {
  return PHASE_COLORS[phase] ?? BLACK;
}

// ---------------------------------------------------------------------------
// Legend and intro constants
// ---------------------------------------------------------------------------
const LEGEND_ITEMS = [
  { phase: 'Solid', color: BLACK },
  { phase: 'Liquid', color: DEEP_BLUE },
  { phase: 'Gas', color: WARM_RED },
];

const INTRO_TEXT =
  'At standard temperature and pressure, only 2 elements are liquid — mercury (Hg) and bromine (Br). Just 11 elements exist as gases, all nonmetals or noble gases. The remaining 105 elements are solid, the vast majority of which are metals.';

const SVG_WIDTH = VIEWBOX_W;
const LEGEND_HEIGHT = 48;
const INTRO_HEIGHT = 100;
const TABLE_OFFSET_Y = LEGEND_HEIGHT + INTRO_HEIGHT + 16;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PhaseLandscape() {
  useDocumentTitle('Phase Landscape');
  const [hasLoaded, setHasLoaded] = useState(false);

  const { lines, lineHeight } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: SVG_WIDTH,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalHeight = TABLE_OFFSET_Y + VIEWBOX_H + 60;

  return (
    <main id="main-content">
      <VizNav />
      <h1 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: WARM_RED }}>Phase Landscape at STP</h1>

      <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          role="img"
          aria-label="Periodic table coloured by element phase at standard temperature and pressure"
          style={{
            width: '100%',
            minWidth: SVG_WIDTH,
            maxWidth: SVG_WIDTH,
            touchAction: 'pinch-zoom',
          }}
        >
          {/* Legend */}
          <g transform="translate(0, 0)">
            {LEGEND_ITEMS.map((item, i) => {
              const xOffset = i * 140;
              return (
                <g key={item.phase} transform={`translate(${xOffset}, 0)`}>
                  <rect
                    x={0}
                    y={4}
                    width={36}
                    height={24}
                    fill={item.color}
                    stroke={BLACK}
                    strokeWidth={0.5}
                  />
                  <text
                    x={44}
                    y={22}
                    fontSize={16}
                    fontWeight="bold"
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                  >
                    {item.phase}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Intro text */}
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={LEGEND_HEIGHT}
            fontSize={16}
            fill={BLACK}
            maxWidth={SVG_WIDTH}
            animationStagger={40}
          />

          {/* Periodic table grid */}
          <g transform={`translate(0, ${TABLE_OFFSET_Y})`}>
            {allElements.map((el) => {
              const pos = getCellPosition(el);
              const fill = phaseFill(el.phase);
              const textColor = contrastTextColor(fill);

              return (
                <Link key={el.symbol} to={`/element/${el.symbol}`}>
                  <g
                    transform={`translate(${pos.x}, ${pos.y})`}
                    role="button"
                    aria-label={`${el.symbol} — ${el.name}, ${el.phase} at STP`}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{el.name}</title>
                    <g
                      style={{
                        opacity: hasLoaded ? 1 : 0,
                        transform: hasLoaded ? 'none' : 'translateY(4px)',
                        transition: hasLoaded
                          ? `opacity 200ms var(--ease-spring) ${el.atomicNumber * 4}ms, transform 200ms var(--ease-spring) ${el.atomicNumber * 4}ms`
                          : 'none',
                      }}
                    >
                      <rect
                        x={1}
                        y={1}
                        width={CELL_WIDTH - 2}
                        height={CELL_HEIGHT - 2}
                        fill={fill}
                        stroke={BLACK}
                        strokeWidth={0.5}
                      />
                      <text
                        x={CELL_WIDTH / 2}
                        y={36}
                        textAnchor="middle"
                        fontSize={16}
                        fontWeight="bold"
                        fill={textColor}
                        fontFamily="system-ui, sans-serif"
                      >
                        {el.symbol}
                      </text>
                    </g>
                  </g>
                </Link>
              );
            })}
          </g>

          {/* Educational note */}
          <text
            x={0}
            y={TABLE_OFFSET_Y + VIEWBOX_H + 32}
            fontSize={13}
            fill={BLACK}
            fontFamily="system-ui, sans-serif"
            opacity={0.7}
          >
            STP = Standard Temperature and Pressure (0°C, 1 atm). Most elements
            are solid metals at room temperature.
          </text>
        </svg>
      </div>
      <SiteNav />
    </main>
  );
}
