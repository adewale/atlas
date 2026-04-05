import { type ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import VizNav from './VizNav';
import SiteNav from './SiteNav';
import AtlasWordmark, { WORDMARK_WIDTH } from './AtlasWordmark';

type PageShellProps = {
  children: ReactNode;
  vizNav?: boolean;
};

export default function PageShell({ children, vizNav = false }: PageShellProps) {
  const isMobile = useIsMobile();
  const contentCol = isMobile ? 1 : 2;

  return (
    <div
      className="page-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : `${WORDMARK_WIDTH}px 1fr`,
        gridTemplateRows: 'auto 1fr auto',
        gap: 0,
        minHeight: '100vh',
      }}
    >
      {!isMobile && (
        <div style={{ gridColumn: 1, gridRow: '1 / -1' }}>
          <AtlasWordmark />
        </div>
      )}

      <div className="page-shell-header" style={{ gridColumn: contentCol, gridRow: 1 }}>
        {vizNav && <VizNav />}
      </div>

      <main id="main-content" className="page-shell-content" style={{ gridColumn: contentCol, gridRow: 2, minWidth: 0 }}>
        {children}
      </main>

      <div className="page-shell-footer" style={{ gridColumn: contentCol, gridRow: 3 }}>
        <SiteNav />
      </div>
    </div>
  );
}
