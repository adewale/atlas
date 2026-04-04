import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { allElements } from '../lib/data';
import { blockColor } from '../lib/grid';
import { BLACK, PAPER, DEEP_BLUE, GREY_MID, GREY_RULE, GREY_LIGHT, INSCRIPTION_STYLE, CONTROL_SECTION_MIN_HEIGHT, MOBILE_VIZ_BREAKPOINT, STROKE_HAIRLINE, STROKE_REGULAR, STROKE_MEDIUM } from '../lib/theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { VT } from '../lib/transitions';
import { PRETEXT_SANS, measureLines } from '../lib/pretext';
import { getElementMetrics, getPropertyMetrics } from '../lib/metrics';
import IntroBlock from '../components/IntroBlock';

import type { ElementRecord } from '../lib/types';
import PageShell from '../components/PageShell';
import ElementSquare from '../components/ElementSquare';
import MarginNote from '../components/MarginNote';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ---------------------------------------------------------------------------
// Property config
// ---------------------------------------------------------------------------
type PropertyKey = 'mass' | 'electronegativity' | 'ionizationEnergy' | 'radius' | 'density' | 'meltingPoint' | 'boilingPoint' | 'halfLife' | 'atomicNumber' | 'discoveryYear' | 'period' | 'group';

const PROPERTY_LABELS: Record<PropertyKey, string> = {
  atomicNumber: 'Atomic number',
  mass: 'Atomic mass (u)',
  density: 'Density (g/cm³)',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionisation energy (eV)',
  radius: 'Atomic radius (pm)',
  meltingPoint: 'Melting point (K)',
  boilingPoint: 'Boiling point (K)',
  halfLife: 'Longest half-life (s)',
  period: 'Period',
  group: 'Group',
  discoveryYear: 'Discovery year',
};

const PROPERTY_KEYS: PropertyKey[] = [
  'atomicNumber',
  'mass',
  'density',
  'electronegativity',
  'ionizationEnergy',
  'radius',
  'meltingPoint',
  'boilingPoint',
  'halfLife',
  'period',
  'group',
  'discoveryYear',
];

function getPropValue(el: ElementRecord, key: PropertyKey): number | null {
  return el[key] ?? null;
}

// ---------------------------------------------------------------------------
// Chart constants
// ---------------------------------------------------------------------------
const SVG_W = 700;
const SVG_H = 500;
const MARGIN = { top: 24, right: 24, bottom: 48, left: 58 };
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_H - MARGIN.top - MARGIN.bottom;
const SQUARE_SIZE_DESKTOP = 10;
const SQUARE_SIZE_MOBILE = 16;
const HIT_SIZE = 44; // mobile-friendly touch target
const TICK_COUNT = 6;

const INTRO_TEXT =
  'Each square is one element. Colour encodes the electron block. Position encodes two numeric properties \u2014 change the axes to discover patterns.';

const AXIS_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 'bold' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  fontFamily: 'system-ui, sans-serif',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate nice tick values for an axis range. */
function niceTickValues(min: number, max: number, count: number): number[] {
  const range = max - min || 1;
  const roughStep = range / count;
  // Round step to a nice number
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / mag;
  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * mag;
  else if (residual <= 3.5) niceStep = 2 * mag;
  else if (residual <= 7.5) niceStep = 5 * mag;
  else niceStep = 10 * mag;

  const ticks: number[] = [];
  const start = Math.ceil(min / niceStep) * niceStep;
  for (let v = start; v <= max; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}

/** Format a tick value sensibly. */
function formatTick(v: number, integer?: boolean): string {
  if (integer) return v.toFixed(0);
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(2);
}

const INTEGER_PROPERTIES: Set<PropertyKey> = new Set(['atomicNumber', 'discoveryYear', 'period', 'group']);

/** Short educational gloss for each property, shown in the margin. */
const PROPERTY_DESCRIPTIONS: Record<PropertyKey, string> = {
  atomicNumber: 'The number of protons in the nucleus. It uniquely identifies an element and determines its position in the periodic table.',
  mass: 'The weighted average mass of an element\u2019s naturally occurring isotopes, measured in unified atomic mass units (u).',
  density: 'Mass per unit volume at standard conditions. Osmium and iridium are the densest elements; hydrogen the least dense.',
  electronegativity: 'How strongly an atom attracts electrons in a chemical bond (Pauling scale). Fluorine is the most electronegative element.',
  ionizationEnergy: 'The energy needed to remove the outermost electron from a neutral atom. Noble gases have the highest values.',
  radius: 'The distance from the nucleus to the outermost electron shell. Atoms shrink across a period and grow down a group.',
  meltingPoint: 'The temperature at which a solid becomes liquid. Tungsten has the highest melting point of any element (3695 K).',
  boilingPoint: 'The temperature at which a liquid becomes gas. Rhenium and tungsten have the highest boiling points.',
  halfLife: 'For radioactive elements, the time for half of a sample to decay. Ranges from microseconds (Og) to billions of years (U-238).',
  period: 'The horizontal row in the periodic table. Each period adds a new principal electron shell.',
  group: 'The vertical column in the periodic table. Elements in the same group share the same number of valence electrons.',
  discoveryYear: 'The year the element was first identified or synthesised. Ancient elements have no recorded discovery date.',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PropertyScatter() {
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const SQUARE_SIZE = isMobile ? SQUARE_SIZE_MOBILE : SQUARE_SIZE_DESKTOP;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const xKey = (searchParams.get('x') as PropertyKey) || 'electronegativity';
  const yKey = (searchParams.get('y') as PropertyKey) || 'ionizationEnergy';
  const [hovered, setHovered] = useState<ElementRecord | null>(null);

  // Coupled dropdowns: prevent same property on both axes
  const handleXChange = useCallback(
    (newX: PropertyKey) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (newX === yKey) next.set('y', xKey); // swap
        next.set('x', newX);
        return next;
      }, { replace: true });
    },
    [xKey, yKey, setSearchParams],
  );

  const handleYChange = useCallback(
    (newY: PropertyKey) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (newY === xKey) next.set('x', yKey); // swap
        next.set('y', newY);
        return next;
      }, { replace: true });
    },
    [xKey, yKey, setSearchParams],
  );

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

  const xTicks = useMemo(() => niceTickValues(xMin, xMax, TICK_COUNT), [xMin, xMax]);
  const yTicks = useMemo(() => niceTickValues(yMin, yMax, TICK_COUNT), [yMin, yMax]);

  useDocumentTitle('Property Scatter', 'Scatter plot of element properties — electronegativity, ionisation energy, mass, and atomic radius — with block colouring and anomaly highlights.');

  return (
    <PageShell vizNav>
      <div style={{ maxWidth: '760px', position: 'relative' }}>
      <MarginNote label="Axes" color={DEEP_BLUE} top={80}>
        <p style={{ margin: '0 0 6px' }}>
          <strong style={{ fontSize: '11px' }}>X: {PROPERTY_LABELS[xKey]}</strong><br />
          {PROPERTY_DESCRIPTIONS[xKey]}
        </p>
        <p style={{ margin: 0 }}>
          <strong style={{ fontSize: '11px' }}>Y: {PROPERTY_LABELS[yKey]}</strong><br />
          {PROPERTY_DESCRIPTIONS[yKey]}
        </p>
      </MarginNote>
      <div style={{ minHeight: CONTROL_SECTION_MIN_HEIGHT }}>
        <h1 style={{ ...INSCRIPTION_STYLE, color: DEEP_BLUE, viewTransitionName: VT.VIZ_TITLE } as React.CSSProperties}>Property Scatter</h1>

        {/* Pretext intro */}
        <IntroBlock text={INTRO_TEXT} color={DEEP_BLUE} dropCapSize={80} />

        {/* Axis selectors — coupled so you can't pick the same property for both */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap', position: 'relative' }}>
          <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            X axis:
            <select
              value={xKey}
              onChange={(e) => handleXChange(e.target.value as PropertyKey)}
              style={{
                fontSize: '14px',
                padding: '4px 8px',
                background: PAPER,
                border: `1px solid ${BLACK}`,
                fontFamily: 'system-ui',
              }}
            >
              {PROPERTY_KEYS.map((k) => (
                <option key={k} value={k} disabled={k === yKey}>
                  {PROPERTY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Y axis:
            <select
              value={yKey}
              onChange={(e) => handleYChange(e.target.value as PropertyKey)}
              style={{
                fontSize: '14px',
                padding: '4px 8px',
                background: PAPER,
                border: `1px solid ${BLACK}`,
                fontFamily: 'system-ui',
              }}
            >
              {PROPERTY_KEYS.map((k) => (
                <option key={k} value={k} disabled={k === xKey}>
                  {PROPERTY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Scatter plot */}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ display: 'block', marginTop: '16px' }}
      >
        {/* Grid lines — subtle */}
        {xTicks.map((v) => {
          const x = toSvgX(v);
          return (
            <line
              key={`gx-${v}`}
              x1={x}
              y1={MARGIN.top}
              x2={x}
              y2={MARGIN.top + PLOT_H}
              stroke={GREY_RULE}
              strokeWidth={STROKE_HAIRLINE}
              strokeDasharray="4 3"
            />
          );
        })}
        {yTicks.map((v) => {
          const y = toSvgY(v);
          return (
            <line
              key={`gy-${v}`}
              x1={MARGIN.left}
              y1={y}
              x2={MARGIN.left + PLOT_W}
              y2={y}
              stroke={GREY_RULE}
              strokeWidth={STROKE_HAIRLINE}
              strokeDasharray="4 3"
            />
          );
        })}

        {/* X axis line */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + PLOT_H}
          x2={MARGIN.left + PLOT_W}
          y2={MARGIN.top + PLOT_H}
          stroke={BLACK}
          strokeWidth={STROKE_MEDIUM}
        />
        {/* Y axis line */}
        <line
          x1={MARGIN.left}
          y1={MARGIN.top}
          x2={MARGIN.left}
          y2={MARGIN.top + PLOT_H}
          stroke={BLACK}
          strokeWidth={STROKE_MEDIUM}
        />

        {/* X axis ticks and labels */}
        {xTicks.map((v) => {
          const x = toSvgX(v);
          return (
            <g key={`xt-${v}`}>
              <line
                x1={x}
                y1={MARGIN.top + PLOT_H}
                x2={x}
                y2={MARGIN.top + PLOT_H + 5}
                stroke={BLACK}
                strokeWidth={STROKE_REGULAR}
              />
              <text
                x={x}
                y={MARGIN.top + PLOT_H + 16}
                textAnchor="middle"
                fontSize={9}
                fill={GREY_LIGHT}
                fontFamily="system-ui, sans-serif"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTick(v, INTEGER_PROPERTIES.has(xKey))}
              </text>
            </g>
          );
        })}

        {/* Y axis ticks and labels */}
        {yTicks.map((v) => {
          const y = toSvgY(v);
          return (
            <g key={`yt-${v}`}>
              <line
                x1={MARGIN.left - 5}
                y1={y}
                x2={MARGIN.left}
                y2={y}
                stroke={BLACK}
                strokeWidth={STROKE_REGULAR}
              />
              <text
                x={MARGIN.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill={GREY_LIGHT}
                fontFamily="system-ui, sans-serif"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTick(v, INTEGER_PROPERTIES.has(yKey))}
              </text>
            </g>
          );
        })}

        {/* Min/max endpoint labels removed — tick labels already cover the
            axis range, and the previous proximity threshold (5%) was too
            tight to prevent overlap in all property combinations. */}

        {/* X axis label — inscription style */}
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={MARGIN.top + PLOT_H + 38}
          textAnchor="middle"
          fill={BLACK}
          {...AXIS_LABEL_STYLE}
        >
          {PROPERTY_LABELS[xKey]}
        </text>

        {/* Y axis label — inscription style, rotated */}
        <text
          x={14}
          y={MARGIN.top + PLOT_H / 2}
          textAnchor="middle"
          fill={BLACK}
          transform={`rotate(-90, 14, ${MARGIN.top + PLOT_H / 2})`}
          {...AXIS_LABEL_STYLE}
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
              {/* Visible square via ElementSquare */}
              <ElementSquare
                symbol={d.el.symbol}
                color={fill}
                size={SQUARE_SIZE}
                x={cx - SQUARE_SIZE / 2}
                y={cy - SQUARE_SIZE / 2}
                title={d.el.name}
                highlighted={isHovered}
                style={{
                  opacity: 0,
                  animation: `svg-fade-in 300ms var(--ease-out) ${i * 15}ms forwards`,
                  pointerEvents: 'none',
                }}
              />
              {/* Invisible larger hit target */}
              <rect
                x={cx - HIT_SIZE / 2}
                y={cy - HIT_SIZE / 2}
                width={HIT_SIZE}
                height={HIT_SIZE}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(d.el)}
                onMouseLeave={() => setHovered(null)}
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch') {
                    e.preventDefault();
                    setHovered(hovered?.symbol === d.el.symbol ? null : d.el);
                  }
                }}
                onClick={() => navigate(`/elements/${d.el.symbol}`)}
              />
              {/* Dim non-hovered when something is hovered */}
              {hovered && !isHovered && (
                <rect
                  x={cx - SQUARE_SIZE / 2}
                  y={cy - SQUARE_SIZE / 2}
                  width={SQUARE_SIZE}
                  height={SQUARE_SIZE}
                  fill={PAPER}
                  opacity={0.6}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* Hover card — rendered last so it paints on top, pointerEvents none so it doesn't block */}
        {hovered &&
          (() => {
            const hPt = points.find((d) => d.el.symbol === hovered.symbol);
            if (!hPt) return null;
            const cx = toSvgX(hPt.xVal);
            const cy = toSvgY(hPt.yVal);
            // Use precomputed name width + property label width for card sizing
            const elMetrics = getElementMetrics(hPt.el.symbol);
            const nameW = elMetrics?.nameWidth14 ?? 80;
            const xPropW = (getPropertyMetrics(xKey)?.width10 ?? 80) + 40; // label + ": " + value
            const yPropW = (getPropertyMetrics(yKey)?.width10 ?? 80) + 40;
            const cardW = Math.max(nameW, xPropW, yPropW) + 24;
            const cardH = 72;
            // Flip card left if too close to right edge
            const flipX = cx + SQUARE_SIZE / 2 + 8 + cardW > SVG_W - MARGIN.right;
            const cardX = flipX
              ? cx - SQUARE_SIZE / 2 - 8 - cardW
              : cx + SQUARE_SIZE / 2 + 8;
            // Flip card up if too close to bottom
            const flipY = cy + cardH > SVG_H - MARGIN.bottom;
            const cardY = flipY ? cy - cardH : cy - 10;

            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={cardX}
                  y={cardY}
                  width={cardW}
                  height={cardH}
                  fill={BLACK}
                  rx={2}
                />
                {/* Element name — bold, larger */}
                <text
                  x={cardX + 10}
                  y={cardY + 17}
                  fontSize={14}
                  fontWeight="bold"
                  fill={PAPER}
                  fontFamily="system-ui, sans-serif"
                >
                  {hPt.el.name}
                </text>
                {/* Symbol and atomic number */}
                <text
                  x={cardX + 10}
                  y={cardY + 31}
                  fontSize={10}
                  fill={PAPER}
                  fontFamily="system-ui, sans-serif"
                  opacity={0.75}
                >
                  {hPt.el.symbol} · #{hPt.el.atomicNumber}
                </text>
                {/* X property with label */}
                <text
                  x={cardX + 10}
                  y={cardY + 48}
                  fontSize={10}
                  fill={PAPER}
                  fontFamily="system-ui, sans-serif"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {PROPERTY_LABELS[xKey]}: {INTEGER_PROPERTIES.has(xKey) ? hPt.xVal : hPt.xVal.toFixed(2)}
                </text>
                {/* Y property with label */}
                <text
                  x={cardX + 10}
                  y={cardY + 62}
                  fontSize={10}
                  fill={PAPER}
                  fontFamily="system-ui, sans-serif"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {PROPERTY_LABELS[yKey]}: {INTEGER_PROPERTIES.has(yKey) ? hPt.yVal : hPt.yVal.toFixed(2)}
                </text>
              </g>
            );
          })()}
      </svg>
      </div>
    </PageShell>
  );
}
