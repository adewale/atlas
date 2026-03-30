Build a Vite + React + React Router web app called "Atlas" and deploy as a static site on Cloudflare Pages.

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
- /element/:symbol
- /atlas/group/:n
- /atlas/period/:n
- /atlas/block/:block
- /atlas/category/:slug
- /atlas/rank/:property
- /atlas/anomaly/:slug
- /compare/:symbolA/:symbolB
- /about
- /credits
- /design

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
- 60% Kronecker-Wallis/Byrne color drama, 40% Tufte data density
- palette: paper, black, deep blue, warm red, mustard yellow
- 90% quiet, 10% explosive
- giant numerals and symbols
- thin rules
- hard color fields
- narrow marginalia
- generous outer whitespace
- targeted dramatic animation at key moments, not everywhere

Pretext requirements:
Use Pretext on constrained summary blocks, marginal notes, relationship callouts, ranking captions, compare-band text, atlas plate captions, and print-like folio layout. Use shaped text (variable-width line breaking) to flow text around data plates. Use per-line geometry for inline sparklines, marginal annotations, and animated text reveals. The visual result should clearly show that text has been composed into space.

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
- Vite + React 19 + React Router 7
- TypeScript (strict mode)
- Static site build (no SSR, no server functions)
- Cloudflare Pages deployment (static assets, no Workers runtime needed)
- Route-level code splitting via React Router lazy()
- clean component architecture
- local generated datasets
- accessibility support (WCAG AA)
- responsive layout
- no unnecessary backend/database services in v1

Build order:
1. scaffold Vite + React + React Router app
2. build data generator
3. render periodic table
4. build one excellent folio template with shaped Pretext text
5. integrate Pretext across all views (sparklines, annotations, animation)
6. add atlas and compare views
7. add credits/about
8. polish animations and Byrne/Tufte integration
