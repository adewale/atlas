import { useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import type { PlateHoverInfo } from '../components/AtlasPlate';
import { DEEP_BLUE, BLACK, PAPER, BACK_LINK_STYLE, SECTION_LABEL_STYLE } from '../lib/theme';
import { getDiscovererMetrics } from '../lib/metrics';
import { VT } from '../lib/transitions';
import HeroHeader from '../components/HeroHeader';
import SvgPrevNext from '../components/SvgPrevNext';
import { DiscovererChip } from '../components/EntityChip';
import NavigationPill from '../components/NavigationPill';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ERA_BINS, eraBySlug, yearInEra } from '../../shared/era-bins';

type TimelineEntry = { symbol: string; year: number | null; discoverer: string };
type TimelineData = { antiquity: TimelineEntry[]; timeline: TimelineEntry[] };

export default function TimelineEra() {
  const { era } = useParams();
  const { antiquity, timeline } = useLoaderData() as TimelineData;

  const bin = era ? eraBySlug(era) : undefined;

  // Get entries for this era
  const entries = useMemo(() => {
    if (!bin) return [];
    const all = [...antiquity, ...timeline];
    return all.filter((e) => yearInEra(e.year, bin));
  }, [bin, antiquity, timeline]);

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

  // Prev/next era from ERA_BINS array index
  const eraLabel = bin?.label ?? 'Unknown Era';
  useDocumentTitle(eraLabel);
  const binIdx = bin ? ERA_BINS.indexOf(bin) : -1;
  const prevBin = binIdx > 0 ? ERA_BINS[binIdx - 1] : null;
  const nextBin = binIdx >= 0 && binIdx < ERA_BINS.length - 1 ? ERA_BINS[binIdx + 1] : null;

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
    if (binIdx < 0) return [];
    const start = Math.max(0, binIdx - 3);
    const end = Math.min(ERA_BINS.length, binIdx + 4);
    return ERA_BINS.slice(start, end).filter((b) => b.slug !== bin?.slug);
  }, [binIdx, bin]);

  if (entries.length === 0) {
    return (
      <PageShell>
        <Link to="/discovery-timeline" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Discovery Timeline</Link>
        <h1 style={{ margin: '12px 0 16px' }}>No elements found for this era</h1>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link to="/discovery-timeline" style={BACK_LINK_STYLE}>← Discovery Timeline</Link>

      {/* Giant era numeral + heading */}
      <HeroHeader
        numeral={bin?.slug === 'ancient' ? '∞' : (bin?.slug ?? '')}
        numeralColor={color}
        title={eraLabel}
        subtitle={`${elements.length} element${elements.length !== 1 ? 's' : ''} discovered`}
      />

      {/* Prev / Next navigation — Pretext-styled, anchored beneath hero */}
      <SvgPrevNext
        prev={prevBin ? { label: prevBin.label, to: `/eras/${prevBin.slug}` } : undefined}
        next={nextBin ? { label: nextBin.label, to: `/eras/${nextBin.slug}` } : undefined}
        ariaLabel="Previous and next era navigation"
      />

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
      {discoverers.length > 0 && (() => {
        // Compute fixed chip width from precomputed metrics so all chips align
        const chipPadding = 25; // 12px left + 10px right + 3px border
        const maxNameW = Math.max(
          ...discoverers.map((d) => {
            const m = getDiscovererMetrics(d);
            return m?.chipWidth ?? 120;
          }),
        );
        const chipWidth = Math.max(maxNameW + chipPadding, 120);

        return (
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
                    fixedWidth={chipWidth}
                  />
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Nearby eras — graph navigation */}
      {nearbyEras.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={SECTION_LABEL_STYLE}>
            Nearby Eras
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {nearbyEras.map((b) => {
              const all = [...antiquity, ...timeline];
              const count = all.filter((e) => yearInEra(e.year, b)).length;
              return (
                <NavigationPill
                  key={b.slug}
                  to={`/eras/${b.slug}`}
                  title={`View the ${b.label} discovery era`}
                  label={`${b.label} (${count})`}
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
