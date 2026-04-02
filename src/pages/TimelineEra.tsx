import { useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import type { PlateHoverInfo } from '../components/AtlasPlate';
import { DEEP_BLUE, BLACK, PAPER, BACK_LINK_STYLE, SECTION_LABEL_STYLE, GREY_MID } from '../lib/theme';
import { VT } from '../lib/transitions';
import HeroHeader from '../components/HeroHeader';
import { PRETEXT_SANS } from '../lib/pretext';
import { DiscovererChip } from '../components/EntityChip';
import NavigationPill from '../components/NavigationPill';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type TimelineEntry = { symbol: string; year: number | null; discoverer: string };
type TimelineData = { antiquity: TimelineEntry[]; timeline: TimelineEntry[] };

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export default function TimelineEra() {
  const { era } = useParams();
  const { antiquity, timeline } = useLoaderData() as TimelineData;

  const isAntiquity = era === 'antiquity';
  const decade = isAntiquity ? null : Number(era);

  // Get entries for this era
  const entries = useMemo(() => {
    if (isAntiquity) return antiquity;
    if (decade == null || isNaN(decade)) return [];
    return timeline.filter((e) => e.year != null && decadeOf(e.year) === decade);
  }, [isAntiquity, decade, antiquity, timeline]);

  const elements = entries.map((e) => getElement(e.symbol)).filter(
    (e): e is ElementRecord => e != null,
  );
  const color = elements.length > 0 ? blockColor(elements[0].block) : DEEP_BLUE;

  // Tooltip state
  type TooltipData = { name: string; year: string; discoverer: string; category: string; top: number; left: number } | null;
  const [tooltip, setTooltip] = useState<TooltipData>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a lookup from symbol to timeline entry for discoverer/year info
  const entryBySymbol = useMemo(() => {
    const map = new Map<string, TimelineEntry>();
    for (const e of entries) map.set(e.symbol, e);
    return map;
  }, [entries]);

  const handleHover = useCallback(
    (info: PlateHoverInfo) => {
      if (!info || !containerRef.current) {
        setTooltip(null);
        return;
      }
      const el = info.element;
      const entry = entryBySymbol.get(el.symbol);
      const containerRect = containerRef.current.getBoundingClientRect();
      setTooltip({
        name: el.name,
        year: entry?.year != null ? String(entry.year) : (el.discoveryYear != null ? String(el.discoveryYear) : 'Antiquity'),
        discoverer: entry?.discoverer ?? el.discoverer ?? 'Unknown',
        category: el.category,
        top: info.rect.top - containerRect.top,
        left: info.rect.left - containerRect.left + info.rect.width / 2,
      });
    },
    [entryBySymbol],
  );

  // All decades that have elements
  const allDecades = useMemo(() => {
    const decades = new Set<number>();
    for (const e of timeline) {
      if (e.year != null) decades.add(decadeOf(e.year));
    }
    return [...decades].sort((a, b) => a - b);
  }, [timeline]);

  // Prev/next era
  const eraLabel = isAntiquity ? 'Antiquity' : `${decade}s`;
  useDocumentTitle(eraLabel);
  let prevEra: string | null = null;
  let nextEra: string | null = null;

  if (isAntiquity) {
    nextEra = allDecades.length > 0 ? String(allDecades[0]) : null;
  } else if (decade != null) {
    const idx = allDecades.indexOf(decade);
    if (idx === 0) {
      prevEra = 'antiquity';
    } else if (idx > 0) {
      prevEra = String(allDecades[idx - 1]);
    }
    if (idx < allDecades.length - 1) {
      nextEra = String(allDecades[idx + 1]);
    }
  }

  // Discoverers in this era (unique)
  const discoverers = useMemo(() => {
    const names = new Set<string>();
    for (const e of entries) {
      if (e.discoverer && !e.discoverer.toLowerCase().includes('antiquity')) {
        names.add(e.discoverer);
      }
    }
    return [...names];
  }, [entries]);

  // Adjacent eras with elements (for graph browse)
  const nearbyEras = useMemo(() => {
    if (decade == null) return allDecades.slice(0, 6);
    const idx = allDecades.indexOf(decade);
    const start = Math.max(0, idx - 3);
    const end = Math.min(allDecades.length, idx + 4);
    return allDecades.slice(start, end).filter((d) => d !== decade);
  }, [decade, allDecades]);

  if (entries.length === 0) {
    return (
      <PageShell>
        <Link to="/discovery-timeline" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Timeline</Link>
        <h1 style={{ margin: '12px 0 16px' }}>No elements found for this era</h1>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link to="/discovery-timeline" style={BACK_LINK_STYLE}>← Timeline</Link>

      {/* Giant era numeral + heading */}
      <HeroHeader
        numeral={isAntiquity ? '∞' : String(decade)}
        numeralColor={color}
        title={eraLabel}
        subtitle={`${elements.length} element${elements.length !== 1 ? 's' : ''} discovered`}
      />

      {/* Prev / Next navigation — Pretext-styled, anchored beneath hero */}
      {(prevEra || nextEra) && (
        <svg
          width="100%"
          height={24}
          viewBox="0 0 400 24"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', maxWidth: 560 }}
          aria-label="Previous and next era navigation"
        >
          {prevEra && (
            <a href={`/timelines/${prevEra}`}>
              <text x={4} y={16} fontSize={11} fill={GREY_MID} fontFamily={PRETEXT_SANS}>
                ← {prevEra === 'antiquity' ? 'Antiquity' : `${prevEra}s`}
              </text>
            </a>
          )}
          {nextEra && (
            <a href={`/timelines/${nextEra}`}>
              <text x={396} y={16} fontSize={11} fill={GREY_MID} fontFamily={PRETEXT_SANS} textAnchor="end">
                {`${nextEra}s`} →
              </text>
            </a>
          )}
        </svg>
      )}

      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px', viewTransitionName: VT.COLOR_RULE } as React.CSSProperties} />

      {elements.length > 0 && (
        <div ref={containerRef} style={{ position: 'relative' }}>
          <AtlasPlate elements={elements} caption={eraLabel} captionColor={color} onHover={handleHover} />
          {tooltip && (
            <div
              style={{
                position: 'absolute',
                top: tooltip.top - 8,
                left: tooltip.left,
                transform: 'translate(-50%, -100%)',
                background: BLACK,
                color: PAPER,
                padding: '8px 14px',
                borderRadius: '2px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {tooltip.name} ({tooltip.year})
              </div>
              <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
                {tooltip.discoverer}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                {tooltip.category}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discoverers in this era */}
      {discoverers.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={SECTION_LABEL_STYLE}>
            Discoverers
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {discoverers.map((name) => {
              const count = entries.filter((e) => e.discoverer === name).length;
              return (
                <DiscovererChip
                  key={name}
                  name={name}
                  elementCount={count}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Nearby eras — graph navigation */}
      {nearbyEras.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={SECTION_LABEL_STYLE}>
            Nearby Eras
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {nearbyEras.map((d) => {
              const count = timeline.filter((e) => e.year != null && decadeOf(e.year) === d).length;
              return (
                <NavigationPill
                  key={d}
                  to={`/timelines/${d}`}
                  title={`View the ${d}s discovery era`}
                  label={`${d}s (${count})`}
                  color={DEEP_BLUE}
                />
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}
