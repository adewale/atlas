import { useState } from 'react';
import { Link } from 'react-router';
import { blockColor, contrastTextColor } from '../lib/grid';
import PropertyBar from '../components/PropertyBar';
import InfoTip from '../components/InfoTip';
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, GREY_MID, GREY_LIGHT, GREY_RULE, DIM, MINERAL_BROWN, ASTRO_PURPLE, MONO_FONT, BACK_LINK_STYLE, STROKE_HAIRLINE, STROKE_THIN, STROKE_REGULAR, STROKE_MEDIUM, STROKE_ACCENT, STROKE_HEAVY } from '../lib/theme';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PALETTE = [
  { name: 'Paper', hex: '#f7f2e8' },
  { name: 'Black', hex: '#0f0f0f' },
  { name: 'Deep Blue', hex: '#133e7c' },
  { name: 'Warm Red', hex: '#9e1c2c' },
  { name: 'Mustard', hex: '#856912' },
];

const BLOCKS = ['s', 'p', 'd', 'f'] as const;

const SPACING = [
  { name: '--sp-1', value: '4px' },
  { name: '--sp-2', value: '8px' },
  { name: '--sp-3', value: '12px' },
  { name: '--sp-4', value: '16px' },
  { name: '--sp-6', value: '24px' },
  { name: '--sp-8', value: '32px' },
  { name: '--sp-12', value: '48px' },
];

const EASINGS = [
  { name: '--ease-out', value: 'cubic-bezier(0.16, 1, 0.3, 1)', use: 'enters/exits' },
  { name: '--ease-in-out', value: 'cubic-bezier(0.77, 0, 0.175, 1)', use: 'on-screen movement' },
  { name: '--ease-spring', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', use: 'playful overshoot' },
  { name: '--ease-snap', value: 'cubic-bezier(0.4, 0, 0.2, 1)', use: 'quick state toggles' },
];

const LINE_THICKNESSES = [
  { tier: 'Hairline', value: STROKE_HAIRLINE, cssVar: '--stroke-hairline', use: 'Grid rules, dividers, subtle structure' },
  { tier: 'Thin', value: STROKE_THIN, cssVar: '--stroke-thin', use: 'Accent lines, timeline rules, data lines' },
  { tier: 'Regular', value: STROKE_REGULAR, cssVar: '--stroke-regular', use: 'Sparklines, button borders, interactive elements' },
  { tier: 'Medium', value: STROKE_MEDIUM, cssVar: '--stroke-medium', use: 'Active/highlighted states, card borders, emphasis' },
  { tier: 'Accent', value: STROKE_ACCENT, cssVar: '--stroke-accent', use: 'Left-border entity chips, category indicators' },
  { tier: 'Heavy', value: STROKE_HEAVY, cssVar: '--stroke-heavy', use: 'Major section dividers, top borders' },
];

export default function Design() {
  useDocumentTitle('Design Language');

  return (
    <PageShell>
      <div style={{ maxWidth: '800px' }}>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', letterSpacing: '0.2em', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Design Language</h1>
      <p style={{ lineHeight: 1.7, marginBottom: '32px' }}>
        Living reference for the Atlas visual system. 60% Kronecker-Wallis/Byrne visual drama,
        40% Tufte data density.
      </p>

      {/* Palette */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Palette</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PALETTE.map((c) => (
            <div key={c.hex} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: c.hex,
                  border: `1px solid ${BLACK}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: contrastTextColor(c.hex),
                  fontSize: '11px',
                  fontFamily: MONO_FONT,
                }}
              >
                {c.hex}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Block Colours */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Block Colours</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {BLOCKS.map((b) => {
            const color = blockColor(b);
            return (
              <div
                key={b}
                style={{
                  width: '80px',
                  height: '60px',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: contrastTextColor(color),
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                {b}
              </div>
            );
          })}
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Typography</h2>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Body — system-ui, 16px</div>
          <p>The quick brown fox jumps over the lazy dog.</p>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Monospace — SF Mono / Cascadia Code</div>
          <p className="mono">118 elements · 7 periods · 18 groups</p>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Giant numerals — 96px, monospace, block-coloured</div>
          <span
            style={{
              fontSize: '96px',
              fontWeight: 'bold',
              fontFamily: MONO_FONT,
              color: WARM_RED,
              lineHeight: 1,
            }}
          >
            026
          </span>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Inscription titles — 13px, uppercase, 0.2em tracking, block-coloured</div>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: WARM_RED, margin: '4px 0' }}>Discovery Timeline</h3>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: DEEP_BLUE, margin: '4px 0' }}>Etymology Map</h3>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: MUSTARD, margin: '4px 0' }}>Anomaly Explorer</h3>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Element name caption — 14px, uppercase, 0.3em tracking</div>
          <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3em', color: GREY_MID }}>Hydrogen</span>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: GREY_MID }}>Drop cap — 48px initial in block colour, Pretext-measured flow</div>
          <svg width={400} height={80} style={{ maxWidth: '100%' }}>
            <text x={0} y={42} fontSize={48} fontWeight="bold" fill={DEEP_BLUE} fontFamily="system-ui, sans-serif">H</text>
            <text x={34} y={20} fontSize={16} fill={BLACK} fontFamily="system-ui, sans-serif">ydrogen is the lightest element,</text>
            <text x={34} y={39} fontSize={16} fill={BLACK} fontFamily="system-ui, sans-serif">with an atomic mass of 1.008.</text>
            <text x={0} y={58} fontSize={16} fill={BLACK} fontFamily="system-ui, sans-serif">It is the most abundant element in</text>
            <text x={0} y={77} fontSize={16} fill={BLACK} fontFamily="system-ui, sans-serif">the universe.</text>
          </svg>
        </div>
      </section>

      {/* Element Cell */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Element Cell</h2>
        <svg width={56} height={64}>
          <rect x={1} y={1} width={54} height={62} fill={PAPER} stroke={BLACK} strokeWidth={0.5} />
          <text x={4} y={13} fontSize={9} fill={BLACK} fontFamily="system-ui">26</text>
          <text x={28} y={36} textAnchor="middle" fontSize={16} fontWeight="bold" fill={BLACK} fontFamily="system-ui">Fe</text>
          <text x={28} y={52} textAnchor="middle" fontSize={7} fill={BLACK} fontFamily="system-ui">Iron</text>
        </svg>
      </section>

      {/* Data Plate */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Data Plate</h2>
        <svg width={160} height={180}>
          <rect x={0} y={0} width={160} height={56} fill={DEEP_BLUE} />
          <text x={12} y={20} fontSize={10} fill={PAPER} fontFamily="system-ui">GROUP</text>
          <text x={12} y={46} fontSize={24} fontWeight="bold" fill={PAPER} fontFamily={MONO_FONT}>8</text>
          <rect x={0} y={60} width={160} height={56} fill={WARM_RED} />
          <text x={12} y={80} fontSize={10} fill={PAPER} fontFamily="system-ui">PERIOD</text>
          <text x={12} y={106} fontSize={24} fontWeight="bold" fill={PAPER} fontFamily={MONO_FONT}>4</text>
          <rect x={0} y={120} width={160} height={56} fill={WARM_RED} />
          <text x={12} y={140} fontSize={10} fill={PAPER} fontFamily="system-ui">BLOCK</text>
          <text x={12} y={166} fontSize={24} fontWeight="bold" fill={PAPER} fontFamily={MONO_FONT}>d</text>
        </svg>
      </section>

      {/* Property Bars */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Property Bars</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '12px', lineHeight: 1.6 }}>
          Tufte principle: the bar is the data, and the label shows the actual value with units.
          No legend required — rank context (#N of 118) sits at top-right.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PropertyBar label="Atomic Mass" rank={93} color={WARM_RED} value={55.845} unit="Da" />
          <PropertyBar label="Electronegativity" rank={41} color={DEEP_BLUE} value={1.83} />
          <PropertyBar label="Ionisation Energy" rank={35} color={MUSTARD} value={762.5} unit="kJ/mol" />
          <PropertyBar label="Atomic Radius" rank={67} color={BLACK} value={126} unit="pm" />
        </div>
      </section>

      {/* Spacing */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Spacing Scale</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {SPACING.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <code style={{ width: '80px', fontSize: '11px' }}>{s.name}</code>
              <div
                style={{
                  width: s.value,
                  height: '12px',
                  background: DEEP_BLUE,
                }}
              />
              <span style={{ fontSize: '11px', color: GREY_MID }}>{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Animation Moments */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Animation Moments</h2>
        <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
          {EASINGS.map((e) => (
            <div key={e.name} style={{ marginBottom: '8px' }}>
              <code>{e.name}</code>
              <span style={{ color: GREY_MID }}> — {e.use}</span>
              <br />
              <span className="mono" style={{ fontSize: '11px' }}>{e.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', lineHeight: 1.7, fontSize: '13px' }}>
          <strong>Four explosive moments:</strong>
          <ol style={{ paddingLeft: '20px', marginTop: '4px' }}>
            <li>Folio entry: text stagger, plate wipe, bar grow</li>
            <li>Compare split: colour halves expand, symbols scale</li>
            <li>Highlight switch: cell fills ripple outward</li>
            <li>First load: cascade by atomic number</li>
          </ol>
        </div>
      </section>
      {/* Element Representations */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Element Representations</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '16px', lineHeight: 1.6 }}>
          Every context uses a different visual density — from a 56px periodic table cell to a full
          AtlasPlate card with property data.
        </p>

        {/* Periodic table cell */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>Periodic table cell — small square with number, symbol, name</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { num: 1, sym: 'H', name: 'Hydrogen', block: 's' },
              { num: 26, sym: 'Fe', name: 'Iron', block: 'd' },
              { num: 79, sym: 'Au', name: 'Gold', block: 'd' },
              { num: 92, sym: 'U', name: 'Uranium', block: 'f' },
            ].map((el) => {
              const fill = blockColor(el.block);
              const text = contrastTextColor(fill);
              return (
                <svg key={el.sym} width={56} height={64}>
                  <rect x={1} y={1} width={54} height={62} fill={PAPER} stroke={BLACK} strokeWidth={0.5} />
                  <text x={4} y={13} fontSize={9} fill={BLACK} fontFamily="system-ui">{el.num}</text>
                  <text x={28} y={36} textAnchor="middle" fontSize={16} fontWeight="bold" fill={BLACK} fontFamily="system-ui">{el.sym}</text>
                  <text x={28} y={52} textAnchor="middle" fontSize={7} fill={BLACK} fontFamily="system-ui">{el.name}</text>
                </svg>
              );
            })}
          </div>
        </div>

        {/* AtlasPlate card */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>AtlasPlate card — symbol, number, category, mass (block-coloured)</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { num: 26, sym: 'Fe', cat: 'trans. metal', mass: '55.845 Da', block: 'd' },
              { num: 79, sym: 'Au', cat: 'trans. metal', mass: '196.97 Da', block: 'd' },
              { num: 6, sym: 'C', cat: 'nonmetal', mass: '12.011 Da', block: 'p' },
              { num: 92, sym: 'U', cat: 'actinide', mass: '238.03 Da', block: 'f' },
            ].map((el) => {
              const fill = blockColor(el.block);
              const text = contrastTextColor(fill);
              return (
                <svg key={el.sym} width={100} height={80}>
                  <rect x={0} y={0} width={100} height={80} fill={fill} />
                  <text x={6} y={14} fontSize={9} fill={text} fontFamily="system-ui">
                    {String(el.num).padStart(3, '0')}
                  </text>
                  <text x={6} y={38} fontSize={20} fontWeight="bold" fill={text} fontFamily="system-ui">{el.sym}</text>
                  <text x={6} y={54} fontSize={8} fill={text} fontFamily="system-ui">{el.cat}</text>
                  <text x={6} y={70} fontSize={10} fill={text} fontFamily={MONO_FONT}>{el.mass}</text>
                </svg>
              );
            })}
          </div>
        </div>

        {/* Etymology card */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>Etymology card — bordered card with symbol and description (hover thickens border)</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { sym: 'Fe', desc: 'Latin: ferrum', color: MINERAL_BROWN },
              { sym: 'He', desc: 'Greek: helios (sun)', color: MUSTARD },
              { sym: 'Am', desc: 'Named for Americas', color: DEEP_BLUE },
              { sym: 'Cm', desc: 'Marie Curie', color: WARM_RED },
            ].map((el) => (
              <Link
                key={el.sym}
                to="#"
                className="etymology-card"
                style={{
                  width: 80,
                  height: 48,
                  border: `2px solid ${el.color}`,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: BLACK,
                  background: PAPER,
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{el.sym}</span>
                <span style={{
                  fontSize: 9, lineHeight: 1.2, color: GREY_MID, textAlign: 'center',
                  padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: 72,
                }}>
                  {el.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Scatter plot point */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>Scatter plot point — 10px square, block-coloured, with hover label</div>
          <svg width={260} height={60}>
            {[
              { x: 20, block: 's', sym: 'H' },
              { x: 60, block: 'p', sym: 'C' },
              { x: 100, block: 'd', sym: 'Fe' },
              { x: 140, block: 'f', sym: 'U' },
            ].map((pt) => (
              <g key={pt.sym}>
                <rect x={pt.x - 5} y={25} width={10} height={10} fill={blockColor(pt.block)} opacity={0.85} />
                <text x={pt.x} y={20} textAnchor="middle" fontSize={9} fill={BLACK} fontFamily="system-ui">{pt.sym}</text>
              </g>
            ))}
            <text x={180} y={33} fontSize={10} fill={GREY_MID} fontFamily="system-ui">← hover reveals value pair</text>
          </svg>
        </div>

        {/* Timeline square */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>Timeline square — 14px stacked squares, block-coloured, with SVG title tooltip</div>
          <svg width={200} height={80}>
            {/* Axis line */}
            <line x1={10} y1={65} x2={190} y2={65} stroke={BLACK} strokeWidth={1} />
            {[
              { x: 30, y: 49, block: 's', name: 'Sodium' },
              { x: 30, y: 33, block: 's', name: 'Potassium' },
              { x: 80, y: 49, block: 'd', name: 'Chromium' },
              { x: 80, y: 33, block: 'd', name: 'Vanadium' },
              { x: 80, y: 17, block: 'd', name: 'Titanium' },
              { x: 140, y: 49, block: 'f', name: 'Plutonium' },
            ].map((sq, i) => (
              <g key={i}>
                <title>{sq.name}</title>
                <rect x={sq.x} y={sq.y} width={14} height={14} fill={blockColor(sq.block)} stroke={BLACK} strokeWidth={0.5} />
              </g>
            ))}
            <text x={30} y={78} textAnchor="middle" fontSize={9} fill={BLACK} fontFamily="system-ui">1807</text>
            <text x={80} y={78} textAnchor="middle" fontSize={9} fill={BLACK} fontFamily="system-ui">1830</text>
            <text x={140} y={78} textAnchor="middle" fontSize={9} fill={BLACK} fontFamily="system-ui">1940</text>
          </svg>
        </div>

        {/* Neighborhood graph node */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>Neighbourhood graph node — circle (r=10) with symbol label, edges to neighbours</div>
          <svg width={260} height={100}>
            {/* Edges */}
            <line x1={130} y1={50} x2={50} y2={30} stroke={DEEP_BLUE} strokeWidth={1.5} />
            <line x1={130} y1={50} x2={50} y2={70} stroke={DEEP_BLUE} strokeWidth={1.5} />
            <line x1={130} y1={50} x2={210} y2={30} stroke={DEEP_BLUE} strokeWidth={1.5} />
            <line x1={130} y1={50} x2={210} y2={70} stroke={DEEP_BLUE} strokeWidth={1.5} />
            {/* Central node */}
            <circle cx={130} cy={50} r={10} fill={blockColor('d')} />
            <text x={130} y={37} textAnchor="middle" fontSize={8} fill={BLACK} fontFamily="system-ui">Fe</text>
            {/* Neighbours */}
            {[
              { cx: 50, cy: 30, sym: 'Mn', block: 'd' },
              { cx: 50, cy: 70, sym: 'Ru', block: 'd' },
              { cx: 210, cy: 30, sym: 'Co', block: 'd' },
              { cx: 210, cy: 70, sym: 'Ni', block: 'd' },
            ].map((n) => (
              <g key={n.sym}>
                <title>{n.sym}</title>
                <circle cx={n.cx} cy={n.cy} r={10} fill={blockColor(n.block)} />
                <text x={n.cx} y={n.cy - 13} textAnchor="middle" fontSize={8} fill={BLACK} fontFamily="system-ui">{n.sym}</text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Entity Representations                                       */}
      {/* ============================================================ */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.05em' }}>Entity Representations</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '24px', lineHeight: 1.6 }}>
          Comprehensive catalogue of every visual form used for each entity type
          across Atlas. The same data appears at different densities depending on
          context; this section documents every variant.
        </p>

        {/* ── ELEMENT (5+ forms) ─────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: DEEP_BLUE }}>Element</h3>

        {/* 1. Periodic table cell */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            1. Periodic table cell (56 x 64 px) — number, symbol, name on block colour background
          </div>
          <svg width={232} height={64}>
            {[
              { num: 1, sym: 'H', name: 'Hydrogen', block: 's' },
              { num: 26, sym: 'Fe', name: 'Iron', block: 'd' },
              { num: 35, sym: 'Br', name: 'Bromine', block: 'p' },
              { num: 92, sym: 'U', name: 'Uranium', block: 'f' },
            ].map((el, i) => {
              const fill = blockColor(el.block);
              const txt = contrastTextColor(fill);
              const x = i * 58;
              return (
                <g key={el.sym}>
                  <rect x={x + 1} y={1} width={54} height={62} fill={fill} stroke={BLACK} strokeWidth={0.5} />
                  <text x={x + 5} y={13} fontSize={9} fill={txt} fontFamily="system-ui">{el.num}</text>
                  <text x={x + 28} y={36} textAnchor="middle" fontSize={16} fontWeight="bold" fill={txt} fontFamily="system-ui">{el.sym}</text>
                  <text x={x + 28} y={52} textAnchor="middle" fontSize={7} fill={txt} fontFamily="system-ui">{el.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 2. AtlasPlate card */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            2. AtlasPlate card (100 x 80 px) — number, symbol, category, property value on block colour
          </div>
          <svg width={312} height={80}>
            {[
              { num: 26, sym: 'Fe', cat: 'trans. metal', val: '55.845 Da', block: 'd' },
              { num: 6, sym: 'C', cat: 'nonmetal', val: '12.011 Da', block: 'p' },
              { num: 92, sym: 'U', cat: 'actinide', val: '238.03 Da', block: 'f' },
            ].map((el, i) => {
              const fill = blockColor(el.block);
              const txt = contrastTextColor(fill);
              const x = i * 104;
              return (
                <g key={el.sym}>
                  <rect x={x} y={0} width={100} height={80} fill={fill} />
                  <text x={x + 6} y={14} fontSize={9} fill={txt} fontFamily="system-ui">{String(el.num).padStart(3, '0')}</text>
                  <text x={x + 6} y={38} fontSize={20} fontWeight="bold" fill={txt} fontFamily="system-ui">{el.sym}</text>
                  <text x={x + 6} y={54} fontSize={8} fill={txt} fontFamily="system-ui">{el.cat}</text>
                  <text x={x + 6} y={70} fontSize={10} fill={txt} fontFamily={MONO_FONT}>{el.val}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3. ElementSquare */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            3. ElementSquare (24 px default) — symbol on block colour; unified small form for Timeline, Scatter, Network
          </div>
          <svg width={180} height={28}>
            {[
              { sym: 'H', block: 's' },
              { sym: 'C', block: 'p' },
              { sym: 'Fe', block: 'd' },
              { sym: 'U', block: 'f' },
              { sym: 'Na', block: 's' },
              { sym: 'Au', block: 'd' },
            ].map((el, i) => {
              const fill = blockColor(el.block);
              const txt = contrastTextColor(fill);
              return (
                <g key={el.sym}>
                  <rect x={i * 28 + 2} y={2} width={24} height={24} fill={fill} stroke={BLACK} strokeWidth={0.5} />
                  <text x={i * 28 + 14} y={18} textAnchor="middle" fontSize={8} fontWeight="bold" fill={txt} fontFamily="system-ui">{el.sym}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 4. Etymology card */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            4. Etymology card (80 x 48 px) — symbol + description, coloured border by origin
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { sym: 'Fe', desc: 'Latin: ferrum', color: MINERAL_BROWN },
              { sym: 'He', desc: 'Greek: helios', color: MUSTARD },
              { sym: 'Pu', desc: 'Named: Pluto', color: ASTRO_PURPLE },
            ].map((el) => (
              <div key={el.sym} style={{
                width: 80, height: 48,
                border: `2px solid ${el.color}`, borderRadius: 2,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: PAPER,
              }}>
                <span style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{el.sym}</span>
                <span style={{ fontSize: 9, color: GREY_MID, textAlign: 'center' }}>{el.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Folio identity (large) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            5. Folio identity (large) — 96 px monospace number, 44 px symbol, uppercase name caption
          </div>
          <svg width={200} height={110}>
            <text x={0} y={60} fontSize={96} fontWeight="bold" fontFamily={MONO_FONT} fill={blockColor('d')}>026</text>
            <text x={0} y={85} fontSize={44} fontWeight="bold" fontFamily="system-ui" fill={BLACK}>Fe</text>
            <text x={0} y={104} fontSize={14} fill={GREY_MID} fontFamily="system-ui" style={{ textTransform: 'uppercase' } as React.CSSProperties} letterSpacing="0.3em">IRON</text>
          </svg>
        </div>

        {/* ── GROUP / PERIOD / BLOCK ─────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: WARM_RED }}>Group / Period / Block</h3>

        {/* Data plate rows */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Data plate rows (160 px wide) — coloured band with label + value; used in Folio sidebar
          </div>
          <svg width={160} height={128}>
            {[
              { label: 'GROUP', value: '8', color: DEEP_BLUE, y: 0 },
              { label: 'PERIOD', value: '4', color: WARM_RED, y: 44 },
              { label: 'BLOCK', value: 'd', color: blockColor('d'), y: 88 },
            ].map((row) => (
              <g key={row.label}>
                <rect x={0} y={row.y} width={160} height={40} fill={row.color} />
                <text x={12} y={row.y + 14} fontSize={10} fill={PAPER} fontFamily="system-ui">{row.label}</text>
                <text x={12} y={row.y + 34} fontSize={20} fontWeight="bold" fill={PAPER} fontFamily={MONO_FONT}>{row.value}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Browse page headers */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Browse page header — AtlasPlate caption strip pattern (coloured band + title); used on AtlasGroup, AtlasPeriod, AtlasBlock pages
          </div>
          <svg width={320} height={36}>
            <rect x={0} y={0} width={320} height={36} fill={DEEP_BLUE} />
            <text x={12} y={24} fontSize={16} fontWeight="bold" fill={PAPER} fontFamily="system-ui">Group 8 — Iron Column</text>
          </svg>
        </div>

        {/* ── CATEGORY ───────────────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: MUSTARD }}>Category</h3>

        {/* Folio marginalia label */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Folio marginalia label — uppercase small text in category colour, beside element data
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[
              { label: 'TRANSITION METAL', color: DEEP_BLUE },
              { label: 'NOBLE GAS', color: WARM_RED },
              { label: 'METALLOID', color: MUSTARD },
            ].map((c) => (
              <span key={c.label} style={{
                fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' as const,
                letterSpacing: '0.15em', color: c.color,
              }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Periodic table highlight mode */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Periodic table highlight mode — cells dimmed except matching category (DIM vs block colour)
          </div>
          <svg width={200} height={32}>
            {[
              { sym: 'Na', active: false },
              { sym: 'Fe', active: true },
              { sym: 'Co', active: true },
              { sym: 'Br', active: false },
              { sym: 'Ni', active: true },
              { sym: 'Kr', active: false },
            ].map((el, i) => (
              <g key={el.sym}>
                <rect x={i * 32 + 2} y={2} width={28} height={28} fill={el.active ? blockColor('d') : DIM} stroke={BLACK} strokeWidth={0.5} />
                <text x={i * 32 + 16} y={20} textAnchor="middle" fontSize={9} fontWeight="bold"
                  fill={el.active ? contrastTextColor(blockColor('d')) : GREY_MID} fontFamily="system-ui">{el.sym}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── RANKING / PROPERTY ─────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: BLACK }}>Ranking / Property</h3>

        {/* PropertyBar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            PropertyBar (320 x 18 px) — filled bar proportional to rank, label left, rank right
          </div>
          <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <PropertyBar label="Atomic Mass" rank={93} color={WARM_RED} value={55.845} unit="Da" />
            <PropertyBar label="Electronegativity" rank={41} color={DEEP_BLUE} value={1.83} />
          </div>
        </div>

        {/* RankDotSparkline */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            RankDotSparkline (40 x 12 px) — single dot on a 1-118 scale line; compact rank indicator
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[
              { rank: 10, label: '#10' },
              { rank: 60, label: '#60' },
              { rank: 110, label: '#110' },
            ].map((r) => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width={40} height={12}>
                  <line x1={0} y1={6} x2={40} y2={6} stroke={GREY_RULE} strokeWidth={0.5} />
                  <circle cx={((118 - r.rank) / 117) * 36 + 2} cy={6} r={3} fill={BLACK} />
                </svg>
                <span style={{ fontSize: 10, color: GREY_MID, fontFamily: MONO_FONT }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DISCOVERER ─────────────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: DEEP_BLUE }}>Discoverer</h3>

        {/* Network row */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Network row — discoverer name (left) + ElementSquare grid (right); DiscovererNetwork page
          </div>
          <svg width={320} height={32}>
            <text x={0} y={20} fontSize={12} fontWeight="bold" fill={BLACK} fontFamily="system-ui">Seaborg</text>
            {['Pu', 'Am', 'Cm', 'Bk', 'Cf'].map((sym, i) => {
              const fill = blockColor('f');
              const txt = contrastTextColor(fill);
              return (
                <g key={sym}>
                  <rect x={100 + i * 27} y={4} width={24} height={24} fill={fill} stroke={BLACK} strokeWidth={0.5} />
                  <text x={100 + i * 27 + 12} y={20} textAnchor="middle" fontSize={8} fontWeight="bold" fill={txt} fontFamily="system-ui">{sym}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail page */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Detail page — giant count numeral + AtlasPlate grid of discovered elements
          </div>
          <svg width={200} height={60}>
            <text x={0} y={44} fontSize={48} fontWeight="bold" fontFamily={MONO_FONT} fill={DEEP_BLUE}>10</text>
            <text x={70} y={20} fontSize={10} fill={GREY_MID} fontFamily="system-ui">ELEMENTS DISCOVERED</text>
            {['Pu', 'Am', 'Cm'].map((sym, i) => {
              const fill = blockColor('f');
              const txt = contrastTextColor(fill);
              return (
                <g key={sym}>
                  <rect x={70 + i * 28} y={26} width={24} height={24} fill={fill} stroke={BLACK} strokeWidth={0.5} />
                  <text x={70 + i * 28 + 12} y={42} textAnchor="middle" fontSize={8} fontWeight="bold" fill={txt} fontFamily="system-ui">{sym}</text>
                </g>
              );
            })}
            <text x={154} y={42} fontSize={10} fill={GREY_MID} fontFamily="system-ui">...</text>
          </svg>
        </div>

        {/* ── ETYMOLOGY ORIGIN ───────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: MINERAL_BROWN }}>Etymology Origin</h3>

        {/* Section header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Section header — full-width coloured band with origin name; groups etymology cards below
          </div>
          <svg width={320} height={80}>
            <rect x={0} y={0} width={320} height={28} fill={MINERAL_BROWN} />
            <text x={10} y={19} fontSize={13} fontWeight="bold" fill={PAPER} fontFamily="system-ui" letterSpacing="0.1em">LATIN ORIGINS</text>
            {/* Grouped cards below */}
            {[
              { sym: 'Fe', desc: 'ferrum' },
              { sym: 'Au', desc: 'aurum' },
              { sym: 'Ag', desc: 'argentum' },
              { sym: 'Cu', desc: 'cuprum' },
            ].map((el, i) => (
              <g key={el.sym}>
                <rect x={i * 78 + 2} y={34} width={74} height={42} fill="none" stroke={MINERAL_BROWN} strokeWidth={1.5} />
                <text x={i * 78 + 39} y={52} textAnchor="middle" fontSize={14} fontWeight="bold" fill={BLACK} fontFamily="system-ui">{el.sym}</text>
                <text x={i * 78 + 39} y={68} textAnchor="middle" fontSize={8} fill={GREY_MID} fontFamily="system-ui">{el.desc}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── ANOMALY ────────────────────────────────────────────── */}
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: WARM_RED }}>Anomaly</h3>

        {/* Explorer chip selectors */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Explorer buttons — chip selectors for anomaly types; active state uses filled colour
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: 'Electron config', active: true },
              { label: 'Melting point', active: false },
              { label: 'Density', active: false },
            ].map((chip) => (
              <span key={chip.label} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 2,
                border: `1.5px solid ${WARM_RED}`,
                background: chip.active ? WARM_RED : PAPER,
                color: chip.active ? PAPER : WARM_RED,
                fontWeight: chip.active ? 'bold' : 'normal',
                cursor: 'pointer',
              }}>
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Ripple highlight */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
            Ripple highlight on periodic table — anomalous cells pulsed with WARM_RED stroke
          </div>
          <svg width={200} height={32}>
            {[
              { sym: 'Cr', anomaly: true },
              { sym: 'Mn', anomaly: false },
              { sym: 'Cu', anomaly: true },
              { sym: 'Zn', anomaly: false },
              { sym: 'Pd', anomaly: true },
              { sym: 'Ag', anomaly: false },
            ].map((el, i) => (
              <g key={el.sym}>
                <rect x={i * 32 + 2} y={2} width={28} height={28}
                  fill={blockColor('d')}
                  stroke={el.anomaly ? WARM_RED : BLACK}
                  strokeWidth={el.anomaly ? 2 : 0.5} />
                <text x={i * 32 + 16} y={20} textAnchor="middle" fontSize={9} fontWeight="bold"
                  fill={contrastTextColor(blockColor('d'))} fontFamily="system-ui">{el.sym}</text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Line Thickness                                                */}
      {/* ============================================================ */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Line Thickness</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '24px', lineHeight: 1.6 }}>
          Six standardised tiers govern all borders, strokes, and rules across Atlas.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {LINE_THICKNESSES.map((t) => (
            <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width={120} height={Math.max(t.value * 2 + 8, 16)} style={{ flexShrink: 0 }}>
                <line
                  x1={0}
                  y1={Math.max(t.value * 2 + 8, 16) / 2}
                  x2={120}
                  y2={Math.max(t.value * 2 + 8, 16) / 2}
                  stroke={BLACK}
                  strokeWidth={t.value}
                />
              </svg>
              <div style={{ minWidth: '160px', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {t.tier}
                  <span style={{ fontWeight: 'normal', color: GREY_MID, marginLeft: '8px' }}>{t.value}px</span>
                </div>
                <code style={{ fontSize: '11px', color: DEEP_BLUE }}>{t.cssVar}</code>
              </div>
              <div style={{ fontSize: '12px', color: GREY_MID, lineHeight: 1.4 }}>
                {t.use}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* Consolidation Opportunities                                   */}
      {/* ============================================================ */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.05em' }}>Consolidation Opportunities</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '16px', lineHeight: 1.6 }}>
          Patterns that could be unified to reduce duplication and improve consistency.
        </p>
        <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
          <div style={{ marginBottom: '16px', padding: '12px', border: `1px solid ${GREY_RULE}`, borderRadius: 2 }}>
            <strong style={{ color: DEEP_BLUE }}>1. Browse pages share a single template</strong>
            <br />
            AtlasGroup, AtlasPeriod, AtlasBlock, AtlasCategory, and AtlasRank pages
            all follow the same layout: coloured caption strip, AtlasPlate card grid,
            and optional sparkline. These could be collapsed into a single
            parameterised <code style={{ fontSize: 12 }}>AtlasBrowsePage</code> component
            that accepts entity type, colour, and data loader.
          </div>
          <div style={{ marginBottom: '16px', padding: '12px', border: `1px solid ${GREY_RULE}`, borderRadius: 2 }}>
            <strong style={{ color: WARM_RED }}>2. ElementSquare unifies small squares</strong>
            <br />
            Timeline stacked squares, Scatter plot points, and Network graph nodes
            all render small block-coloured squares with a symbol label. The
            <code style={{ fontSize: 12 }}> ElementSquare</code> component (24 px default)
            already serves this role and is used in DiscovererNetwork, PropertyScatter,
            and DiscoveryTimeline. Any remaining inline SVG squares should migrate to it.
          </div>
          <div style={{ padding: '12px', border: `1px solid ${GREY_RULE}`, borderRadius: 2 }}>
            <strong style={{ color: MUSTARD }}>3. Folio data plate rows could be reorganised</strong>
            <br />
            The three data plate rows (Group, Period, Block) in the Folio sidebar are
            hard-coded as separate SVG rects with repeated styling. Extracting a
            <code style={{ fontSize: 12 }}> DataPlateRow</code> component would reduce
            the Folio file size and make it trivial to add or reorder rows (e.g. add
            Category or Phase).
          </div>
        </div>
      </section>

      {/* Tooltip & Hover Patterns */}
      <TooltipPatterns />
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip & Hover Patterns                                          */
/* ------------------------------------------------------------------ */

function TooltipPatterns() {
  const [svgTooltip, setSvgTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>
        Tooltip &amp; Hover Patterns
      </h2>
      <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '16px', lineHeight: 1.6 }}>
        Four tooltip strategies, chosen by context: InfoTip for educational asides,
        SVG native title for basic identification, custom SVG card for rich data,
        and CSS hover states for affordance cues.
      </p>

      {/* 1. InfoTip component */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
          InfoTip — (?) circle that reveals a black tooltip on hover/focus/click
        </div>
        <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
          <span>Electronegativity</span>
          <InfoTip label="A measure of how strongly an atom attracts shared electrons in a bond. Pauling scale, 0.7–4.0.">
            {''}
          </InfoTip>
          <span style={{ marginLeft: '16px' }}>Ionisation Energy</span>
          <InfoTip label="Energy required to remove the outermost electron from a gaseous atom. Measured in kJ/mol.">
            {''}
          </InfoTip>
        </div>
      </div>

      {/* 2. SVG native tooltip (<title>) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
          SVG native tooltip — {'<title>'} element, browser-rendered on hover (try hovering)
        </div>
        <svg width={260} height={50}>
          {[
            { cx: 30, sym: 'Na', block: 's' as const, name: 'Sodium (Na) — Alkali metal, period 3' },
            { cx: 80, sym: 'Fe', block: 'd' as const, name: 'Iron (Fe) — Transition metal, period 4' },
            { cx: 130, sym: 'Br', block: 'p' as const, name: 'Bromine (Br) — Halogen, period 4' },
            { cx: 180, sym: 'U', block: 'f' as const, name: 'Uranium (U) — Actinide, period 7' },
          ].map((el) => (
            <g key={el.sym}>
              <title>{el.name}</title>
              <rect
                x={el.cx - 7}
                y={18}
                width={14}
                height={14}
                fill={blockColor(el.block)}
                stroke={BLACK}
                strokeWidth={0.5}
                style={{ cursor: 'default' }}
              />
              <text x={el.cx} y={14} textAnchor="middle" fontSize={9} fill={BLACK} fontFamily="system-ui">
                {el.sym}
              </text>
            </g>
          ))}
          <text x={220} y={28} fontSize={10} fill={GREY_MID} fontFamily="system-ui">← hover</text>
        </svg>
      </div>

      {/* 3. Custom SVG tooltip (black box, white text) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
          Custom SVG tooltip — black rect with white text, follows hovered element (DiscoveryTimeline / PropertyScatter style)
        </div>
        <svg width={340} height={100}>
          {/* Fake axis */}
          <line x1={20} y1={80} x2={320} y2={80} stroke={BLACK} strokeWidth={1} />
          {[
            { x: 60, y: 60, sym: 'H', year: '1766', discoverer: 'Cavendish', block: 's' as const },
            { x: 140, y: 45, sym: 'O', year: '1774', discoverer: 'Priestley', block: 'p' as const },
            { x: 220, y: 55, sym: 'Fe', year: 'Ancient', discoverer: 'Unknown', block: 'd' as const },
            { x: 290, y: 40, sym: 'Pu', year: '1940', discoverer: 'Seaborg', block: 'f' as const },
          ].map((pt) => (
            <g key={pt.sym}>
              <rect
                x={pt.x - 5}
                y={pt.y}
                width={10}
                height={10}
                fill={blockColor(pt.block)}
                stroke={BLACK}
                strokeWidth={0.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setSvgTooltip({ x: pt.x, y: pt.y, label: `${pt.sym} (${pt.year}) — ${pt.discoverer}` })}
                onMouseLeave={() => setSvgTooltip(null)}
              />
            </g>
          ))}
          {svgTooltip && (
            <g transform={`translate(${svgTooltip.x}, ${svgTooltip.y})`} style={{ pointerEvents: 'none' }}>
              <rect x={-80} y={-30} width={160} height={24} fill={BLACK} rx={2} />
              <text
                x={0}
                y={-14}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill={PAPER}
                fontFamily="system-ui, sans-serif"
              >
                {svgTooltip.label}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 4. CSS hover state (border thickening) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: GREY_MID, marginBottom: '6px' }}>
          CSS hover state — border thickens on hover (etymology card pattern)
        </div>
        <style>{`
          .design-hover-card {
            border: 2px solid ${DEEP_BLUE};
            transition: border-width 120ms var(--ease-snap), box-shadow 120ms var(--ease-snap);
          }
          .design-hover-card:hover {
            border-width: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          }
        `}</style>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { sym: 'Li', label: 'Greek: lithos', color: DEEP_BLUE },
            { sym: 'Au', label: 'Latin: aurum', color: MUSTARD },
            { sym: 'Hg', label: 'Greek: hydrargyros', color: WARM_RED },
          ].map((card) => (
            <div
              key={card.sym}
              className="design-hover-card"
              style={{
                borderColor: card.color,
                borderRadius: 2,
                width: 80,
                height: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: PAPER,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{card.sym}</span>
              <span style={{ fontSize: 9, color: GREY_MID }}>{card.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
