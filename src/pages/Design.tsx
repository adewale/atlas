import { useState } from 'react';
import { Link } from 'react-router';
import { blockColor, contrastTextColor } from '../lib/grid';
import PropertyBar from '../components/PropertyBar';
import InfoTip from '../components/InfoTip';
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, GREY_MID, GREY_LIGHT, DIM, MINERAL_BROWN, MONO_FONT, BACK_LINK_STYLE } from '../lib/theme';
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
            <line x1={10} y1={65} x2={190} y2={65} stroke={BLACK} strokeWidth={0.75} />
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
                <rect x={sq.x} y={sq.y} width={14} height={14} fill={blockColor(sq.block)} stroke={BLACK} strokeWidth={0.25} />
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

      {/* Tooltip & Hover Patterns */}
      <TooltipPatterns />
      </div>
    </PageShell>
  );
}
