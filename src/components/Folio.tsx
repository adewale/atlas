import { useMemo, useState, useEffect } from 'react';
import type { ElementRecord, ElementSources } from '../lib/types';
import { blockColor, contrastTextColor } from '../lib/grid';
import { usePretextLines, useShapedText } from '../hooks/usePretextLines';
import { getElement } from '../lib/data';
import PretextSvg from './PretextSvg';
import PropertyBar from './PropertyBar';
import { GroupTrendSparkline, RankDotSparkline } from './Sparkline';
import SourceStrip from './SourceStrip';
import type { GroupData } from '../lib/types';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return mobile;
}

const DEEP_BLUE = '#133e7c';
const WARM_RED = '#9e1c2c';
const PAPER = '#f7f2e8';

const PLATE_WIDTH = 160;
const PLATE_HEIGHT = 180;
const FULL_WIDTH = 560;
const NARROW_WIDTH = FULL_WIDTH - PLATE_WIDTH - 24;

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

  const paddedNumber = String(element.atomicNumber).padStart(3, '0');

  // Pretext-measured marginalia text
  const MARGINALIA_WIDTH = 180;
  const MARGINALIA_FONT = '14px system-ui';

  const { lines: catLines, lineHeight: catLH } = usePretextLines({
    text: element.category,
    maxWidth: MARGINALIA_WIDTH,
    font: MARGINALIA_FONT,
  });

  // Property bars data
  const properties = [
    { label: 'Mass', key: 'mass' },
    { label: 'EN', key: 'electronegativity' },
    { label: 'IE', key: 'ionizationEnergy' },
    { label: 'Radius', key: 'radius' },
  ] as const;

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
        {/* Giant atomic number in block color */}
        <div
          className="folio-number"
          aria-hidden="true"
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color,
            fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
            lineHeight: 1,
          }}
        >
          {paddedNumber}
        </div>

        {/* Giant symbol */}
        <div
          className="folio-symbol"
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#0f0f0f',
            lineHeight: 1.1,
          }}
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
        <div className="folio-summary-area" style={{ position: 'relative', minHeight: PLATE_HEIGHT }}>
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
                    clipPath: 'inset(0 0 0 100%)',
                    animation: 'plate-wipe 350ms var(--ease-out) 150ms forwards',
                  }
                : {}),
            }}
          >
            <svg width={PLATE_WIDTH} height={PLATE_HEIGHT} role="img" aria-label={`Data plate: Group ${element.group ?? '—'}, Period ${element.period}, Block ${element.block}`}>
              {/* Group row — deep blue */}
              <rect x={0} y={0} width={PLATE_WIDTH} height={56} fill={DEEP_BLUE} />
              <text x={12} y={20} fontSize={10} fill={PAPER} fontFamily="system-ui">
                GROUP
              </text>
              <text
                x={12}
                y={46}
                fontSize={24}
                fontWeight="bold"
                fill={PAPER}
                fontFamily="'SF Mono', monospace"
              >
                {element.group ?? '—'}
              </text>

              {/* Period row — warm red */}
              <rect x={0} y={60} width={PLATE_WIDTH} height={56} fill={WARM_RED} />
              <text x={12} y={80} fontSize={10} fill={PAPER} fontFamily="system-ui">
                PERIOD
              </text>
              <text
                x={12}
                y={106}
                fontSize={24}
                fontWeight="bold"
                fill={PAPER}
                fontFamily="'SF Mono', monospace"
              >
                {element.period}
              </text>

              {/* Block row — block color */}
              <rect x={0} y={120} width={PLATE_WIDTH} height={56} fill={color} />
              <text
                x={12}
                y={140}
                fontSize={10}
                fill={contrastTextColor(color)}
                fontFamily="system-ui"
              >
                BLOCK
              </text>
              <text
                x={12}
                y={166}
                fontSize={24}
                fontWeight="bold"
                fill={contrastTextColor(color)}
                fontFamily="'SF Mono', monospace"
              >
                {element.block}
              </text>
            </svg>
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
              animationStagger={animate ? 30 : undefined}
            />
          </svg>
        </div>

        {/* Group trend sparkline */}
        {groupTrendData && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              Electronegativity trend — Group {element.group}
            </div>
            <GroupTrendSparkline
              values={groupTrendData.values}
              highlightIndex={groupTrendData.highlightIndex}
              color={color}
              width={FULL_WIDTH}
              height={40}
            />
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
      </div>

      {/* Marginalia panel */}
      <aside
        className="folio-marginalia"
        style={{
          width: '200px',
          flexShrink: 0,
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        {/* Category — Pretext Tier 1 measured text */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Category
          </div>
          <svg
            width={MARGINALIA_WIDTH}
            height={catLines.length * catLH + catLH}
            style={{ maxWidth: '100%', display: 'block' }}
          >
            <PretextSvg lines={catLines} lineHeight={catLH} fontSize={14} />
          </svg>
        </div>

        {/* Key properties with rank dots — Pretext Tier 1 measured labels */}
        {properties.map((prop) => {
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
        })}

        {/* Neighbors */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
            Neighbors
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {element.neighbors.map((sym) => (
              <a key={sym} href={`/element/${sym}`}>
                {sym}
              </a>
            ))}
          </div>
        </div>

        {/* Source strip (mandatory CC BY-SA) */}
        {sources && <SourceStrip sources={sources} ruleColor={color} />}

        {/* Compare link */}
        <div style={{ marginTop: '12px' }}>
          <a href={`/compare/${element.symbol}/${element.neighbors[0] ?? 'O'}`}>
            Compare →
          </a>
        </div>
      </aside>
    </div>
  );
}
