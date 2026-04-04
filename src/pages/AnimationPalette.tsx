import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { blockColor, contrastTextColor } from '../lib/grid';
import { DEEP_BLUE, WARM_RED, MUSTARD, PAPER, BLACK, GREY_MID, MONO_FONT, BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import PageShell from '../components/PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* ── Data for demos ───────────────────────────────────────── */

const EASING_CURVES = [
  { name: '--ease-out', value: 'cubic-bezier(0.16, 1, 0.3, 1)', role: 'Default for all view transitions' },
  { name: '--ease-spring', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', role: 'Hero accent (element-symbol only)' },
] as const;

const DURATIONS = [
  { tier: 'Fast', ms: 150, role: 'Persistent chrome: viz-nav, nav-back, color-rule, viz-title' },
  { tier: 'Standard', ms: 250, role: 'Identity morphs: symbol, number, name, cell-bg, data-plate' },
] as const;

const ENTRY_KEYFRAMES = [
  { name: 'folio-line-reveal', desc: 'Opacity + translateY(6px)', duration: '400ms', easing: 'var(--ease-out)' },
  { name: 'card-enter', desc: 'Opacity + translateY(8px)', duration: '250ms', easing: 'var(--ease-out)' },
  { name: 'wipe-left', desc: 'clip-path reveal from left', duration: '350ms', easing: 'var(--ease-out)' },
  { name: 'sparkline-draw', desc: 'stroke-dashoffset draw', duration: '400ms', easing: 'var(--ease-out)' },
  { name: 'svg-fade-in', desc: 'Opacity only (SVG-safe)', duration: '300ms', easing: 'var(--ease-out)' },
  { name: 'compare-expand', desc: 'clip-path from centre outward', duration: '300ms', easing: 'var(--ease-out)' },
  { name: 'compare-scale', desc: 'scale(0.95) to scale(1)', duration: '250ms', easing: 'var(--ease-out)' },
  { name: 'help-panel-enter', desc: 'Opacity + translateY(-8px)', duration: '250ms', easing: 'var(--ease-out)' },
] as const;

const VT_NAMES = [
  { name: VT.SYMBOL, tier: 'Standard', easing: '--ease-spring', desc: 'Symbol text (Fe, Au) — grid/card to Folio hero' },
  { name: VT.NUMBER, tier: 'Standard', easing: '--ease-out', desc: 'Atomic number (026) — grid/card to Folio hero' },
  { name: VT.NAME, tier: 'Standard', easing: '--ease-out', desc: 'Element name (Iron) — grid to Folio heading' },
  { name: VT.CELL_BG, tier: 'Standard', easing: '--ease-out', desc: 'Cell background rect to Folio colour accent bar' },
  { name: VT.VIZ_NAV, tier: 'Fast', easing: '--ease-out', desc: 'Navigation bar — persists across viz pages' },
  { name: VT.VIZ_TITLE, tier: 'Fast', easing: '--ease-out', desc: 'Page heading — morphs between viz pages' },
  { name: VT.NAV_BACK, tier: 'Fast', easing: '--ease-out', desc: 'Back link — persists across pages' },
  { name: VT.COLOR_RULE, tier: 'Fast', easing: '--ease-out', desc: '4px colour rule — persists across pages' },
  { name: VT.DATA_PLATE_GROUP, tier: 'Standard', easing: '--ease-out', desc: 'Group row — Folio plate to browse badge' },
  { name: VT.DATA_PLATE_PERIOD, tier: 'Standard', easing: '--ease-out', desc: 'Period row — Folio plate to browse badge' },
  { name: VT.DATA_PLATE_BLOCK, tier: 'Standard', easing: '--ease-out', desc: 'Block row — Folio plate to browse badge' },
] as const;

/* ── Reusable demo components ─────────────────────────────── */

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '48px',
};

const H2_STYLE: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  marginBottom: '16px',
  letterSpacing: '0.05em',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: GREY_MID,
  marginBottom: '6px',
  fontFamily: MONO_FONT,
};

function TriggerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 12px',
        border: `1.5px solid ${BLACK}`,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: MONO_FONT,
      }}
    >
      {label}
    </button>
  );
}

/* ── Easing curve visualiser ──────────────────────────────── */

function EasingDemo({ name, value }: { name: string; value: string }) {
  const [playing, setPlaying] = useState(false);
  const play = useCallback(() => {
    setPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
  }, []);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={LABEL_STYLE}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '200px',
            height: '4px',
            background: GREY_MID,
            position: 'relative',
            opacity: 0.2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '-4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: DEEP_BLUE,
              transform: playing ? 'translateX(188px)' : 'translateX(0)',
              transition: playing ? `transform 500ms ${value}` : 'none',
            }}
          />
        </div>
        <TriggerButton label="Play" onClick={play} />
        <span style={{ fontSize: '10px', color: GREY_MID }}>{value}</span>
      </div>
    </div>
  );
}

/* ── Entry keyframe demo ──────────────────────────────────── */

function KeyframeDemo({ name, desc, duration, easing }: {
  name: string; desc: string; duration: string; easing: string;
}) {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);

  const clipPathAnimations = ['wipe-left', 'compare-expand'];
  const transformOnlyAnimations = ['compare-scale'];
  const animationStyle: React.CSSProperties =
    name === 'sparkline-draw'
      ? {
          width: '200px',
          height: '24px',
        }
      : clipPathAnimations.includes(name)
        ? {
            width: '200px',
            height: '24px',
            background: DEEP_BLUE,
            animation: `${name} ${duration} ${easing} forwards`,
          }
        : transformOnlyAnimations.includes(name)
          ? {
              width: '200px',
              height: '24px',
              background: DEEP_BLUE,
              animation: `${name} ${duration} ${easing} forwards`,
            }
          : {
              width: '200px',
              height: '24px',
              background: DEEP_BLUE,
              opacity: 0,
              animation: `${name} ${duration} ${easing} forwards`,
            };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={LABEL_STYLE}>@keyframes {name} <span style={{ color: BLACK }}>{desc}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {name === 'sparkline-draw' ? (
          <svg key={key} width={200} height={24} viewBox="0 0 200 24" style={{ maxWidth: '100%', height: 'auto' }}>
            <line
              x1={0} y1={12} x2={200} y2={12}
              stroke={DEEP_BLUE}
              strokeWidth={2}
              strokeDasharray={200}
              style={{
                '--dash-length': '200',
                animation: `sparkline-draw ${duration} ${easing} forwards`,
              } as React.CSSProperties}
            />
          </svg>
        ) : (
          <div key={key} style={animationStyle} />
        )}
        <TriggerButton label="Replay" onClick={replay} />
        <span style={{ fontSize: '10px', color: GREY_MID }}>{duration}</span>
      </div>
    </div>
  );
}

/* ── Stagger pattern demo ─────────────────────────────────── */

function StaggerDemo() {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={LABEL_STYLE}>Stagger pattern: card-enter with index * 15ms delay</div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`${key}-${i}`}
            style={{
              width: '24px',
              height: '40px',
              background: blockColor((['s', 'p', 'd', 'f'] as const)[i % 4]),
              opacity: 0,
              animation: `card-enter 250ms var(--ease-out) ${i * 15}ms forwards`,
            }}
          />
        ))}
        <TriggerButton label="Replay" onClick={replay} />
      </div>
    </div>
  );
}

/* ── View transition name table ───────────────────────────── */

function TransitionNameTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
        <thead>
          <tr>
            {['Name', 'Tier', 'Easing', 'Description'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderBottom: `2px solid ${BLACK}`,
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VT_NAMES.map((v) => (
            <tr key={v.name}>
              <td style={{ padding: '4px 10px', fontFamily: MONO_FONT, borderBottom: `1px solid ${GREY_MID}` }}>{v.name}</td>
              <td style={{ padding: '4px 10px', borderBottom: `1px solid ${GREY_MID}` }}>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: v.tier === 'Fast' ? WARM_RED : DEEP_BLUE,
                  color: PAPER,
                  fontWeight: 700,
                }}>
                  {v.tier === 'Fast' ? '150ms' : '250ms'}
                </span>
              </td>
              <td style={{ padding: '4px 10px', fontFamily: MONO_FONT, borderBottom: `1px solid ${GREY_MID}` }}>{v.easing}</td>
              <td style={{ padding: '4px 10px', borderBottom: `1px solid ${GREY_MID}` }}>{v.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Morph demo: shows a before/after with a trigger ──────── */

function MorphDemo() {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const fill = blockColor('d');
  const textFill = contrastTextColor(fill);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={LABEL_STYLE}>Text + surface + colour morph (simulated with CSS transitions)</div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            position: 'relative',
            width: expanded ? '200px' : '56px',
            height: expanded ? '120px' : '64px',
            background: fill,
            transition: 'width 250ms var(--ease-spring), height 250ms var(--ease-spring), background 250ms var(--ease-out)',
            overflow: 'hidden',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={expanded ? '0 0 200 120' : '0 0 56 64'}
            preserveAspectRatio="xMinYMin meet"
          >
            {/* Number */}
            <text
              x={expanded ? 8 : 4}
              y={expanded ? 50 : 13}
              fontSize={expanded ? 40 : 9}
              fontFamily={MONO_FONT}
              fontWeight={700}
              fill={textFill}
              style={{ transition: 'font-size 250ms var(--ease-out)' }}
            >
              026
            </text>
            {/* Symbol */}
            <text
              x={expanded ? 8 : 28}
              y={expanded ? 90 : 38}
              fontSize={expanded ? 36 : 16}
              fontWeight={700}
              fontFamily="system-ui, sans-serif"
              fill={textFill}
              textAnchor={expanded ? 'start' : 'middle'}
              style={{ transition: 'font-size 250ms var(--ease-spring)' }}
            >
              Fe
            </text>
            {/* Name */}
            {expanded && (
              <text
                x={8}
                y={110}
                fontSize={10}
                fill={textFill}
                fontFamily="system-ui, sans-serif"
                opacity={0.8}
                style={{ textTransform: 'uppercase' } as React.CSSProperties}
              >
                IRON
              </text>
            )}
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <TriggerButton label={expanded ? 'Collapse' : 'Expand'} onClick={toggle} />
          <span style={{ fontSize: '10px', color: GREY_MID }}>
            Symbol: ease-spring (bounce)<br />
            Surface + number: ease-out (glide)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Colour morph demo ────────────────────────────────────── */

function ColourMorphDemo() {
  const blocks = ['s', 'p', 'd', 'f'] as const;
  const [activeBlock, setActiveBlock] = useState<number>(0);
  const cycle = useCallback(() => setActiveBlock((i) => (i + 1) % 4), []);
  const fill = blockColor(blocks[activeBlock]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={LABEL_STYLE}>Colour morph: block colour transitions between s/p/d/f</div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div
          style={{
            width: '80px',
            height: '60px',
            background: fill,
            transition: 'background 250ms var(--ease-out)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: contrastTextColor(fill), fontWeight: 700, fontSize: '24px', fontFamily: MONO_FONT }}>
            {blocks[activeBlock]}
          </span>
        </div>
        <div
          style={{
            width: '4px',
            height: '60px',
            background: fill,
            transition: 'background 250ms var(--ease-out)',
          }}
        />
        <div
          style={{
            height: '4px',
            width: '120px',
            background: fill,
            transition: 'background 250ms var(--ease-out)',
          }}
        />
        <TriggerButton label="Next block" onClick={cycle} />
        <span style={{ fontSize: '10px', color: GREY_MID }}>
          Cell rect, accent bar, and colour rule<br />
          all carry the same block colour
        </span>
      </div>
    </div>
  );
}

/* ── Reduced motion indicator ─────────────────────────────── */

function ReducedMotionNote() {
  return (
    <div style={{
      padding: '10px 14px',
      border: `1.5px solid ${GREY_MID}`,
      fontSize: '12px',
      color: GREY_MID,
      marginBottom: '32px',
    }}>
      All animations honour <code style={{ fontFamily: MONO_FONT }}>prefers-reduced-motion: reduce</code>.
      When active, durations collapse to 0.01ms — transitions still occur but complete instantly.
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function AnimationPalette() {
  useDocumentTitle('Animation Palette');

  return (
    <PageShell>
      <div style={{ maxWidth: '800px' }}>
        <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
        <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px' }}>
          Animation Palette
        </h1>
        <p style={{ lineHeight: 1.7, marginBottom: '32px' }}>
          Living reference for the Atlas animation system. Click triggers to preview each animation.
          90% still, 10% explosive — animations are reserved for transitions and entry moments.
        </p>

        <ReducedMotionNote />

        {/* ── Easing curves ──────────────────────────────── */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Easing Curves</h2>
          <p style={{ fontSize: '13px', marginBottom: '16px', color: GREY_MID }}>
            Two curves for view transitions. All other easing is reserved for interactive states (hover, toggle).
          </p>
          {EASING_CURVES.map((e) => (
            <EasingDemo key={e.name} name={e.name} value={e.value} />
          ))}
        </section>

        {/* ── Duration tiers ─────────────────────────────── */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Duration Tiers</h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {DURATIONS.map((d) => (
              <div key={d.tier} style={{ flex: 1 }}>
                <div style={{
                  padding: '12px',
                  background: d.tier === 'Fast' ? WARM_RED : DEEP_BLUE,
                  color: PAPER,
                  fontWeight: 700,
                  fontSize: '24px',
                  fontFamily: MONO_FONT,
                  marginBottom: '4px',
                }}>
                  {d.ms}ms
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  {d.tier}
                </div>
                <div style={{ fontSize: '11px', color: GREY_MID }}>{d.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── View transition names ──────────────────────── */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>View Transition Names</h2>
          <p style={{ fontSize: '13px', marginBottom: '16px', color: GREY_MID }}>
            11 named shared elements. The browser morphs position, size, and colour between
            matching elements on old and new pages.
          </p>
          <TransitionNameTable />
        </section>

        {/* ── Entry keyframes ────────────────────────────── */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Entry Keyframes</h2>
          <p style={{ fontSize: '13px', marginBottom: '16px', color: GREY_MID }}>
            Eight canonical keyframes for on-page entry and interactive moments. Three aliases
            (plate-wipe, bar-grow, rule-draw) share the wipe-left implementation.
          </p>
          {ENTRY_KEYFRAMES.map((k) => (
            <KeyframeDemo key={k.name} name={k.name} desc={k.desc} duration={k.duration} easing={k.easing} />
          ))}
          <StaggerDemo />
        </section>

        {/* ── Morph demos ────────────────────────────────── */}
        <section style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>Morph Demos</h2>
          <p style={{ fontSize: '13px', marginBottom: '16px', color: GREY_MID }}>
            Simulations of how text, surfaces, and colour morph between pages.
            Actual view transitions are triggered by navigation — these demos use CSS transitions
            to illustrate the same principles.
          </p>
          <MorphDemo />
          <ColourMorphDemo />
        </section>
      </div>
    </PageShell>
  );
}
