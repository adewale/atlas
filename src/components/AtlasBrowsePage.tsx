import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { BACK_LINK_STYLE, INSCRIPTION_STYLE } from '../lib/theme';
import { VT } from '../lib/transitions';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from './PretextSvg';
import AtlasPlate from './AtlasPlate';
import PageShell from './PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
  /** Optional margin note rendered in the right margin on desktop, inline disclosure on mobile. */
  marginNote?: ReactNode;
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
  marginNote,
}: AtlasBrowsePageProps) {
  useDocumentTitle(heading);

  const elements = symbols.map((s) => getElement(s)).filter(
    (e): e is ElementRecord => e != null,
  );

  const { lines, lineHeight } = usePretextLines({
    text: description ?? '',
    maxWidth: DESC_MAX_W,
  });

  return (
    <PageShell>
      <div style={marginNote ? { maxWidth: 760, position: 'relative' as const } : undefined}>
        {marginNote}
        <Link to={backLink.to} style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>{backLink.label}</Link>
        <h1
          style={{
            ...INSCRIPTION_STYLE,
            margin: '12px 0 16px',
            color,
            ...(viewTransitionName ? { viewTransitionName } : {}),
          } as React.CSSProperties}
        >
          {heading}
        </h1>
        <div style={{ borderTop: `4px solid ${color}`, marginBottom: '16px', viewTransitionName: VT.COLOR_RULE } as React.CSSProperties} />
        {description && (
          <svg
            width={DESC_MAX_W}
            height={lines.length * lineHeight + lineHeight}
            viewBox={`0 0 ${DESC_MAX_W} ${lines.length * lineHeight + lineHeight}`}
            style={{ maxWidth: '100%', height: 'auto', marginBottom: '24px' }}
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
      </div>
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
