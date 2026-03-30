import { useMemo } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import { WARM_RED, DEEP_BLUE, BLACK } from '../lib/theme';
import SiteNav from '../components/SiteNav';

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

  const elements = entries.map((e) => getElement(e.symbol)!).filter(Boolean);
  const color = elements.length > 0 ? blockColor(elements[0].block) : DEEP_BLUE;

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
      <main>
        <Link to="/discovery-timeline" style={{ fontSize: '14px' }}>← Discovery Timeline</Link>
        <h1 style={{ margin: '16px 0' }}>No elements found for this era</h1>
        <SiteNav />
    </main>
    );
  }

  return (
    <main>
      <Link to="/discovery-timeline" style={{ fontSize: '14px' }}>← Discovery Timeline</Link>

      {/* Prev / Next navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        marginTop: '8px',
      }}>
        {prevEra ? (
          <Link to={`/timeline/${prevEra}`} style={{ color: '#666', textDecoration: 'none' }}>
            ← {prevEra === 'antiquity' ? 'Antiquity' : `${prevEra}s`}
          </Link>
        ) : <span />}
        {nextEra ? (
          <Link to={`/timeline/${nextEra}`} style={{ color: '#666', textDecoration: 'none' }}>
            {`${nextEra}s`} →
          </Link>
        ) : <span />}
      </nav>

      {/* Giant era numeral + heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', margin: '12px 0' }}>
        <span style={{
          fontSize: '96px',
          fontWeight: 'bold',
          fontFamily: "'SF Mono', 'Cascadia Code', monospace",
          lineHeight: 1,
          color,
          letterSpacing: '-0.02em',
        }}>
          {isAntiquity ? '∞' : String(decade)}
        </span>
        <div>
          <h1 style={{
            fontSize: '13px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: DEEP_BLUE,
          }}>
            {eraLabel}
          </h1>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            {elements.length} element{elements.length !== 1 ? 's' : ''} discovered
          </div>
        </div>
      </div>

      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />

      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={eraLabel} captionColor={color} />
      )}

      {/* Discoverers in this era */}
      {discoverers.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#666',
            marginBottom: '8px',
          }}>
            Discoverers
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {discoverers.map((name) => (
              <Link
                key={name}
                to={`/discoverer/${encodeURIComponent(name)}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  border: `1.5px solid ${WARM_RED}`,
                  color: WARM_RED,
                  textDecoration: 'none',
                  minHeight: 'unset',
                  minWidth: 'unset',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', background: WARM_RED, display: 'inline-block', flexShrink: 0 }} />
                {name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nearby eras — graph navigation */}
      {nearbyEras.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#666',
            marginBottom: '8px',
          }}>
            Nearby Eras
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {nearbyEras.map((d) => {
              const count = timeline.filter((e) => e.year != null && decadeOf(e.year) === d).length;
              return (
                <Link
                  key={d}
                  to={`/timeline/${d}`}
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    padding: '6px 12px',
                    border: `1.5px solid ${DEEP_BLUE}`,
                    color: DEEP_BLUE,
                    textDecoration: 'none',
                    minHeight: 'unset',
                    minWidth: 'unset',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', background: DEEP_BLUE, display: 'inline-block', flexShrink: 0 }} />
                  {d}s ({count})
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <SiteNav />
    </main>
  );
}
