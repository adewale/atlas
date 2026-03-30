import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router';
import type { ElementRecord, ElementSources } from '../lib/types';
import type { PositionedLine } from '../lib/pretext';
import { blockColor, contrastTextColor } from '../lib/grid';
import { usePretextLines, useShapedText } from '../hooks/usePretextLines';
import { useIsMobile } from '../hooks/useIsMobile';
import { getElement } from '../lib/data';
import PretextSvg from './PretextSvg';
import PropertyBar from './PropertyBar';
import { GroupTrendSparkline, RankDotSparkline, GroupPhaseStrip } from './Sparkline';
import SourceStrip from './SourceStrip';
import type { GroupData } from '../lib/types';

import { DEEP_BLUE, WARM_RED, PAPER, toSlug } from '../lib/theme';
import InfoTip from './InfoTip';

const PLATE_WIDTH = 160;
const PLATE_HEIGHT = 180;
const FULL_WIDTH = 560;
const NARROW_WIDTH = FULL_WIDTH - PLATE_WIDTH - 24;

const MIN_ANNOTATION_GAP = 20;

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

/** Resolve overlap: if two annotations are within MIN_ANNOTATION_GAP, push later ones down. */
function resolveOverlaps(positions: (number | null)[]): (number | null)[] {
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
  animate?: boolean;
};

export default function Folio({ element, sources, groups, animate = true }: FolioProps) {
  const color = blockColor(element.block);
  const mobile = useIsMobile();

  const svgWidth = mobile ? 320 : FULL_WIDTH;

  const { lines, lineHeight, plateHeightInLines } = useShapedText({
    text: element.summary,
    fullWidth: FULL_WIDTH,
    narrowWidth: NARROW_WIDTH,
    mobile,
  });

  // Group trend data for electronegativity sparkline
  const groupTrendData = useMemo(() => {
    if (!groups || element.group === null) return null;
    const group = groups.find((g) => g.n === element.group);
    if (!group) return null;
    const values = group.elements.map((sym) => {
      const el = getElement(sym);
      return el?.electronegativity ?? null;
    });
    const highlightIndex = group.elements.indexOf(element.symbol);
    return { values, highlightIndex };
  }, [groups, element]);

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
  const MARGINALIA_FONT = '14px system-ui';

  const { lines: catLines, lineHeight: catLH } = usePretextLines({
    text: element.category,
    maxWidth: MARGINALIA_WIDTH,
    font: MARGINALIA_FONT,
  });

  // Property bars data with search terms for marginalia alignment
  const properties = [
    { label: 'Mass', key: 'mass', searchTerm: 'mass', unit: 'Da' },
    { label: 'EN', key: 'electronegativity', searchTerm: 'electronegativity', unit: '' },
    { label: 'IE', key: 'ionizationEnergy', searchTerm: 'ionization', unit: 'kJ/mol' },
    { label: 'Radius', key: 'radius', searchTerm: 'radius', unit: 'pm' },
  ] as const;

  // Compute y-positions for marginalia annotations aligned to summary text lines
  const annotationPositions = useMemo(() => {
    if (mobile) return null; // On mobile, use stacked layout
    const rawPositions = properties.map((prop) =>
      findLineYForKeyword(lines, prop.searchTerm, lineHeight),
    );
    return resolveOverlaps(rawPositions);
  }, [lines, lineHeight, mobile]);

  return (
    <div className="folio-layout" style={{ display: 'flex', gap: '48px', position: 'relative' }}>
      {/* Left color bar */}
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
        {/* Giant atomic number in block color — morphs from grid cell */}
        <div
          className="folio-number"
          aria-hidden="true"
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color,
            fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
            lineHeight: 1,
            viewTransitionName: 'element-number',
          } as React.CSSProperties}
        >
          {paddedNumber}
        </div>

        {/* Giant symbol — view-transition-name matches grid cell for morphing */}
        <div
          className="folio-symbol"
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#0f0f0f',
            lineHeight: 1.1,
            viewTransitionName: 'element-symbol',
          } as React.CSSProperties}
        >
          {element.symbol}
        </div>

        {/* Element name */}
        <h2 style={{ fontSize: '24px', fontWeight: 'normal', margin: '4px 0 12px' }}>
          {element.name}
        </h2>

        {/* Thin rule in block color */}
        <div style={{ borderTop: `1px solid ${color}`, marginBottom: '16px' }} />

        {/* Summary text shaped around data plate */}
        <div ref={summaryRef} className="folio-summary-area" style={{ position: 'relative', minHeight: PLATE_HEIGHT }}>
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
              <Link to={element.group != null ? `/atlas/group/${element.group}` : '#'} aria-label={`Group ${element.group ?? '—'}`} style={{ display: 'block', textDecoration: 'none' }}>
                <svg width={PLATE_WIDTH} height={56}>
                  <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={DEEP_BLUE} />
                  <text x={12} y={20} fontSize={10} fill={PAPER} fontFamily="system-ui">GROUP</text>
                  <text x={12} y={46} fontSize={24} fontWeight="bold" fill={PAPER} fontFamily="'SF Mono', monospace">{element.group ?? '—'}</text>
                </svg>
              </Link>
              {/* Period row — warm red */}
              <Link to={`/atlas/period/${element.period}`} aria-label={`Period ${element.period}`} style={{ display: 'block', textDecoration: 'none' }}>
                <svg width={PLATE_WIDTH} height={56}>
                  <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={WARM_RED} />
                  <text x={12} y={20} fontSize={10} fill={PAPER} fontFamily="system-ui">PERIOD</text>
                  <text x={12} y={46} fontSize={24} fontWeight="bold" fill={PAPER} fontFamily="'SF Mono', monospace">{element.period}</text>
                </svg>
              </Link>
              {/* Block row — block color */}
              <Link to={`/atlas/block/${element.block}`} aria-label={`Block ${element.block}`} style={{ display: 'block', textDecoration: 'none' }}>
                <svg width={PLATE_WIDTH} height={56}>
                  <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={color} />
                  <text x={12} y={20} fontSize={10} fill={contrastTextColor(color)} fontFamily="system-ui">BLOCK</text>
                  <text x={12} y={46} fontSize={24} fontWeight="bold" fill={contrastTextColor(color)} fontFamily="'SF Mono', monospace">{element.block}</text>
                </svg>
              </Link>
            </div>
          </div>

          {/* Shaped summary text */}
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
              inlineSparkline={
                groupTrendData
                  ? {
                      lineIndex: -1,
                      values: groupTrendData.values,
                      highlightIndex: groupTrendData.highlightIndex,
                      color: color,
                    }
                  : undefined
              }
            />
          </svg>
        </div>

        {/* Group phase strip — shows phase at STP for each group member */}
        {groupPhaseData && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              <InfoTip label="STP = Standard Temperature and Pressure (0°C, 1 atm). This strip shows the physical state of each element in the same group at these conditions.">
                <span>Phase at STP — Group {element.group}</span>
              </InfoTip>
            </div>
            <GroupPhaseStrip
              phases={groupPhaseData.phases}
              symbols={groupPhaseData.symbols}
              highlightIndex={groupPhaseData.highlightIndex}
              width={FULL_WIDTH}
              height={24}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '9px', color: '#666' }}>
              <span><span style={{ color: '#0f0f0f' }}>■</span> Solid</span>
              <span><span style={{ color: '#133e7c' }}>■</span> Liquid</span>
              <span><span style={{ color: '#9e1c2c' }}>■</span> Gas</span>
            </div>
          </div>
        )}

        {/* Property bars */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {properties.map((prop, i) => {
            const rank = element.rankings[prop.key] ?? 0;
            return (
              <PropertyBar
                key={prop.key}
                label={prop.label}
                rank={rank}
                color={color}
                width={FULL_WIDTH - 60}
                animate={animate}
                delay={animate ? 200 + i * 50 : 0}
              />
            );
          })}
        </div>

        {/* Etymology and discovery — educational context */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 0',
            borderTop: `1px solid ${color}`,
            fontSize: '13px',
            lineHeight: 1.7,
            color: '#333',
            opacity: 0,
            animation: animate ? 'folio-line-reveal 300ms var(--ease-out) 400ms forwards' : undefined,
          }}
        >
          {element.etymologyDescription && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etymology</span>
              <div>{element.etymologyDescription}</div>
            </div>
          )}
          {element.discoverer && (
            <div>
              <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discovery</span>
              <div>
                {element.discoverer}
                {element.discoveryYear ? ` (${element.discoveryYear})` : ''}
              </div>
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
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Category
          </div>
          <Link to={`/atlas/category/${toSlug(element.category)}`} aria-label={element.category} style={{ textDecoration: 'none' }}>
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
          properties.map((prop, i) => {
            const val = element[prop.key as keyof ElementRecord];
            const rank = element.rankings[prop.key] ?? 0;
            const displayText = `${prop.label}: ${val != null ? String(val) : '—'}`;
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
          properties.map((prop) => {
            const val = element[prop.key as keyof ElementRecord];
            const rank = element.rankings[prop.key] ?? 0;
            const displayText = `${prop.label}: ${val != null ? String(val) : '—'}`;
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
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Neighbors
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {element.neighbors.map((sym) => (
              <Link key={sym} to={`/element/${sym}`}>
                {sym}
              </Link>
            ))}
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
