import { useLoaderData, Link } from 'react-router';
import type { CreditsData } from '../lib/types';

export default function Credits() {
  const { credits } = useLoaderData() as { credits: CreditsData };

  return (
    <article style={{ maxWidth: '800px' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0 24px', letterSpacing: '0.15em' }}>Credits</h1>

      {/* Structured Data */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Structured Data</h2>
        <p style={{ lineHeight: 1.6 }}>
          <a href={credits.structured.url} target="_blank" rel="noopener noreferrer">
            {credits.structured.provider}
          </a>{' '}
          — {credits.structured.license}. Atomic mass, electronegativity, ionization energy,
          radius, and phase data.
        </p>
      </section>

      {/* Identifiers */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Identifiers</h2>
        <p style={{ lineHeight: 1.6 }}>
          <a href={credits.identifiers.url} target="_blank" rel="noopener noreferrer">
            {credits.identifiers.provider}
          </a>{' '}
          — {credits.identifiers.license}. QIDs, Wikipedia sitelinks, category classification,
          group/period/block.
        </p>
      </section>

      {/* Text Summaries */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Text Summaries</h2>
        <p style={{ lineHeight: 1.6, marginBottom: '12px' }}>
          Excerpts may differ from current Wikipedia content. All used under{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
          .
        </p>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #0f0f0f', textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Element</th>
              <th style={{ padding: '4px 8px' }}>Wikipedia Article</th>
              <th style={{ padding: '4px 8px' }}>Access Date</th>
              <th style={{ padding: '4px 8px' }}>License</th>
            </tr>
          </thead>
          <tbody>
            {credits.summaries.map((s) => (
              <tr key={s.symbol} style={{ borderBottom: '1px solid #ece7db' }}>
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
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Media</h2>
        <p style={{ lineHeight: 1.6 }}>No media in v1.</p>
      </section>

      {/* Software */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Software</h2>
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
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>About Atlas</h2>
        <p style={{ lineHeight: 1.6 }}>
          Atlas is an original editorial and design work. The derived data (rankings,
          groupings, anomaly descriptions) and comparison templates are original content.
        </p>
      </section>
    </article>
  );
}
