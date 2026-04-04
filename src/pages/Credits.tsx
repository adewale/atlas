import { useMemo } from 'react';
import { useLoaderData, Link } from 'react-router';
import type { CreditsData } from '../lib/types';
import { usePretextLines } from '../hooks/usePretextLines';
import { useFontsReady } from '../hooks/useFontsReady';
import { PRETEXT_SANS, measureLines, computeLineHeight } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import { BLACK, DEEP_BLUE, DIM, GREY_MID, BACK_LINK_STYLE, INSCRIPTION_STYLE, MOBILE_VIZ_BREAKPOINT, STROKE_HAIRLINE } from '../lib/theme';
import { VT } from '../lib/transitions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

const TEXT_WIDTH = 720;
const BODY_FONT = `16px ${PRETEXT_SANS}`;

export default function Credits() {
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const textWidth = isMobile ? 360 : TEXT_WIDTH;
  const { credits } = useLoaderData() as { credits: CreditsData };
  const fontsReady = useFontsReady();

  const structuredText = `${credits.structured.provider} — ${credits.structured.license}. Atomic mass, electronegativity, ionisation energy, radius, and phase data.`;
  const identifiersText = `${credits.identifiers.provider} — ${credits.identifiers.license}. QIDs (Wikidata identifiers), Wikipedia sitelinks, category classification, group/periods/block.`;
  const summariesNoteText = 'Excerpts may differ from current Wikipedia content. All used under CC BY-SA 4.0.';
  const aboutText = 'Atlas is an original editorial and design work. The derived data (rankings, groupings, anomaly descriptions) and comparison templates are original content.';
  const mediaText = 'No media in v1.';

  const { lines: structuredLines, lineHeight: structuredLH } = usePretextLines({
    text: structuredText,
    maxWidth: textWidth,
  });
  const { lines: identifiersLines, lineHeight: identifiersLH } = usePretextLines({
    text: identifiersText,
    maxWidth: textWidth,
  });
  const { lines: summariesNoteLines, lineHeight: summariesNoteLH } = usePretextLines({
    text: summariesNoteText,
    maxWidth: textWidth,
  });
  const { lines: aboutLines, lineHeight: aboutLH } = usePretextLines({
    text: aboutText,
    maxWidth: textWidth,
  });
  const { lines: mediaLines, lineHeight: mediaLH } = usePretextLines({
    text: mediaText,
    maxWidth: textWidth,
  });

  /* ---- Software list: measure each item, track name positions for links ---- */
  const softwareData = useMemo(() => {
    const lh = computeLineHeight(BODY_FONT);
    const allLines: Array<{ text: string; width: number; x: number; y: number }> = [];
    const links: Array<{ x: number; y: number; width: number; lineY: number; url: string; name: string }> = [];
    let yOffset = 0;
    const ITEM_GAP = 6;

    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const ctx = canvas?.getContext('2d') ?? null;
    if (ctx) ctx.font = BODY_FONT;

    credits.software.forEach((s, idx) => {
      const text = `• ${s.name} — ${s.license}`;
      const lines = measureLines(text, BODY_FONT, textWidth, lh);

      // Name always starts after "• " on line 0
      const bulletW = ctx ? ctx.measureText('• ').width : 0;
      const nameW = ctx ? ctx.measureText(s.name).width : 0;
      links.push({
        x: bulletW,
        y: yOffset,
        width: nameW,
        lineY: yOffset + lh,
        url: s.url,
        name: s.name,
      });

      lines.forEach((line) => {
        allLines.push({ ...line, y: line.y + yOffset });
      });
      yOffset += lines.length * lh;
      if (idx < credits.software.length - 1) yOffset += ITEM_GAP;
    });

    return { allLines, links, lineHeight: lh, totalHeight: yOffset };
  }, [credits.software, textWidth, fontsReady]);

  useDocumentTitle('Credits', 'Data sources and licensing — PubChem, Wikidata, and Wikipedia attributions for all element data in Atlas.');

  return (
    <PageShell>
      <div style={{ maxWidth: '800px' }}>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px' } as React.CSSProperties}>Credits</h1>

      <div style={{ borderTop: `2px solid ${BLACK}`, marginBottom: '24px' }} />

      {/* Structured Data */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Structured Data</h2>
        <svg viewBox={`0 0 ${textWidth} ${structuredLines.length * structuredLH + structuredLH}`} style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}>
          <PretextSvg lines={structuredLines} lineHeight={structuredLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      {/* Identifiers */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Identifiers</h2>
        <svg viewBox={`0 0 ${textWidth} ${identifiersLines.length * identifiersLH + identifiersLH}`} style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}>
          <PretextSvg lines={identifiersLines} lineHeight={identifiersLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      {/* Text Summaries */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Text Summaries</h2>
        <svg viewBox={`0 0 ${textWidth} ${summariesNoteLines.length * summariesNoteLH + summariesNoteLH}`} style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto', marginBottom: '12px' }}>
          <PretextSvg lines={summariesNoteLines} lineHeight={summariesNoteLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
        {isMobile ? (
          /* Stacked cards for mobile — each element gets its own card */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {credits.summaries.map((s) => (
              <div key={s.symbol} style={{ borderBottom: `1px solid ${DIM}`, paddingBottom: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  <Link to={`/elements/${s.symbol}`}>{s.symbol} — {s.name}</Link>
                </div>
                <div>
                  <span style={{ color: GREY_MID, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source: </span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                </div>
                <div>
                  <span style={{ color: GREY_MID, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fetched: </span>
                  <span className="mono">{s.accessDate}</span>
                </div>
                <div>
                  <span style={{ color: GREY_MID, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>License: </span>
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">{s.license}</a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop table */
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${BLACK}`, textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>Element</th>
                <th style={{ padding: '4px 8px' }}>Wikipedia Article</th>
                <th style={{ padding: '4px 8px' }}>Access Date</th>
                <th style={{ padding: '4px 8px' }}>License</th>
              </tr>
            </thead>
            <tbody>
              {credits.summaries.map((s) => (
                <tr key={s.symbol} style={{ borderBottom: `1px solid ${DIM}` }}>
                  <td style={{ padding: '4px 8px' }}>
                    <Link to={`/elements/${s.symbol}`}>
                      {s.symbol} — {s.name}
                    </Link>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </td>
                  <td style={{ padding: '4px 8px' }} className="mono">
                    {s.accessDate}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <a
                      href="https://creativecommons.org/licenses/by-sa/4.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.license}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Media */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Media</h2>
        <svg viewBox={`0 0 ${textWidth} ${mediaLines.length * mediaLH + mediaLH}`} style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}>
          <PretextSvg lines={mediaLines} lineHeight={mediaLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      {/* Software */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Software</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${softwareData.totalHeight + softwareData.lineHeight}`}
          aria-label="Software dependencies and licenses"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block' }}
        >
          {softwareData.allLines.map((line, i) => {
            const lineY = line.y + softwareData.lineHeight;
            const delay = i * 25;
            const animStyle = {
              opacity: 0 as const,
              transform: 'translateY(6px)',
              animation: `folio-line-reveal 300ms var(--ease-out) ${delay}ms forwards`,
            };

            // Find if this line's y position matches a link entry (first line of an item)
            const linkEntry = softwareData.links.find((l) => l.y === line.y);

            return (
              <g key={i}>
                {i > 0 && (
                  <line
                    x1={0}
                    y1={line.y}
                    x2={textWidth}
                    y2={line.y}
                    stroke={BLACK}
                    strokeWidth={STROKE_HAIRLINE}
                    opacity={0.2}
                    style={{
                      clipPath: 'inset(0 100% 0 0)',
                      animation: `rule-draw 400ms var(--ease-out) ${delay}ms forwards`,
                    }}
                  />
                )}
                <text
                  x={line.x}
                  y={lineY}
                  fontSize={16}
                  fill={BLACK}
                  fontFamily={PRETEXT_SANS}
                  style={animStyle}
                >
                  {linkEntry ? (
                    <>
                      {'• '}
                      <tspan fill={DEEP_BLUE}>{linkEntry.name}</tspan>
                      {line.text.slice(line.text.indexOf(linkEntry.name) + linkEntry.name.length)}
                    </>
                  ) : (
                    line.text
                  )}
                </text>
                {linkEntry && (
                  <>
                    <line
                      x1={linkEntry.x}
                      y1={lineY + 2}
                      x2={linkEntry.x + linkEntry.width}
                      y2={lineY + 2}
                      stroke={DEEP_BLUE}
                      strokeWidth={1}
                      style={animStyle}
                    />
                    <rect
                      x={linkEntry.x}
                      y={line.y}
                      width={linkEntry.width}
                      height={softwareData.lineHeight}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      role="link"
                      tabIndex={0}
                      aria-label={`${linkEntry.name} on GitHub`}
                      onClick={() => window.open(linkEntry.url, '_blank', 'noopener,noreferrer')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') window.open(linkEntry.url, '_blank', 'noopener,noreferrer');
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </section>

      {/* About Atlas */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>About Atlas</h2>
        <svg viewBox={`0 0 ${textWidth} ${aboutLines.length * aboutLH + aboutLH}`} style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}>
          <PretextSvg lines={aboutLines} lineHeight={aboutLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>
      </div>
    </PageShell>
  );
}
