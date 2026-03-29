Build a Next.js App Router web app called “Atlas” and target deployment to Cloudflare Workers using the OpenNext Cloudflare adapter.

Product:
Atlas is a machine-edited atlas of the periodic table built from Wikidata, Wikipedia, and Wikimedia Commons. It is not a conventional encyclopedia. It should teach relationships between elements through composition, comparison, ranking, and editorial layout.

Core rules:
- No original chemistry prose.
- Use Wikidata for structured facts.
- Use Wikipedia for short summaries/excerpts, article titles, and article URLs.
- Use Wikimedia Commons media only when visible credits and license metadata can be shown.
- Generate local JSON data at build time. Do not fetch all content live on each request.
- Use @chenglou/pretext for visible editorial layout work, not just hidden plumbing.
- Use SVG as the main rendering surface for folio, atlas, and compare views.

Required routes:
- /
- /element/[symbol]
- /atlas/group/[n]
- /atlas/period/[n]
- /atlas/block/[block]
- /atlas/category/[slug]
- /atlas/rank/[property]
- /atlas/anomaly/[slug]
- /compare/[symbolA]/[symbolB]
- /about
- /credits

Required features:
- full periodic table with 118 elements
- search by name and symbol
- keyboard navigation
- highlight modes for group, period, block, category, and one selected numeric property
- folio view for each element
- atlas views for sets
- compare view for two elements
- source strip on each folio distinguishing data, text, and media sources

Design language:
- Tufte-like density plus Byrne/Kronecker-Wallis color drama
- palette: paper, black, deep blue, warm red, mustard yellow
- 90% quiet, 10% explosive
- giant numerals and symbols
- thin rules
- hard color fields
- narrow marginalia
- generous outer whitespace
- minimal animation

Pretext requirements:
Use Pretext on constrained summary blocks, marginal notes, relationship callouts, ranking captions, compare-band text, atlas plate captions, and print-like folio layout. The visual result should clearly show that text has been composed into space.

Data generation:
Create a deterministic build-time script that fetches and normalizes data into generated JSON files:
- elements.json
- per-element JSON
- group/period/block/category/ranking/anomaly JSON
- text credits index
- image credits index

Schema:
Use a normalized element record with atomic number, symbol, name, wikidataId, wikipediaTitle, wikipediaUrl, period, group, block, category, optional phase/mass/electronegativity/ionization energy/radius, optional summary, optional image metadata, neighbors, and optional rankings.

Licensing UI:
Every folio must show:
- Data: Wikidata (CC0)
- Text: Wikipedia summary/excerpt with attribution context
- Media: Wikimedia Commons file-specific credit/license

Technical constraints:
- TypeScript
- clean component architecture
- route-level code splitting
- local generated datasets
- Cloudflare Workers deployment config
- accessibility support
- responsive layout
- no unnecessary backend/database services in v1

Build order:
1. scaffold app
2. build generator
3. render table
4. build one excellent folio template
5. integrate Pretext
6. add atlas and compare
7. add credits/about
8. polish
