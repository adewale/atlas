import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router';
import type { ElementRecord, ElementSources, AnomalyData } from '../lib/types';
import type { PositionedLine } from '../lib/pretext';
import { blockColor, contrastTextColor, adjacencyMap } from '../lib/grid';
import { usePretextLines, useShapedText } from '../hooks/usePretextLines';
import { PRETEXT_SANS } from '../lib/pretext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getElement, allElements } from '../lib/data';
import PretextSvg from './PretextSvg';
import PropertyBar from './PropertyBar';
import { RankDotSparkline, GroupPhaseStrip } from './Sparkline';
import SourceStrip from './SourceStrip';
import type { GroupData } from '../lib/types';

import { BLACK, DEEP_BLUE, WARM_RED, PAPER, GREY_DARK, GREY_MID, MONO_FONT, toSlug } from '../lib/theme';
import InfoTip from './InfoTip';
import { NeighbourChip } from './EntityChip';
import { AnomalyChip } from './EntityChip';

const PLATE_WIDTH = 160;
const PLATE_HEIGHT = 180;
const FULL_WIDTH = 560;
const NARROW_WIDTH = FULL_WIDTH - PLATE_WIDTH - 24;

// Identity block: number + symbol + name, acts as a large "drop cap"
const IDENTITY_WIDTH = 130;
const IDENTITY_HEIGHT = 150;

const MIN_ANNOTATION_GAP = 20;

/** Reusable row for the data plate (Group / Period / Block). */
function DataPlateRow({ label, value, fill, textFill = PAPER, href, ariaLabel, title, viewTransitionName, mobile, prev, next }: {
  label: string; value: string | number; fill: string; textFill?: string;
  href: string; ariaLabel: string; title: string;
  viewTransitionName?: string; mobile: boolean;
  prev?: { symbol: string; name: string };
  next?: { symbol: string; name: string };
}) {
  return (
    <div style={{ viewTransitionName, textDecoration: 'none' } as React.CSSProperties}>
      <svg width={mobile ? '100%' : PLATE_WIDTH} height={56} viewBox={`0 0 ${PLATE_WIDTH} 56`}>
        {/* Main area — links to listing page */}
        <a href={href} aria-label={ariaLabel}>
          <title>{title}</title>
          <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={fill} />
          <text x={12} y={20} fontSize={10} fill={textFill} fontFamily="system-ui">{label}</text>
          <text x={12} y={46} fontSize={24} fontWeight="bold" fill={textFill} fontFamily={MONO_FONT}>{value}</text>
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

/** Find the y-position of the first text line containing `keyword`. */
function findLineYForKeyword(
  lines: PositionedLine[],
  keyword: string,
  lineHeight: number,
): number | null {
  const kw = keyword.toLowerCase();
  for (const line of lines) {
    if (line.text.toLowerCase().includes(kw)) {
      return line.y + lineHeight;
    }
  }
  return null;
}

/** Resolve overlap: if two annotations are within MIN_ANNOTATION_GAP, push later ones down.
 *  If maxY is provided, clamp annotations so they don't exceed that boundary;
 *  overflow items are stacked upward from maxY with MIN_ANNOTATION_GAP spacing. */
function resolveOverlaps(positions: (number | null)[], maxY?: number): (number | null)[] {
  const result = [...positions];
  // Sort indices by their non-null y values, preserving order for nulls
  const nonNullIndices = result
    .map((y, i) => ({ y, i }))
    .filter((e): e is { y: number; i: number } => e.y != null)
    .sort((a, b) => a.y - b.y);

  for (let j = 1; j < nonNullIndices.length; j++) {
    const prev = nonNullIndices[j - 1];
    const curr = nonNullIndices[j];
    const prevY = result[prev.i]!;
    const currY = result[curr.i]!;
    if (currY - prevY < MIN_ANNOTATION_GAP) {
      result[curr.i] = prevY + MIN_ANNOTATION_GAP;
    }
  }

  // Clamp to maxY: if any annotation exceeds the available height,
  // stack them upward from maxY with MIN_ANNOTATION_GAP spacing.
  if (maxY != null && nonNullIndices.length > 0) {
    // Walk backwards through sorted annotations and pull any that exceed maxY
    for (let j = nonNullIndices.length - 1; j >= 0; j--) {
      const idx = nonNullIndices[j].i;
      const y = result[idx]!;
      const limit = maxY - (nonNullIndices.length - 1 - j) * MIN_ANNOTATION_GAP;
      if (y > limit) {
        result[idx] = limit;
      }
    }
    // Re-enforce minimum gap from top to bottom after clamping
    for (let j = 1; j < nonNullIndices.length; j++) {
      const prev = nonNullIndices[j - 1];
      const curr = nonNullIndices[j];
      const prevY = result[prev.i]!;
      const currY = result[curr.i]!;
      if (currY - prevY < MIN_ANNOTATION_GAP) {
        result[curr.i] = prevY + MIN_ANNOTATION_GAP;
      }
    }
  }

  return result;
}

type MarginaliaPropertyProps = {
  text: string;
  rank: number;
  color: string;
  maxWidth: number;
  font: string;
};

function MarginaliaProperty({ text, rank, color, maxWidth, font }: MarginaliaPropertyProps) {
  const { lines: propLines, lineHeight: propLH } = usePretextLines({
    text,
    maxWidth,
    font,
  });

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg
          width={maxWidth}
          height={propLines.length * propLH + propLH}
          style={{ maxWidth: '100%', display: 'block', flexShrink: 1 }}
        >
          <PretextSvg lines={propLines} lineHeight={propLH} fontSize={14} />
        </svg>
        <RankDotSparkline rank={rank} color={color} />
      </div>
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

  // Refs for measuring vertical offset between summary area and marginalia
  const summaryRef = useRef<HTMLDivElement>(null);
  const marginaliaRef = useRef<HTMLElement>(null);
  const [summaryOffsetInMarginalia, setSummaryOffsetInMarginalia] = useState(0);

  useLayoutEffect(() => {
    if (mobile) return;
    const summaryEl = summaryRef.current;
    const marginaliaEl = marginaliaRef.current;
    if (summaryEl && marginaliaEl) {
      const summaryTop = summaryEl.getBoundingClientRect().top;
      const marginaliaTop = marginaliaEl.getBoundingClientRect().top;
      setSummaryOffsetInMarginalia(summaryTop - marginaliaTop);
    }
  }, [mobile, lines, lineHeight]);

  // Pretext-measured marginalia text
  const MARGINALIA_WIDTH = 180;
  const MARGINALIA_FONT = `14px ${PRETEXT_SANS}`;

  const { lines: catLines, lineHeight: catLH } = usePretextLines({
    text: element.category,
    maxWidth: MARGINALIA_WIDTH,
    font: MARGINALIA_FONT,
  });

  // Property bars data with search terms for marginalia alignment — defined as
  // module-level constant (PROPERTIES) to avoid re-creating on every render.

  // Available height for marginalia annotations: summary text height acts as boundary
  const summaryTextHeight = lines.length * lineHeight;

  // Compute y-positions for marginalia annotations aligned to summary text lines
  const annotationPositions = useMemo(() => {
    if (mobile) return null; // On mobile, use stacked layout
    const rawPositions = PROPERTIES.map((prop) =>
      findLineYForKeyword(lines, prop.searchTerm, lineHeight),
    );
    return resolveOverlaps(rawPositions, summaryTextHeight);
  }, [lines, lineHeight, mobile, summaryTextHeight]);

  return (
    <div className="folio-layout" style={{ display: 'flex', gap: '48px', position: 'relative' }}>
      {/* Left colour bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: color,
        }}
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
                viewTransitionName: 'element-number',
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
                viewTransitionName: 'element-symbol',
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
            }}>
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
            <div role="img" aria-label={`Data plate: Group ${element.group ?? '—'}, Period ${element.period}, Block ${element.block}`}>
              {/* Group row — deep blue */}
              <DataPlateRow label="GROUP" value={element.group ?? '—'} fill={DEEP_BLUE} href={element.group != null ? `/atlas/group/${element.group}` : '#'} ariaLabel={`Group ${element.group ?? '—'}`} title={`View all elements in Group ${element.group ?? '—'}`} viewTransitionName="data-plate-group" mobile={mobile} prev={prevInGroup ? { symbol: prevInGroup.symbol, name: prevInGroup.name } : undefined} next={nextInGroup ? { symbol: nextInGroup.symbol, name: nextInGroup.name } : undefined} />
              {/* Period row — warm red */}
              <DataPlateRow label="PERIOD" value={element.period} fill={WARM_RED} href={`/atlas/period/${element.period}`} ariaLabel={`Period ${element.period}`} title={`View all elements in Period ${element.period}`} viewTransitionName="data-plate-period" mobile={mobile} prev={prevInPeriod ? { symbol: prevInPeriod.symbol, name: prevInPeriod.name } : undefined} next={nextInPeriod ? { symbol: nextInPeriod.symbol, name: nextInPeriod.name } : undefined} />
              {/* Block row — block colour */}
              <DataPlateRow label="BLOCK" value={element.block} fill={color} textFill={contrastTextColor(color)} href={`/atlas/block/${element.block}`} ariaLabel={`Block ${element.block}`} title={`View all elements in the ${element.block}-block`} viewTransitionName="data-plate-block" mobile={mobile} prev={prevInBlock ? { symbol: prevInBlock.symbol, name: prevInBlock.name } : undefined} next={nextInBlock ? { symbol: nextInBlock.symbol, name: nextInBlock.name } : undefined} />
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
        <div style={{ borderTop: `4px solid ${color}`, margin: '16px 0' }} />

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

        {/* Property bars — each links to its ranking page */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PROPERTIES.map((prop, i) => {
            const rank = element.rankings[prop.key] ?? 0;
            const val = element[prop.key as keyof ElementRecord] as number | null;
            return (
              <Link key={prop.key} to={`/atlas/rank/${prop.key}`} title={`View all 118 elements ranked by ${prop.label.toLowerCase()}`} style={{ textDecoration: 'none', minHeight: 'unset', minWidth: 'unset' }}>
                <PropertyBar
                  label={prop.label}
                  rank={rank}
                  color={color}
                  width={svgWidth - 60}
                  animate={animate}
                  delay={animate ? 200 + i * 50 : 0}
                  value={val}
                  unit={prop.unit}
                />
              </Link>
            );
          })}
        </div>

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
        {/* Category — Pretext Tier 1 measured text */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: GREY_MID, textTransform: 'uppercase' }}>
            Category
          </div>
          <Link to={`/atlas/category/${toSlug(element.category)}`} aria-label={element.category} title={`View all ${element.category} elements`} style={{ textDecoration: 'none' }}>
            <svg
              width={MARGINALIA_WIDTH}
              height={catLines.length * catLH + catLH}
              style={{ maxWidth: '100%', display: 'block' }}
            >
              <PretextSvg lines={catLines} lineHeight={catLH} fontSize={14} />
            </svg>
          </Link>
        </div>

        {/* Key properties with rank dots — aligned to text lines on desktop, stacked on mobile */}
        {!mobile && annotationPositions ? (
          /* Desktop: absolutely positioned annotations aligned to summary text lines */
          PROPERTIES.map((prop, i) => {
            const val = element[prop.key as keyof ElementRecord];
            const rank = element.rankings[prop.key] ?? 0;
            const displayText = `${prop.label}: ${val != null ? String(val) + (prop.unit ? ' ' + prop.unit : '') : '—'}`;
            const targetY = annotationPositions[i];

            if (targetY != null) {
              return (
                <div
                  key={prop.key}
                  style={{
                    position: 'absolute',
                    top: summaryOffsetInMarginalia + targetY,
                    left: 0,
                    right: 0,
                  }}
                >
                  <MarginaliaProperty
                    text={`◄ ${displayText}`}
                    rank={rank}
                    color={color}
                    maxWidth={MARGINALIA_WIDTH}
                    font={MARGINALIA_FONT}
                  />
                </div>
              );
            }

            /* Fallback: no keyword match, render in flow */
            return (
              <MarginaliaProperty
                key={prop.key}
                text={displayText}
                rank={rank}
                color={color}
                maxWidth={MARGINALIA_WIDTH}
                font={MARGINALIA_FONT}
              />
            );
          })
        ) : (
          /* Mobile / no positions: sequential stacked layout */
          PROPERTIES.map((prop) => {
            const val = element[prop.key as keyof ElementRecord];
            const rank = element.rankings[prop.key] ?? 0;
            const displayText = `${prop.label}: ${val != null ? String(val) + (prop.unit ? ' ' + prop.unit : '') : '—'}`;
            return (
              <MarginaliaProperty
                key={prop.key}
                text={displayText}
                rank={rank}
                color={color}
                maxWidth={MARGINALIA_WIDTH}
                font={MARGINALIA_FONT}
              />
            );
          })
        )}

        {/* Neighbors */}
        <div style={{ marginBottom: '12px' }}>
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
        {sources && <SourceStrip sources={sources} ruleColor={color} />}

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
