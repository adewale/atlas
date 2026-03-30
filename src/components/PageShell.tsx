import type { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import VizNav from './VizNav';
import SiteNav from './SiteNav';
import { BLACK, DEEP_BLUE, WARM_RED, MUSTARD, PAPER } from '../lib/theme';

const ATLAS_LETTERS = [
  { letter: 'A', color: WARM_RED, shape: 'rect' as const },
  { letter: 'T', color: BLACK, shape: 'circle' as const },
  { letter: 'L', color: DEEP_BLUE, shape: 'rect' as const },
  { letter: 'A', color: WARM_RED, shape: 'rect' as const },
  { letter: 'S', color: MUSTARD, shape: 'circle' as const },
];

const WORDMARK_SIZE = 24;
const CELL = 40;
const BAR_W = 48;

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
        gridTemplateColumns: isMobile ? '1fr' : '64px 1fr',
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
            paddingTop: '8px',
            gap: '4px',
            width: '64px',
            margin: 0,
            userSelect: 'none',
          }}
        >
          <svg
            width={BAR_W}
            height={ATLAS_LETTERS.length * CELL}
            viewBox={`0 0 ${BAR_W} ${ATLAS_LETTERS.length * CELL}`}
            aria-hidden="true"
          >
            {ATLAS_LETTERS.map((item, i) => (
              <g key={i}>
                {item.shape === 'rect' ? (
                  <rect x={4} y={i * CELL + 2} width={40} height={36} fill={item.color} />
                ) : (
                  <circle cx={24} cy={i * CELL + 20} r={18} fill={item.color} />
                )}
                <text
                  x={24}
                  y={i * CELL + 26}
                  textAnchor="middle"
                  fontSize={WORDMARK_SIZE}
                  fontFamily="Cinzel, Georgia, serif"
                  fontWeight="bold"
                  fill={PAPER}
                  letterSpacing="0.1em"
                >
                  {item.letter}
                </text>
              </g>
            ))}
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
