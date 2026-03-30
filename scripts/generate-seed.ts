/**
 * One-time seed generation script.
 * Fetches real element data from PubChem, Wikidata, and Wikipedia.
 * Run manually: npm run build:seed
 * Review output, then commit data/seed/elements.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPARQL_URL = 'https://query.wikidata.org/sparql';
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const PUBCHEM_API = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable';

const ACCESS_DATE = new Date().toISOString().split('T')[0];

// --- Hardcoded IUPAC data (authoritative) ---

type BaseElement = {
  atomicNumber: number;
  symbol: string;
  name: string;
  period: number;
  group: number | null;
  block: 's' | 'p' | 'd' | 'f';
};

// prettier-ignore
const BASE: BaseElement[] = [
  {atomicNumber:1,symbol:'H',name:'Hydrogen',period:1,group:1,block:'s'},
  {atomicNumber:2,symbol:'He',name:'Helium',period:1,group:18,block:'s'},
  {atomicNumber:3,symbol:'Li',name:'Lithium',period:2,group:1,block:'s'},
  {atomicNumber:4,symbol:'Be',name:'Beryllium',period:2,group:2,block:'s'},
  {atomicNumber:5,symbol:'B',name:'Boron',period:2,group:13,block:'p'},
  {atomicNumber:6,symbol:'C',name:'Carbon',period:2,group:14,block:'p'},
  {atomicNumber:7,symbol:'N',name:'Nitrogen',period:2,group:15,block:'p'},
  {atomicNumber:8,symbol:'O',name:'Oxygen',period:2,group:16,block:'p'},
  {atomicNumber:9,symbol:'F',name:'Fluorine',period:2,group:17,block:'p'},
  {atomicNumber:10,symbol:'Ne',name:'Neon',period:2,group:18,block:'p'},
  {atomicNumber:11,symbol:'Na',name:'Sodium',period:3,group:1,block:'s'},
  {atomicNumber:12,symbol:'Mg',name:'Magnesium',period:3,group:2,block:'s'},
  {atomicNumber:13,symbol:'Al',name:'Aluminium',period:3,group:13,block:'p'},
  {atomicNumber:14,symbol:'Si',name:'Silicon',period:3,group:14,block:'p'},
  {atomicNumber:15,symbol:'P',name:'Phosphorus',period:3,group:15,block:'p'},
  {atomicNumber:16,symbol:'S',name:'Sulfur',period:3,group:16,block:'p'},
  {atomicNumber:17,symbol:'Cl',name:'Chlorine',period:3,group:17,block:'p'},
  {atomicNumber:18,symbol:'Ar',name:'Argon',period:3,group:18,block:'p'},
  {atomicNumber:19,symbol:'K',name:'Potassium',period:4,group:1,block:'s'},
  {atomicNumber:20,symbol:'Ca',name:'Calcium',period:4,group:2,block:'s'},
  {atomicNumber:21,symbol:'Sc',name:'Scandium',period:4,group:3,block:'d'},
  {atomicNumber:22,symbol:'Ti',name:'Titanium',period:4,group:4,block:'d'},
  {atomicNumber:23,symbol:'V',name:'Vanadium',period:4,group:5,block:'d'},
  {atomicNumber:24,symbol:'Cr',name:'Chromium',period:4,group:6,block:'d'},
  {atomicNumber:25,symbol:'Mn',name:'Manganese',period:4,group:7,block:'d'},
  {atomicNumber:26,symbol:'Fe',name:'Iron',period:4,group:8,block:'d'},
  {atomicNumber:27,symbol:'Co',name:'Cobalt',period:4,group:9,block:'d'},
  {atomicNumber:28,symbol:'Ni',name:'Nickel',period:4,group:10,block:'d'},
  {atomicNumber:29,symbol:'Cu',name:'Copper',period:4,group:11,block:'d'},
  {atomicNumber:30,symbol:'Zn',name:'Zinc',period:4,group:12,block:'d'},
  {atomicNumber:31,symbol:'Ga',name:'Gallium',period:4,group:13,block:'p'},
  {atomicNumber:32,symbol:'Ge',name:'Germanium',period:4,group:14,block:'p'},
  {atomicNumber:33,symbol:'As',name:'Arsenic',period:4,group:15,block:'p'},
  {atomicNumber:34,symbol:'Se',name:'Selenium',period:4,group:16,block:'p'},
  {atomicNumber:35,symbol:'Br',name:'Bromine',period:4,group:17,block:'p'},
  {atomicNumber:36,symbol:'Kr',name:'Krypton',period:4,group:18,block:'p'},
  {atomicNumber:37,symbol:'Rb',name:'Rubidium',period:5,group:1,block:'s'},
  {atomicNumber:38,symbol:'Sr',name:'Strontium',period:5,group:2,block:'s'},
  {atomicNumber:39,symbol:'Y',name:'Yttrium',period:5,group:3,block:'d'},
  {atomicNumber:40,symbol:'Zr',name:'Zirconium',period:5,group:4,block:'d'},
  {atomicNumber:41,symbol:'Nb',name:'Niobium',period:5,group:5,block:'d'},
  {atomicNumber:42,symbol:'Mo',name:'Molybdenum',period:5,group:6,block:'d'},
  {atomicNumber:43,symbol:'Tc',name:'Technetium',period:5,group:7,block:'d'},
  {atomicNumber:44,symbol:'Ru',name:'Ruthenium',period:5,group:8,block:'d'},
  {atomicNumber:45,symbol:'Rh',name:'Rhodium',period:5,group:9,block:'d'},
  {atomicNumber:46,symbol:'Pd',name:'Palladium',period:5,group:10,block:'d'},
  {atomicNumber:47,symbol:'Ag',name:'Silver',period:5,group:11,block:'d'},
  {atomicNumber:48,symbol:'Cd',name:'Cadmium',period:5,group:12,block:'d'},
  {atomicNumber:49,symbol:'In',name:'Indium',period:5,group:13,block:'p'},
  {atomicNumber:50,symbol:'Sn',name:'Tin',period:5,group:14,block:'p'},
  {atomicNumber:51,symbol:'Sb',name:'Antimony',period:5,group:15,block:'p'},
  {atomicNumber:52,symbol:'Te',name:'Tellurium',period:5,group:16,block:'p'},
  {atomicNumber:53,symbol:'I',name:'Iodine',period:5,group:17,block:'p'},
  {atomicNumber:54,symbol:'Xe',name:'Xenon',period:5,group:18,block:'p'},
  {atomicNumber:55,symbol:'Cs',name:'Caesium',period:6,group:1,block:'s'},
  {atomicNumber:56,symbol:'Ba',name:'Barium',period:6,group:2,block:'s'},
  {atomicNumber:57,symbol:'La',name:'Lanthanum',period:6,group:3,block:'f'},
  {atomicNumber:58,symbol:'Ce',name:'Cerium',period:6,group:null,block:'f'},
  {atomicNumber:59,symbol:'Pr',name:'Praseodymium',period:6,group:null,block:'f'},
  {atomicNumber:60,symbol:'Nd',name:'Neodymium',period:6,group:null,block:'f'},
  {atomicNumber:61,symbol:'Pm',name:'Promethium',period:6,group:null,block:'f'},
  {atomicNumber:62,symbol:'Sm',name:'Samarium',period:6,group:null,block:'f'},
  {atomicNumber:63,symbol:'Eu',name:'Europium',period:6,group:null,block:'f'},
  {atomicNumber:64,symbol:'Gd',name:'Gadolinium',period:6,group:null,block:'f'},
  {atomicNumber:65,symbol:'Tb',name:'Terbium',period:6,group:null,block:'f'},
  {atomicNumber:66,symbol:'Dy',name:'Dysprosium',period:6,group:null,block:'f'},
  {atomicNumber:67,symbol:'Ho',name:'Holmium',period:6,group:null,block:'f'},
  {atomicNumber:68,symbol:'Er',name:'Erbium',period:6,group:null,block:'f'},
  {atomicNumber:69,symbol:'Tm',name:'Thulium',period:6,group:null,block:'f'},
  {atomicNumber:70,symbol:'Yb',name:'Ytterbium',period:6,group:null,block:'f'},
  {atomicNumber:71,symbol:'Lu',name:'Lutetium',period:6,group:3,block:'d'},
  {atomicNumber:72,symbol:'Hf',name:'Hafnium',period:6,group:4,block:'d'},
  {atomicNumber:73,symbol:'Ta',name:'Tantalum',period:6,group:5,block:'d'},
  {atomicNumber:74,symbol:'W',name:'Tungsten',period:6,group:6,block:'d'},
  {atomicNumber:75,symbol:'Re',name:'Rhenium',period:6,group:7,block:'d'},
  {atomicNumber:76,symbol:'Os',name:'Osmium',period:6,group:8,block:'d'},
  {atomicNumber:77,symbol:'Ir',name:'Iridium',period:6,group:9,block:'d'},
  {atomicNumber:78,symbol:'Pt',name:'Platinum',period:6,group:10,block:'d'},
  {atomicNumber:79,symbol:'Au',name:'Gold',period:6,group:11,block:'d'},
  {atomicNumber:80,symbol:'Hg',name:'Mercury',period:6,group:12,block:'d'},
  {atomicNumber:81,symbol:'Tl',name:'Thallium',period:6,group:13,block:'p'},
  {atomicNumber:82,symbol:'Pb',name:'Lead',period:6,group:14,block:'p'},
  {atomicNumber:83,symbol:'Bi',name:'Bismuth',period:6,group:15,block:'p'},
  {atomicNumber:84,symbol:'Po',name:'Polonium',period:6,group:16,block:'p'},
  {atomicNumber:85,symbol:'At',name:'Astatine',period:6,group:17,block:'p'},
  {atomicNumber:86,symbol:'Rn',name:'Radon',period:6,group:18,block:'p'},
  {atomicNumber:87,symbol:'Fr',name:'Francium',period:7,group:1,block:'s'},
  {atomicNumber:88,symbol:'Ra',name:'Radium',period:7,group:2,block:'s'},
  {atomicNumber:89,symbol:'Ac',name:'Actinium',period:7,group:3,block:'f'},
  {atomicNumber:90,symbol:'Th',name:'Thorium',period:7,group:null,block:'f'},
  {atomicNumber:91,symbol:'Pa',name:'Protactinium',period:7,group:null,block:'f'},
  {atomicNumber:92,symbol:'U',name:'Uranium',period:7,group:null,block:'f'},
  {atomicNumber:93,symbol:'Np',name:'Neptunium',period:7,group:null,block:'f'},
  {atomicNumber:94,symbol:'Pu',name:'Plutonium',period:7,group:null,block:'f'},
  {atomicNumber:95,symbol:'Am',name:'Americium',period:7,group:null,block:'f'},
  {atomicNumber:96,symbol:'Cm',name:'Curium',period:7,group:null,block:'f'},
  {atomicNumber:97,symbol:'Bk',name:'Berkelium',period:7,group:null,block:'f'},
  {atomicNumber:98,symbol:'Cf',name:'Californium',period:7,group:null,block:'f'},
  {atomicNumber:99,symbol:'Es',name:'Einsteinium',period:7,group:null,block:'f'},
  {atomicNumber:100,symbol:'Fm',name:'Fermium',period:7,group:null,block:'f'},
  {atomicNumber:101,symbol:'Md',name:'Mendelevium',period:7,group:null,block:'f'},
  {atomicNumber:102,symbol:'No',name:'Nobelium',period:7,group:null,block:'f'},
  {atomicNumber:103,symbol:'Lr',name:'Lawrencium',period:7,group:3,block:'d'},
  {atomicNumber:104,symbol:'Rf',name:'Rutherfordium',period:7,group:4,block:'d'},
  {atomicNumber:105,symbol:'Db',name:'Dubnium',period:7,group:5,block:'d'},
  {atomicNumber:106,symbol:'Sg',name:'Seaborgium',period:7,group:6,block:'d'},
  {atomicNumber:107,symbol:'Bh',name:'Bohrium',period:7,group:7,block:'d'},
  {atomicNumber:108,symbol:'Hs',name:'Hassium',period:7,group:8,block:'d'},
  {atomicNumber:109,symbol:'Mt',name:'Meitnerium',period:7,group:9,block:'d'},
  {atomicNumber:110,symbol:'Ds',name:'Darmstadtium',period:7,group:10,block:'d'},
  {atomicNumber:111,symbol:'Rg',name:'Roentgenium',period:7,group:11,block:'d'},
  {atomicNumber:112,symbol:'Cn',name:'Copernicium',period:7,group:12,block:'d'},
  {atomicNumber:113,symbol:'Nh',name:'Nihonium',period:7,group:13,block:'p'},
  {atomicNumber:114,symbol:'Fl',name:'Flerovium',period:7,group:14,block:'p'},
  {atomicNumber:115,symbol:'Mc',name:'Moscovium',period:7,group:15,block:'p'},
  {atomicNumber:116,symbol:'Lv',name:'Livermorium',period:7,group:16,block:'p'},
  {atomicNumber:117,symbol:'Ts',name:'Tennessine',period:7,group:17,block:'p'},
  {atomicNumber:118,symbol:'Og',name:'Oganesson',period:7,group:18,block:'p'},
];

// --- Category classification ---
function categoryFor(el: BaseElement): string {
  if (el.symbol === 'H') return 'nonmetal';
  if (el.group === 1) return 'alkali metal';
  if (el.group === 2) return 'alkaline earth metal';
  if ([9, 17, 35, 53, 85, 117].includes(el.atomicNumber)) return 'halogen';
  if ([2, 10, 18, 36, 54, 86, 118].includes(el.atomicNumber)) return 'noble gas';
  if (el.block === 'f' && el.atomicNumber <= 71) return 'lanthanide';
  if (el.block === 'f' && el.atomicNumber >= 89) return 'actinide';
  if (el.block === 'd') return 'transition metal';
  if ([5, 14, 32, 33, 51, 52, 84].includes(el.atomicNumber)) return 'metalloid';
  if ([6, 7, 8, 15, 16, 34].includes(el.atomicNumber)) return 'nonmetal';
  return 'post-transition metal';
}

// --- Fetch helpers ---
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Atlas/1.0 (periodic table app)', ...headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

// --- PubChem: fetch properties for all elements ---
type PubChemProps = {
  mass: number | null;
  electronegativity: number | null;
  ionizationEnergy: number | null;
  radius: number | null;
  phase: string;
};

async function fetchPubChem(): Promise<Map<number, PubChemProps>> {
  console.log('Fetching PubChem data...');
  const map = new Map<number, PubChemProps>();

  const url = `${PUBCHEM_API}/JSON`;
  try {
    const data = await fetchJSON(url);
    const table = data.Table;
    const columns = table.Columns.Column as string[];
    const rows = table.Row as Array<{ Cell: string[] }>;

    const colIdx = (name: string) => columns.indexOf(name);
    const anum = colIdx('AtomicNumber');
    const massIdx = colIdx('AtomicMass');
    const enIdx = colIdx('Electronegativity');
    const ieIdx = colIdx('IonizationEnergy');
    const radIdx = colIdx('AtomicRadius');
    const phaseIdx = colIdx('StandardState');

    for (const row of rows) {
      const cells = row.Cell;
      const z = parseInt(cells[anum], 10);
      if (isNaN(z)) continue;

      const parseNum = (idx: number) => {
        if (idx < 0 || !cells[idx]) return null;
        const v = parseFloat(cells[idx]);
        return isNaN(v) ? null : v;
      };

      map.set(z, {
        mass: parseNum(massIdx),
        electronegativity: parseNum(enIdx),
        ionizationEnergy: parseNum(ieIdx),
        radius: parseNum(radIdx),
        phase: cells[phaseIdx] || 'unknown',
      });
    }
  } catch (err) {
    console.error('PubChem fetch failed:', err);
  }

  console.log(`  PubChem: got data for ${map.size} elements`);
  return map;
}

// --- Wikidata: fetch QIDs and Wikipedia sitelinks ---
type WikidataInfo = {
  wikidataId: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
};

async function fetchWikidata(): Promise<Map<number, WikidataInfo>> {
  console.log('Fetching Wikidata identifiers...');
  const map = new Map<number, WikidataInfo>();

  const query = `
    SELECT ?element ?elementLabel ?atomicNumber ?article WHERE {
      ?element wdt:P31 wd:Q11344;
               wdt:P1086 ?atomicNumber.
      OPTIONAL {
        ?article schema:about ?element;
                 schema:isPartOf <https://en.wikipedia.org/>.
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY ?atomicNumber
  `;

  try {
    const url = `${SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`;
    const data = await fetchJSON(url);
    const bindings = data.results.bindings;

    for (const b of bindings) {
      const z = parseInt(b.atomicNumber.value, 10);
      if (isNaN(z) || z < 1 || z > 118) continue;
      const qid = b.element.value.split('/').pop() || '';
      const articleUrl = b.article?.value || '';
      const title = articleUrl ? decodeURIComponent(articleUrl.split('/wiki/').pop() || '').replace(/_/g, ' ') : '';

      map.set(z, {
        wikidataId: qid,
        wikipediaTitle: title || b.elementLabel?.value || '',
        wikipediaUrl: articleUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(b.elementLabel?.value || '')}`,
      });
    }
  } catch (err) {
    console.error('Wikidata SPARQL failed:', err);
    // Fallback: construct from element names
    for (const el of BASE) {
      map.set(el.atomicNumber, {
        wikidataId: '',
        wikipediaTitle: el.name,
        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(el.name)}`,
      });
    }
  }

  console.log(`  Wikidata: got data for ${map.size} elements`);
  return map;
}

// --- Wikipedia: fetch summaries ---
async function fetchWikipediaSummary(title: string): Promise<string> {
  try {
    const url = `${WIKIPEDIA_API}/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    const data = await fetchJSON(url);
    return data.extract || '';
  } catch {
    return '';
  }
}

async function fetchAllWikipediaSummaries(
  elements: Array<{ name: string; wikipediaTitle: string }>,
): Promise<Map<string, string>> {
  console.log('Fetching Wikipedia summaries (this takes ~2 minutes)...');
  const map = new Map<string, string>();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const title = el.wikipediaTitle || el.name;
    const summary = await fetchWikipediaSummary(title);
    map.set(el.name, summary);

    if ((i + 1) % 20 === 0) {
      console.log(`  Wikipedia: ${i + 1}/${elements.length}`);
    }
    await sleep(50); // rate limit: ~20 req/s
  }

  console.log(`  Wikipedia: got ${map.size} summaries`);
  return map;
}

// --- Main ---
async function run() {
  const pubchem = await fetchPubChem();
  const wikidata = await fetchWikidata();

  // Build initial records to get Wikipedia titles
  const preRecords = BASE.map((el) => {
    const wd = wikidata.get(el.atomicNumber);
    return { name: el.name, wikipediaTitle: wd?.wikipediaTitle || el.name };
  });

  const summaries = await fetchAllWikipediaSummaries(preRecords);

  // Merge all sources
  const conflicts: string[] = [];
  const elements = BASE.map((el, i, arr) => {
    const pc = pubchem.get(el.atomicNumber);
    const wd = wikidata.get(el.atomicNumber);
    const summary = summaries.get(el.name) || '';
    const neighbors = [arr[i - 1]?.symbol, arr[i + 1]?.symbol].filter(Boolean) as string[];

    // Log conflicts between PubChem and Wikidata if both provide values
    // (for now we always prefer PubChem for numeric data)

    const mass = pc?.mass ?? null;
    if (mass === null) {
      conflicts.push(`Z=${el.atomicNumber} (${el.symbol}): no mass from PubChem`);
    }

    const wikipediaTitle = wd?.wikipediaTitle || el.name;
    const wikipediaUrl =
      wd?.wikipediaUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(el.name)}`;

    return {
      atomicNumber: el.atomicNumber,
      symbol: el.symbol,
      name: el.name,
      wikidataId: wd?.wikidataId || '',
      wikipediaTitle,
      wikipediaUrl,
      period: el.period,
      group: el.group,
      block: el.block,
      category: categoryFor(el),
      phase: pc?.phase?.toLowerCase() || 'unknown',
      mass: mass ?? 0,
      electronegativity: pc?.electronegativity ?? null,
      ionizationEnergy: pc?.ionizationEnergy ?? null,
      radius: pc?.radius ?? null,
      summary,
      neighbors,
      rankings: {} as Record<string, number>, // filled by derive-data
      sources: {
        structured: {
          provider: 'PubChem',
          license: 'public domain',
          url: `https://pubchem.ncbi.nlm.nih.gov/element/${el.atomicNumber}`,
        },
        identifiers: {
          provider: 'Wikidata',
          license: 'CC0 1.0',
          url: wd?.wikidataId
            ? `https://www.wikidata.org/wiki/${wd.wikidataId}`
            : '',
        },
        summary: {
          provider: 'Wikipedia',
          title: wikipediaTitle,
          url: wikipediaUrl,
          license: 'CC BY-SA 4.0',
          accessDate: ACCESS_DATE,
        },
      },
    };
  });

  // Write output
  const outDir = join(process.cwd(), 'data', 'seed');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'elements.json'), JSON.stringify(elements, null, 2));

  // Report
  console.log('\n=== Seed generation complete ===');
  console.log(`Elements: ${elements.length}`);
  console.log(`With mass: ${elements.filter((e) => e.mass > 0).length}`);
  console.log(`With summary: ${elements.filter((e) => e.summary.length > 0).length}`);
  console.log(`With wikidataId: ${elements.filter((e) => e.wikidataId).length}`);

  if (conflicts.length > 0) {
    console.log(`\n=== Conflicts/warnings (${conflicts.length}) ===`);
    for (const c of conflicts) console.log(`  ${c}`);
  }

  console.log(`\nOutput: ${join(outDir, 'elements.json')}`);
  console.log('Review the output, then commit it.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
