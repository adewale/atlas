Implementation Spec: Atlas v1
==============================
Resolves ambiguities in atlas.spec for a correct, buildable implementation.

1. Pretext (@chenglou/pretext)
------------------------------
Library: https://github.com/chenglou/pretext
Package: @chenglou/pretext (npm, version ≥0.0.3)
What it is: A text measurement and layout engine. It does NOT export React
components. Its API is prepare() → layout()/layoutWithLines().

Usage in Atlas:
- SVG text composition: Use prepare() + layoutWithLines() to measure and
  line-break text, then render resulting lines as positioned <text> elements
  in SVG folios, atlas plates, and compare views. This gives editorial control
  over line breaks and text placement.
- HTML text measurement: Use prepare() + layout() to pre-calculate paragraph
  heights for marginalia and captions, preventing layout shift.
- The visual result must clearly show that text has been composed into space —
  not just dropped in with CSS overflow.

Do NOT vendor a fake React wrapper. Install the real package from npm.

2. Data Strategy
----------------
Approach: Fully static seed dataset, committed to the repo.

Seed generation (one-time script, run manually, results committed):
- Script: scripts/generate-seed.ts
- Sources, merged with priority:
  1. PubChem — primary source for numeric accuracy (atomic mass,
     electronegativity, ionization energy, atomic radius, phase at STP)
  2. Wikidata — identifiers (QID), categories, group/period/block,
     Wikipedia page titles, Wikimedia Commons links
  3. Wikipedia REST API — short summary extract per element (1-2 paragraphs)
- Output: data/seed/elements.json (single file, all 118 elements, real values)
- The seed file is committed and is the source of truth.

Build-time derivation (runs on every build via `npm run build:data`):
- Script: scripts/derive-data.ts
- Input: data/seed/elements.json
- Output (all committed to data/generated/):
  - elements.json (full array)
  - element-{Symbol}.json (per-element)
  - groups.json, periods.json, blocks.json, categories.json
  - rankings.json (sorted arrays for mass, electronegativity, ionization energy, radius)
  - anomalies.json
  - text-credits.json (Wikipedia attribution index)
  - image-credits.json (placeholder — no images in v1)

Generated files ARE committed to the repo so the app works after clone.

3. Element Schema
-----------------
```typescript
type ElementRecord = {
  atomicNumber: number;
  symbol: string;
  name: string;
  wikidataId: string;           // e.g., "Q556" for Hydrogen
  wikipediaTitle: string;
  wikipediaUrl: string;
  period: number;               // 1–7
  group: number | null;         // 1–18, null for lanthanides/actinides
  block: 's' | 'p' | 'd' | 'f';
  category: string;             // e.g., "alkali metal", "noble gas"
  phase: string;                // "solid", "liquid", "gas" at STP
  mass: number;                 // atomic mass in Da (real values from PubChem)
  electronegativity: number | null; // Pauling scale
  ionizationEnergy: number | null;  // first ionization, eV
  radius: number | null;        // atomic radius, pm
  summary: string;              // Wikipedia extract, 1-2 paragraphs
  neighbors: string[];          // adjacent elements by atomic number
  rankings: Record<string, number>; // rank position for each numeric property
};
```

All numeric values must be real scientific data. No formulas or fabrication.

4. Periodic Table (Home Page)
-----------------------------
Layout: Standard IUPAC 18-column grid.
- 7 main rows (periods 1–7)
- 2 separated rows below for lanthanides (Z=57–71) and actinides (Z=89–103)
- Gap between period 7 and the f-block rows
- Empty cells where no element exists (e.g., row 1 cols 2–17)

Rendering: SVG with fixed cell positions.
Cell content: atomic number (small), symbol (large, bold), name (small).
Default fill: paper (#f7f2e8) with black (#0f0f0f) stroke.

Highlight modes (select dropdown):
- None: default paper fill
- Group: alternating deep blue (#133e7c) / mustard (#c59b1a)
- Period: alternating warm red (#9e1c2c) / deep blue (#133e7c)
- Block: s=#133e7c, p=#c59b1a, d=#9e1c2c, f=#2e2e2e
- Category: metal-containing=#133e7c, nonmetal/noble gas=#9e1c2c, metalloid=#c59b1a
- Numeric property: continuous color scale from paper to deep blue, proportional
  to selected property (mass | electronegativity | ionizationEnergy)

Search: text input filters visible elements by name or symbol. Non-matching
cells dim to #ece7db.

Keyboard navigation: Spatial grid movement.
- Arrow keys move focus in the visual grid (up/down/left/right)
- Skip empty cells (jump to next occupied cell in that direction)
- Enter/Space navigates to /element/[symbol]
- Tab/Shift+Tab for sequential focus order (accessibility)
- Visible focus ring: 2px warm red (#9e1c2c) stroke

5. Element Folio (/element/[symbol])
------------------------------------
Two-column layout: main content (left) + marginalia panel (right).

Main content:
- Giant atomic number (3-digit zero-padded, e.g., "001")
- Giant symbol
- Element name as heading
- Thin rule
- Summary text composed with Pretext into SVG (measured line breaks,
  positioned <text> elements, not CSS-wrapped)
- SVG data plate showing group, period, block with color fields

Marginalia (right panel):
- Category
- Key numeric properties with values
- Neighbor elements (links)
- Thin rule
- Source strip:
  * Data: "Wikidata (CC0)" with link
  * Text: Wikipedia article title with link + "(Wikipedia excerpt, CC BY-SA)"
  * Media: "No media in v1" (placeholder)
- Compare link (to /compare/[symbol]/O or nearest neighbor)

Use Pretext for all text blocks in the folio: summary, marginalia notes,
source strip text. Text should be visibly composed into measured space.

6. Atlas Plates (/atlas/*)
--------------------------
Rendering: SVG card grid. Each element in the set rendered as a mini
folio-style card showing symbol, atomic number, and one key property.
Cards arranged in meaningful order (by group number, period number,
atomic number within category, or ranked by property value).

Caption text composed with Pretext.

Routes:
- /atlas/group/[n] — elements in group n
- /atlas/period/[n] — elements in period n
- /atlas/block/[block] — elements in block (s/p/d/f)
- /atlas/category/[slug] — elements in category
- /atlas/rank/[property] — all 118 elements sorted by property
- /atlas/anomaly/[slug] — curated anomaly sets

7. Anomalies
-------------
Launch set:
- synthetic-heavy: superheavy elements (Z > 103)
- f-block-gap: f-block discontinuity on the main grid
- diagonal-relationships: Li/Mg, Be/Al, B/Si diagonal pairs
- electron-config-anomalies: Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au
  (elements with unexpected electron configurations)
- metalloid-boundary: elements on the metal/nonmetal border (B, Si, Ge, As, Sb, Te)

Each anomaly has: slug, label, description, element list.

8. Compare View (/compare/[symbolA]/[symbolB])
-----------------------------------------------
Split-screen dramatic layout:
- Bold vertical split in SVG: left half deep blue, right half warm red
- Each side shows element symbol (giant), name, atomic number
- Below the split: horizontal comparison bands for each shared numeric
  property (mass, electronegativity, ionization energy, radius)
  showing both values on the same scale with visual bars
- Category and block context
- Relationship notes composed with Pretext (e.g., "Both are period 4
  transition metals" or "Category transition: alkali metal → noble gas")

9. Design Language
------------------
Balance: 60% Kronecker-Wallis visual drama, 40% Tufte data density.

Palette:
- Paper: #f7f2e8
- Black: #0f0f0f
- Deep blue: #133e7c
- Warm red: #9e1c2c
- Mustard yellow: #c59b1a

Visual rules:
- Giant numerals and symbols (hero elements)
- Hard color fields (solid SVG rects, no gradients)
- Thin rules (1px #0f0f0f dividers)
- Narrow marginalia column
- Generous outer whitespace (page margins)
- Minimal animation (transitions on highlight mode changes only)
- Bold geometric color blocks in atlas plates and compare views
- High data-ink ratio in data tables and property displays
- Body text: system sans-serif, 16px base
- Monospace for numeric values and atomic data

10. Images
----------
No images in v1. Schema supports optional image metadata but all image
fields are null/empty. Source strip says "No media in v1."
Image support is a v2 feature.

11. Accessibility (WCAG AA)
---------------------------
- All SVG elements have appropriate ARIA roles and labels
- SVG periodic table: role="img" with aria-label, individual cells
  are focusable with aria-label="[Name], atomic number [N], [category]"
- Keyboard navigation: full spatial grid nav (see section 4)
- Focus indicators: visible 2px warm red ring on all interactive elements
- Color contrast: all text meets AA ratio (4.5:1 normal, 3:1 large)
  — verify highlight mode colors against text
- Skip link to main content
- Search input has visible label (can be sr-only)
- Semantic HTML: proper heading hierarchy, landmarks, lists
- Screen reader text for SVG data visualizations in compare/atlas views

12. Technical Stack
-------------------
- Next.js 15 with App Router
- TypeScript (strict mode)
- @chenglou/pretext from npm (NOT vendored)
- Cloudflare Workers via @opennextjs/cloudflare
- No additional UI libraries
- No database or KV
- Route-level code splitting (automatic with App Router)
- 'use client' only where needed (PeriodicTable search/keyboard state)

13. Testing
-----------
Framework: Vitest + React Testing Library + Playwright

Unit tests (Vitest):
- Data layer: getElement(), searchElements() return correct results
- Seed data validation: 118 elements, no null required fields, real values
  (e.g., Hydrogen mass ≈ 1.008, not 2.01)
- Derivation: groups.json has correct element membership
  (e.g., Lu is NOT in group 17)
- Rankings are correctly sorted

Component tests (Vitest + React Testing Library):
- PeriodicTable renders 118 cells
- Search filters correctly
- Highlight modes change fill colors
- Folio renders element data

Integration tests (Playwright):
- Home page loads, periodic table is visible
- Click element → navigates to folio
- Keyboard navigation: arrow keys move focus spatially
- Search filters table
- Compare view renders both elements
- All routes return 200

14. Build & Scripts
-------------------
package.json scripts:
- "dev": "next dev"
- "build:data": "tsx scripts/derive-data.ts"
- "build:seed": "tsx scripts/generate-seed.ts"  (one-time, manual)
- "build": "npm run build:data && next build"
- "start": "next start"
- "test": "vitest run"
- "test:e2e": "playwright test"
- "typecheck": "tsc --noEmit"
- "lint": "next lint"

15. File Structure
------------------
atlas/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                        # home — periodic table
│   ├── element/[symbol]/page.tsx       # folio
│   ├── atlas/
│   │   ├── group/[n]/page.tsx
│   │   ├── period/[n]/page.tsx
│   │   ├── block/[block]/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   ├── rank/[property]/page.tsx
│   │   └── anomaly/[slug]/page.tsx
│   ├── compare/[symbolA]/[symbolB]/page.tsx
│   ├── about/page.tsx
│   └── credits/page.tsx
├── components/
│   ├── PeriodicTable.tsx               # 'use client' — search, keyboard, highlights
│   ├── Folio.tsx
│   ├── AtlasPlate.tsx
│   ├── CompareView.tsx
│   └── PretextBlock.tsx                # helper: uses pretext to measure + render SVG text
├── lib/
│   ├── data.ts                         # getElement, searchElements, allElements
│   ├── types.ts                        # ElementRecord and related types
│   ├── pretext.ts                      # thin wrapper around prepare/layout for SSR/client
│   └── grid.ts                         # periodic table cell position calculations
├── data/
│   ├── seed/
│   │   └── elements.json               # curated real data (committed)
│   └── generated/                      # derived files (committed)
│       ├── elements.json
│       ├── element-*.json
│       ├── groups.json
│       ├── periods.json
│       ├── blocks.json
│       ├── categories.json
│       ├── rankings.json
│       ├── anomalies.json
│       ├── text-credits.json
│       └── image-credits.json
├── scripts/
│   ├── generate-seed.ts                # one-time: PubChem + Wikidata + Wikipedia → seed
│   └── derive-data.ts                  # build-time: seed → generated files
├── tests/
│   ├── data.test.ts
│   ├── components/
│   │   ├── PeriodicTable.test.tsx
│   │   └── Folio.test.tsx
│   └── e2e/
│       └── navigation.spec.ts
├── next.config.ts
├── open-next.config.ts
├── wrangler.toml
├── tsconfig.json
├── package.json
├── atlas.spec                          # product spec
└── atlas.impl.spec                     # this file
