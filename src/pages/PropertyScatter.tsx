import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import VizNav from '../components/VizNav';
import { allElements } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, PAPER, DEEP_BLUE } from '../lib/theme';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import InfoTip from '../components/InfoTip';
import type { ElementRecord } from '../lib/types';
import SiteNav from '../components/SiteNav';

// ---------------------------------------------------------------------------
// Property config
// ---------------------------------------------------------------------------
type PropertyKey = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'radius';

const PROPERTY_LABELS: Record<PropertyKey, string> = {
  mass: 'Atomic mass (u)',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionisation energy (eV)',
  radius: 'Atomic radius (pm)',
};

function getPropValue(el: ElementRecord, key: PropertyKey): number | null {
  return el[key];
}

// ---------------------------------------------------------------------------
// Chart constants
// ---------------------------------------------------------------------------
const SVG_W = 700;
const SVG_H = 500;
const MARGIN = { top: 24, right: 24, bottom: 40, left: 52 };
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_H - MARGIN.top - MARGIN.bottom;
const SQUARE_SIZE = 10;

const INTRO_TEXT =
  'Each square is one element. Colour encodes the electron block. Position encodes two numeric properties \u2014 change the axes to discover patterns.';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PropertyScatter() {
  const navigate = useNavigate();
  const [xKey, setXKey] = useState<PropertyKey>('electronegativity');
  const [yKey, setYKey] = useState<PropertyKey>('ionizationEnergy');
  const [hovered, setHovered] = useState<ElementRecord | null>(null);

  const { lines, lineHeight } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: 640,
  });

  // Filter & normalize
  const { points, xMin, xMax, yMin, yMax } = useMemo(() => {
    const valid: { el: ElementRecord; xVal: number; yVal: number }[] = [];
    for (const el of allElements) {
      const xVal = getPropValue(el, xKey);
      const yVal = getPropValue(el, yKey);
      if (xVal != null && yVal != null) {
        valid.push({ el, xVal, yVal });
      }
    }
    if (valid.length === 0) {
      return { points: [], xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xVals = valid.map((d) => d.xVal);
    const yVals = valid.map((d) => d.yVal);
    return {
      points: valid,
      xMin: Math.min(...xVals),
      xMax: Math.max(...xVals),
      yMin: Math.min(...yVals),
      yMax: Math.max(...yVals),
    };
  }, [xKey, yKey]);

  function toSvgX(val: number): number {
    const range = xMax - xMin || 1;
    return MARGIN.left + ((val - xMin) / range) * PLOT_W;
  }

  function toSvgY(val: number): number {
    const range = yMax - yMin || 1;
    // Invert Y so higher values go up
    return MARGIN.top + PLOT_H - ((val - yMin) / range) * PLOT_H;
  }

  const introHeight = lines.length * lineHeight + 16;

  return (
    <main>
      <VizNav />
      <div style={{ maxWidth: '760px' }}>
      <h1 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: DEEP_BLUE }}>Property Scatter</h1>

      {/* Pretext intro */}
      <svg
        width="100%"
        viewBox={`0 0 660 ${introHeight}`}
        style={{ display: 'block', marginTop: '16px' }}
      >
        <PretextSvg lines={lines} lineHeight={lineHeight} x={10} y={0} />
      </svg>

      {/* Educational note */}
      <p style={{ fontSize: '14px', lineHeight: 1.6, marginTop: '8px', color: BLACK }}>
        <InfoTip label="Electronegativity measures how strongly an atom attracts electrons in a chemical bond (Pauling scale). Ionisation energy is the energy needed to remove an electron from a neutral atom. Noble gases cluster at high ionisation energy because their filled shells resist electron removal.">
          What do these properties mean?
        </InfoTip>
      </p>

      {/* Axis selectors */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          X axis:
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value as PropertyKey)}
            style={{
              fontSize: '14px',
              padding: '4px 8px',
              background: PAPER,
              border: `1px solid ${BLACK}`,
              fontFamily: 'system-ui',
            }}
          >
            {Object.entries(PROPERTY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Y axis:
          <select
            value={yKey}
            onChange={(e) => setYKey(e.target.value as PropertyKey)}
            style={{
              fontSize: '14px',
              padding: '4px 8px',
              background: PAPER,
              border: `1px solid ${BLACK}`,
              fontFamily: 'system-ui',
            }}
          >
            {Object.entries(PROPERTY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Scatter plot */}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ display: 'block', marginTop: '16px' }}
      >
        {/* X axis line */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + PLOT_H}
          x2={MARGIN.left + PLOT_W}
          y2={MARGIN.top + PLOT_H}
          stroke={BLACK}
          strokeWidth={1}
        />
        {/* Y axis line */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + PLOT_H}
          stroke={BLACK}
          strokeWidth={1}
        />

        {/* X axis label */}
        <text
          x={MARGIN.left + PLOT_W}
          y={MARGIN.top + PLOT_H + 30}
          fontSize={12}
          fill={BLACK}
          textAnchor="end"
          fontFamily="system-ui, sans-serif"
        >
          {PROPERTY_LABELS[xKey]}
        </text>

        {/* Y axis label */}
        <text
          x={MARGIN.left - 10}
          y={MARGIN.top - 6}
          fontSize={12}
          fill={BLACK}
          textAnchor="start"
          fontFamily="system-ui, sans-serif"
        >
          {PROPERTY_LABELS[yKey]}
        </text>

        {/* Element squares */}
        {points.map((d, i) => {
          const cx = toSvgX(d.xVal);
          const cy = toSvgY(d.yVal);
          const fill = blockColor(d.el.block);
          const isHovered = hovered?.symbol === d.el.symbol;

          return (
            <g key={d.el.symbol}>
              <rect
                x={cx - SQUARE_SIZE / 2}
                y={cy - SQUARE_SIZE / 2}
                width={SQUARE_SIZE}
                height={SQUARE_SIZE}
                fill={fill}
                opacity={hovered && !isHovered ? 0.3 : 0.85}
                style={{
                  cursor: 'pointer',
                  opacity: 0,
                  animation: `card-enter 300ms var(--ease-out) ${i * 15}ms forwards`,
                }}
                onMouseEnter={() => setHovered(d.el)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/element/${d.el.symbol}`)}
              />
              {isHovered && (
                <>
                  <rect
                    x={cx + SQUARE_SIZE / 2 + 4}
                    y={cy - 20}
                    width={120}
                    height={36}
                    fill={PAPER}
                    stroke={BLACK}
                    strokeWidth={0.5}
                    rx={0}
                  />
                  <text
                    x={cx + SQUARE_SIZE / 2 + 10}
                    y={cy - 5}
                    fontSize={12}
                    fontWeight="bold"
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                  >
                    {d.el.symbol}
                  </text>
                  <text
                    x={cx + SQUARE_SIZE / 2 + 10}
                    y={cy + 10}
                    fontSize={10}
                    fill={BLACK}
                    fontFamily="system-ui, sans-serif"
                  >
                    {d.xVal.toFixed(2)} / {d.yVal.toFixed(2)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      </div>
      <SiteNav />
    </main>
  );
}
