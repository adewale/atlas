import { useMemo } from 'react';
import { Link } from 'react-router';
import { usePretextLines, useDropCapText } from '../hooks/usePretextLines';
import { useFontsReady } from '../hooks/useFontsReady';
import { DROP_CAP_FONT, PRETEXT_SANS, measureLines, computeLineHeight } from '../lib/pretext';
import PretextSvg from '../components/PretextSvg';
import PageShell from '../components/PageShell';
import { BLACK, DEEP_BLUE, BACK_LINK_STYLE, INSCRIPTION_STYLE, SECTION_HEADING_STYLE, MOBILE_VIZ_BREAKPOINT, STROKE_HAIRLINE } from '../lib/theme';
import { VT } from '../lib/transitions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIsMobile } from '../hooks/useIsMobile';
import { useViewTransitionNavigate } from '../hooks/useViewTransition';

const SVG_MAX_WIDTH = 640;
const BODY_FONT = `16px ${PRETEXT_SANS}`;
const LINK_TEXT = 'Design Language';

const INTRO_TEXT =
  'Atlas is a structural exploration of the periodic table, drawing on the visual traditions of Oliver Byrne and the data-density principles of Edward Tufte. Every element is presented as a folio — a single, information-rich page where colour is structural identity and the shape of the data is the data itself.';

const DATA_SOURCES_TEXT =
  'Numeric properties (mass, electronegativity, ionisation energy, radius) come from PubChem (public domain). Identifiers and classification from Wikidata (CC0 1.0). Text summaries excerpted from Wikipedia under CC BY-SA 4.0. Full attribution on the credits page.';

const STANDING_ON_SHOULDERS_TEXT =
  'Atlas would not exist without PubChem, Wikidata, and Wikipedia. These open data projects represent decades of painstaking work by scientists, editors, and volunteers worldwide. What Atlas adds is a layer of cross-linked navigation, visual encoding, and computed relationships that make the periodic table explorable as a connected graph rather than a flat table. Every element connects to its group, period, block, category, discoverer, era, etymology, neighbours, anomalies, and rankings — thirteen relationship types, all surfaced as navigable links. But the data beneath it all comes from the community. We are grateful.';

const TECHNOLOGY_TEXT =
  'Built with React, Vite, and @chenglou/pretext for text measurement. Deployed on Cloudflare Pages. System fonts throughout. No images in v1.';

const DESIGN_PRINCIPLES = [
  '60% Byrne visual drama, 40% Tufte data density',
  'Hard colour fields — solid rects, no gradients',
  'Giant numerals and symbols as hero elements',
  'High data-ink ratio: property bars where length IS the value',
  'Block-colour identity: you recognise the block before reading a word',
  '90% perfectly still, 10% explosive animation',
  'Zero border-radius. Sharp corners. Printed, not digital.',
];

const DESIGN_LANG_TEXT =
  'Atlas follows a strict visual system: hard colour fields, sharp corners, giant numerals, and high data-ink ratio. See the full Design Language reference for palette, spacing, typography, and animation details.';

export default function About() {
  const isMobile = useIsMobile(MOBILE_VIZ_BREAKPOINT);
  const textWidth = isMobile ? 360 : SVG_MAX_WIDTH;
  const fontsReady = useFontsReady();
  const transitionNavigate = useViewTransitionNavigate();

  useDocumentTitle('About', 'About Atlas — a structural exploration of the periodic table inspired by Oliver Byrne and Edward Tufte. Built with React, Vite, and open data from PubChem, Wikidata, and Wikipedia.');

  const { dropCap: introDC, lines: introLines, lineHeight: introLH } = useDropCapText({
    text: INTRO_TEXT,
    maxWidth: textWidth,
    dropCapFont: `72px ${DROP_CAP_FONT}`,
  });

  const { lines: dataLines, lineHeight: dataLH } = usePretextLines({
    text: DATA_SOURCES_TEXT,
    maxWidth: textWidth,
  });

  const { lines: techLines, lineHeight: techLH } = usePretextLines({
    text: TECHNOLOGY_TEXT,
    maxWidth: textWidth,
  });

  const { lines: shoulderLines, lineHeight: shoulderLH } = usePretextLines({
    text: STANDING_ON_SHOULDERS_TEXT,
    maxWidth: textWidth,
  });

  /* ---- Bullet list: measure each item as a separate mini-paragraph ---- */
  const bulletData = useMemo(() => {
    const lh = computeLineHeight(BODY_FONT);
    const allLines: Array<{ text: string; width: number; x: number; y: number }> = [];
    let yOffset = 0;
    const ITEM_GAP = 6;

    DESIGN_PRINCIPLES.forEach((item, idx) => {
      const lines = measureLines(`• ${item}`, BODY_FONT, textWidth, lh);
      lines.forEach((line) => {
        allLines.push({ ...line, y: line.y + yOffset });
      });
      yOffset += lines.length * lh;
      if (idx < DESIGN_PRINCIPLES.length - 1) yOffset += ITEM_GAP;
    });

    return { lines: allLines, lineHeight: lh, totalHeight: yOffset };
  }, [textWidth, fontsReady]);

  /* ---- Design Language paragraph with inline link ---- */
  const { lines: designLines, lineHeight: designLH } = usePretextLines({
    text: DESIGN_LANG_TEXT,
    maxWidth: textWidth,
  });

  const linkMetrics = useMemo(() => {
    const lineIdx = designLines.findIndex((l) => l.text.includes(LINK_TEXT));
    if (lineIdx === -1 || typeof document === 'undefined') return null;
    const line = designLines[lineIdx];
    const before = line.text.split(LINK_TEXT)[0];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = BODY_FONT;
    return {
      lineIdx,
      x: line.x + ctx.measureText(before).width,
      y: line.y,
      width: ctx.measureText(LINK_TEXT).width,
    };
  }, [designLines, fontsReady]);

  const handleDesignLinkClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    transitionNavigate('/about/design');
  };

  return (
    <PageShell>
      <div style={{ maxWidth: '640px' }}>
      <Link to="/" style={{ ...BACK_LINK_STYLE, viewTransitionName: VT.NAV_BACK } as React.CSSProperties}>← Table</Link>
      <h1 style={{ ...INSCRIPTION_STYLE, margin: '12px 0 16px' }}>About Atlas</h1>

      <div style={{ borderTop: `2px solid ${BLACK}`, marginBottom: '16px' }} />

      <section style={{ marginBottom: '40px' }}>
        <svg
          viewBox={`0 0 ${textWidth} ${introLines.length * introLH + introLH}`}
          aria-label="Introduction"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          <PretextSvg lines={introLines} lineHeight={introLH} x={0} y={0} maxWidth={textWidth} animationStagger={25} dropCap={{ fontSize: 72, fill: DEEP_BLUE, char: introDC.char }} />
        </svg>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ ...SECTION_HEADING_STYLE, marginBottom: '12px' }}>Design Principles</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${bulletData.totalHeight + bulletData.lineHeight}`}
          aria-label="Design principles"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          <PretextSvg lines={bulletData.lines} lineHeight={bulletData.lineHeight} x={0} y={0} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ ...SECTION_HEADING_STYLE, marginBottom: '12px' }}>Data Sources</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${dataLines.length * dataLH + dataLH}`}
          aria-label="Data sources description"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          <PretextSvg lines={dataLines} lineHeight={dataLH} x={0} y={0} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ ...SECTION_HEADING_STYLE, marginBottom: '12px' }}>Technology</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${techLines.length * techLH + techLH}`}
          aria-label="Technology description"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          <PretextSvg lines={techLines} lineHeight={techLH} x={0} y={0} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ ...SECTION_HEADING_STYLE, marginBottom: '12px' }}>Standing on Shoulders</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${shoulderLines.length * shoulderLH + shoulderLH}`}
          aria-label="Standing on shoulders — acknowledgement of data sources"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          <PretextSvg lines={shoulderLines} lineHeight={shoulderLH} x={0} y={0} maxWidth={textWidth} animationStagger={25} />
        </svg>
      </section>

      <section>
        <h2 style={{ ...SECTION_HEADING_STYLE, marginBottom: '12px' }}>Design Language</h2>
        <svg
          viewBox={`0 0 ${textWidth} ${designLines.length * designLH + designLH}`}
          aria-label="Design language description"
          role="img"
          style={{ width: '100%', maxWidth: textWidth, display: 'block', height: 'auto' }}
        >
          {designLines.map((line, i) => {
            const lineY = line.y + designLH;
            const delay = i * 25;
            const animStyle = {
              opacity: 0 as const,
              transform: 'translateY(6px)',
              animation: `folio-line-reveal 300ms var(--ease-out) ${delay}ms forwards`,
            };
            const linkIdx = line.text.indexOf(LINK_TEXT);

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
                  {linkIdx >= 0 ? (
                    <>
                      {line.text.slice(0, linkIdx)}
                      <tspan fill={DEEP_BLUE}>{LINK_TEXT}</tspan>
                      {line.text.slice(linkIdx + LINK_TEXT.length)}
                    </>
                  ) : (
                    line.text
                  )}
                </text>
                {linkIdx >= 0 && linkMetrics && (
                  <>
                    <line
                      x1={linkMetrics.x}
                      y1={lineY + 2}
                      x2={linkMetrics.x + linkMetrics.width}
                      y2={lineY + 2}
                      stroke={DEEP_BLUE}
                      strokeWidth={1}
                      style={animStyle}
                    />
                    <rect
                      x={linkMetrics.x}
                      y={line.y}
                      width={linkMetrics.width}
                      height={designLH}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      role="link"
                      tabIndex={0}
                      aria-label="Design Language reference page"
                      onClick={handleDesignLinkClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDesignLinkClick(e);
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </section>
      </div>
    </PageShell>
  );
}
