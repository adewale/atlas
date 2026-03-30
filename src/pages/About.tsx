import { Link } from 'react-router';
import { usePretextLines } from '../hooks/usePretextLines';
import PretextSvg from '../components/PretextSvg';

const SVG_MAX_WIDTH = 640;

const INTRO_TEXT =
  'Atlas is a structural exploration of the periodic table, drawing on the visual traditions of Oliver Byrne and the data-density principles of Edward Tufte. Every element is presented as a folio — a single, information-rich page where color is structural identity and the shape of the data is the data itself.';

const DATA_SOURCES_TEXT =
  'Numeric properties (mass, electronegativity, ionization energy, radius) come from PubChem (public domain). Identifiers and classification from Wikidata (CC0 1.0). Text summaries excerpted from Wikipedia under CC BY-SA 4.0. Full attribution on the credits page.';

const TECHNOLOGY_TEXT =
  'Built with React, Vite, and @chenglou/pretext for text measurement. Deployed on Cloudflare Pages. System fonts throughout. No images in v1.';

export default function About() {
  const { lines: introLines, lineHeight: introLH } = usePretextLines({
    text: INTRO_TEXT,
    maxWidth: SVG_MAX_WIDTH,
  });

  const { lines: dataLines, lineHeight: dataLH } = usePretextLines({
    text: DATA_SOURCES_TEXT,
    maxWidth: SVG_MAX_WIDTH,
  });

  const { lines: techLines, lineHeight: techLH } = usePretextLines({
    text: TECHNOLOGY_TEXT,
    maxWidth: SVG_MAX_WIDTH,
  });

  return (
    <article style={{ maxWidth: '640px' }}>
      <Link to="/" style={{ fontSize: '14px' }}>← Periodic Table</Link>
      <h1 style={{ margin: '16px 0 24px', letterSpacing: '0.15em' }}>About Atlas</h1>

      <div style={{ borderTop: '2px solid #0f0f0f', marginBottom: '16px' }} />

      <section style={{ marginBottom: '40px' }}>
        <svg
          width={SVG_MAX_WIDTH}
          height={introLines.length * introLH + introLH}
          aria-label="Introduction"
          role="img"
          style={{ maxWidth: '100%' }}
        >
          <PretextSvg lines={introLines} lineHeight={introLH} x={0} y={0} maxWidth={SVG_MAX_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Design Principles</h2>
        <ul style={{ paddingLeft: '1.2em', lineHeight: 1.7 }}>
          <li>60% Byrne visual drama, 40% Tufte data density</li>
          <li>Hard color fields — solid rects, no gradients</li>
          <li>Giant numerals and symbols as hero elements</li>
          <li>High data-ink ratio: property bars where length IS the value</li>
          <li>Block-color identity: you recognise the block before reading a word</li>
          <li>90% perfectly still, 10% explosive animation</li>
          <li>Zero border-radius. Sharp corners. Printed, not digital.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Data Sources</h2>
        <svg
          width={SVG_MAX_WIDTH}
          height={dataLines.length * dataLH + dataLH}
          aria-label="Data sources description"
          role="img"
          style={{ maxWidth: '100%' }}
        >
          <PretextSvg lines={dataLines} lineHeight={dataLH} x={0} y={0} maxWidth={SVG_MAX_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '0.05em' }}>Technology</h2>
        <svg
          width={SVG_MAX_WIDTH}
          height={techLines.length * techLH + techLH}
          aria-label="Technology description"
          role="img"
          style={{ maxWidth: '100%' }}
        >
          <PretextSvg lines={techLines} lineHeight={techLH} x={0} y={0} maxWidth={SVG_MAX_WIDTH} showRules animationStagger={25} />
        </svg>
      </section>
    </article>
  );
}
