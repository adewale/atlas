import { useCallback } from 'react';
import PeriodicTable from '../components/PeriodicTable';
import VizNav from '../components/VizNav';
import SiteNav from '../components/SiteNav';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';
import { useIsMobile } from '../hooks/useIsMobile';
import { BLACK, PAPER } from '../lib/theme';

const ATLAS_LETTERS = ['A', 'T', 'L', 'A', 'S'] as const;

export default function Home() {
  const transitionNavigate = useViewTransitionNavigate();
  const isMobile = useIsMobile();

  const handleSelect = useCallback(
    (symbol: string) => {
      transitionNavigate(`/element/${symbol}`);
    },
    [transitionNavigate],
  );

  return (
    <main id="main-content">
      <div style={{ display: 'flex', gap: '0' }}>
        {/* Vertical ATLAS wordmark in left gutter — desktop only */}
        {!isMobile && <h1
          aria-label="Atlas"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '64px',
            flexShrink: 0,
            margin: 0,
            padding: '8px 0',
            userSelect: 'none',
          }}
        >
          {ATLAS_LETTERS.map((letter, i) => (
            <span
              key={i}
              style={{
                fontSize: '72px',
                fontWeight: 900,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1,
                color: BLACK,
                letterSpacing: '-0.02em',
              }}
            >
              {letter}
            </span>
          ))}
        </h1>}

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <VizNav />
          <PeriodicTable onSelectElement={handleSelect} />
        </div>
      </div>
      <SiteNav />
    </main>
  );
}
