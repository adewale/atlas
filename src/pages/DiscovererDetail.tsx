import { useMemo } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import { WARM_RED, BACK_LINK_STYLE, SECTION_LABEL_STYLE } from '../lib/theme';
import PrevNextNav from '../components/PrevNextNav';
import HeroHeader from '../components/HeroHeader';
import { DiscovererChip } from '../components/EntityChip';
import NavigationPill from '../components/NavigationPill';
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
      <PrevNextNav
        prev={prevDisc ? { label: prevDisc.name.length > 20 ? prevDisc.name.slice(0, 18) + '…' : prevDisc.name, to: `/discoverer/${encodeURIComponent(prevDisc.name)}` } : undefined}
        next={nextDisc ? { label: nextDisc.name.length > 20 ? nextDisc.name.slice(0, 18) + '…' : nextDisc.name, to: `/discoverer/${encodeURIComponent(nextDisc.name)}` } : undefined}
        style={{ marginTop: '8px' }}
      />

      {/* Giant element count + heading */}
      <HeroHeader
        numeral={elements.length}
        numeralColor={color}
        title={discoverer.name}
        titleColor={WARM_RED}
        subtitle={`${elements.length} element${elements.length !== 1 ? 's' : ''} · ${yearRange}`}
      />

      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px' }} />

      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={discoverer.name} captionColor={color} />
      )}

      {/* Related discoverers — graph navigation */}
      {related.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <h2 style={SECTION_LABEL_STYLE}>
            Related Discoverers
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {related.map((d) => (
              <DiscovererChip
                key={d.name}
                name={d.name}
                elementCount={d.elements.length}
              />
            ))}
          </div>
        </section>
      )}

      {/* Link to timeline era for context */}
      <div style={{ marginTop: '24px' }}>
        {years.length > 0 ? (
          <NavigationPill
            to={`/timeline/${Math.floor(years[0] / 10) * 10}`}
            title={`View the ${Math.floor(years[0] / 10) * 10}s discovery era`}
            label={`View ${Math.floor(years[0] / 10) * 10}s on Timeline →`}
            color={WARM_RED}
            dot={false}
          />
        ) : (
          <NavigationPill
            to="/timeline/antiquity"
            title="View the Antiquity discovery era"
            label="View Antiquity on Timeline →"
            color={WARM_RED}
            dot={false}
          />
        )}
      </div>
    </PageShell>
  );
}
