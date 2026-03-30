import { useMemo } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import { WARM_RED, GREY_MID, BACK_LINK_STYLE, MONO_FONT } from '../lib/theme';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type DiscovererEntry = { name: string; elements: string[] };

export default function DiscovererDetail() {
  const { name } = useParams();
  const { discoverers } = useLoaderData() as { discoverers: DiscovererEntry[] };

  const decodedName = decodeURIComponent(name ?? '');

  // Find current discoverer
  const discoverer = discoverers.find((d) => d.name === decodedName);
  useDocumentTitle(discoverer ? discoverer.name : 'Discoverer Not Found');
  if (!discoverer) {
    return (
      <PageShell>
        <Link to="/discoverer-network" style={BACK_LINK_STYLE}>← Discoverers</Link>
        <h1 style={{ margin: '16px 0' }}>Discoverer not found</h1>
      </PageShell>
    );
  }

  const elements = discoverer.elements.map((s) => getElement(s)!).filter(Boolean);
  const color = elements.length > 0 ? blockColor(elements[0].block) : WARM_RED;

  // Year range
  const years = elements
    .map((e) => e.discoveryYear)
    .filter((y): y is number => y != null)
    .sort((a, b) => a - b);
  const yearRange = years.length > 0
    ? years.length === 1
      ? String(years[0])
      : `${years[0]}–${years[years.length - 1]}`
    : 'Antiquity';

  // Prev/next discoverer (sorted by element count desc, then name)
  const currentIdx = discoverers.findIndex((d) => d.name === decodedName);
  const prevDisc = currentIdx > 0 ? discoverers[currentIdx - 1] : null;
  const nextDisc = currentIdx < discoverers.length - 1 ? discoverers[currentIdx + 1] : null;

  // Related discoverers: same era (±20 years) or shared block
  const related = useMemo(() => {
    const blocks = new Set(elements.map((e) => e.block));
    const minYear = years.length > 0 ? years[0] : null;
    const maxYear = years.length > 0 ? years[years.length - 1] : null;

    return discoverers
      .filter((d) => {
        if (d.name === decodedName) return false;
        const dElements = d.elements.map((s) => getElement(s)).filter(Boolean);
        // Same era?
        if (minYear != null && maxYear != null) {
          const dYears = dElements
            .map((e) => e!.discoveryYear)
            .filter((y): y is number => y != null);
          if (dYears.some((y) => y >= minYear - 20 && y <= maxYear + 20)) return true;
        }
        // Shared block?
        if (dElements.some((e) => e && blocks.has(e.block))) return true;
        return false;
      })
      .slice(0, 8);
  }, [discoverers, decodedName, elements, years]);

  return (
    <PageShell>
      <Link to="/discoverer-network" style={BACK_LINK_STYLE}>← Discoverers</Link>

      {/* Prev / Next navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        marginTop: '8px',
      }}>
        {prevDisc ? (
          <Link to={`/discoverer/${encodeURIComponent(prevDisc.name)}`} title={`View elements discovered by ${prevDisc.name}`} style={{ color: GREY_MID, textDecoration: 'none' }}>
            ← {prevDisc.name.length > 20 ? prevDisc.name.slice(0, 18) + '…' : prevDisc.name}
          </Link>
        ) : <span />}
        {nextDisc ? (
          <Link to={`/discoverer/${encodeURIComponent(nextDisc.name)}`} title={`View elements discovered by ${nextDisc.name}`} style={{ color: GREY_MID, textDecoration: 'none' }}>
            {nextDisc.name.length > 20 ? nextDisc.name.slice(0, 18) + '…' : nextDisc.name} →
          </Link>
        ) : <span />}
      </nav>

      {/* Giant element count + heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', margin: '12px 0' }}>
        <span style={{
          fontSize: '96px',
          fontWeight: 'bold',
          fontFamily: MONO_FONT,
          lineHeight: 1,
          color,
          letterSpacing: '-0.02em',
        }}>
          {elements.length}
        </span>
        <div>
          <h1 style={{
            fontSize: '13px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: WARM_RED,
          }}>
            {discoverer.name}
          </h1>
          <div style={{ fontSize: '13px', color: GREY_MID, marginTop: '4px' }}>
            {elements.length} element{elements.length !== 1 ? 's' : ''} · {yearRange}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />

      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={discoverer.name} captionColor={color} />
      )}

      {/* Related discoverers — graph navigation */}
      {related.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <h2 style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: GREY_MID,
            marginBottom: '8px',
          }}>
            Related Discoverers
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {related.map((d) => (
              <Link
                key={d.name}
                to={`/discoverer/${encodeURIComponent(d.name)}`}
                title={`View elements discovered by ${d.name}`}
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
                {d.name} ({d.elements.length})
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Link to timeline era for context */}
      <div style={{ marginTop: '24px', fontSize: '13px' }}>
        {years.length > 0 ? (
          <Link to={`/timeline/${Math.floor(years[0] / 10) * 10}`} title={`View the ${Math.floor(years[0] / 10) * 10}s discovery era`} style={{ color: WARM_RED }}>
            View {Math.floor(years[0] / 10) * 10}s on Timeline →
          </Link>
        ) : (
          <Link to="/timeline/antiquity" title="View the Antiquity discovery era" style={{ color: WARM_RED }}>
            View Antiquity on Timeline →
          </Link>
        )}
      </div>
    </PageShell>
  );
}
