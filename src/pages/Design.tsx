import { Link } from 'react-router';
import { blockColor, contrastTextColor } from '../lib/grid';
import PropertyBar from '../components/PropertyBar';

const PALETTE = [
  { name: 'Paper', hex: '#f7f2e8' },
  { name: 'Black', hex: '#0f0f0f' },
  { name: 'Deep Blue', hex: '#133e7c' },
  { name: 'Warm Red', hex: '#9e1c2c' },
  { name: 'Mustard', hex: '#c59b1a' },
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
  return (
    <main style={{ maxWidth: '800px' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0 24px', letterSpacing: '0.15em' }}>Design Language</h1>
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
                  border: '1px solid #0f0f0f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: contrastTextColor(c.hex),
                  fontSize: '11px',
                  fontFamily: "'SF Mono', monospace",
                }}
              >
                {c.hex}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Block Colors */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Block Colors</h2>
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
          <div style={{ fontSize: '12px', color: '#666' }}>Body — system-ui, 16px</div>
          <p>The quick brown fox jumps over the lazy dog.</p>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Monospace — SF Mono / Cascadia Code</div>
          <p className="mono">118 elements · 7 periods · 18 groups</p>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>Giant numerals</div>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              fontFamily: "'SF Mono', monospace",
              color: '#9e1c2c',
              lineHeight: 1,
            }}
          >
            026
          </span>
        </div>
      </section>

      {/* Element Cell */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Element Cell</h2>
        <svg width={56} height={64}>
          <rect x={1} y={1} width={54} height={62} fill="#f7f2e8" stroke="#0f0f0f" strokeWidth={0.5} />
          <text x={4} y={13} fontSize={9} fill="#0f0f0f" fontFamily="system-ui">26</text>
          <text x={28} y={36} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#0f0f0f" fontFamily="system-ui">Fe</text>
          <text x={28} y={52} textAnchor="middle" fontSize={7} fill="#0f0f0f" fontFamily="system-ui">Iron</text>
        </svg>
      </section>

      {/* Data Plate */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Data Plate</h2>
        <svg width={160} height={180}>
          <rect x={0} y={0} width={160} height={56} fill="#133e7c" />
          <text x={12} y={20} fontSize={10} fill="#f7f2e8" fontFamily="system-ui">GROUP</text>
          <text x={12} y={46} fontSize={24} fontWeight="bold" fill="#f7f2e8" fontFamily="'SF Mono', monospace">8</text>
          <rect x={0} y={60} width={160} height={56} fill="#9e1c2c" />
          <text x={12} y={80} fontSize={10} fill="#f7f2e8" fontFamily="system-ui">PERIOD</text>
          <text x={12} y={106} fontSize={24} fontWeight="bold" fill="#f7f2e8" fontFamily="'SF Mono', monospace">4</text>
          <rect x={0} y={120} width={160} height={56} fill="#9e1c2c" />
          <text x={12} y={140} fontSize={10} fill="#f7f2e8" fontFamily="system-ui">BLOCK</text>
          <text x={12} y={166} fontSize={24} fontWeight="bold" fill="#f7f2e8" fontFamily="'SF Mono', monospace">d</text>
        </svg>
      </section>

      {/* Property Bars */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Property Bars</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PropertyBar label="Mass" rank={93} color="#9e1c2c" />
          <PropertyBar label="EN" rank={41} color="#133e7c" />
          <PropertyBar label="IE" rank={35} color="#c59b1a" />
          <PropertyBar label="Radius" rank={67} color="#0f0f0f" />
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
                  background: '#133e7c',
                }}
              />
              <span style={{ fontSize: '11px', color: '#666' }}>{s.value}</span>
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
              <span style={{ color: '#666' }}> — {e.use}</span>
              <br />
              <span className="mono" style={{ fontSize: '11px' }}>{e.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', lineHeight: 1.7, fontSize: '13px' }}>
          <strong>Four explosive moments:</strong>
          <ol style={{ paddingLeft: '20px', marginTop: '4px' }}>
            <li>Folio entry: text stagger, plate wipe, bar grow</li>
            <li>Compare split: color halves expand, symbols scale</li>
            <li>Highlight switch: cell fills ripple outward</li>
            <li>First load: cascade by atomic number</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
