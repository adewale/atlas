/**
 * Build-time derivation script.
 * Reads data/seed/elements.json (committed) and produces all generated files.
 * Run: npm run build:data
 * Deterministic: same input always produces same output.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type SeedElement = {
  atomicNumber: number;
  symbol: string;
  name: string;
  wikidataId: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  period: number;
  group: number | null;
  block: string;
  category: string;
  phase: string;
  mass: number;
  electronegativity: number | null;
  ionizationEnergy: number | null;
  radius: number | null;
  discoveryYear: number | null;
  discoverer: string;
  etymologyOrigin: string;
  etymologyDescription: string;
  summary: string;
  neighbors: string[];
  rankings: Record<string, number>;
  sources?: Record<string, unknown>;
};

const seedPath = join(process.cwd(), 'data', 'seed', 'elements.json');
const outDir = join(process.cwd(), 'data', 'generated');

function readSeed(): SeedElement[] {
  const raw = readFileSync(seedPath, 'utf-8');
  return JSON.parse(raw);
}

function computeRankings(elements: SeedElement[]): void {
  const properties = ['mass', 'electronegativity', 'ionizationEnergy', 'radius'] as const;

  for (const prop of properties) {
    const sorted = [...elements]
      .filter((e) => e[prop] != null && e[prop] !== 0)
      .sort((a, b) => ((b[prop] as number) ?? 0) - ((a[prop] as number) ?? 0));

    sorted.forEach((el, idx) => {
      el.rankings[prop] = idx + 1;
    });

    // Elements without values get rank 0 (unranked)
    for (const el of elements) {
      if (!(prop in el.rankings)) {
        el.rankings[prop] = 0;
      }
    }
  }
}

// --- Anomaly definitions (authored editorial content) ---

const ANOMALIES = [
  {
    slug: 'synthetic-heavy',
    label: 'Synthetic superheavy elements',
    description:
      'Elements beyond lawrencium (Z > 103) exist only as synthetic isotopes with half-lives measured in milliseconds to seconds. Their chemical properties are predicted by extrapolation from lighter homologues but remain largely unverified experimentally.',
    filter: (el: SeedElement) => el.atomicNumber > 103,
  },
  {
    slug: 'f-block-gap',
    label: 'f-block discontinuity',
    description:
      'The lanthanides (Z 57–71) and actinides (Z 89–103) are separated from the main periodic table grid because they fill f-orbitals. This creates a visual gap that obscures their relationship to the d-block elements they sit between.',
    filter: (el: SeedElement) => el.block === 'f',
  },
  {
    slug: 'diagonal-relationships',
    label: 'Diagonal relationships',
    description:
      'Certain pairs of elements positioned diagonally on the periodic table share unexpected chemical similarities: lithium/magnesium, beryllium/aluminium, boron/silicon. These diagonal relationships arise from opposing trends in size and charge.',
    filter: (el: SeedElement) =>
      ['Li', 'Mg', 'Be', 'Al', 'B', 'Si'].includes(el.symbol),
  },
  {
    slug: 'electron-config-anomalies',
    label: 'Electron configuration anomalies',
    description:
      'These elements have ground-state electron configurations that deviate from the aufbau prediction. Chromium and copper prefer half-filled or fully-filled d-subshells; similar anomalies appear in heavier transition metals and are driven by exchange energy stabilisation.',
    filter: (el: SeedElement) =>
      ['Cr', 'Cu', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Pt', 'Au'].includes(el.symbol),
  },
  {
    slug: 'metalloid-boundary',
    label: 'Metalloid boundary',
    description:
      'The metalloids sit on the staircase boundary between metals and nonmetals. They exhibit intermediate properties — semiconductivity, amphoteric oxides — that make them essential in electronics and materials science.',
    filter: (el: SeedElement) =>
      ['B', 'Si', 'Ge', 'As', 'Sb', 'Te'].includes(el.symbol),
  },
];

function run() {
  const elements = readSeed();
  console.log(`Read ${elements.length} elements from seed`);

  // Compute rankings
  computeRankings(elements);

  // --- Generate files ---
  mkdirSync(outDir, { recursive: true });

  // elements.json (array, sources stripped for bundle size)
  const stripped = elements.map(({ sources: _s, ...rest }) => rest);
  writeFileSync(join(outDir, 'elements.json'), JSON.stringify(stripped, null, 2));

  // Per-element files (with sources)
  for (const el of elements) {
    writeFileSync(join(outDir, `element-${el.symbol}.json`), JSON.stringify(el, null, 2));
  }

  // Groups
  const groups = Array.from({ length: 18 }, (_, i) => i + 1).map((n) => ({
    n,
    elements: elements.filter((e) => e.group === n).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'groups.json'), JSON.stringify(groups, null, 2));

  // Periods
  const periods = Array.from({ length: 7 }, (_, i) => i + 1).map((n) => ({
    n,
    elements: elements.filter((e) => e.period === n).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'periods.json'), JSON.stringify(periods, null, 2));

  // Blocks
  const blocks = ['s', 'p', 'd', 'f'].map((block) => ({
    block,
    elements: elements.filter((e) => e.block === block).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'blocks.json'), JSON.stringify(blocks, null, 2));

  // Categories
  const categorySlugs = [...new Set(elements.map((e) => e.category))].sort();
  const categories = categorySlugs.map((slug) => ({
    slug,
    elements: elements.filter((e) => e.category === slug).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'categories.json'), JSON.stringify(categories, null, 2));

  // Rankings
  const rankings: Record<string, string[]> = {};
  for (const prop of ['mass', 'electronegativity', 'ionizationEnergy', 'radius']) {
    rankings[prop] = [...elements]
      .filter((e) => e.rankings[prop] > 0)
      .sort((a, b) => a.rankings[prop] - b.rankings[prop])
      .map((e) => e.symbol);
  }
  writeFileSync(join(outDir, 'rankings.json'), JSON.stringify(rankings, null, 2));

  // Anomalies
  const anomalies = ANOMALIES.map((a) => ({
    slug: a.slug,
    label: a.label,
    description: a.description,
    elements: elements.filter(a.filter).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'anomalies.json'), JSON.stringify(anomalies, null, 2));

  // Timeline — elements sorted by discovery year
  const timeline = [...elements]
    .filter((e) => e.discoveryYear != null)
    .sort((a, b) => a.discoveryYear! - b.discoveryYear!)
    .map((e) => ({ symbol: e.symbol, year: e.discoveryYear, discoverer: e.discoverer }));
  const antiquity = elements
    .filter((e) => e.discoveryYear == null)
    .map((e) => ({ symbol: e.symbol, year: null, discoverer: e.discoverer }));
  writeFileSync(join(outDir, 'timeline.json'), JSON.stringify({ antiquity, timeline }, null, 2));

  // Etymology origins
  const etymologyOrigins = [...new Set(elements.map((e) => e.etymologyOrigin))].sort();
  const etymology = etymologyOrigins.map((origin) => ({
    origin,
    elements: elements
      .filter((e) => e.etymologyOrigin === origin)
      .map((e) => ({ symbol: e.symbol, description: e.etymologyDescription })),
  }));
  writeFileSync(join(outDir, 'etymology.json'), JSON.stringify(etymology, null, 2));

  // Discoverers — grouped by discoverer name
  const discovererMap = new Map<string, string[]>();
  for (const el of elements) {
    const d = el.discoverer;
    if (!discovererMap.has(d)) discovererMap.set(d, []);
    discovererMap.get(d)!.push(el.symbol);
  }
  const discoverers = [...discovererMap.entries()]
    .map(([name, syms]) => ({ name, elements: syms }))
    .sort((a, b) => b.elements.length - a.elements.length);
  writeFileSync(join(outDir, 'discoverers.json'), JSON.stringify(discoverers, null, 2));

  // Credits
  const credits = {
    structured: {
      provider: 'PubChem',
      license: 'public domain',
      url: 'https://pubchem.ncbi.nlm.nih.gov/periodic-table/',
    },
    identifiers: {
      provider: 'Wikidata',
      license: 'CC0 1.0',
      url: 'https://www.wikidata.org/',
    },
    summaries: elements.map((e) => ({
      symbol: e.symbol,
      name: e.name,
      title: e.sources?.summary
        ? (e.sources.summary as Record<string, string>).title
        : e.wikipediaTitle,
      url: e.sources?.summary
        ? (e.sources.summary as Record<string, string>).url
        : e.wikipediaUrl,
      license: 'CC BY-SA 4.0',
      accessDate: e.sources?.summary
        ? (e.sources.summary as Record<string, string>).accessDate
        : '',
    })),
    software: [
      { name: 'Vite', url: 'https://vite.dev/', license: 'MIT' },
      { name: 'React', url: 'https://react.dev/', license: 'MIT' },
      { name: 'React Router', url: 'https://reactrouter.com/', license: 'MIT' },
      { name: '@chenglou/pretext', url: 'https://github.com/chenglou/pretext', license: 'MIT' },
    ],
  };
  writeFileSync(join(outDir, 'credits.json'), JSON.stringify(credits, null, 2));

  console.log('Generated files:');
  console.log(`  elements.json (${stripped.length} elements)`);
  console.log(`  ${elements.length} per-element files`);
  console.log(`  groups.json (${groups.length} groups)`);
  console.log(`  periods.json (${periods.length} periods)`);
  console.log(`  blocks.json (${blocks.length} blocks)`);
  console.log(`  categories.json (${categories.length} categories)`);
  console.log(`  rankings.json (${Object.keys(rankings).length} properties)`);
  console.log(`  anomalies.json (${anomalies.length} anomalies)`);
  console.log(`  credits.json`);
}

run();
