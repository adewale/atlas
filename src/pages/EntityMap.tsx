import { useState } from 'react';
import { Link } from 'react-router';
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from '../lib/theme';
import SiteNav from '../components/SiteNav';
import { useIsMobile } from '../hooks/useIsMobile';

/* ------------------------------------------------------------------ */
/* Entity catalogue                                                    */
/* ------------------------------------------------------------------ */
type Entity = {
  id: string;
  label: string;
  route: string;
  examples: { name: string; href: string }[];
  count: string;
  colour: string;
  description: string;
};

const ENTITIES: Entity[] = [
  { id: 'element', label: 'Element', route: '/element/:symbol', count: '118', colour: WARM_RED, description: 'Central entity. Every element is a folio page with properties, neighbours, discoverer, etymology, and rankings.', examples: [
    { name: 'Fe — Iron', href: '/element/Fe' },
    { name: 'O — Oxygen', href: '/element/O' },
    { name: 'Au — Gold', href: '/element/Au' },
    { name: 'Og — Oganesson', href: '/element/Og' },
  ]},
  { id: 'group', label: 'Group', route: '/atlas/group/:n', count: '18', colour: DEEP_BLUE, description: 'IUPAC vertical column (1–18). Elements in a group share valence electron configuration.', examples: [
    { name: 'Group 1 (Alkali)', href: '/atlas/group/1' },
    { name: 'Group 8', href: '/atlas/group/8' },
    { name: 'Group 17 (Halogens)', href: '/atlas/group/17' },
    { name: 'Group 18 (Noble gases)', href: '/atlas/group/18' },
  ]},
  { id: 'period', label: 'Period', route: '/atlas/period/:n', count: '7', colour: WARM_RED, description: 'Horizontal row (1–7). Elements in a period share the same highest energy level.', examples: [
    { name: 'Period 1 (H, He)', href: '/atlas/period/1' },
    { name: 'Period 4', href: '/atlas/period/4' },
    { name: 'Period 7 (actinides+)', href: '/atlas/period/7' },
  ]},
  { id: 'block', label: 'Block', route: '/atlas/block/:b', count: '4', colour: MUSTARD, description: 'Orbital family (s/p/d/f). The block determines the element\'s colour identity throughout Atlas.', examples: [
    { name: 's-block', href: '/atlas/block/s' },
    { name: 'p-block', href: '/atlas/block/p' },
    { name: 'd-block', href: '/atlas/block/d' },
    { name: 'f-block', href: '/atlas/block/f' },
  ]},
  { id: 'category', label: 'Category', route: '/atlas/category/:slug', count: '10', colour: DEEP_BLUE, description: 'Chemical family (alkali metal, halogen, noble gas, etc.). Cross-cuts block boundaries.', examples: [
    { name: 'Transition metal', href: '/atlas/category/transition-metal' },
    { name: 'Noble gas', href: '/atlas/category/noble-gas' },
    { name: 'Alkali metal', href: '/atlas/category/alkali-metal' },
    { name: 'Metalloid', href: '/atlas/category/metalloid' },
  ]},
  { id: 'ranking', label: 'Ranking', route: '/atlas/rank/:property', count: '4', colour: MUSTARD, description: 'Elements ordered by a numeric property: mass, electronegativity, ionisation energy, or radius.', examples: [
    { name: 'Ranked by mass', href: '/atlas/rank/mass' },
    { name: 'By electronegativity', href: '/atlas/rank/electronegativity' },
    { name: 'By ionisation energy', href: '/atlas/rank/ionizationEnergy' },
    { name: 'By atomic radius', href: '/atlas/rank/radius' },
  ]},
  { id: 'anomaly', label: 'Anomaly', route: '/atlas/anomaly/:slug', count: '5', colour: WARM_RED, description: 'Periodic table rule-breakers: aufbau deviations, diagonal relationships, metalloid boundary.', examples: [
    { name: 'Electron config anomalies', href: '/atlas/anomaly/electron-configuration-anomalies' },
    { name: 'Diagonal relationships', href: '/atlas/anomaly/diagonal-relationships' },
    { name: 'Synthetic heavyweights', href: '/atlas/anomaly/synthetic-heavy' },
  ]},
  { id: 'discoverer', label: 'Discoverer', route: '/discoverer/:name', count: '50+', colour: MUSTARD, description: 'Person or group who discovered elements. Graph-navigable with related discoverers by era or block.', examples: [
    { name: 'Humphry Davy', href: '/discoverer/Humphry%20Davy' },
    { name: 'Marie Curie', href: '/discoverer/Marie%20Curie' },
    { name: 'Carl Wilhelm Scheele', href: '/discoverer/Carl%20Wilhelm%20Scheele' },
  ]},
  { id: 'era', label: 'Timeline Era', route: '/timeline/:era', count: '30+', colour: DEEP_BLUE, description: 'Decade or "antiquity". Groups discoveries by when they happened. Links to discoverers.', examples: [
    { name: 'Antiquity', href: '/timeline/antiquity' },
    { name: '1770s', href: '/timeline/1770' },
    { name: '1890s', href: '/timeline/1890' },
    { name: '1940s', href: '/timeline/1940' },
  ]},
  { id: 'etymology', label: 'Etymology Origin', route: '/etymology-map#:origin', count: '7', colour: WARM_RED, description: 'Why elements are named: place, person, mythology, property, mineral, astronomical, unknown.', examples: [
    { name: 'Place names', href: '/etymology-map#place' },
    { name: 'Mythology', href: '/etymology-map#mythology' },
    { name: 'Properties', href: '/etymology-map#property' },
  ]},
  { id: 'comparison', label: 'Comparison', route: '/compare/:a/:b', count: '6903', colour: BLACK, description: 'Side-by-side element pair. Any two of 118 elements can be compared.', examples: [
    { name: 'Fe vs Cu', href: '/compare/Fe/Cu' },
    { name: 'Na vs K', href: '/compare/Na/K' },
    { name: 'C vs Si', href: '/compare/C/Si' },
  ]},
  { id: 'neighbour', label: 'Neighbour', route: '—', count: '~236', colour: BLACK, description: 'Positional adjacency in the periodic table grid. Implicit, computed from grid coordinates.', examples: [
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
  forwardVia?: string;
  reverseVia?: string;
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
  { from: 'element', to: 'neighbour', label: 'adjacent to', cardinality: 'n:m', surfaced: 'both', forwardVia: 'Folio neighbours', reverseVia: 'symmetric' },
  { from: 'element', to: 'comparison', label: 'compared in', cardinality: 'n:m', surfaced: 'both', forwardVia: 'Folio compare link', reverseVia: 'Compare page' },
  { from: 'anomaly', to: 'element', label: 'contains', cardinality: '1:n', surfaced: 'both', forwardVia: 'AtlasAnomaly plate', reverseVia: 'Folio anomaly badges' },
  { from: 'discoverer', to: 'era', label: 'active in', cardinality: 'n:m', surfaced: 'both', forwardVia: 'DiscovererDetail timeline link', reverseVia: 'TimelineEra discoverer list' },
  { from: 'discoverer', to: 'discoverer', label: 'related to', cardinality: 'n:m', surfaced: 'both', forwardVia: 'DiscovererDetail related section', reverseVia: 'symmetric' },
];

/* Node positions for the relationship graph */
const GRAPH_W = 800;
const GRAPH_H = 520;
const GRAPH_CX = GRAPH_W / 2;
const GRAPH_CY = GRAPH_H / 2;

type NodePos = { id: string; x: number; y: number };

const NODE_POSITIONS: NodePos[] = [
  { id: 'element', x: GRAPH_CX, y: GRAPH_CY },
  { id: 'group', x: GRAPH_CX - 160, y: GRAPH_CY - 120 },
  { id: 'period', x: GRAPH_CX + 160, y: GRAPH_CY - 120 },
  { id: 'block', x: GRAPH_CX - 200, y: GRAPH_CY + 40 },
  { id: 'category', x: GRAPH_CX + 200, y: GRAPH_CY + 40 },
  { id: 'ranking', x: GRAPH_CX + 300, y: GRAPH_CY - 60 },
  { id: 'anomaly', x: GRAPH_CX - 300, y: GRAPH_CY - 60 },
  { id: 'discoverer', x: GRAPH_CX - 120, y: GRAPH_CY + 180 },
  { id: 'era', x: GRAPH_CX + 120, y: GRAPH_CY + 180 },
  { id: 'etymology', x: GRAPH_CX, y: GRAPH_CY - 210 },
  { id: 'comparison', x: GRAPH_CX + 310, y: GRAPH_CY + 150 },
  { id: 'neighbour', x: GRAPH_CX - 310, y: GRAPH_CY + 150 },
];

const nodeMap = new Map(NODE_POSITIONS.map((n) => [n.id, n]));
const entityMap = new Map(ENTITIES.map((e) => [e.id, e]));

function EntityCard({ entity, highlight, onHover }: { entity: Entity; highlight: boolean; onHover: (id: string | null) => void }) {
  return (
    <div
      style={{
        border: `2px solid ${highlight ? entity.colour : '#ece7db'}`,
        padding: '12px 16px',
        width: '220px',
        maxWidth: '100%',
        transition: 'border-color 150ms ease-out',
        background: highlight ? `${entity.colour}08` : 'transparent',
      }}
      onMouseEnter={() => onHover(entity.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ width: '10px', height: '10px', background: entity.colour, display: 'inline-block', flexShrink: 0 }} />
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
            style={{ fontSize: '11px', color: entity.colour, textDecoration: 'none', minHeight: 'unset', minWidth: 'unset' }}
          >
            {ex.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function EntityGraph({ hovered, setHovered }: { hovered: string | null; setHovered: (id: string | null) => void }) {
  const activeEdges = hovered
    ? EDGES.filter((e) => e.from === hovered || e.to === hovered)
    : [];
  const activeNodeIds = new Set(
    hovered
      ? [hovered, ...activeEdges.map((e) => e.from), ...activeEdges.map((e) => e.to)]
      : [],
  );

  return (
    <div className="pt-scroll-container" style={{ touchAction: 'pinch-zoom' }}>
      <svg
        viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
        style={{ width: '100%', maxWidth: GRAPH_W }}
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
            const cx = fromNode.x;
            const cy = fromNode.y;
            return (
              <g key={`edge-${i}`}>
                <path
                  d={`M ${cx + 10} ${cy + 14} C ${cx + 50} ${cy + 60}, ${cx - 50} ${cy + 60}, ${cx - 10} ${cy + 14}`}
                  fill="none"
                  stroke={isActive ? (fromEntity?.colour ?? BLACK) : '#ddd'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={hovered && !isActive ? 0.15 : isActive ? 1 : 0.4}
                />
                {isActive && (
                  <text
                    x={cx}
                    y={cy + 58}
                    textAnchor="middle"
                    fontSize={11}
                    fill={fromEntity?.colour ?? BLACK}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="bold"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          }

          const mx = (fromNode.x + toNode.x) / 2;
          const my = (fromNode.y + toNode.y) / 2;
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
                stroke={isActive ? (fromEntity?.colour ?? BLACK) : '#ddd'}
                strokeWidth={isActive ? 2 : 1}
                opacity={hovered && !isActive ? 0.15 : isActive ? 1 : 0.4}
                strokeDasharray={edge.cardinality.includes('m') ? '4 2' : undefined}
              />
              {isActive && (
                <>
                  {/* Background for readability */}
                  <rect
                    x={cx - 40}
                    y={cy - 14}
                    width={80}
                    height={16}
                    fill={PAPER}
                    opacity={0.9}
                    rx={2}
                  />
                  <text
                    x={cx}
                    y={cy - 2}
                    textAnchor="middle"
                    fontSize={11}
                    fill={fromEntity?.colour ?? BLACK}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="bold"
                  >
                    {edge.label} ({edge.cardinality})
                  </text>
                </>
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
          const r = node.id === 'element' ? 32 : 22;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(hovered === node.id ? null : node.id)}
              opacity={dimmed ? 0.2 : 1}
            >
              <circle
                r={r}
                fill={isHovered ? entity.colour : PAPER}
                stroke={entity.colour}
                strokeWidth={isHovered ? 3 : 2}
              />
              <text
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={node.id === 'element' ? 12 : 10}
                fontWeight="bold"
                fill={isHovered ? PAPER : entity.colour}
                fontFamily="system-ui, sans-serif"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {entity.label.length > 10 ? entity.label.slice(0, 9) + '…' : entity.label}
              </text>
              {/* Count badge */}
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize={10}
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
  );
}

export default function EntityMapPage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const mobile = useIsMobile();

  const activeEdges = hovered
    ? EDGES.filter((e) => e.from === hovered || e.to === hovered)
    : [];
  const activeNodeIds = new Set(
    hovered
      ? [hovered, ...activeEdges.map((e) => e.from), ...activeEdges.map((e) => e.to)]
      : [],
  );

  return (
    <main>
      <div style={{ maxWidth: '900px' }}>
      <Link to="/" style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', color: '#666' }}>← Table</Link>
      <h1 style={{
        margin: '16px 0 8px',
        letterSpacing: '0.2em',
        fontSize: '13px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: WARM_RED,
      }}>
        Entity Map
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '32px', fontSize: '14px', color: '#333' }}>
        Atlas models 12 entity types connected by 13 relationship types. Element is the central
        hub — every other entity connects through it. {mobile ? 'Tap' : 'Hover over'} a node to highlight its edges.
      </p>

      {/* Relationship Graph */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Entity Graph</h2>
        <EntityGraph hovered={hovered} setHovered={setHovered} />
      </section>

      {/* Entity Catalogue */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Entity Catalogue</h2>
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

      {/* URL Patterns */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>URL Patterns</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: 1.6 }}>
          Every entity has a unique, linkable URL. Share any page and the recipient sees exactly what you see.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.5 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0f0f0f', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Entity</th>
              <th style={{ padding: '6px 8px', fontFamily: "'SF Mono', monospace" }}>URL Pattern</th>
              <th style={{ padding: '6px 8px' }}>Example</th>
              <th style={{ padding: '6px 8px' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {ENTITIES.filter((e) => e.route !== '—').map((entity) => (
              <tr key={entity.id} style={{ borderBottom: '1px solid #ece7db' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{ color: entity.colour, fontWeight: 'bold' }}>{entity.label}</span>
                </td>
                <td style={{ padding: '6px 8px', fontFamily: "'SF Mono', monospace", fontSize: '11px', color: '#666' }}>
                  {entity.route}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {entity.examples[0] && (
                    <Link to={entity.examples[0].href} style={{ fontSize: '11px', color: entity.colour, textDecoration: 'none', minHeight: 'unset', minWidth: 'unset' }}>
                      {entity.examples[0].name}
                    </Link>
                  )}
                </td>
                <td style={{ padding: '6px 8px', fontFamily: "'SF Mono', monospace" }}>{entity.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Relationships Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>Relationships</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: 1.6 }}>
          All 13 edges are surfaced as navigable links in both directions. The "Via" column shows where each link lives in the UI.
        </p>
        {mobile ? (
          /* Mobile: stacked card layout instead of table */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {EDGES.map((edge, i) => {
              const fromEntity = entityMap.get(edge.from);
              const toEntity = entityMap.get(edge.to);
              return (
                <div
                  key={i}
                  style={{
                    borderLeft: `3px solid ${fromEntity?.colour ?? '#ccc'}`,
                    padding: '8px 12px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    <span style={{ color: fromEntity?.colour, fontWeight: 'bold' }}>{fromEntity?.label}</span>
                    {' '}<span style={{ color: '#666' }}>{edge.label}</span>{' '}
                    <span style={{ color: toEntity?.colour, fontWeight: 'bold' }}>{toEntity?.label}</span>
                    {' '}<span style={{ fontSize: '11px', color: '#999', fontFamily: "'SF Mono', monospace" }}>({edge.cardinality})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                    Forward: {edge.forwardVia ?? '—'} · Reverse: {edge.reverseVia ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: table layout */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0f0f0f', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>From</th>
                <th style={{ padding: '6px 8px' }}>Relationship</th>
                <th style={{ padding: '6px 8px' }}>To</th>
                <th style={{ padding: '6px 8px' }}>Card.</th>
                <th style={{ padding: '6px 8px' }}>Forward via</th>
                <th style={{ padding: '6px 8px' }}>Reverse via</th>
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
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: fromEntity?.colour }}>{fromEntity?.label ?? edge.from}</span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#666' }}>{edge.label}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: toEntity?.colour }}>{toEntity?.label ?? edge.to}</span>
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: "'SF Mono', monospace" }}>{edge.cardinality}</td>
                    <td style={{ padding: '6px 8px', fontSize: '11px', color: '#666' }}>{edge.forwardVia ?? '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: '11px', color: '#666' }}>{edge.reverseVia ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <div style={{ fontSize: '13px' }}>
        <Link to="/design" style={{ color: WARM_RED }}>Design Language →</Link>
      </div>
      </div>

      <SiteNav />
    </main>
  );
}
