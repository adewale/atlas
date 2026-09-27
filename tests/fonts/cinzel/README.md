# Cinzel (test copy)

Cinzel 700 and 900, latin and latin-ext subsets: the Google Fonts build as
published in `@fontsource/cinzel@5.3.0`, converted losslessly from WOFF to
TrueType (the WOFF tables, zlib-decompressed, in an sfnt container).
Licensed under the SIL Open Font License 1.1 (`OFL.txt`).

Tests use these instead of fonts.googleapis.com / fonts.gstatic.com:

- Playwright (`tests/e2e/fixtures.ts`) answers the Google Fonts requests from
  `index.html` with these files, so E2E runs never depend on the network.
- Vitest (`tests/setup.ts`) registers them with node-canvas, so unit-tier text
  measurement uses Cinzel's real metrics instead of a fallback font.

TrueType because node-canvas cannot use WOFF2, and with WOFF it measured every
Cinzel glyph as the same fallback box.
`tests/e2e/measurement-parity.spec.ts` checks node-canvas and Chromium agree.
