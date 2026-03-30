import { useState } from 'react';
import { Link } from 'react-router';
import { blockColor, contrastTextColor } from '../lib/grid';
import PropertyBar from '../components/PropertyBar';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from '../lib/theme';
import SiteNav from '../components/SiteNav';

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

/* ------------------------------------------------------------------ */
/* Entity catalog                                                      */
/* ------------------------------------------------------------------ */
type Entity = {
  id: string;
  label: string;
  route: string;
  examples: { name: string; href: string }[];
  count: string;
  color: string;
  description: string;
};

const ENTITIES: Entity[] = [
  { id: 'element', label: 'Element', route: '/element/:symbol', count: '118', color: WARM_RED, description: 'Central entity. Every element is a folio page with properties, neighbors, discoverer, etymology, and rankings.', examples: [
    { name: 'Fe — Iron', href: '/element/Fe' },
    { name: 'O — Oxygen', href: '/element/O' },
    { name: 'Au — Gold', href: '/element/Au' },
    { name: 'Og — Oganesson', href: '/element/Og' },
  ]},
  { id: 'group', label: 'Group', route: '/atlas/group/:n', count: '18', color: DEEP_BLUE, description: 'IUPAC vertical column (1–18). Elements in a group share valence electron configuration.', examples: [
    { name: 'Group 1 (Alkali)', href: '/atlas/group/1' },
    { name: 'Group 8', href: '/atlas/group/8' },
    { name: 'Group 17 (Halogens)', href: '/atlas/group/17' },
    { name: 'Group 18 (Noble gases)', href: '/atlas/group/18' },
  ]},
  { id: 'period', label: 'Period', route: '/atlas/period/:n', count: '7', color: WARM_RED, description: 'Horizontal row (1–7). Elements in a period share the same highest energy level.', examples: [
    { name: 'Period 1 (H, He)', href: '/atlas/period/1' },
    { name: 'Period 4', href: '/atlas/period/4' },
    { name: 'Period 7 (actinides+)', href: '/atlas/period/7' },
  ]},
  { id: 'block', label: 'Block', route: '/atlas/block/:b', count: '4', color: MUSTARD, description: 'Orbital family (s/p/d/f). The block determines the element\'s color identity throughout Atlas.', examples: [
    { name: 's-block', href: '/atlas/block/s' },
    { name: 'p-block', href: '/atlas/block/p' },
    { name: 'd-block', href: '/atlas/block/d' },
    { name: 'f-block', href: '/atlas/block/f' },
  ]},
  { id: 'category', label: 'Category', route: '/atlas/category/:slug', count: '10', color: DEEP_BLUE, description: 'Chemical family (alkali metal, halogen, noble gas, etc.). Cross-cuts block boundaries.', examples: [
    { name: 'Transition metal', href: '/atlas/category/transition-metal' },
    { name: 'Noble gas', href: '/atlas/category/noble-gas' },
    { name: 'Alkali metal', href: '/atlas/category/alkali-metal' },
    { name: 'Metalloid', href: '/atlas/category/metalloid' },
  ]},
  { id: 'ranking', label: 'Ranking', route: '/atlas/rank/:property', count: '4', color: MUSTARD, description: 'Elements ordered by a numeric property: mass, electronegativity, ionization energy, or radius.', examples: [
    { name: 'Ranked by mass', href: '/atlas/rank/mass' },
    { name: 'By electronegativity', href: '/atlas/rank/electronegativity' },
    { name: 'By ionization energy', href: '/atlas/rank/ionizationEnergy' },
    { name: 'By atomic radius', href: '/atlas/rank/radius' },
  ]},
  { id: 'anomaly', label: 'Anomaly', route: '/atlas/anomaly/:slug', count: '5', color: WARM_RED, description: 'Periodic table rule-breakers: aufbau deviations, diagonal relationships, metalloid boundary.', examples: [
    { name: 'Electron config anomalies', href: '/atlas/anomaly/electron-configuration-anomalies' },
    { name: 'Diagonal relationships', href: '/atlas/anomaly/diagonal-relationships' },
    { name: 'Synthetic heavyweights', href: '/atlas/anomaly/synthetic-heavy' },
  ]},
  { id: 'discoverer', label: 'Discoverer', route: '/discoverer/:name', count: '50+', color: MUSTARD, description: 'Person or group who discovered elements. Graph-navigable with related discoverers by era or block.', examples: [
    { name: 'Humphry Davy', href: '/discoverer/Humphry%20Davy' },
    { name: 'Marie Curie', href: '/discoverer/Marie%20Curie' },
    { name: 'Carl Wilhelm Scheele', href: '/discoverer/Carl%20Wilhelm%20Scheele' },
  ]},
  { id: 'era', label: 'Timeline Era', route: '/timeline/:era', count: '30+', color: DEEP_BLUE, description: 'Decade or "antiquity". Groups discoveries by when they happened. Links to discoverers.', examples: [
    { name: 'Antiquity', href: '/timeline/antiquity' },
    { name: '1770s', href: '/timeline/1770' },
    { name: '1890s', href: '/timeline/1890' },
    { name: '1940s', href: '/timeline/1940' },
  ]},
  { id: 'etymology', label: 'Etymology Origin', route: '/etymology-map', count: '7', color: WARM_RED, description: 'Why elements are named: place, person, mythology, property, mineral, astronomical, unknown.', examples: [
    { name: 'Place names', href: '/etymology-map' },
    { name: 'Mythology', href: '/etymology-map' },
    { name: 'Properties', href: '/etymology-map' },
  ]},
  { id: 'comparison', label: 'Comparison', route: '/compare/:a/:b', count: '6903', color: BLACK, description: 'Side-by-side element pair. Any two of 118 elements can be compared.', examples: [
    { name: 'Fe vs Cu', href: '/compare/Fe/Cu' },
    { name: 'Na vs K', href: '/compare/Na/K' },
    { name: 'C vs Si', href: '/compare/C/Si' },
  ]},
  { id: 'neighbor', label: 'Neighbor', route: '—', count: '~236', color: BLACK, description: 'Positional adjacency in the periodic table grid. Implicit, computed from grid coordinates.', examples: [
    { name: 'Fe ↔ Mn, Co', href: '/element/Fe' },
    { name: 'O ↔ N, F', href: '/element/O' },
  ]},
];

type Edge = {
  from: string;
  to: string;
  label: string;
  cardinality: string;
  surfaced: 'both' | 'forward' | 'reverse' | 'none';
  forwardVia?: string; // where the forward link lives
  reverseVia?: string; // where the reverse link lives
};

const EDGES: Edge[] = [
  { from: 'element', to: 'group', label: 'belongs to', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio data plate', reverseVia: 'AtlasGroup plate' },
  { from: 'element', to: 'period', label: 'belongs to', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio data plate', reverseVia: 'AtlasPeriod plate' },
  { from: 'element', to: 'block', label: 'belongs to', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio data plate', reverseVia: 'AtlasBlock plate' },
  { from: 'element', to: 'category', label: 'classified as', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio marginalia', reverseVia: 'AtlasCategory plate' },
  { from: 'element', to: 'ranking', label: 'ranked in', cardinality: 'n:m', surfaced: 'both', forwardVia: 'Folio property bars', reverseVia: 'AtlasRank plate' },
  { from: 'element', to: 'discoverer', label: 'discovered by', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio discovery section', reverseVia: 'DiscovererDetail plate' },
  { from: 'element', to: 'era', label: 'discovered in', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio timeline link', reverseVia: 'TimelineEra plate' },
  { from: 'element', to: 'etymology', label: 'named for', cardinality: 'n:1', surfaced: 'both', forwardVia: 'Folio etymology section', reverseVia: 'EtymologyMap cards' },
  { from: 'element', to: 'neighbor', label: 'adjacent to', cardinality: 'n:m', surfaced: 'both', forwardVia: 'Folio neighbors', reverseVia: 'symmetric' },
  { from: 'element', to: 'comparison', label: 'compared in', cardinality: 'n:m', surfaced: 'both', forwardVia: 'Folio compare link', reverseVia: 'Compare page' },
  { from: 'anomaly', to: 'element', label: 'contains', cardinality: '1:n', surfaced: 'both', forwardVia: 'AtlasAnomaly plate', reverseVia: 'Folio anomaly badges' },
  { from: 'discoverer', to: 'era', label: 'active in', cardinality: 'n:m', surfaced: 'both', forwardVia: 'DiscovererDetail timeline link', reverseVia: 'TimelineEra discoverer list' },
  { from: 'discoverer', to: 'discoverer', label: 'related to', cardinality: 'n:m', surfaced: 'both', forwardVia: 'DiscovererDetail related section', reverseVia: 'symmetric' },
];

/* Node positions for the relationship graph (hand-tuned radial layout) */
const GRAPH_W = 800;
const GRAPH_H = 520;
const GRAPH_CX = GRAPH_W / 2;
const GRAPH_CY = GRAPH_H / 2;

type NodePos = { id: string; x: number; y: number };

// Element at center, structural entities in inner ring, derived in outer ring
const NODE_POSITIONS: NodePos[] = [
  // Center hub
  { id: 'element', x: GRAPH_CX, y: GRAPH_CY },
  // Inner ring — structural classification (4 entities)
  { id: 'group', x: GRAPH_CX - 160, y: GRAPH_CY - 120 },
  { id: 'period', x: GRAPH_CX + 160, y: GRAPH_CY - 120 },
  { id: 'block', x: GRAPH_CX - 200, y: GRAPH_CY + 40 },
  { id: 'category', x: GRAPH_CX + 200, y: GRAPH_CY + 40 },
  // Outer ring — derived/historical (7 entities)
  { id: 'ranking', x: GRAPH_CX + 300, y: GRAPH_CY - 60 },
  { id: 'anomaly', x: GRAPH_CX - 300, y: GRAPH_CY - 60 },
  { id: 'discoverer', x: GRAPH_CX - 120, y: GRAPH_CY + 180 },
  { id: 'era', x: GRAPH_CX + 120, y: GRAPH_CY + 180 },
  { id: 'etymology', x: GRAPH_CX, y: GRAPH_CY - 210 },
  { id: 'comparison', x: GRAPH_CX + 310, y: GRAPH_CY + 150 },
  { id: 'neighbor', x: GRAPH_CX - 310, y: GRAPH_CY + 150 },
];

const nodeMap = new Map(NODE_POSITIONS.map((n) => [n.id, n]));
const entityMap = new Map(ENTITIES.map((e) => [e.id, e]));

function EntityCard({ entity, highlight, onHover }: { entity: Entity; highlight: boolean; onHover: (id: string | null) => void }) {
  return (
    <div
      style={{
        border: `2px solid ${highlight ? entity.color : '#ece7db'}`,
        padding: '12px 16px',
        width: '220px',
        transition: 'border-color 150ms ease-out',
        background: highlight ? `${entity.color}08` : 'transparent',
      }}
      onMouseEnter={() => onHover(entity.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ width: '10px', height: '10px', background: entity.color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {entity.label}
        </span>
        <span style={{ fontSize: '10px', color: '#666', marginLeft: 'auto', fontFamily: "'SF Mono', monospace" }}>
          {entity.count}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5, marginBottom: '6px' }}>
        {entity.description}
      </div>
      <div style={{ fontSize: '10px', fontFamily: "'SF Mono', monospace", color: '#999', marginBottom: '4px' }}>
        {entity.route}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {entity.examples.map((ex) => (
          <Link
            key={ex.name}
            to={ex.href}
            style={{ fontSize: '11px', color: entity.color, textDecoration: 'none', minHeight: 'unset', minWidth: 'unset' }}
          >
            {ex.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function EntityCatalog() {
  const [hovered, setHovered] = useState<string | null>(null);

  // Edges connected to hovered entity
  const activeEdges = hovered
    ? EDGES.filter((e) => e.from === hovered || e.to === hovered)
    : [];
  const activeNodeIds = new Set(
    hovered
      ? [hovered, ...activeEdges.map((e) => e.from), ...activeEdges.map((e) => e.to)]
      : [],
  );

  return (
    <>
      {/* Relationship Graph */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Entity Graph</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.6 }}>
          Atlas models 12 entity types connected by 13 relationship types. Element is the central hub — every other entity connects through it. Hover a node to highlight its edges.
        </p>
        <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
          <svg
            viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
            style={{ width: '100%', maxWidth: GRAPH_W, minWidth: 600 }}
            role="img"
            aria-label="Entity relationship graph showing how all Atlas entities connect"
          >
            {/* Edges */}
            {EDGES.map((edge, i) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isActive = hovered && (edge.from === hovered || edge.to === hovered);
              const fromEntity = entityMap.get(edge.from);
              const isSelfLoop = edge.from === edge.to;

              if (isSelfLoop) {
                // Self-referential edge (discoverer → discoverer)
                const cx = fromNode.x;
                const cy = fromNode.y;
                return (
                  <g key={`edge-${i}`}>
                    <path
                      d={`M ${cx + 10} ${cy + 14} C ${cx + 50} ${cy + 60}, ${cx - 50} ${cy + 60}, ${cx - 10} ${cy + 14}`}
                      fill="none"
                      stroke={isActive ? (fromEntity?.color ?? BLACK) : '#ddd'}
                      strokeWidth={isActive ? 1.5 : 0.75}
                      opacity={hovered && !isActive ? 0.15 : isActive ? 1 : 0.4}
                    />
                    {isActive && (
                      <text
                        x={cx}
                        y={cy + 58}
                        textAnchor="middle"
                        fontSize={9}
                        fill={fromEntity?.color ?? BLACK}
                        fontFamily="system-ui, sans-serif"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              }

              // Curved edges for better readability
              const mx = (fromNode.x + toNode.x) / 2;
              const my = (fromNode.y + toNode.y) / 2;
              // Slight curve perpendicular to the line
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const curvature = 20;
              const cx = mx + (-dy / len) * curvature;
              const cy = my + (dx / len) * curvature;

              return (
                <g key={`edge-${i}`}>
                  <path
                    d={`M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`}
                    fill="none"
                    stroke={isActive ? (fromEntity?.color ?? BLACK) : '#ddd'}
                    strokeWidth={isActive ? 1.5 : 0.75}
                    opacity={hovered && !isActive ? 0.15 : isActive ? 1 : 0.4}
                    strokeDasharray={edge.cardinality.includes('m') ? '4 2' : undefined}
                  />
                  {isActive && (
                    <text
                      x={cx}
                      y={cy - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill={fromEntity?.color ?? BLACK}
                      fontFamily="system-ui, sans-serif"
                    >
                      {edge.label} ({edge.cardinality})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODE_POSITIONS.map((node) => {
              const entity = entityMap.get(node.id);
              if (!entity) return null;
              const isHovered = hovered === node.id;
              const isActive = activeNodeIds.has(node.id);
              const dimmed = hovered != null && !isActive;
              const r = node.id === 'element' ? 28 : 18;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  opacity={dimmed ? 0.2 : 1}
                >
                  <circle
                    r={r}
                    fill={isHovered ? entity.color : PAPER}
                    stroke={entity.color}
                    strokeWidth={isHovered ? 3 : 1.5}
                  />
                  <text
                    y={node.id === 'element' ? 1 : 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={node.id === 'element' ? 10 : 8}
                    fontWeight="bold"
                    fill={isHovered ? PAPER : entity.color}
                    fontFamily="system-ui, sans-serif"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {entity.label.length > 9 ? entity.label.slice(0, 8) + '…' : entity.label}
                  </text>
                  {/* Count badge */}
                  <text
                    y={r + 12}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#666"
                    fontFamily="'SF Mono', monospace"
                  >
                    {entity.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Entity Cards */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Entity Catalog</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.6 }}>
          Every browsable entity in Atlas. Cards link to an example instance.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {ENTITIES.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              highlight={hovered === entity.id || (hovered != null && activeNodeIds.has(entity.id))}
              onHover={setHovered}
            />
          ))}
        </div>
      </section>

      {/* Relationship Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Relationships</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: 1.6 }}>
          All 13 edges are surfaced as navigable links in both directions. The "Via" column shows where each link lives in the UI.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.5 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0f0f0f', textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>From</th>
              <th style={{ padding: '4px 8px' }}>Relationship</th>
              <th style={{ padding: '4px 8px' }}>To</th>
              <th style={{ padding: '4px 8px' }}>Card.</th>
              <th style={{ padding: '4px 8px' }}>Forward via</th>
              <th style={{ padding: '4px 8px' }}>Reverse via</th>
            </tr>
          </thead>
          <tbody>
            {EDGES.map((edge, i) => {
              const fromEntity = entityMap.get(edge.from);
              const toEntity = entityMap.get(edge.to);
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid #ece7db',
                    background: hovered && (edge.from === hovered || edge.to === hovered) ? '#f7f2e8' : undefined,
                  }}
                  onMouseEnter={() => setHovered(edge.from)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ color: fromEntity?.color }}>{fromEntity?.label ?? edge.from}</span>
                  </td>
                  <td style={{ padding: '4px 8px', color: '#666' }}>{edge.label}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ color: toEntity?.color }}>{toEntity?.label ?? edge.to}</span>
                  </td>
                  <td style={{ padding: '4px 8px', fontFamily: "'SF Mono', monospace" }}>{edge.cardinality}</td>
                  <td style={{ padding: '4px 8px', fontSize: '11px', color: '#666' }}>{edge.forwardVia ?? '—'}</td>
                  <td style={{ padding: '4px 8px', fontSize: '11px', color: '#666' }}>{edge.reverseVia ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function Design() {
  return (
    <main style={{ maxWidth: '800px' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0 24px', letterSpacing: '0.2em', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Design Language</h1>
      <p style={{ lineHeight: 1.7, marginBottom: '32px' }}>
        Living reference for the Atlas visual system. 60% Kronecker-Wallis/Byrne visual drama,
        40% Tufte data density.
      </p>

      {/* Entity Catalog & Relationship Graph */}
      <EntityCatalog />

      <div style={{ borderTop: '2px solid #0f0f0f', margin: '40px 0' }} />

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
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Giant numerals — 96px, monospace, block-colored</div>
          <span
            style={{
              fontSize: '96px',
              fontWeight: 'bold',
              fontFamily: "'SF Mono', monospace",
              color: '#9e1c2c',
              lineHeight: 1,
            }}
          >
            026
          </span>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Inscription titles — 13px, uppercase, 0.2em tracking, block-colored</div>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9e1c2c', margin: '4px 0' }}>Discovery Timeline</h3>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#133e7c', margin: '4px 0' }}>Etymology Map</h3>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c59b1a', margin: '4px 0' }}>Anomaly Explorer</h3>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Element name caption — 14px, uppercase, 0.3em tracking</div>
          <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#666' }}>Hydrogen</span>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>Drop cap — 48px initial in block color, Pretext-measured flow</div>
          <svg width={400} height={80}>
            <text x={0} y={42} fontSize={48} fontWeight="bold" fill="#133e7c" fontFamily="system-ui, sans-serif">H</text>
            <text x={34} y={20} fontSize={16} fill="#0f0f0f" fontFamily="system-ui, sans-serif">ydrogen is the lightest element,</text>
            <text x={34} y={39} fontSize={16} fill="#0f0f0f" fontFamily="system-ui, sans-serif">with an atomic mass of 1.008.</text>
            <text x={0} y={58} fontSize={16} fill="#0f0f0f" fontFamily="system-ui, sans-serif">It is the most abundant element in</text>
            <text x={0} y={77} fontSize={16} fill="#0f0f0f" fontFamily="system-ui, sans-serif">the universe.</text>
          </svg>
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
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: 1.6 }}>
          Tufte principle: the bar is the data, and the label shows the actual value with units.
          No legend required — rank context (#N of 118) sits at top-right.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PropertyBar label="Atomic Mass" rank={93} color="#9e1c2c" value={55.845} unit="Da" />
          <PropertyBar label="Electronegativity" rank={41} color="#133e7c" value={1.83} />
          <PropertyBar label="Ionization Energy" rank={35} color="#c59b1a" value={762.5} unit="kJ/mol" />
          <PropertyBar label="Atomic Radius" rank={67} color="#0f0f0f" value={126} unit="pm" />
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
      <SiteNav />
    </main>
  );
}
