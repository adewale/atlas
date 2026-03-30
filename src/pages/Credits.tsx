import { useLoaderData, Link } from 'react-router';
import type { CreditsData } from '../lib/types';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';
import SiteNav from '../components/SiteNav';
import { BLACK, DIM, BACK_LINK_STYLE } from '../lib/theme';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TEXT_WIDTH = 720;

export default function Credits() {
  const { credits } = useLoaderData() as { credits: CreditsData };

  const structuredText = `${credits.structured.provider} — ${credits.structured.license}. Atomic mass, electronegativity, ionisation energy, radius, and phase data.`;
  const identifiersText = `${credits.identifiers.provider} — ${credits.identifiers.license}. QIDs (Wikidata identifiers), Wikipedia sitelinks, category classification, group/period/block.`;
  const summariesNoteText = 'Excerpts may differ from current Wikipedia content. All used under CC BY-SA 4.0.';
  const aboutText = 'Atlas is an original editorial and design work. The derived data (rankings, groupings, anomaly descriptions) and comparison templates are original content.';
  const mediaText = 'No media in v1.';

  const { lines: structuredLines, lineHeight: structuredLH } = usePretextLines({
    text: structuredText,
    maxWidth: TEXT_WIDTH,
  });
  const { lines: identifiersLines, lineHeight: identifiersLH } = usePretextLines({
    text: identifiersText,
    maxWidth: TEXT_WIDTH,
  });
  const { lines: summariesNoteLines, lineHeight: summariesNoteLH } = usePretextLines({
    text: summariesNoteText,
    maxWidth: TEXT_WIDTH,
  });
  const { lines: aboutLines, lineHeight: aboutLH } = usePretextLines({
    text: aboutText,
    maxWidth: TEXT_WIDTH,
  });
  const { lines: mediaLines, lineHeight: mediaLH } = usePretextLines({
    text: mediaText,
    maxWidth: TEXT_WIDTH,
  });

  return (
    <main>
      <div style={{ maxWidth: '800px' }}>
      <Link to="/" style={BACK_LINK_STYLE}>← Table</Link>
      <h1 style={{ margin: '12px 0 16px', letterSpacing: '0.2em', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Credits</h1>

      <div style={{ borderTop: `2px solid ${BLACK}`, marginBottom: '24px' }} />

      {/* Structured Data */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Structured Data</h2>
        <svg width={TEXT_WIDTH} height={structuredLines.length * structuredLH + structuredLH} style={{ maxWidth: '100%' }}>
          <PretextSvg lines={structuredLines} lineHeight={structuredLH} maxWidth={TEXT_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>

      {/* Identifiers */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Identifiers</h2>
        <svg width={TEXT_WIDTH} height={identifiersLines.length * identifiersLH + identifiersLH} style={{ maxWidth: '100%' }}>
          <PretextSvg lines={identifiersLines} lineHeight={identifiersLH} maxWidth={TEXT_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>

      {/* Text Summaries */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Text Summaries</h2>
        <svg width={TEXT_WIDTH} height={summariesNoteLines.length * summariesNoteLH + summariesNoteLH} style={{ maxWidth: '100%', marginBottom: '12px' }}>
          <PretextSvg lines={summariesNoteLines} lineHeight={summariesNoteLH} maxWidth={TEXT_WIDTH} showRules animationStagger={25} />
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
                  <Link to={`/element/${s.symbol}`}>
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
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Media</h2>
        <svg width={TEXT_WIDTH} height={mediaLines.length * mediaLH + mediaLH} style={{ maxWidth: '100%' }}>
          <PretextSvg lines={mediaLines} lineHeight={mediaLH} maxWidth={TEXT_WIDTH} animationStagger={25} />
        </svg>
      </section>

      {/* Software */}
      <section style={{ marginBottom: '32px' }}>
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
        <svg width={TEXT_WIDTH} height={aboutLines.length * aboutLH + aboutLH} style={{ maxWidth: '100%' }}>
          <PretextSvg lines={aboutLines} lineHeight={aboutLH} maxWidth={TEXT_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>
      </div>
      <SiteNav />
    </main>
  );
}
