# Atlas

Atlas is a Next.js App Router web app targeting Cloudflare Workers through OpenNext Cloudflare adapter configuration.

## Scripts

- `npm run build:data` generates deterministic local JSON datasets under `data/generated`.
- `npm run build` runs data generation and Next.js production build.
- `npm run dev` starts local dev mode.

## Data sources

- Structured data baseline is normalized for all 118 elements and prepared for Wikidata enrichment.
- Text summaries are sourced from Wikipedia summary endpoint when `ATLAS_REMOTE=1` during generation.
- Media credits map to Wikimedia Commons source pages.

## Deploy

1. Build OpenNext output (after installing OpenNext Cloudflare adapter).
2. Publish with Wrangler using `wrangler.toml`.
