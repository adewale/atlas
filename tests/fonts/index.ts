import { join } from 'path';

/**
 * The web fonts the app loads from Google Fonts (index.html:
 * `family=Cinzel:wght@700;900`), served from committed files in tests.
 * See tests/fonts/cinzel/README.md.
 */
export const FONT_DIR = join(import.meta.dirname ?? __dirname, 'cinzel');

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const CINZEL_FACES = [700, 900].flatMap((weight) => [
  { family: 'Cinzel', weight, file: `cinzel-latin-ext-${weight}-normal.ttf`, unicodeRange: LATIN_EXT },
  { family: 'Cinzel', weight, file: `cinzel-latin-${weight}-normal.ttf`, unicodeRange: LATIN },
]);

/** The stylesheet fonts.googleapis.com would return, pointing at `baseUrl/<file>`. */
export function cinzelStylesheet(baseUrl: string): string {
  return CINZEL_FACES.map((f) => `@font-face {
  font-family: '${f.family}';
  font-style: normal;
  font-weight: ${f.weight};
  font-display: swap;
  src: url(${baseUrl}/${f.file}) format('truetype');
  unicode-range: ${f.unicodeRange};
}`).join('\n');
}

/**
 * Register the latin Cinzel faces with node-canvas (tests/setup.ts and
 * tests/e2e/measurement-parity.spec.ts). The latin-ext files cover other
 * code points; registering both under one family/weight would make
 * node-canvas pick one arbitrarily.
 */
export function registerCinzelWithNodeCanvas(
  registerFont: (path: string, face: { family: string; weight: string }) => void,
): void {
  for (const face of CINZEL_FACES.filter((f) => !f.file.includes('-latin-ext-'))) {
    registerFont(join(FONT_DIR, face.file), { family: face.family, weight: String(face.weight) });
  }
}
