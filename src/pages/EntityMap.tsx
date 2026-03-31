import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { BLACK, WARM_RED, PAPER, DIM, GREY_MID, GREY_LIGHT, GREY_DARK, GREY_RULE, BACK_LINK_STYLE, MONO_FONT, INSCRIPTION_STYLE, SECTION_HEADING_STYLE } from '../lib/theme';
import { ENTITIES, VIZ_PAGES } from '../lib/routeMeta';
import type { EntityMeta } from '../lib/routeMeta';
import PageShell from '../components/PageShell';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePretextLines } from '../hooks/usePretextLines';
import { PRETEXT_SANS, measureLines } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';

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
const GRAPH_H = 620;
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

function EntityCard({ entity, highlight, onHover }: { entity: EntityMeta; highlight: boolean; onHover: (id: string | null) => void }) {
  return (
    <div
      style={{
        border: `2px solid ${highlight ? entity.colour : DIM}`,
        padding: '12px 16px',
        width: '220px',
        maxWidth: '100%',
        minHeight: '150px',
        transition: 'border-color 150ms ease-out',
        background: highlight ? `${entity.colour}08` : 'transparent',
      }}
      onPointerEnter={() => onHover(entity.id)}
      onPointerLeave={() => onHover(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ width: '10px', height: '10px', background: entity.colour, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {entity.label}
        </span>
        <span style={{ fontSize: '10px', color: GREY_MID, marginLeft: 'auto', fontFamily: MONO_FONT }}>
          {entity.count}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: GREY_MID, lineHeight: 1.5, marginBottom: '6px' }}>
        {entity.description}
      </div>
      <div style={{ fontSize: '10px', fontFamily: MONO_FONT, color: GREY_LIGHT, marginBottom: '4px' }}>
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

/** Font strings matching what the SVG labels use (bold, system-ui). */
const LABEL_FONT = 'bold 10px system-ui, sans-serif';
const LABEL_FONT_ELEMENT = 'bold 12px system-ui, sans-serif';

/** Measure the displayed label for each node and return the max width across all. */
function useMaxLabelWidth(): number {
  return useMemo(() => {
    let maxW = 0;
    for (const node of NODE_POSITIONS) {
      const entity = entityMap.get(node.id);
      if (!entity) continue;
      const display = entity.label.length > 10 ? entity.label.slice(0, 9) + '\u2026' : entity.label;
      const font = node.id === 'element' ? LABEL_FONT_ELEMENT : LABEL_FONT;
      const lines = measureLines(display.toUpperCase(), font, 9999, 20);
      const w = lines[0]?.width ?? 0;
      if (w > maxW) maxW = w;
    }
    // Add ~5% for CSS letter-spacing (0.05em) + 16px horizontal padding (8px each side)
    return Math.ceil(maxW * 1.05) + 16;
  }, []);
}

function EntityGraph({ hovered, setHovered }: { hovered: string | null; setHovered: (id: string | null) => void }) {
  const hoveredEntity = hovered ? entityMap.get(hovered) : null;
  const { lines: descLines, lineHeight: descLH } = usePretextLines({
    text: hoveredEntity?.description ?? '',
    maxWidth: 200,
    font: `12px ${PRETEXT_SANS}`,
  });
  const maxLabelW = useMaxLabelWidth();

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
                  stroke={isActive ? (fromEntity?.colour ?? BLACK) : DIM}
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
                stroke={isActive ? (fromEntity?.colour ?? BLACK) : DIM}
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
                    opacity={1}
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
          const barH = Math.round(r * 0.8);  // bar height
          const barW = Math.max(r * 2 + 12, maxLabelW); // at least as wide as the longest label
          const ringStroke = isHovered ? 5 : 3;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: 'pointer' }}
              onPointerEnter={() => setHovered(node.id)}
              onPointerLeave={() => setHovered(null)}
              onClick={() => setHovered(hovered === node.id ? null : node.id)}
              opacity={dimmed ? 0.2 : 1}
            >
              {/* Ring */}
              <circle
                r={r}
                fill="none"
                stroke={entity.colour}
                strokeWidth={ringStroke}
                style={{ transition: 'stroke-width 150ms ease-out' }}
              />
              {/* Bar — extends past ring edges */}
              <rect
                x={-barW / 2}
                y={-barH / 2}
                width={barW}
                height={barH}
                fill={entity.colour}
              />
              {/* Label text — white on colored bar */}
              <text
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={node.id === 'element' ? 12 : 10}
                fontWeight="bold"
                fill={PAPER}
                fontFamily="system-ui, sans-serif"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {entity.label.length > 10 ? entity.label.slice(0, 9) + '…' : entity.label}
              </text>
              {/* Count badge below */}
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize={10}
                fill={GREY_MID}
                fontFamily={MONO_FONT}
              >
                {entity.count}
              </text>
            </g>
          );
        })}

        {/* Pretext description for hovered entity */}
        {hoveredEntity && descLines.length > 0 && (() => {
          const node = nodeMap.get(hovered!);
          if (!node) return null;
          const r = hovered === 'element' ? 32 : 22;
          // Position text below the node's count badge
          const textX = node.x - 100;
          const textY = node.y + r + 28;
          return (
            <g style={{ opacity: 0, animation: 'folio-line-reveal 200ms var(--ease-out) forwards' }}>
              {/* Background for readability */}
              <rect
                x={textX - 8}
                y={textY - 6}
                width={216}
                height={descLines.length * descLH + 16}
                fill={PAPER}
                opacity={0.95}
                rx={2}
              />
              <PretextSvg
                lines={descLines}
                lineHeight={descLH}
                x={textX}
                y={textY}
                fontSize={12}
                fill={BLACK}
                maxWidth={200}
              />
            </g>
          );
        })()}
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

  useDocumentTitle('Entity Map');

  return (
    <PageShell>
      <div style={{ maxWidth: '900px' }}>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '16px 0 8px', color: WARM_RED }}>
        Entity Map
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '32px', fontSize: '14px', color: GREY_DARK }}>
        Atlas models 12 entity types connected by 13 relationship types. Element is the central
        hub — every other entity connects through it. {mobile ? 'Tap' : 'Hover over'} a node to highlight its edges.
      </p>

      {/* Relationship Graph */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={SECTION_HEADING_STYLE}>Entity Graph</h2>
        <EntityGraph hovered={hovered} setHovered={setHovered} />
      </section>

      {/* Entity Catalogue */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={SECTION_HEADING_STYLE}>Entity Catalogue</h2>
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
        <h2 style={SECTION_HEADING_STYLE}>URL Patterns</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '12px', lineHeight: 1.6 }}>
          Every entity has a unique, linkable URL. Share any page and the recipient sees exactly what you see.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.5 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BLACK}`, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Entity</th>
              <th style={{ padding: '6px 8px', fontFamily: MONO_FONT }}>URL Pattern</th>
              <th style={{ padding: '6px 8px' }}>Example</th>
              <th style={{ padding: '6px 8px' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {ENTITIES.filter((e) => e.route !== '—').map((entity) => (
              <tr key={entity.id} style={{ borderBottom: `1px solid ${DIM}` }}>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{ color: entity.colour, fontWeight: 'bold' }}>{entity.label}</span>
                </td>
                <td style={{ padding: '6px 8px', fontFamily: MONO_FONT, fontSize: '11px', color: GREY_MID }}>
                  {entity.route}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {entity.examples[0] && (
                    <Link to={entity.examples[0].href} style={{ fontSize: '11px', color: entity.colour, textDecoration: 'none', minHeight: 'unset', minWidth: 'unset' }}>
                      {entity.examples[0].name}
                    </Link>
                  )}
                </td>
                <td style={{ padding: '6px 8px', fontFamily: MONO_FONT }}>{entity.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Relationships Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={SECTION_HEADING_STYLE}>Relationships</h2>
        <p style={{ fontSize: '13px', color: GREY_MID, marginBottom: '12px', lineHeight: 1.6 }}>
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
                    borderLeft: `3px solid ${fromEntity?.colour ?? GREY_RULE}`,
                    padding: '8px 12px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    <span style={{ color: fromEntity?.colour, fontWeight: 'bold' }}>{fromEntity?.label}</span>
                    {' '}<span style={{ color: GREY_MID }}>{edge.label}</span>{' '}
                    <span style={{ color: toEntity?.colour, fontWeight: 'bold' }}>{toEntity?.label}</span>
                    {' '}<span style={{ fontSize: '11px', color: GREY_LIGHT, fontFamily: MONO_FONT }}>({edge.cardinality})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: GREY_LIGHT, marginTop: '2px' }}>
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
              <tr style={{ borderBottom: `2px solid ${BLACK}`, textAlign: 'left' }}>
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
                      borderBottom: `1px solid ${DIM}`,
                      background: hovered && (edge.from === hovered || edge.to === hovered) ? PAPER : undefined,
                    }}
                    onMouseEnter={() => setHovered(edge.from)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: fromEntity?.colour }}>{fromEntity?.label ?? edge.from}</span>
                    </td>
                    <td style={{ padding: '6px 8px', color: GREY_MID }}>{edge.label}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: toEntity?.colour }}>{toEntity?.label ?? edge.to}</span>
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: MONO_FONT }}>{edge.cardinality}</td>
                    <td style={{ padding: '6px 8px', fontSize: '11px', color: GREY_MID }}>{edge.forwardVia ?? '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: '11px', color: GREY_MID }}>{edge.reverseVia ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Visualisation pages — where each entity type is surfaced */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ ...SECTION_HEADING_STYLE, margin: '32px 0 12px' }}>
          Visualisation Pages
        </h2>
        <p style={{ fontSize: '13px', color: GREY_MID, lineHeight: 1.7, marginBottom: '16px' }}>
          Each visualisation page surfaces a different facet of the entity graph. Elements appear on every page;
          other entity types are surfaced where they add context.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {VIZ_PAGES.map((viz) => (
            <Link
              key={viz.path}
              to={viz.path}
              title={viz.label}
              style={{
                display: 'block',
                padding: '10px 12px',
                border: `1px solid ${DIM}`,
                textDecoration: 'none',
                color: BLACK,
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{viz.label}</div>
              <div style={{ color: GREY_MID, fontSize: '11px' }}>{viz.entities}</div>
            </Link>
          ))}
        </div>
      </section>

      </div>

    </PageShell>
  );
}
