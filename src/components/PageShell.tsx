import { type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import VizNav from './VizNav';
import SiteNav from './SiteNav';
import { BLACK, DEEP_BLUE, WARM_RED, MUSTARD, GREY_RULE, STROKE_THIN } from '../lib/theme';

const ATLAS_LETTERS = [
  { letter: 'A', color: WARM_RED },
  { letter: 'T', color: BLACK },
  { letter: 'L', color: DEEP_BLUE },
  { letter: 'A', color: WARM_RED },
  { letter: 'S', color: MUSTARD },
];

const FONT_SIZE = 32;
const CELL = 44;
const BAR_W = 56;
const RULE_COLOR = GREY_RULE;

type PageShellProps = {
  children: ReactNode;
  /** Show VizNav bar (true for visualization pages). */
  vizNav?: boolean;
};

/**
 * Shared page shell providing a CSS-grid layout with:
 *  - Left gutter: vertical ATLAS wordmark (desktop only)
 *  - Main column: optional VizNav, page content, SiteNav footer
 *
 * This ensures the wordmark, header, and footer appear at consistent
 * positions across every page.
 */
export default function PageShell({ children, vizNav = false }: PageShellProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className="page-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '72px 1fr',
        gridTemplateRows: 'auto 1fr auto',
        gap: 0,
        minHeight: '100vh',
      }}
    >
      {/* ---- Wordmark gutter (desktop only) ---- */}
      {!isMobile && (
        <h1
          aria-label="Atlas"
          className="page-shell-wordmark"
          style={{
            gridColumn: 1,
            gridRow: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 0,
            gap: 0,
            width: '72px',
            margin: 0,
            userSelect: 'none',
          }}
        >
          <svg
            width={BAR_W}
            height={ATLAS_LETTERS.length * CELL + 12}
            viewBox={`0 0 ${BAR_W} ${ATLAS_LETTERS.length * CELL + 12}`}
            aria-hidden="true"
          >
            {/* Top rule — thin hairline */}
            <line x1={10} y1={2} x2={BAR_W - 10} y2={2} stroke={RULE_COLOR} strokeWidth={STROKE_THIN} />
            {/* Small diamond accent below top rule */}
            <polygon
              points={`${BAR_W / 2},5 ${BAR_W / 2 + 2.5},8 ${BAR_W / 2},11 ${BAR_W / 2 - 2.5},8`}
              fill={RULE_COLOR}
            />

            {ATLAS_LETTERS.map((item, i) => (
              <text
                key={i}
                x={BAR_W / 2}
                y={14 + i * CELL + FONT_SIZE}
                textAnchor="middle"
                fontSize={FONT_SIZE}
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="900"
                fill={item.color}
                letterSpacing="0.15em"
              >
                {item.letter}
              </text>
            ))}

            {/* Bottom rule — matching hairline */}
            <line
              x1={10}
              y1={ATLAS_LETTERS.length * CELL + 10}
              x2={BAR_W - 10}
              y2={ATLAS_LETTERS.length * CELL + 10}
              stroke={RULE_COLOR}
              strokeWidth={STROKE_THIN}
            />
          </svg>
        </h1>
      )}

      {/* ---- Header: VizNav ---- */}
      <div
        className="page-shell-header"
        style={{
          gridColumn: isMobile ? 1 : 2,
          gridRow: 1,
        }}
      >
        {vizNav && <VizNav />}
      </div>

      {/* ---- Main content area ---- */}
      <main
        id="main-content"
        className="page-shell-content"
        style={{
          gridColumn: isMobile ? 1 : 2,
          gridRow: 2,
          minWidth: 0,
        }}
      >
        {children}
      </main>

      {/* ---- Footer: SiteNav ---- */}
      <div
        className="page-shell-footer"
        style={{
          gridColumn: isMobile ? 1 : 2,
          gridRow: 3,
        }}
      >
        <SiteNav />
      </div>
    </div>
  );
}
