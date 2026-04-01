import { Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { BACK_LINK_STYLE, PAPER, MONO_FONT } from '../lib/theme';
import { VT } from '../lib/transitions';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from './PretextSvg';
import AtlasPlate from './AtlasPlate';
import PageShell from './PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { contrastTextColor } from '../lib/grid';

const DESC_MAX_W = 600;

type AtlasBrowsePageProps = {
  backLink: { label: string; to: string };
  heading: string;
  color: string;
  viewTransitionName?: string;
  description?: string;
  elements: string[];
  caption: string;
  captionColor: string;
  propertyKey?: string;
  sparkline?: {
    values: (number | null)[];
    highlightIndex?: number;
    color?: string;
  };
};

/**
 * Shared browse-page template used by Group, Period, Block, Category, Rank,
 * and Anomaly pages.  Renders a back-link, heading, colour rule, optional
 * description (via PretextSvg), and an AtlasPlate card grid.
 */
export default function AtlasBrowsePage({
  backLink,
  heading,
  color,
  viewTransitionName,
  description,
  elements: symbols,
  caption,
  captionColor,
  propertyKey,
  sparkline,
}: AtlasBrowsePageProps) {
  useDocumentTitle(heading);

  const elements = symbols.map((s) => getElement(s)).filter(
    (e): e is ElementRecord => e != null,
  );

  const { lines, lineHeight } = usePretextLines({
    text: description ?? '',
    maxWidth: DESC_MAX_W,
  });

  const textFill = viewTransitionName ? contrastTextColor(color) : color;

  return (
    <PageShell>
      <Link to={backLink.to} style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>{backLink.label}</Link>
      {viewTransitionName ? (
        /* Data-plate badge: coloured background matching Folio plate rows
           so the view transition morph is shape-preserving in both directions. */
        <div
          style={{
            margin: '12px 0 16px',
            padding: '8px 14px',
            background: color,
            display: 'inline-block',
            viewTransitionName,
          } as React.CSSProperties}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: textFill,
              fontFamily: MONO_FONT,
            }}
          >
            {heading}
          </span>
        </div>
      ) : (
        <h1
          style={{
            margin: '12px 0 16px',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color,
          }}
        >
          {heading}
        </h1>
      )}
      <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px', viewTransitionName: VT.COLOR_RULE } as React.CSSProperties} />
      {description && (
        <svg
          width={DESC_MAX_W}
          height={lines.length * lineHeight + lineHeight}
          style={{ maxWidth: '100%', marginBottom: '24px' }}
          role="img"
          aria-label={description}
        >
          <PretextSvg
            lines={lines}
            lineHeight={lineHeight}
            x={0}
            y={0}
            maxWidth={DESC_MAX_W}
            showRules
            animationStagger={25}
          />
        </svg>
      )}
      {elements.length > 0 && (
        <AtlasPlate
          elements={elements}
          caption={caption}
          captionColor={captionColor}
          propertyKey={propertyKey}
          sparklineValues={sparkline?.values}
          sparklineHighlight={sparkline?.highlightIndex}
        />
      )}
    </PageShell>
  );
}
