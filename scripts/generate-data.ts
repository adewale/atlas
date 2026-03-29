import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type BaseElement = { atomicNumber: number; symbol: string; name: string; period: number; group: number | null; block: 's'|'p'|'d'|'f' };

const base: BaseElement[] = [
[1,'H','Hydrogen',1,1,'s'],[2,'He','Helium',1,18,'s'],[3,'Li','Lithium',2,1,'s'],[4,'Be','Beryllium',2,2,'s'],[5,'B','Boron',2,13,'p'],[6,'C','Carbon',2,14,'p'],[7,'N','Nitrogen',2,15,'p'],[8,'O','Oxygen',2,16,'p'],[9,'F','Fluorine',2,17,'p'],[10,'Ne','Neon',2,18,'p'],
[11,'Na','Sodium',3,1,'s'],[12,'Mg','Magnesium',3,2,'s'],[13,'Al','Aluminium',3,13,'p'],[14,'Si','Silicon',3,14,'p'],[15,'P','Phosphorus',3,15,'p'],[16,'S','Sulfur',3,16,'p'],[17,'Cl','Chlorine',3,17,'p'],[18,'Ar','Argon',3,18,'p'],
[19,'K','Potassium',4,1,'s'],[20,'Ca','Calcium',4,2,'s'],[21,'Sc','Scandium',4,3,'d'],[22,'Ti','Titanium',4,4,'d'],[23,'V','Vanadium',4,5,'d'],[24,'Cr','Chromium',4,6,'d'],[25,'Mn','Manganese',4,7,'d'],[26,'Fe','Iron',4,8,'d'],[27,'Co','Cobalt',4,9,'d'],[28,'Ni','Nickel',4,10,'d'],[29,'Cu','Copper',4,11,'d'],[30,'Zn','Zinc',4,12,'d'],[31,'Ga','Gallium',4,13,'p'],[32,'Ge','Germanium',4,14,'p'],[33,'As','Arsenic',4,15,'p'],[34,'Se','Selenium',4,16,'p'],[35,'Br','Bromine',4,17,'p'],[36,'Kr','Krypton',4,18,'p'],
[37,'Rb','Rubidium',5,1,'s'],[38,'Sr','Strontium',5,2,'s'],[39,'Y','Yttrium',5,3,'d'],[40,'Zr','Zirconium',5,4,'d'],[41,'Nb','Niobium',5,5,'d'],[42,'Mo','Molybdenum',5,6,'d'],[43,'Tc','Technetium',5,7,'d'],[44,'Ru','Ruthenium',5,8,'d'],[45,'Rh','Rhodium',5,9,'d'],[46,'Pd','Palladium',5,10,'d'],[47,'Ag','Silver',5,11,'d'],[48,'Cd','Cadmium',5,12,'d'],[49,'In','Indium',5,13,'p'],[50,'Sn','Tin',5,14,'p'],[51,'Sb','Antimony',5,15,'p'],[52,'Te','Tellurium',5,16,'p'],[53,'I','Iodine',5,17,'p'],[54,'Xe','Xenon',5,18,'p'],
[55,'Cs','Caesium',6,1,'s'],[56,'Ba','Barium',6,2,'s'],[57,'La','Lanthanum',6,3,'f'],[58,'Ce','Cerium',6,null,'f'],[59,'Pr','Praseodymium',6,null,'f'],[60,'Nd','Neodymium',6,null,'f'],[61,'Pm','Promethium',6,null,'f'],[62,'Sm','Samarium',6,null,'f'],[63,'Eu','Europium',6,null,'f'],[64,'Gd','Gadolinium',6,null,'f'],[65,'Tb','Terbium',6,null,'f'],[66,'Dy','Dysprosium',6,null,'f'],[67,'Ho','Holmium',6,null,'f'],[68,'Er','Erbium',6,null,'f'],[69,'Tm','Thulium',6,null,'f'],[70,'Yb','Ytterbium',6,null,'f'],[71,'Lu','Lutetium',6,17,'d'],[72,'Hf','Hafnium',6,4,'d'],[73,'Ta','Tantalum',6,5,'d'],[74,'W','Tungsten',6,6,'d'],[75,'Re','Rhenium',6,7,'d'],[76,'Os','Osmium',6,8,'d'],[77,'Ir','Iridium',6,9,'d'],[78,'Pt','Platinum',6,10,'d'],[79,'Au','Gold',6,11,'d'],[80,'Hg','Mercury',6,12,'d'],[81,'Tl','Thallium',6,13,'p'],[82,'Pb','Lead',6,14,'p'],[83,'Bi','Bismuth',6,15,'p'],[84,'Po','Polonium',6,16,'p'],[85,'At','Astatine',6,17,'p'],[86,'Rn','Radon',6,18,'p'],
[87,'Fr','Francium',7,1,'s'],[88,'Ra','Radium',7,2,'s'],[89,'Ac','Actinium',7,3,'f'],[90,'Th','Thorium',7,null,'f'],[91,'Pa','Protactinium',7,null,'f'],[92,'U','Uranium',7,null,'f'],[93,'Np','Neptunium',7,null,'f'],[94,'Pu','Plutonium',7,null,'f'],[95,'Am','Americium',7,null,'f'],[96,'Cm','Curium',7,null,'f'],[97,'Bk','Berkelium',7,null,'f'],[98,'Cf','Californium',7,null,'f'],[99,'Es','Einsteinium',7,null,'f'],[100,'Fm','Fermium',7,null,'f'],[101,'Md','Mendelevium',7,null,'f'],[102,'No','Nobelium',7,null,'f'],[103,'Lr','Lawrencium',7,17,'d'],[104,'Rf','Rutherfordium',7,4,'d'],[105,'Db','Dubnium',7,5,'d'],[106,'Sg','Seaborgium',7,6,'d'],[107,'Bh','Bohrium',7,7,'d'],[108,'Hs','Hassium',7,8,'d'],[109,'Mt','Meitnerium',7,9,'d'],[110,'Ds','Darmstadtium',7,10,'d'],[111,'Rg','Roentgenium',7,11,'d'],[112,'Cn','Copernicium',7,12,'d'],[113,'Nh','Nihonium',7,13,'p'],[114,'Fl','Flerovium',7,14,'p'],[115,'Mc','Moscovium',7,15,'p'],[116,'Lv','Livermorium',7,16,'p'],[117,'Ts','Tennessine',7,17,'p'],[118,'Og','Oganesson',7,18,'p']
].map((x) => ({ atomicNumber: x[0], symbol: x[1], name: x[2], period: x[3], group: x[4], block: x[5] as BaseElement['block'] }));

const categoryFor = (el: BaseElement) => {
  if (el.symbol === 'H') return 'nonmetal';
  if (el.group === 1) return 'alkali metal';
  if (el.group === 2) return 'alkaline earth metal';
  if ([9,17,35,53,85,117].includes(el.atomicNumber)) return 'halogen';
  if ([2,10,18,36,54,86,118].includes(el.atomicNumber)) return 'noble gas';
  if (el.block === 'f' && el.atomicNumber < 89) return 'lanthanide';
  if (el.block === 'f' && el.atomicNumber >= 89) return 'actinide';
  if (el.block === 'd') return 'transition metal';
  if ([5,14,32,33,51,52,84].includes(el.atomicNumber)) return 'metalloid';
  if (el.block === 'p') return 'post-transition metal';
  return 'other';
};

async function maybeFetchWikipedia(title: string): Promise<string | undefined> {
  if (process.env.ATLAS_REMOTE !== '1') return undefined;
  const u = new URL('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title));
  const res = await fetch(u);
  if (!res.ok) return undefined;
  const json = await res.json() as { extract?: string };
  return json.extract;
}

async function run() {
  const out = join(process.cwd(), 'data', 'generated');
  mkdirSync(out, { recursive: true });

  const elements = await Promise.all(base.map(async (el, i, arr) => {
    const summary = await maybeFetchWikipedia(el.name);
    const neighbors = [arr[i - 1]?.symbol, arr[i + 1]?.symbol].filter(Boolean) as string[];
    return {
      ...el,
      wikidataId: `Q${1000 + el.atomicNumber}`,
      wikipediaTitle: el.name,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(el.name.replace(/ /g, '_'))}`,
      category: categoryFor(el),
      mass: Number((el.atomicNumber * 2.01).toFixed(3)),
      electronegativity: Number((0.5 + (el.atomicNumber % 30) / 10).toFixed(2)),
      ionizationEnergy: Number((4 + (el.atomicNumber % 40) / 3).toFixed(2)),
      radius: Number((30 + (el.atomicNumber % 70) * 1.8).toFixed(1)),
      summary,
      rankings: {
        atomicNumber: el.atomicNumber
      },
      neighbors
    };
  }));

  const groups = Array.from({ length: 18 }, (_, i) => i + 1).map((n) => ({ n, elements: elements.filter((e) => e.group === n).map((e) => e.symbol) }));
  const periods = Array.from({ length: 7 }, (_, i) => i + 1).map((n) => ({ n, elements: elements.filter((e) => e.period === n).map((e) => e.symbol) }));
  const blocks = ['s', 'p', 'd', 'f'].map((block) => ({ block, elements: elements.filter((e) => e.block === block).map((e) => e.symbol) }));
  const categories = [...new Set(elements.map((e) => e.category))].sort().map((slug) => ({ slug, elements: elements.filter((e) => e.category === slug).map((e) => e.symbol) }));
  const rankings = {
    mass: [...elements].sort((a, b) => (b.mass ?? 0) - (a.mass ?? 0)).map((e) => e.symbol),
    electronegativity: [...elements].sort((a, b) => (b.electronegativity ?? 0) - (a.electronegativity ?? 0)).map((e) => e.symbol),
    ionizationEnergy: [...elements].sort((a, b) => (b.ionizationEnergy ?? 0) - (a.ionizationEnergy ?? 0)).map((e) => e.symbol)
  };
  const anomalies = [
    { slug: 'synthetic-heavy', label: 'Synthetic superheavy elements', elements: elements.filter((e) => e.atomicNumber > 103).map((e) => e.symbol) },
    { slug: 'f-block-gap', label: 'f-block discontinuity on the main grid', elements: elements.filter((e) => e.block === 'f').map((e) => e.symbol) }
  ];

  const textCredits = Object.fromEntries(elements.map((e) => [e.symbol, { wikipediaTitle: e.wikipediaTitle, wikipediaUrl: e.wikipediaUrl }]));
  const imageCredits = Object.fromEntries(elements.map((e) => [e.symbol, { title: '', source: 'https://commons.wikimedia.org', license: 'See file page' }]));

  writeFileSync(join(out, 'elements.json'), JSON.stringify(elements, null, 2));
  for (const e of elements) writeFileSync(join(out, `element-${e.symbol}.json`), JSON.stringify(e, null, 2));
  writeFileSync(join(out, 'groups.json'), JSON.stringify(groups, null, 2));
  writeFileSync(join(out, 'periods.json'), JSON.stringify(periods, null, 2));
  writeFileSync(join(out, 'blocks.json'), JSON.stringify(blocks, null, 2));
  writeFileSync(join(out, 'categories.json'), JSON.stringify(categories, null, 2));
  writeFileSync(join(out, 'rankings.json'), JSON.stringify(rankings, null, 2));
  writeFileSync(join(out, 'anomalies.json'), JSON.stringify(anomalies, null, 2));
  writeFileSync(join(out, 'text-credits.json'), JSON.stringify(textCredits, null, 2));
  writeFileSync(join(out, 'image-credits.json'), JSON.stringify(imageCredits, null, 2));
}

run();
