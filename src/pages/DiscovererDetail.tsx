import { useMemo } from 'react';
import { useParams, useLoaderData, Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { blockColor } from '../lib/grid';
import AtlasPlate from '../components/AtlasPlate';
import { WARM_RED, BACK_LINK_STYLE, SECTION_LABEL_STYLE } from '../lib/theme';
import { fitLabel, PRETEXT_SANS } from '../lib/pretext';
import { VT } from '../lib/transitions';
import HeroHeader from '../components/HeroHeader';
import SvgPrevNext from '../components/SvgPrevNext';
import { DiscovererChip } from '../components/EntityChip';
import { getDiscovererMetrics } from '../lib/metrics';
import NavigationPill from '../components/NavigationPill';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// SvgPrevNext renders at 11px in a 400-unit-wide viewBox; each label gets ~190 units.
const NAV_LABEL_FONT = `11px ${PRETEXT_SANS}`;
const NAV_LABEL_MAX_W = 180; // conservative: 200 minus arrow + padding

/** Truncate name to fit SvgPrevNext label using precomputed navWidth when available,
 *  falling back to Pretext runtime measurement. */
function truncateNavLabel(name: string): string {
  // Fast path: use precomputed metric if available
  const precomputed = getDiscovererMetrics(name);
  if (precomputed && precomputed.navWidth <= NAV_LABEL_MAX_W) return name;

  // If no precomputed metric, check with Pretext
  if (!precomputed && fitLabel(name, NAV_LABEL_FONT, NAV_LABEL_MAX_W)) return name;

  // Binary search for longest prefix + ellipsis that fits
  let lo = 1, hi = name.length - 1, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fitLabel(name.slice(0, mid) + '\u2026', NAV_LABEL_FONT, NAV_LABEL_MAX_W)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best > 0 ? name.slice(0, best) + '\u2026' : name[0] + '\u2026';
}

type DiscovererEntry = { name: string; elements: string[] };

export default function DiscovererDetail() {
  const { name } = useParams();
  const { discoverers } = useLoaderData() as { discoverers: DiscovererEntry[] };

  const decodedName = decodeURIComponent(name ?? '');

  // Find current discoverer
  const discoverer = discoverers.find((d) => d.name === decodedName);
  useDocumentTitle(discoverer ? discoverer.name : 'Discoverer Not Found');

  // Related discoverers: same era (±20 years) or shared block
  // NOTE: useMemo must be called unconditionally (before any early return)
  const related = useMemo(() => {
    if (!discoverer) return [];
    const elems = discoverer.elements.map((s) => getElement(s)).filter(
      (e): e is ElementRecord => e != null,
    );
    const yrs = elems
      .map((e) => e.discoveryYear)
      .filter((y): y is number => y != null)
      .sort((a, b) => a - b);
    const blocks = new Set(elems.map((e) => e.block));
    const minYear = yrs.length > 0 ? yrs[0] : null;
    const maxYear = yrs.length > 0 ? yrs[yrs.length - 1] : null;

    return discoverers
      .filter((d) => {
        if (d.name === decodedName) return false;
        const dElements = d.elements.map((s) => getElement(s)).filter(
          (e): e is ElementRecord => e != null,
        );
        // Same era?
        if (minYear != null && maxYear != null) {
          const dYears = dElements
            .map((e) => e.discoveryYear)
            .filter((y): y is number => y != null);
          if (dYears.some((y) => y >= minYear - 20 && y <= maxYear + 20)) return true;
        }
        // Shared block?
        if (dElements.some((e) => blocks.has(e.block))) return true;
        return false;
      })
      ; // no limit — show all related discoverers
  }, [discoverers, decodedName, discoverer]);

  if (!discoverer) {
    return (
      <PageShell>
        <Link to="/discoverer-network" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Discoverers</Link>
        <h1 style={{ margin: '16px 0' }}>Discoverer not found</h1>
      </PageShell>
    );
  }

  const elements = discoverer.elements.map((s) => getElement(s)).filter(
    (e): e is ElementRecord => e != null,
  );
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

  return (
    <PageShell>
      <Link to="/discoverer-network" style={BACK_LINK_STYLE}>← Discoverers</Link>

      {/* Giant element count + heading */}
      <HeroHeader
        numeral={elements.length}
        numeralColor={color}
        title={discoverer.name}
        titleColor={WARM_RED}
        subtitle={`${elements.length} element${elements.length !== 1 ? 's' : ''} · ${yearRange}`}
      />

      {/* Prev / Next navigation — Pretext-styled, anchored beneath hero */}
      <SvgPrevNext
        prev={prevDisc ? { label: truncateNavLabel(prevDisc.name), to: `/discoverers/${encodeURIComponent(prevDisc.name)}` } : undefined}
        next={nextDisc ? { label: truncateNavLabel(nextDisc.name), to: `/discoverers/${encodeURIComponent(nextDisc.name)}` } : undefined}
        ariaLabel="Previous and next discoverer navigation"
      />

      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px', viewTransitionName: VT.COLOR_RULE } as React.CSSProperties} />

      {elements.length > 0 && (
        <AtlasPlate elements={elements} caption={discoverer.name} captionColor={color} />
      )}

      {/* Related discoverers — graph navigation */}
      {related.length > 0 && (() => {
        // Compute fixed chip width from precomputed metrics so all chips align
        const chipPadding = 25; // 12px left + 10px right + 3px border
        const maxNameW = Math.max(
          ...related.map((d) => {
            const m = getDiscovererMetrics(d.name);
            return m ? Math.ceil(m.navWidth * 1.1) : 120; // 1.1× for bold vs regular
          }),
        );
        const chipWidth = Math.max(maxNameW + chipPadding, 120);

        return (
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
                  fixedWidth={chipWidth}
                />
              ))}
            </div>
          </section>
        );
      })()}

      {/* Link to timeline era for context */}
      <div style={{ marginTop: '24px' }}>
        {years.length > 0 ? (
          <NavigationPill
            to={`/eras/${Math.floor(years[0] / 10) * 10}`}
            title={`View the ${Math.floor(years[0] / 10) * 10}s discovery era`}
            label={`View ${Math.floor(years[0] / 10) * 10}s on Timeline →`}
            color={WARM_RED}
            dot={false}
          />
        ) : (
          <NavigationPill
            to="/eras/antiquity"
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
