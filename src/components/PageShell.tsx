import type { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import VizNav from './VizNav';
import SiteNav from './SiteNav';
import { BLACK, DEEP_BLUE, WARM_RED, MUSTARD } from '../lib/theme';

const ATLAS_LETTERS = [
  { letter: 'A', size: 28, color: WARM_RED },
  { letter: 'T', size: 22, color: BLACK },
  { letter: 'L', size: 28, color: DEEP_BLUE },
  { letter: 'A', size: 28, color: WARM_RED },
  { letter: 'S', size: 22, color: MUSTARD },
] as const;

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
          {ATLAS_LETTERS.map((item, i) => (
            <span
              key={i}
              style={{
                fontSize: `${item.size}px`,
                fontWeight: 900,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1,
                color: item.color,
                letterSpacing: '0.15em',
                textAlign: 'center',
                display: 'block',
              }}
            >
              {item.letter}
            </span>
          ))}
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
