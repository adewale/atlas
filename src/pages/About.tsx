import { Link } from 'react-router';

export default function About() {
  return (
    <article style={{ maxWidth: '640px' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0 24px', letterSpacing: '0.15em' }}>About Atlas</h1>

      <div style={{ borderTop: '1px solid #0f0f0f', marginBottom: '24px' }} />

      <section style={{ marginBottom: '32px', lineHeight: 1.7 }}>
        <p>
          Atlas is a structural exploration of the periodic table, drawing on the visual
          traditions of Oliver Byrne and the data-density principles of Edward Tufte.
          Every element is presented as a folio — a single, information-rich page where
          color is structural identity and the shape of the data is the data itself.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Design Principles</h2>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.7 }}>
          <li>60% Byrne visual drama, 40% Tufte data density</li>
          <li>Hard color fields — solid rects, no gradients</li>
          <li>Giant numerals and symbols as hero elements</li>
          <li>High data-ink ratio: property bars where length IS the value</li>
          <li>Block-color identity: you recognise the block before reading a word</li>
          <li>90% perfectly still, 10% explosive animation</li>
          <li>Zero border-radius. Sharp corners. Printed, not digital.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Data Sources</h2>
        <p style={{ lineHeight: 1.7 }}>
          Numeric properties (mass, electronegativity, ionization energy, radius) come from{' '}
          <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">
            PubChem
          </a>{' '}
          (public domain). Identifiers and classification from{' '}
          <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">
            Wikidata
          </a>{' '}
          (CC0 1.0). Text summaries excerpted from{' '}
          <a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>{' '}
          under{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Full attribution on the{' '}
          <Link to="/credits">credits page</Link>.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Technology</h2>
        <p style={{ lineHeight: 1.7 }}>
          Built with React, Vite, and{' '}
          <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener noreferrer">
            @chenglou/pretext
          </a>{' '}
          for text measurement. Deployed on Cloudflare Pages. System fonts throughout.
          No images in v1.
        </p>
      </section>
    </article>
  );
}
