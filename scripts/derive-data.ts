/**
 * Build-time derivation script.
 * Reads data/seed/elements.json (committed) and produces all generated files.
 * Run: npm run build:data
 * Deterministic: same input always produces same output.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ERA_BINS, yearToEra } from '../shared/era-bins';

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
  density: number | null;
  meltingPoint: number | null;
  boilingPoint: number | null;
  halfLife: number | null;
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
  const properties = ['mass', 'electronegativity', 'ionizationEnergy', 'radius', 'density', 'meltingPoint', 'boilingPoint', 'halfLife'] as const;

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

// --- Group descriptions (authored editorial content) ---

const GROUP_DESCRIPTIONS: Record<number, { label: string; description: string }> = {
  1: {
    label: 'Alkali metals & hydrogen',
    description:
      'The alkali metals -- lithium through francium -- are soft, silvery reactive metals that form strong bases (alkalis) when combined with water. Hydrogen heads the group but stands apart as a nonmetal.',
  },
  2: {
    label: 'Alkaline earth metals',
    description:
      'The alkaline earth metals are reactive silvery metals found in the Earth\'s crust. Beryllium through radium become increasingly reactive down the group.',
  },
  3: {
    label: 'Group 3',
    description:
      'Group 3 marks the start of the transition metals and includes scandium, yttrium, and the disputed placements of lanthanum/lutetium and actinium/lawrencium.',
  },
  4: {
    label: 'Group 4',
    description:
      'Titanium, zirconium, hafnium, and rutherfordium form group 4. These early transition metals are known for high melting points and strong resistance to corrosion.',
  },
  5: {
    label: 'Group 5',
    description:
      'Vanadium, niobium, tantalum, and dubnium make up group 5. These metals display multiple oxidation states and are valued for their strength in alloys.',
  },
  6: {
    label: 'Group 6',
    description:
      'Chromium, molybdenum, tungsten, and seaborgium comprise group 6. Tungsten has the highest melting point of all metals; chromium lends hardness and lustre to stainless steel.',
  },
  7: {
    label: 'Group 7',
    description:
      'Manganese, technetium, rhenium, and bohrium form group 7. Technetium was the first element produced artificially and has no stable isotopes.',
  },
  8: {
    label: 'Group 8',
    description:
      'Iron, ruthenium, osmium, and hassium make up group 8. Iron is the most abundant transition metal on Earth and the cornerstone of steel production.',
  },
  9: {
    label: 'Group 9',
    description:
      'Cobalt, rhodium, iridium, and meitnerium form group 9. These metals are prized as catalysts and for their exceptional hardness and corrosion resistance.',
  },
  10: {
    label: 'Group 10',
    description:
      'Nickel, palladium, platinum, and darmstadtium comprise group 10. Palladium and platinum are essential catalysts in automotive converters and chemical synthesis.',
  },
  11: {
    label: 'Coinage metals',
    description:
      'Copper, silver, gold, and roentgenium form group 11 -- the coinage metals. Their malleability, lustre, and resistance to oxidation have made them symbols of value for millennia.',
  },
  12: {
    label: 'Group 12',
    description:
      'Zinc, cadmium, mercury, and copernicium form group 12. Mercury is the only metal that is liquid at room temperature; zinc is essential to biology as a cofactor in hundreds of enzymes.',
  },
  13: {
    label: 'Boron group',
    description:
      'The boron group spans a nonmetal (boron), common metals (aluminium, gallium, indium, thallium), and the synthetic nihonium. Aluminium is the most abundant metal in the Earth\'s crust.',
  },
  14: {
    label: 'Carbon group',
    description:
      'The carbon group ranges from carbon and silicon -- the basis of organic and semiconductor chemistry -- through germanium, tin, lead, and flerovium. Properties shift from nonmetal to metal down the group.',
  },
  15: {
    label: 'Pnictogens',
    description:
      'The pnictogens include nitrogen and phosphorus, both essential to life, along with arsenic, antimony, bismuth, and moscovium. The group bridges nonmetals, metalloids, and metals.',
  },
  16: {
    label: 'Chalcogens',
    description:
      'The chalcogens -- oxygen, sulfur, selenium, tellurium, polonium, and livermorium -- are the ore-forming elements. Oxygen makes up roughly 21 % of the atmosphere and is vital for respiration.',
  },
  17: {
    label: 'Halogens',
    description:
      'The halogens are highly reactive nonmetals that form salts with metals. Fluorine is the most electronegative element; iodine is essential to thyroid function.',
  },
  18: {
    label: 'Noble gases',
    description:
      'The noble gases have full outer electron shells, giving them exceptional chemical stability. Helium through oganesson span the lightest and heaviest elements in the periodic table.',
  },
};

// --- Period descriptions (authored editorial content) ---

const PERIOD_DESCRIPTIONS: Record<number, { label: string; description: string }> = {
  1: {
    label: 'Period 1',
    description:
      'The first period contains only hydrogen and helium -- the two lightest elements, formed in the Big Bang. They fill the 1s orbital.',
  },
  2: {
    label: 'Period 2',
    description:
      'Period 2 fills the 2s and 2p orbitals, spanning lithium to neon. It introduces the first nonmetals, the smallest halogens, and the lightest noble gas after helium.',
  },
  3: {
    label: 'Period 3',
    description:
      'Period 3 fills the 3s and 3p orbitals, from sodium to argon. It mirrors period 2 in structure but the elements are larger and more metallic.',
  },
  4: {
    label: 'Period 4',
    description:
      'Period 4 is the first to include d-block elements, expanding from 8 to 18 elements. It runs from potassium to krypton and introduces the first row of transition metals.',
  },
  5: {
    label: 'Period 5',
    description:
      'Period 5 mirrors period 4 with a second row of transition metals, from rubidium to xenon. It includes technetium, the lightest element with no stable isotopes.',
  },
  6: {
    label: 'Period 6',
    description:
      'Period 6 expands to 32 elements by introducing the f-block lanthanides. It spans caesium to radon and contains some of the densest and rarest stable elements.',
  },
  7: {
    label: 'Period 7',
    description:
      'Period 7 includes the actinides and all known synthetic superheavy elements, from francium to oganesson. Many of its members are radioactive and exist only briefly in laboratories.',
  },
};

// --- Block descriptions (authored editorial content) ---

const BLOCK_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  s: {
    label: 's-block',
    description:
      'Elements filling their outermost s-orbital. The s-block spans groups 1-2 plus helium, containing the most electropositive metals and the universe\'s lightest elements.',
  },
  p: {
    label: 'p-block',
    description:
      'Elements filling their outermost p-orbitals. The p-block contains the nonmetals, metalloids, halogens, and noble gases, as well as several post-transition metals.',
  },
  d: {
    label: 'd-block',
    description:
      'The d-block houses the transition metals, known for variable oxidation states, coloured compounds, and catalytic activity. They fill the 3d through 6d orbitals across groups 3-12.',
  },
  f: {
    label: 'f-block',
    description:
      'The f-block contains the lanthanides and actinides, which fill 4f and 5f orbitals respectively. These elements are often separated below the main table due to their unique electron configurations.',
  },
};

// --- Category descriptions (authored editorial content) ---

const CATEGORY_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  actinide: {
    label: 'Actinides',
    description:
      'The actinides fill the 5f electron shell, from actinium to nobelium. All are radioactive; uranium and plutonium are the best-known members due to their role in nuclear energy and weapons.',
  },
  'alkali metal': {
    label: 'Alkali metals',
    description:
      'The alkali metals (lithium through francium) are soft, silvery metals with a single valence electron. They are the most reactive metals, reacting vigorously with water to produce hydroxides.',
  },
  'alkaline earth metal': {
    label: 'Alkaline earth metals',
    description:
      'The alkaline earth metals (beryllium through radium) have two valence electrons and are less reactive than the alkali metals. Calcium and magnesium are essential to biological systems.',
  },
  halogen: {
    label: 'Halogens',
    description:
      'The halogens are reactive nonmetals with seven valence electrons, making them eager to gain one more. They range from the pale yellow gas fluorine to the dark solid iodine.',
  },
  lanthanide: {
    label: 'Lanthanides',
    description:
      'The lanthanides fill the 4f electron shell, from lanthanum to ytterbium. Often called rare earth elements, they are critical in magnets, lasers, and modern electronics.',
  },
  metalloid: {
    label: 'Metalloids',
    description:
      'Metalloids sit on the boundary between metals and nonmetals, exhibiting intermediate properties such as semiconductivity. Silicon and germanium are the foundation of the electronics industry.',
  },
  'noble gas': {
    label: 'Noble gases',
    description:
      'The noble gases have complete valence shells, making them exceptionally unreactive under normal conditions. They are colourless, odourless, and monatomic.',
  },
  nonmetal: {
    label: 'Nonmetals',
    description:
      'The nonmetals are a diverse group of elements that lack metallic character. They include carbon, nitrogen, oxygen, and other elements essential to organic chemistry and life.',
  },
  'post-transition metal': {
    label: 'Post-transition metals',
    description:
      'Post-transition metals are softer and have lower melting points than transition metals. They include aluminium, tin, lead, and several heavier synthetic elements.',
  },
  'transition metal': {
    label: 'Transition metals',
    description:
      'Transition metals occupy the d-block and are characterised by variable oxidation states, coloured ions, and catalytic properties. Iron, copper, and gold are among the most familiar.',
  },
};

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

  // symbol-blocks.json — minimal { symbol: block } map (~0.8 KB)
  // Used by EntityCard to colour mini-symbols without loading full elements.json
  const symbolBlocks: Record<string, string> = {};
  for (const el of elements) symbolBlocks[el.symbol] = el.block;
  writeFileSync(join(outDir, 'symbol-blocks.json'), JSON.stringify(symbolBlocks));

  // Per-element files (with sources)
  for (const el of elements) {
    writeFileSync(join(outDir, `element-${el.symbol}.json`), JSON.stringify(el, null, 2));
  }

  // Groups
  const groups = Array.from({ length: 18 }, (_, i) => i + 1).map((n) => ({
    n,
    label: GROUP_DESCRIPTIONS[n]?.label ?? `Group ${n}`,
    description: GROUP_DESCRIPTIONS[n]?.description ?? '',
    elements: elements.filter((e) => e.group === n).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'groups.json'), JSON.stringify(groups, null, 2));

  // Periods
  const periods = Array.from({ length: 7 }, (_, i) => i + 1).map((n) => ({
    n,
    label: PERIOD_DESCRIPTIONS[n]?.label ?? `Period ${n}`,
    description: PERIOD_DESCRIPTIONS[n]?.description ?? '',
    elements: elements.filter((e) => e.period === n).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'periods.json'), JSON.stringify(periods, null, 2));

  // Blocks
  const blocks = ['s', 'p', 'd', 'f'].map((block) => ({
    block,
    label: BLOCK_DESCRIPTIONS[block]?.label ?? `${block}-block`,
    description: BLOCK_DESCRIPTIONS[block]?.description ?? '',
    elements: elements.filter((e) => e.block === block).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'blocks.json'), JSON.stringify(blocks, null, 2));

  // Categories
  const categorySlugs = [...new Set(elements.map((e) => e.category))].sort();
  const categories = categorySlugs.map((slug) => ({
    slug,
    label: CATEGORY_DESCRIPTIONS[slug]?.label ?? slug,
    description: CATEGORY_DESCRIPTIONS[slug]?.description ?? '',
    elements: elements.filter((e) => e.category === slug).map((e) => e.symbol),
  }));
  writeFileSync(join(outDir, 'categories.json'), JSON.stringify(categories, null, 2));

  // Rankings
  const rankings: Record<string, string[]> = {};
  for (const prop of ['mass', 'electronegativity', 'ionizationEnergy', 'radius', 'density', 'meltingPoint', 'boilingPoint', 'halfLife']) {
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

  // --- grid-elements.json (minimal fields for the periodic table grid) ---
  const gridElements = elements.map((e) => ({
    atomicNumber: e.atomicNumber,
    symbol: e.symbol,
    name: e.name,
    block: e.block,
    group: e.group,
    period: e.period,
    category: e.category,
    phase: e.phase,
    mass: e.mass,
    electronegativity: e.electronegativity,
    ionizationEnergy: e.ionizationEnergy,
    radius: e.radius,
    density: e.density,
    meltingPoint: e.meltingPoint,
    boilingPoint: e.boilingPoint,
    halfLife: e.halfLife,
    neighbors: e.neighbors,
  }));
  writeFileSync(join(outDir, 'grid-elements.json'), JSON.stringify(gridElements));

  // --- entity-index.json (pre-built entity corpus for the Explore page) ---
  // Only result-worthy entity types: elements, discoverers, anomalies, eras, etymologies.
  // Groups, periods, blocks, categories are structural labels — facets, not results.
  const ENTITY_TYPE_COLOURS: Record<string, string> = {
    element: '#133e7c', anomaly: '#9e1c2c',
    discoverer: '#856912', era: '#9e1c2c', etymology: '#0f0f0f',
  };
  const entityIndex: Array<{
    id: string; type: string; name: string; description: string;
    colour: string; elements: string[]; href: string | null;
  }> = [];

  for (const el of elements) {
    entityIndex.push({
      id: `element-${el.symbol}`, type: 'element',
      name: `${el.symbol} — ${el.name}`, description: el.summary,
      colour: ENTITY_TYPE_COLOURS.element, elements: [el.symbol],
      href: `/elements/${el.symbol}`,
    });
  }
  for (const a of anomalies) {
    entityIndex.push({
      id: `anomaly-${a.slug}`, type: 'anomaly',
      name: a.label, description: a.description,
      colour: ENTITY_TYPE_COLOURS.anomaly, elements: a.elements,
      href: `/anomalies/${a.slug}`,
    });
  }
  for (const d of discoverers) {
    entityIndex.push({
      id: `discoverer-${d.name}`, type: 'discoverer',
      name: d.name,
      description: `Discovered ${d.elements.length} element${d.elements.length === 1 ? '' : 's'}: ${d.elements.join(', ')}`,
      colour: ENTITY_TYPE_COLOURS.discoverer, elements: d.elements,
      href: `/discoverers/${encodeURIComponent(d.name)}`,
    });
  }
  // Eras from timeline — use shared ERA_BINS
  const eraBuckets = new Map<string, string[]>();
  for (const entry of antiquity) {
    const bin = yearToEra(null);
    if (!eraBuckets.has(bin.slug)) eraBuckets.set(bin.slug, []);
    eraBuckets.get(bin.slug)!.push(entry.symbol);
  }
  for (const entry of timeline) {
    if (entry.year == null) continue;
    const bin = yearToEra(entry.year);
    if (!eraBuckets.has(bin.slug)) eraBuckets.set(bin.slug, []);
    eraBuckets.get(bin.slug)!.push(entry.symbol);
  }
  for (const bin of ERA_BINS) {
    const symbols = eraBuckets.get(bin.slug);
    if (!symbols || symbols.length === 0) continue;
    const unique = [...new Set(symbols)];
    entityIndex.push({
      id: `era-${bin.slug}`, type: 'era',
      name: bin.label,
      description: `${unique.length} element${unique.length === 1 ? '' : 's'} discovered in ${bin.label}.`,
      colour: ENTITY_TYPE_COLOURS.era, elements: unique,
      href: `/eras/${bin.slug}`,
    });
  }
  // Etymology origins
  for (const ety of etymology) {
    const symbols = ety.elements.map((e: { symbol: string }) => e.symbol);
    const capitalised = ety.origin.charAt(0).toUpperCase() + ety.origin.slice(1);
    entityIndex.push({
      id: `etymology-${ety.origin}`, type: 'etymology',
      name: `${capitalised} names`,
      description: `${symbols.length} elements named for ${ety.origin === 'property' ? 'their properties' : ety.origin === 'place' ? 'places' : ety.origin === 'person' ? 'people' : ety.origin === 'mythology' ? 'mythological figures' : ety.origin === 'mineral' ? 'minerals' : ety.origin === 'astronomical' ? 'celestial bodies' : ety.origin}.`,
      colour: ENTITY_TYPE_COLOURS.etymology, elements: symbols,
      href: `/etymology-map#${ety.origin}`,
    });
  }
  writeFileSync(join(outDir, 'entity-index.json'), JSON.stringify(entityIndex));

  // --- folio bundles (pre-resolved per-element data for the Folio page) ---
  // Each bundle includes everything Folio.tsx needs: no more allElements dependency.
  for (const el of elements) {
    const group = el.group != null ? groups.find((g) => g.n === el.group) : null;
    const elAnomalies = anomalies.filter((a) => a.elements.includes(el.symbol));

    // Prev/next within group (sorted by period)
    const groupMembers = el.group != null
      ? elements.filter((e) => e.group === el.group).sort((a, b) => a.period - b.period)
      : [];
    const groupIdx = groupMembers.findIndex((e) => e.symbol === el.symbol);
    const prevInGroup = groupIdx > 0 ? groupMembers[groupIdx - 1] : null;
    const nextInGroup = groupIdx < groupMembers.length - 1 ? groupMembers[groupIdx + 1] : null;

    // Prev/next within period (sorted by atomic number)
    const periodMembers = elements.filter((e) => e.period === el.period).sort((a, b) => a.atomicNumber - b.atomicNumber);
    const periodIdx = periodMembers.findIndex((e) => e.symbol === el.symbol);
    const prevInPeriod = periodIdx > 0 ? periodMembers[periodIdx - 1] : null;
    const nextInPeriod = periodIdx < periodMembers.length - 1 ? periodMembers[periodIdx + 1] : null;

    // Prev/next within block (sorted by atomic number)
    const blockMembers = elements.filter((e) => e.block === el.block).sort((a, b) => a.atomicNumber - b.atomicNumber);
    const blockIdx = blockMembers.findIndex((e) => e.symbol === el.symbol);
    const prevInBlock = blockIdx > 0 ? blockMembers[blockIdx - 1] : null;
    const nextInBlock = blockIdx < blockMembers.length - 1 ? blockMembers[blockIdx + 1] : null;

    // Prev/next within category (sorted by atomic number)
    const catMembers = elements.filter((e) => e.category === el.category).sort((a, b) => a.atomicNumber - b.atomicNumber);
    const catIdx = catMembers.findIndex((e) => e.symbol === el.symbol);
    const prevInCategory = catIdx > 0 ? catMembers[catIdx - 1] : null;
    const nextInCategory = catIdx < catMembers.length - 1 ? catMembers[catIdx + 1] : null;

    // Group phase strip data
    const groupPhases = group
      ? group.elements.map((sym) => {
          const member = elements.find((e) => e.symbol === sym);
          return member?.phase ?? null;
        })
      : null;

    // Resolved neighbors
    const resolvedNeighbors = el.neighbors.map((sym) => {
      const n = elements.find((e) => e.symbol === sym);
      return n ? { symbol: n.symbol, name: n.name, block: n.block } : null;
    }).filter(Boolean);

    // Same discoverer
    const sameDiscoverer = (!el.discoverer || el.discoverer.toLowerCase().includes('antiquity'))
      ? []
      : elements
          .filter((e) => e.discoverer === el.discoverer && e.symbol !== el.symbol)
          .slice(0, 6)
          .map((e) => ({ symbol: e.symbol, name: e.name, block: e.block }));

    // Same etymology
    const sameEtymology = (!el.etymologyOrigin || el.etymologyOrigin === 'unknown')
      ? []
      : elements
          .filter((e) => e.etymologyOrigin === el.etymologyOrigin && e.symbol !== el.symbol)
          .slice(0, 6)
          .map((e) => ({ symbol: e.symbol, name: e.name, block: e.block }));

    const asRef = (e: SeedElement | null) => e ? { symbol: e.symbol, name: e.name } : null;

    const folioBundle = {
      element: el,
      group: group ? { n: group.n, label: group.label, description: group.description, elements: group.elements } : null,
      anomalies: elAnomalies.map((a) => ({ slug: a.slug, label: a.label, elementCount: a.elements.length })),
      nav: {
        prevInGroup: asRef(prevInGroup),
        nextInGroup: asRef(nextInGroup),
        prevInPeriod: asRef(prevInPeriod),
        nextInPeriod: asRef(nextInPeriod),
        prevInBlock: asRef(prevInBlock),
        nextInBlock: asRef(nextInBlock),
        prevInCategory: asRef(prevInCategory),
        nextInCategory: asRef(nextInCategory),
      },
      groupPhases,
      neighbors: resolvedNeighbors,
      sameDiscoverer,
      sameEtymology,
    };
    writeFileSync(join(outDir, `folio-${el.symbol}.json`), JSON.stringify(folioBundle));
  }

  // --- entity-refs.json (structural cross-references between entities) ---
  // Phase 2 of enrichment spec: extract bidirectional refs from existing data.
  const entityRefs: Array<{ sourceId: string; targetId: string; relType: string }> = [];

  // discoverer -> elements (discovered)
  for (const d of discoverers) {
    const srcId = `discoverer-${d.name}`;
    for (const sym of d.elements) {
      entityRefs.push({ sourceId: srcId, targetId: `element-${sym}`, relType: 'discovered' });
    }
  }

  // anomaly -> elements (exhibits)
  for (const a of anomalies) {
    const srcId = `anomaly-${a.slug}`;
    for (const sym of a.elements) {
      entityRefs.push({ sourceId: srcId, targetId: `element-${sym}`, relType: 'exhibits' });
    }
  }

  // element -> category (member_of)
  for (const el of elements) {
    entityRefs.push({ sourceId: `element-${el.symbol}`, targetId: `category-${el.category}`, relType: 'member_of' });
  }

  // element -> group (belongs_to)
  for (const el of elements) {
    if (el.group != null) {
      entityRefs.push({ sourceId: `element-${el.symbol}`, targetId: `group-${el.group}`, relType: 'belongs_to' });
    }
  }

  // element -> period (belongs_to)
  for (const el of elements) {
    entityRefs.push({ sourceId: `element-${el.symbol}`, targetId: `period-${el.period}`, relType: 'belongs_to' });
  }

  // element -> block (belongs_to)
  for (const el of elements) {
    entityRefs.push({ sourceId: `element-${el.symbol}`, targetId: `block-${el.block}`, relType: 'belongs_to' });
  }

  // element -> etymology (named_for)
  for (const el of elements) {
    if (el.etymologyOrigin && el.etymologyOrigin !== 'unknown') {
      entityRefs.push({ sourceId: `element-${el.symbol}`, targetId: `etymology-${el.etymologyOrigin}`, relType: 'named_for' });
    }
  }

  // era -> discoverers (active_during): link eras to discoverers who discovered in that era
  for (const entry of timeline) {
    if (entry.year == null) continue;
    const bin = yearToEra(entry.year);
    const eraId = `era-${bin.slug}`;
    const discId = `discoverer-${entry.discoverer}`;
    // Only add if both entities exist in the index
    if (entityIndex.some((e) => e.id === eraId) && entityIndex.some((e) => e.id === discId)) {
      entityRefs.push({ sourceId: eraId, targetId: discId, relType: 'active_during' });
    }
  }
  for (const entry of antiquity) {
    const bin = yearToEra(null);
    const eraId = `era-${bin.slug}`;
    const discId = `discoverer-${entry.discoverer}`;
    if (entityIndex.some((e) => e.id === discId)) {
      entityRefs.push({ sourceId: eraId, targetId: discId, relType: 'active_during' });
    }
  }

  // Deduplicate refs
  const refSet = new Set<string>();
  const dedupedRefs = entityRefs.filter((r) => {
    const key = `${r.sourceId}|${r.targetId}|${r.relType}`;
    if (refSet.has(key)) return false;
    refSet.add(key);
    return true;
  });

  writeFileSync(join(outDir, 'entity-refs.json'), JSON.stringify(dedupedRefs));

  // --- Build per-entity ref lookup (outgoing + incoming grouped by entity id) ---
  // This creates a compact lookup: { [entityId]: { out: [{id, rel}...], in: [{id, rel}...] } }
  const refLookup: Record<string, { out: Array<{ id: string; rel: string }>; in: Array<{ id: string; rel: string }> }> = {};
  for (const ref of dedupedRefs) {
    if (!refLookup[ref.sourceId]) refLookup[ref.sourceId] = { out: [], in: [] };
    if (!refLookup[ref.targetId]) refLookup[ref.targetId] = { out: [], in: [] };
    refLookup[ref.sourceId].out.push({ id: ref.targetId, rel: ref.relType });
    refLookup[ref.targetId].in.push({ id: ref.sourceId, rel: ref.relType });
  }
  writeFileSync(join(outDir, 'entity-ref-lookup.json'), JSON.stringify(refLookup));

  console.log('Generated files:');
  console.log(`  elements.json (${stripped.length} elements)`);
  console.log(`  grid-elements.json (${gridElements.length} elements, grid-only)`);
  console.log(`  ${elements.length} per-element files`);
  console.log(`  ${elements.length} folio bundle files`);
  console.log(`  entity-index.json (${entityIndex.length} entities)`);
  console.log(`  groups.json (${groups.length} groups)`);
  console.log(`  periods.json (${periods.length} periods)`);
  console.log(`  blocks.json (${blocks.length} blocks)`);
  console.log(`  categories.json (${categories.length} categories)`);
  console.log(`  rankings.json (${Object.keys(rankings).length} properties)`);
  console.log(`  anomalies.json (${anomalies.length} anomalies)`);
  console.log(`  credits.json`);
  console.log(`  symbol-blocks.json`);
  console.log(`  entity-refs.json (${dedupedRefs.length} cross-references)`);
  console.log(`  entity-ref-lookup.json (${Object.keys(refLookup).length} entities with refs)`);
}

run();
