import { useLoaderData, Link } from 'react-router';
import type { CreditsData } from '../lib/types';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import { BLACK, DIM, BACK_LINK_STYLE, INSCRIPTION_STYLE, MOBILE_VIZ_BREAKPOINT } from '../lib/theme';
import { VT } from '../lib/transitions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';

const TEXT_WIDTH = 720;

export default function Credits() {
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const textWidth = isMobile ? 360 : TEXT_WIDTH;
  const { credits } = useLoaderData() as { credits: CreditsData };

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
        <svg width="100%" viewBox={`0 0 ${textWidth} ${structuredLines.length * structuredLH + structuredLH}`} style={{ display: 'block' }}>
          <PretextSvg lines={structuredLines} lineHeight={structuredLH} maxWidth={textWidth} showRules animationStagger={25} />
        </svg>
      </section>

      {/* Identifiers */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Identifiers</h2>
        <svg width="100%" viewBox={`0 0 ${textWidth} ${identifiersLines.length * identifiersLH + identifiersLH}`} style={{ display: 'block' }}>
          <PretextSvg lines={identifiersLines} lineHeight={identifiersLH} maxWidth={textWidth} showRules animationStagger={25} />
        </svg>
      </section>

      {/* Text Summaries */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Text Summaries</h2>
        <svg width="100%" viewBox={`0 0 ${textWidth} ${summariesNoteLines.length * summariesNoteLH + summariesNoteLH}`} style={{ display: 'block', marginBottom: '12px' }}>
          <PretextSvg lines={summariesNoteLines} lineHeight={summariesNoteLH} maxWidth={textWidth} showRules animationStagger={25} />
        </svg>
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
      </section>

      {/* Media */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Media</h2>
        <svg width="100%" viewBox={`0 0 ${textWidth} ${mediaLines.length * mediaLH + mediaLH}`} style={{ display: 'block' }}>
          <PretextSvg lines={mediaLines} lineHeight={mediaLH} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      {/* Software */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Software</h2>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.7 }}>
          {credits.software.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>{' '}
              — {s.license}
            </li>
          ))}
        </ul>
      </section>

      {/* About Atlas */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>About Atlas</h2>
        <svg width="100%" viewBox={`0 0 ${textWidth} ${aboutLines.length * aboutLH + aboutLH}`} style={{ display: 'block' }}>
          <PretextSvg lines={aboutLines} lineHeight={aboutLH} maxWidth={textWidth} showRules animationStagger={25} />
        </svg>
      </section>
      </div>
    </PageShell>
  );
}
