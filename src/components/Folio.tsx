import { useMemo, useRef } from 'react';
import { Link } from 'react-router';
import type { ElementRecord, ElementSources, AnomalyData } from '../lib/types';
import { blockColor, contrastTextColor, adjacencyMap } from '../lib/grid';
import { useShapedText } from '../hooks/usePretextLines';
import { PRETEXT_SANS } from '../lib/pretext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getElement, allElements } from '../lib/data';
import PretextSvg from './PretextSvg';
import { GroupPhaseStrip } from './Sparkline';
import SourceStrip from './SourceStrip';
import type { GroupData } from '../lib/types';

import { BLACK, DEEP_BLUE, WARM_RED, PAPER, GREY_DARK, GREY_MID, GREY_LIGHT, MONO_FONT, toSlug, categoryColor } from '../lib/theme';
import { VT } from '../lib/transitions';
import InfoTip from './InfoTip';
import { NeighbourChip } from './EntityChip';
import { AnomalyChip } from './EntityChip';

const PLATE_WIDTH = 160;
const PLATE_HEIGHT = 320;
const RANK_ROW_H = 24;
const FULL_WIDTH = 560;
const NARROW_WIDTH = FULL_WIDTH - PLATE_WIDTH - 24;

// Identity block: number + symbol + name, acts as a large "drop cap"
const IDENTITY_WIDTH = 130;
const IDENTITY_HEIGHT = 150;

/** Reusable row for the data plate (Group / Period / Block / Category). */
function DataPlateRow({ label, value, fill, textFill = PAPER, href, ariaLabel, title, viewTransitionName, mobile, prev, next }: {
  label: string; value: string | number; fill: string; textFill?: string;
  href: string; ariaLabel: string; title: string;
  viewTransitionName?: string; mobile: boolean;
  prev?: { symbol: string; name: string };
  next?: { symbol: string; name: string };
}) {
  const strValue = String(value);
  const valueFontSize = strValue.length > 6 ? 13 : strValue.length > 3 ? 18 : 24;
  const valueY = strValue.length > 6 ? 42 : 46;
  return (
    <div style={{ viewTransitionName, textDecoration: 'none' } as React.CSSProperties}>
      <svg width={mobile ? '100%' : PLATE_WIDTH} height={56} viewBox={`0 0 ${PLATE_WIDTH} 56`}>
        {/* Main area — links to listing page */}
        <a href={href} aria-label={ariaLabel}>
          <title>{title}</title>
          <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={fill} />
          <text x={12} y={20} fontSize={10} fill={textFill} fontFamily="system-ui">{label}</text>
          <text x={12} y={valueY} fontSize={valueFontSize} fontWeight="bold" fill={textFill} fontFamily={valueFontSize >= 18 ? MONO_FONT : 'system-ui, sans-serif'}>{strValue.length > 3 ? strValue.replace(/\b\w/g, c => c.toUpperCase()) : strValue}</text>
        </a>
        {/* Prev/next arrows on the right */}
        {prev && (
          <a href={`/element/${prev.symbol}`} aria-label={`Previous: ${prev.name}`}>
            <title>← {prev.name}</title>
            <rect x={PLATE_WIDTH - 48} y={2} width={24} height={52} fill={fill} />
            <text x={PLATE_WIDTH - 36} y={34} fontSize={16} fill={textFill} fontFamily={PRETEXT_SANS} textAnchor="middle" opacity={0.7} style={{ cursor: 'pointer' }}>←</text>
          </a>
        )}
        {next && (
          <a href={`/element/${next.symbol}`} aria-label={`Next: ${next.name}`}>
            <title>{next.name} →</title>
            <rect x={PLATE_WIDTH - 24} y={2} width={24} height={52} fill={fill} />
            <text x={PLATE_WIDTH - 12} y={34} fontSize={16} fill={textFill} fontFamily={PRETEXT_SANS} textAnchor="middle" opacity={0.7} style={{ cursor: 'pointer' }}>→</text>
          </a>
        )}
      </svg>
    </div>
  );
}

type FolioProps = {
  element: ElementRecord;
  sources?: ElementSources;
  groups?: GroupData[];
  anomalies?: AnomalyData[];
  animate?: boolean;
};

const PROPERTIES = [
  { label: 'Atomic Mass', key: 'mass', searchTerm: 'mass', unit: 'Da' },
  { label: 'Electronegativity', key: 'electronegativity', searchTerm: 'electronegativity', unit: '' },
  { label: 'Ionisation Energy', key: 'ionizationEnergy', searchTerm: 'ionization', unit: 'kJ/mol' },
  { label: 'Atomic Radius', key: 'radius', searchTerm: 'radius', unit: 'pm' },
] as const;

export default function Folio({ element, sources, groups, anomalies, animate = true }: FolioProps) {
  const color = blockColor(element.block);
  const mobile = useIsMobile();

  const svgWidth = mobile ? 320 : FULL_WIDTH;

  const { lines, lineHeight } = useShapedText({
    text: element.summary,
    fullWidth: FULL_WIDTH,
    narrowWidth: NARROW_WIDTH,
    mobile,
    leftIndent: mobile ? undefined : { width: IDENTITY_WIDTH, height: IDENTITY_HEIGHT },
  });

  // Group phase data for phase strip (replaces duplicate EN sparkline)
  const groupPhaseData = useMemo(() => {
    if (!groups || element.group === null) return null;
    const group = groups.find((g) => g.n === element.group);
    if (!group) return null;
    const phases = group.elements.map((sym) => {
      const el = getElement(sym);
      return el?.phase ?? null;
    });
    const highlightIndex = group.elements.indexOf(element.symbol);
    return { phases, symbols: group.elements, highlightIndex };
  }, [groups, element]);

  // Prev/next within group (vertical traversal)
  const { prevInGroup, nextInGroup } = useMemo(() => {
    if (element.group == null) return { prevInGroup: null, nextInGroup: null };
    const groupMembers = allElements
      .filter((e) => e.group === element.group)
      .sort((a, b) => a.period - b.period);
    const idx = groupMembers.findIndex((e) => e.symbol === element.symbol);
    return {
      prevInGroup: idx > 0 ? groupMembers[idx - 1] : null,
      nextInGroup: idx < groupMembers.length - 1 ? groupMembers[idx + 1] : null,
    };
  }, [element.group, element.symbol]);

  // Prev/next within period (horizontal traversal)
  const { prevInPeriod, nextInPeriod } = useMemo(() => {
    const periodMembers = allElements
      .filter((e) => e.period === element.period)
      .sort((a, b) => a.atomicNumber - b.atomicNumber);
    const idx = periodMembers.findIndex((e) => e.symbol === element.symbol);
    return {
      prevInPeriod: idx > 0 ? periodMembers[idx - 1] : null,
      nextInPeriod: idx < periodMembers.length - 1 ? periodMembers[idx + 1] : null,
    };
  }, [element.period, element.symbol]);

  // Prev/next within block
  const { prevInBlock, nextInBlock } = useMemo(() => {
    const blockMembers = allElements
      .filter((e) => e.block === element.block)
      .sort((a, b) => a.atomicNumber - b.atomicNumber);
    const idx = blockMembers.findIndex((e) => e.symbol === element.symbol);
    return {
      prevInBlock: idx > 0 ? blockMembers[idx - 1] : null,
      nextInBlock: idx < blockMembers.length - 1 ? blockMembers[idx + 1] : null,
    };
  }, [element.block, element.symbol]);

  // Prev/next within category
  const { prevInCategory, nextInCategory } = useMemo(() => {
    const catMembers = allElements
      .filter((e) => e.category === element.category)
      .sort((a, b) => a.atomicNumber - b.atomicNumber);
    const idx = catMembers.findIndex((e) => e.symbol === element.symbol);
    return {
      prevInCategory: idx > 0 ? catMembers[idx - 1] : null,
      nextInCategory: idx < catMembers.length - 1 ? catMembers[idx + 1] : null,
    };
  }, [element.category, element.symbol]);

  // Find elements sharing the same discoverer (lateral link)
  const sameDiscoverer = useMemo(() => {
    if (!element.discoverer || element.discoverer.toLowerCase().includes('antiquity')) return [];
    return allElements
      .filter((e) => e.discoverer === element.discoverer && e.symbol !== element.symbol)
      .slice(0, 6);
  }, [element]);

  // Find elements sharing the same etymology origin (lateral link)
  const sameEtymology = useMemo(() => {
    if (!element.etymologyOrigin || element.etymologyOrigin === 'unknown') return [];
    return allElements
      .filter((e) => e.etymologyOrigin === element.etymologyOrigin && e.symbol !== element.symbol)
      .slice(0, 6);
  }, [element]);

  // Anomalies this element belongs to
  const elementAnomalies = useMemo(() => {
    if (!anomalies) return [];
    return anomalies.filter((a) => a.elements.includes(element.symbol));
  }, [anomalies, element.symbol]);

  const paddedNumber = String(element.atomicNumber).padStart(3, '0');

  const summaryRef = useRef<HTMLDivElement>(null);
  const marginaliaRef = useRef<HTMLElement>(null);

  return (
    <div className="folio-layout" style={{ display: 'flex', gap: '48px', position: 'relative' }}>
      {/* Left colour bar — morph target for element-cell-bg */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: color,
          viewTransitionName: VT.CELL_BG,
        } as React.CSSProperties}
      />

      {/* Main content */}
      <div className="folio-main" style={{ flex: 1, paddingLeft: '24px', minWidth: 0 }}>
        {/* Summary area: identity block (left), text (centre), data plate (right) */}
        <div ref={summaryRef} className="folio-summary-area" style={{ position: 'relative', minHeight: PLATE_HEIGHT }}>
          {/* Identity block — number + symbol + name, acts as dramatic drop cap */}
          <div
            className="folio-identity"
            style={{
              position: mobile ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: mobile ? '100%' : IDENTITY_WIDTH,
              marginBottom: mobile ? '12px' : 0,
              ...(animate
                ? {
                    opacity: 0,
                    animation: 'folio-line-reveal 400ms var(--ease-out) forwards',
                  }
                : {}),
            }}
          >
            <div
              className="folio-number"
              aria-hidden="true"
              style={{
                fontSize: mobile ? '64px' : '56px',
                fontWeight: 'bold',
                color,
                fontFamily: MONO_FONT,
                lineHeight: 1,
                viewTransitionName: VT.NUMBER,
              } as React.CSSProperties}
            >
              {paddedNumber}
            </div>
            <div
              className="folio-symbol"
              style={{
                fontSize: mobile ? '40px' : '44px',
                fontWeight: 'bold',
                color,
                lineHeight: 1.1,
                viewTransitionName: VT.SYMBOL,
              } as React.CSSProperties}
            >
              {element.symbol}
            </div>
            <h2 style={{
              fontSize: '11px',
              fontWeight: 'normal',
              margin: '4px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: GREY_MID,
              viewTransitionName: VT.NAME,
            } as React.CSSProperties}>
              {element.name}
            </h2>
          </div>

          {/* Data plate positioned at top-right */}
          <div
            data-testid="data-plate"
            className="folio-data-plate"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: PLATE_WIDTH,
              ...(animate
                ? {
                    clipPath: 'inset(0 100% 0 0)',
                    animation: 'plate-wipe 350ms var(--ease-out) 150ms forwards',
                  }
                : {}),
            }}
          >
            <div role="img" aria-label={`Data plate: Group ${element.group ?? '—'}, Period ${element.period}, Block ${element.block}, ${element.category}`}>
              {/* Group row — deep blue */}
              <DataPlateRow label="GROUP" value={element.group ?? '—'} fill={DEEP_BLUE} href={element.group != null ? `/atlas/group/${element.group}` : '#'} ariaLabel={`Group ${element.group ?? '—'}`} title={`View all elements in Group ${element.group ?? '—'}`} viewTransitionName={VT.DATA_PLATE_GROUP} mobile={mobile} prev={prevInGroup ? { symbol: prevInGroup.symbol, name: prevInGroup.name } : undefined} next={nextInGroup ? { symbol: nextInGroup.symbol, name: nextInGroup.name } : undefined} />
              {/* Period row — warm red */}
              <DataPlateRow label="PERIOD" value={element.period} fill={WARM_RED} href={`/atlas/period/${element.period}`} ariaLabel={`Period ${element.period}`} title={`View all elements in Period ${element.period}`} viewTransitionName={VT.DATA_PLATE_PERIOD} mobile={mobile} prev={prevInPeriod ? { symbol: prevInPeriod.symbol, name: prevInPeriod.name } : undefined} next={nextInPeriod ? { symbol: nextInPeriod.symbol, name: nextInPeriod.name } : undefined} />
              {/* Block row — block colour */}
              <DataPlateRow label="BLOCK" value={element.block} fill={color} textFill={contrastTextColor(color)} href={`/atlas/block/${element.block}`} ariaLabel={`Block ${element.block}`} title={`View all elements in the ${element.block}-block`} viewTransitionName={VT.DATA_PLATE_BLOCK} mobile={mobile} prev={prevInBlock ? { symbol: prevInBlock.symbol, name: prevInBlock.name } : undefined} next={nextInBlock ? { symbol: nextInBlock.symbol, name: nextInBlock.name } : undefined} />
              {/* Category row */}
              <DataPlateRow label="CATEGORY" value={element.category} fill={categoryColor(element.category)} href={`/atlas/category/${toSlug(element.category)}`} ariaLabel={element.category} title={`View all ${element.category} elements`} mobile={mobile} prev={prevInCategory ? { symbol: prevInCategory.symbol, name: prevInCategory.name } : undefined} next={nextInCategory ? { symbol: nextInCategory.symbol, name: nextInCategory.name } : undefined} />
            </div>

            {/* Rank sub-rows — compact, visibly clickable */}
            <div style={{ marginTop: '2px' }}>
              {PROPERTIES.map((prop) => {
                const rank = element.rankings[prop.key] ?? 0;
                const total = 118;
                const fraction = rank > 0 ? (total - rank + 1) / total : 0;
                return (
                  <Link
                    key={prop.key}
                    to={`/atlas/rank/${prop.key}`}
                    title={`View all 118 elements ranked by ${prop.label.toLowerCase()}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <svg width={mobile ? '100%' : PLATE_WIDTH} height={RANK_ROW_H} viewBox={`0 0 ${PLATE_WIDTH} ${RANK_ROW_H}`}>
                      {/* Background */}
                      <rect x={0} y={0} width={PLATE_WIDTH} height={RANK_ROW_H} fill={PAPER} stroke={BLACK} strokeWidth={0.5} />
                      {/* Filled portion */}
                      <rect x={0} y={0} width={fraction * PLATE_WIDTH} height={RANK_ROW_H} fill={color} opacity={0.15} />
                      {/* Label */}
                      <text x={6} y={16} fontSize={9} fill={BLACK} fontFamily={MONO_FONT} fontWeight="bold">
                        {prop.label}
                      </text>
                      {/* Rank */}
                      <text x={PLATE_WIDTH - 6} y={16} fontSize={9} fill={GREY_MID} fontFamily={MONO_FONT} textAnchor="end">
                        {rank > 0 ? `#${rank}` : '—'} →
                      </text>
                    </svg>
                  </Link>
                );
              })}
            </div>

          </div>

          {/* Shaped summary text — flows around identity block (left) and data plate (right) */}
          <svg
            width={svgWidth}
            height={Math.max(PLATE_HEIGHT, lines.length * lineHeight + 16)}
            aria-label="Element summary"
            style={{ maxWidth: '100%' }}
          >
            <PretextSvg
              lines={lines}
              lineHeight={lineHeight}
              y={0}
              maxWidth={svgWidth}
              animationStagger={animate ? 30 : undefined}
            />
          </svg>
        </div>

        {/* Thick rule in block colour */}
        <div style={{ borderTop: `4px solid ${color}`, margin: '16px 0', viewTransitionName: VT.COLOR_RULE } as React.CSSProperties} />

        {/* Group phase strip — shows phase at STP for each group member */}
        {groupPhaseData && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: GREY_MID, marginBottom: '4px' }}>
              <InfoTip label="STP = Standard Temperature and Pressure (0°C, 1 atm). This strip shows the physical state of each element in the same group at these conditions.">
                <span>Phase at STP — Group {element.group}</span>
              </InfoTip>
            </div>
            <GroupPhaseStrip
              phases={groupPhaseData.phases}
              symbols={groupPhaseData.symbols}
              highlightIndex={groupPhaseData.highlightIndex}
              width={svgWidth}
              height={24}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '9px', color: GREY_MID }}>
              <span><span style={{ color: BLACK }}>■</span> Solid</span>
              <span><span style={{ color: DEEP_BLUE }}>■</span> Liquid</span>
              <span><span style={{ color: WARM_RED }}>■</span> Gas</span>
            </div>
          </div>
        )}

        {/* Anomaly badges — shows which anomalies this element belongs to */}
        {elementAnomalies.length > 0 && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              opacity: 0,
              animation: animate ? 'folio-line-reveal 300ms var(--ease-out) 350ms forwards' : undefined,
            }}
          >
            {elementAnomalies.map((a) => (
              <AnomalyChip
                key={a.slug}
                slug={a.slug}
                label={a.label}
                elementCount={a.elements.length}
              />
            ))}
          </div>
        )}

        {/* Etymology and discovery — educational context with lateral links */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 0',
            borderTop: `3px solid ${color}`,
            fontSize: '13px',
            lineHeight: 1.7,
            color: GREY_DARK,
            opacity: 0,
            animation: animate ? 'folio-line-reveal 300ms var(--ease-out) 400ms forwards' : undefined,
          }}
        >
          {element.etymologyDescription && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: GREY_MID, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etymology</span>
              <div>
                {element.etymologyDescription}
                {element.etymologyOrigin && element.etymologyOrigin !== 'unknown' && (
                  <Link
                    to={`/etymology-map#${element.etymologyOrigin?.toLowerCase()}`}
                    title={`View all elements with ${element.etymologyOrigin} etymology`}
                    style={{ marginLeft: '6px', fontSize: '11px', color }}
                  >
                    ({element.etymologyOrigin} →)
                  </Link>
                )}
              </div>
              {sameEtymology.length > 0 && (
                <div style={{ fontSize: '11px', color: GREY_MID, marginTop: '2px' }}>
                  Also named for {element.etymologyOrigin}:{' '}
                  {sameEtymology.map((e, i) => (
                    <span key={e.symbol}>
                      {i > 0 && ', '}
                      <Link to={`/element/${e.symbol}`} title={e.name} style={{ color }}>{e.symbol}</Link>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {element.discoverer && (
            <div>
              <span style={{ fontSize: '10px', color: GREY_MID, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discovery</span>
              <div>
                <Link to={`/discoverer/${encodeURIComponent(element.discoverer)}`} title={`View all elements discovered by ${element.discoverer}`} style={{ color, textDecoration: 'none' }}>
                  {element.discoverer}
                </Link>
                {element.discoveryYear ? ` (${element.discoveryYear})` : ''}
                <Link
                  to={element.discoveryYear ? `/timeline/${Math.floor(element.discoveryYear / 10) * 10}` : '/discovery-timeline'}
                  title={element.discoveryYear ? `View the ${Math.floor(element.discoveryYear / 10) * 10}s discovery era` : 'View discovery timeline'}
                  style={{ marginLeft: '6px', fontSize: '11px', color }}
                >
                  timeline →
                </Link>
              </div>
              {sameDiscoverer.length > 0 && (
                <div style={{ fontSize: '11px', color: GREY_MID, marginTop: '2px' }}>
                  Also by {element.discoverer.split(',')[0].split(' and ')[0]}:{' '}
                  {sameDiscoverer.map((e, i) => (
                    <span key={e.symbol}>
                      {i > 0 && ', '}
                      <Link to={`/element/${e.symbol}`} title={e.name} style={{ color }}>{e.symbol}</Link>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marginalia panel */}
      <aside
        ref={marginaliaRef}
        className="folio-marginalia"
        style={{
          width: '200px',
          flexShrink: 0,
          fontSize: '13px',
          lineHeight: 1.6,
          position: 'relative',
        }}
      >
        {/* Neighbors */}
        <div style={{ marginBottom: '12px', borderLeft: `3px solid ${color}`, paddingLeft: '10px' }}>
          <div style={{ fontSize: '10px', color: GREY_MID, textTransform: 'uppercase' }}>
            Neighbours
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {element.neighbors.map((sym) => {
              const neighbour = getElement(sym);
              if (!neighbour) return null;
              const adj = adjacencyMap.get(element.symbol);
              const dirLabels: Record<string, string> = { left: '← left', right: '→ right', up: '↑ above', down: '↓ below' };
              let direction: string | undefined;
              if (adj) {
                for (const [dir, target] of Object.entries(adj)) {
                  if (target === sym) { direction = dirLabels[dir]; break; }
                }
              }
              return (
                <NeighbourChip
                  key={sym}
                  symbol={sym}
                  name={neighbour.name}
                  color={blockColor(neighbour.block)}
                  direction={direction}
                />
              );
            })}
          </div>
        </div>

        {/* Source strip (mandatory CC BY-SA) */}
        {sources && (
          <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '10px' }}>
            <SourceStrip sources={sources} ruleColor={color} />
          </div>
        )}

        {/* Compare link */}
        <div style={{ marginTop: '12px' }}>
          <Link to={`/compare/${element.symbol}/${element.neighbors[0] ?? 'O'}`}>
            Compare →
          </Link>
        </div>
      </aside>
    </div>
  );
}
