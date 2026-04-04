import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Link } from 'react-router';
import type { ElementRecord, ElementSources, AnomalyData } from '../lib/types';
import { blockColor, contrastTextColor, adjacencyMap } from '../lib/grid';
import { useShapedText } from '../hooks/usePretextLines';
import { PRETEXT_SANS, measureLines } from '../lib/pretext';
import type { PositionedLine } from '../lib/pretext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getElement, allElements } from '../lib/data';
import { getElementMetrics } from '../lib/metrics';
import PretextSvg from './PretextSvg';
import { GroupPhaseStrip } from './Sparkline';
import SourceStrip from './SourceStrip';
import type { GroupData } from '../lib/types';

import { BLACK, DEEP_BLUE, WARM_RED, PAPER, GREY_DARK, GREY_MID, GREY_LIGHT, MONO_FONT, toSlug, categoryColor } from '../lib/theme';
import { VT } from '../lib/transitions';
import InfoTip from './InfoTip';
import SvgLink from './SvgLink';
import { NeighbourChip } from './EntityChip';
import { AnomalyChip } from './EntityChip';

const PLATE_WIDTH = 160;
const PLATE_ROW_H = 56;
const PLATE_ROWS = 4; // Group, Period, Block, Category
const PLATE_ROW_GAP = 6; // gap between DataPlateRow divs (from browser measurement)
const PLATE_HEIGHT = PLATE_ROW_H * PLATE_ROWS + PLATE_ROW_GAP * (PLATE_ROWS - 1); // 242
const RANK_ROW_H = 24;
const FULL_WIDTH = 560;
const PLATE_GAP = 24;
const NARROW_WIDTH = FULL_WIDTH - PLATE_WIDTH - PLATE_GAP;

// Identity block: number + symbol + name, acts as a large "drop cap"
// Height: number (48px lh1) + symbol (36px lh1.1≈40) + name (10px+2px≈17) ≈ 105px
const IDENTITY_HEIGHT = 106;
const MIN_ANNOTATION_GAP = 24;

/** Measure the identity block's actual width from element data using Pretext. */
function measureIdentityWidth(paddedNumber: string, symbol: string, name: string, mobile: boolean): number {
  const numFontSize = mobile ? 56 : 48;
  const numLines = measureLines(paddedNumber, `bold ${numFontSize}px ${MONO_FONT}`, 9999, numFontSize);
  const symLines = measureLines(symbol, `bold 36px system-ui, sans-serif`, 9999, 40);
  // Name is uppercase with 0.2em letter-spacing; approximate by scaling measured width by 1.2
  const nameLines = measureLines(name.toUpperCase(), `10px system-ui, sans-serif`, 9999, 12);
  const nameW = (nameLines[0]?.width ?? 40) * 1.2; // letter-spacing adds ~20%

  const maxW = Math.max(
    numLines[0]?.width ?? 60,
    symLines[0]?.width ?? 30,
    nameW,
  );
  // Add 8px breathing room so text doesn't touch the identity
  return Math.ceil(maxW) + 8;
}

/** Reusable row for the data plate (Group / Period / Block / Category). */
function DataPlateRow({ label, value, fill, textFill = PAPER, href, ariaLabel, title, viewTransitionName, rowWidth, prev, next }: {
  label: string; value: string | number; fill: string; textFill?: string;
  href: string; ariaLabel: string; title: string;
  viewTransitionName?: string; rowWidth: number;
  prev?: { symbol: string; name: string };
  next?: { symbol: string; name: string };
}) {
  const strValue = String(value);
  // Cap fontSize for long strings; use system-ui for wordy values, mono for short codes
  const valueFontSize = strValue.length > 6 ? 13 : strValue.length > 3 ? 18 : 24;
  const valueY = strValue.length > 6 ? 42 : 46;
  const hasArrows = !!(prev || next);
  const maxTextWidth = rowWidth - 12 - (hasArrows ? 52 : 8);
  const displayValue = strValue.length > 3 ? strValue.replace(/\b\w/g, c => c.toUpperCase()) : strValue;
  // Use Pretext measurement for compression detection (fallback for non-precomputed values)
  const valueFont = `bold ${valueFontSize}px ${valueFontSize >= 18 ? MONO_FONT : 'system-ui, sans-serif'}`;
  const measured = measureLines(displayValue, valueFont, 9999, valueFontSize);
  const measuredWidth = measured[0]?.width ?? 0;
  const needsCompression = measuredWidth > maxTextWidth;
  return (
    <div style={{ viewTransitionName, textDecoration: 'none' } as React.CSSProperties}>
      <svg width={rowWidth} height={56} viewBox={`0 0 ${rowWidth} 56`}>
        {/* Main area — links to listing page */}
        <SvgLink to={href} aria-label={ariaLabel}>
          <title>{title}</title>
          <rect x={0} y={0} width={rowWidth} height={56} fill={fill} />
          <text x={12} y={20} fontSize={10} fill={textFill} fontFamily="system-ui">{label}</text>
          <text x={12} y={valueY} fontSize={valueFontSize} fontWeight="bold" fill={textFill} fontFamily={valueFontSize >= 18 ? MONO_FONT : 'system-ui, sans-serif'} {...(needsCompression ? { textLength: maxTextWidth, lengthAdjust: 'spacingAndGlyphs' } : {})}>{displayValue}</text>
        </SvgLink>
        {/* Prev/next arrows on the right */}
        {prev && (
          <SvgLink to={`/elements/${prev.symbol}`} aria-label={`Previous: ${prev.name}`}>
            <title>← {prev.name}</title>
            <rect x={rowWidth - 48} y={2} width={24} height={52} fill={fill} />
            <text x={rowWidth - 36} y={34} fontSize={16} fill={textFill} fontFamily={PRETEXT_SANS} textAnchor="middle" opacity={0.7} style={{ cursor: 'pointer' }}>←</text>
          </SvgLink>
        )}
        {next && (
          <SvgLink to={`/elements/${next.symbol}`} aria-label={`Next: ${next.name}`}>
            <title>{next.name} →</title>
            <rect x={rowWidth - 24} y={2} width={24} height={52} fill={fill} />
            <text x={rowWidth - 12} y={34} fontSize={16} fill={textFill} fontFamily={PRETEXT_SANS} textAnchor="middle" opacity={0.7} style={{ cursor: 'pointer' }}>→</text>
          </SvgLink>
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

  // Measure actual container width so layout fills available space
  const mainRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    // Use content box (excludes padding) so SVG fits exactly
    const style = getComputedStyle(el);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    setMeasuredWidth(el.clientWidth - padL - padR);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentBoxSize?.[0]?.inlineSize;
      if (w != null && w > 0) {
        setMeasuredWidth(w);
      } else {
        const rect = entries[0]?.contentRect;
        if (rect && rect.width > 0) setMeasuredWidth(rect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Use measured width once available, fall back to hardcoded defaults
  const effectiveWidth = measuredWidth > 0 ? measuredWidth : (mobile ? 320 : FULL_WIDTH);
  const effectiveNarrow = effectiveWidth - PLATE_WIDTH - PLATE_GAP;

  const paddedNumber = String(element.atomicNumber).padStart(3, '0');
  const precomputed = getElementMetrics(element.symbol);
  const identityWidth = precomputed
    ? (mobile ? precomputed.identityWidthMobile : precomputed.identityWidth)
    : measureIdentityWidth(paddedNumber, element.symbol, element.name, mobile);

  const textFullWidth = mobile ? effectiveWidth : Math.min(FULL_WIDTH, effectiveWidth);
  const { lines, lineHeight } = useShapedText({
    text: element.summary,
    fullWidth: textFullWidth,
    narrowWidth: Math.min(effectiveNarrow, textFullWidth),
    plateHeight: PLATE_HEIGHT,
    mobile,
    leftIndent: mobile ? undefined : { width: identityWidth, height: IDENTITY_HEIGHT },
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

  const summaryRef = useRef<HTMLDivElement>(null);
  const marginaliaRef = useRef<HTMLElement>(null);

  return (
    <div className="folio-layout" style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: mobile ? '24px' : '48px' }}>
      {/* Main content */}
      <div ref={mainRef} className="folio-main" style={{ flex: 1, paddingLeft: '24px', minWidth: 0, position: 'relative' }}>
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
        {/* Summary area: identity block (left), text (centre), data plate (right) */}
        <div ref={summaryRef} className="folio-summary-area" style={{ position: 'relative', minHeight: mobile ? 'auto' : PLATE_HEIGHT }}>
          {/* Identity block — number + symbol + name, acts as dramatic drop cap */}
          <div
            className="folio-identity"
            style={{
              position: mobile ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: mobile ? 'auto' : identityWidth,
              marginBottom: mobile ? 0 : 0,
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
                fontSize: mobile ? '56px' : '48px',
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
                fontSize: mobile ? '36px' : '36px',
                fontWeight: 'bold',
                color,
                lineHeight: 1.1,
                viewTransitionName: VT.SYMBOL,
              } as React.CSSProperties}
            >
              {element.symbol}
            </div>
            <h2 style={{
              fontSize: '10px',
              fontWeight: 'normal',
              margin: '2px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: GREY_MID,
              viewTransitionName: VT.NAME,
            } as React.CSSProperties}>
              {element.name}
            </h2>
          </div>

          {/* Data plate positioned at top-right on desktop, stacked on mobile */}
          <div
            data-testid="data-plate"
            className="folio-data-plate"
            style={{
              position: mobile ? 'static' : 'absolute',
              top: 0,
              right: 0,
              width: mobile ? 'auto' : PLATE_WIDTH,
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
              <DataPlateRow label="GROUP" value={element.group ?? '—'} fill={DEEP_BLUE} href={element.group != null ? `/groups/${element.group}` : '#'} ariaLabel={`Group ${element.group ?? '—'}`} title={`View all elements in Group ${element.group ?? '—'}`} viewTransitionName={VT.DATA_PLATE_GROUP} rowWidth={mobile ? effectiveWidth : PLATE_WIDTH} prev={prevInGroup ? { symbol: prevInGroup.symbol, name: prevInGroup.name } : undefined} next={nextInGroup ? { symbol: nextInGroup.symbol, name: nextInGroup.name } : undefined} />
              {/* Period row — warm red */}
              <DataPlateRow label="PERIOD" value={element.period} fill={WARM_RED} href={`/periods/${element.period}`} ariaLabel={`Period ${element.period}`} title={`View all elements in Period ${element.period}`} viewTransitionName={VT.DATA_PLATE_PERIOD} rowWidth={mobile ? effectiveWidth : PLATE_WIDTH} prev={prevInPeriod ? { symbol: prevInPeriod.symbol, name: prevInPeriod.name } : undefined} next={nextInPeriod ? { symbol: nextInPeriod.symbol, name: nextInPeriod.name } : undefined} />
              {/* Block row — block colour */}
              <DataPlateRow label="BLOCK" value={element.block} fill={color} textFill={contrastTextColor(color)} href={`/blocks/${element.block}`} ariaLabel={`Block ${element.block}`} title={`View all elements in the ${element.block}-block`} viewTransitionName={VT.DATA_PLATE_BLOCK} rowWidth={mobile ? effectiveWidth : PLATE_WIDTH} prev={prevInBlock ? { symbol: prevInBlock.symbol, name: prevInBlock.name } : undefined} next={nextInBlock ? { symbol: nextInBlock.symbol, name: nextInBlock.name } : undefined} />
              {/* Category row */}
              <DataPlateRow label="CATEGORY" value={element.category} fill={categoryColor(element.category)} href={`/categories/${toSlug(element.category)}`} ariaLabel={element.category} title={`View all ${element.category} elements`} rowWidth={mobile ? effectiveWidth : PLATE_WIDTH} prev={prevInCategory ? { symbol: prevInCategory.symbol, name: prevInCategory.name } : undefined} next={nextInCategory ? { symbol: nextInCategory.symbol, name: nextInCategory.name } : undefined} />
            </div>

          </div>

          {/* Shaped summary text — flows around identity block (left) and data plate (right) */}
          <svg
            width={effectiveWidth}
            height={Math.max(PLATE_HEIGHT, lines.length * lineHeight + 16)}
            viewBox={`0 0 ${effectiveWidth} ${Math.max(PLATE_HEIGHT, lines.length * lineHeight + 16)}`}
            aria-label="Element summary"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <PretextSvg
              lines={lines}
              lineHeight={lineHeight}
              y={0}
              maxWidth={effectiveWidth}
              animationStagger={animate ? 30 : undefined}
            />
          </svg>
        </div>

        {/* Rank sub-rows — full width, beneath summary area */}
        <div className="folio-rank-rows" style={{ display: 'flex', gap: '2px', marginTop: '8px', flexWrap: 'wrap' }}>
          {PROPERTIES.map((prop) => {
            const rank = element.rankings[prop.key] ?? 0;
            const total = 118;
            const fraction = rank > 0 ? (total - rank + 1) / total : 0;
            const rowW = mobile ? effectiveWidth : Math.floor((effectiveWidth - 6) / 2);
            return (
              <Link
                key={prop.key}
                to={`/properties/${prop.key}`}
                title={`View all 118 elements ranked by ${prop.label.toLowerCase()}`}
                style={{ textDecoration: 'none', display: 'block', flex: mobile ? '1 1 100%' : `0 0 ${rowW}px` }}
              >
                <svg width="100%" height={RANK_ROW_H} viewBox={`0 0 ${rowW} ${RANK_ROW_H}`} preserveAspectRatio="none">
                  <rect x={0} y={0} width={rowW} height={RANK_ROW_H} fill={PAPER} stroke={BLACK} strokeWidth={0.5} />
                  <rect x={0} y={0} width={fraction * rowW} height={RANK_ROW_H} fill={color} opacity={0.15} />
                  <text x={6} y={16} fontSize={9} fill={BLACK} fontFamily={MONO_FONT} fontWeight="bold">
                    {prop.label}
                  </text>
                  <text x={rowW - 6} y={16} fontSize={9} fill={GREY_MID} fontFamily={MONO_FONT} textAnchor="end">
                    {rank > 0 ? `#${rank}` : '—'} →
                  </text>
                </svg>
              </Link>
            );
          })}
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
              width={effectiveWidth}
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
                      <Link to={`/elements/${e.symbol}`} title={e.name} style={{ color }}>{e.symbol}</Link>
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
                <Link to={`/discoverers/${encodeURIComponent(element.discoverer)}`} title={`View all elements discovered by ${element.discoverer}`} style={{ color, textDecoration: 'none' }}>
                  {element.discoverer}
                </Link>
                {element.discoveryYear ? ` (${element.discoveryYear})` : ''}
                <Link
                  to={element.discoveryYear ? `/eras/${Math.floor(element.discoveryYear / 10) * 10}` : '/discovery-timeline'}
                  title={element.discoveryYear ? `View the ${Math.floor(element.discoveryYear / 10) * 10}s discovery era` : 'View discovery timeline'}
                  style={{ marginLeft: '6px', fontSize: '11px', color }}
                >
                  {element.discoveryYear ? `${Math.floor(element.discoveryYear / 10) * 10}s →` : 'timeline →'}
                </Link>
              </div>
              {sameDiscoverer.length > 0 && (
                <div style={{ fontSize: '11px', color: GREY_MID, marginTop: '2px' }}>
                  Also by {element.discoverer.split(',')[0].split(' and ')[0]}:{' '}
                  {sameDiscoverer.map((e, i) => (
                    <span key={e.symbol}>
                      {i > 0 && ', '}
                      <Link to={`/elements/${e.symbol}`} title={e.name} style={{ color }}>{e.symbol}</Link>
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
          width: mobile ? 'auto' : '200px',
          flexShrink: 0,
          fontSize: '13px',
          lineHeight: 1.6,
          position: 'relative',
        }}
      >
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
        {sources && (
          <SourceStrip sources={sources} ruleColor={color} />
        )}

        {/* Compare link */}
        <div style={{ marginTop: '12px' }}>
          <Link to={`/elements/${element.symbol}/compare/${element.neighbors[0] ?? 'O'}`}>
            Compare →
          </Link>
        </div>
      </aside>
    </div>
  );
}
