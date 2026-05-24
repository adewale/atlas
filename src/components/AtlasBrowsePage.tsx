import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { getElement } from '../lib/data';
import type { ElementRecord } from '../lib/types';
import { BACK_LINK_STYLE, INSCRIPTION_STYLE, GREY_MID } from '../lib/theme';
import { VT } from '../lib/transitions';
import { usePretextLines } from '../hooks/usePretextLines';
import { useIsMobile } from '../hooks/useIsMobile';
import PretextSvg from './PretextSvg';
import AtlasPlate from './AtlasPlate';
import PageShell from './PageShell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const DESC_MAX_W = 600;
// On mobile, descriptions over this many lines are collapsed behind a "Read more" disclosure.
const MOBILE_COLLAPSE_LINES = 3;

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
  const isMobile = useIsMobile();

  const elements = symbols.map((s) => getElement(s)).filter(
    (e): e is ElementRecord => e != null,
  );

  const { lines, lineHeight } = usePretextLines({
    text: description ?? '',
    maxWidth: DESC_MAX_W,
  });

  const collapseOnMobile = isMobile && lines.length > MOBILE_COLLAPSE_LINES;
  const svgHeight = lines.length * lineHeight + lineHeight;

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
          collapseOnMobile ? (
            <details className="atlas-browse-description" style={{ marginBottom: '24px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: GREY_MID,
                  marginBottom: '8px',
                  listStyle: 'none',
                  padding: '4px 0',
                }}
              >
                Read more →
              </summary>
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 ${DESC_MAX_W} ${svgHeight}`}
                style={{ maxWidth: `${DESC_MAX_W}px`, height: 'auto' }}
                role="img"
                aria-label={description}
              >
                <PretextSvg
                  lines={lines}
                  lineHeight={lineHeight}
                  x={0}
                  y={0}
                  maxWidth={DESC_MAX_W}
                  animationStagger={25}
                />
              </svg>
            </details>
          ) : (
            <svg
              width="100%"
              height={svgHeight}
              viewBox={`0 0 ${DESC_MAX_W} ${svgHeight}`}
              style={{ maxWidth: `${DESC_MAX_W}px`, height: 'auto', marginBottom: '24px' }}
              role="img"
              aria-label={description}
            >
              <PretextSvg
                lines={lines}
                lineHeight={lineHeight}
                x={0}
                y={0}
                maxWidth={DESC_MAX_W}
                animationStagger={25}
              />
            </svg>
          )
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
