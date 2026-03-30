/**
 * One-time script to enrich seed data with discovery, etymology, and discoverer info.
 * Reference data sourced from IUPAC, PubChem, and standard chemistry references.
 * Run: npx tsx scripts/enrich-seed.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const seedPath = join(process.cwd(), 'data', 'seed', 'elements.json');

type EnrichmentRecord = {
  discoveryYear: number | null;
  discoverer: string;
  etymologyOrigin: string; // category: place, person, mythology, property, mineral, astronomical
  etymologyDescription: string;
};

// Comprehensive discovery/etymology data for all 118 elements
const ENRICHMENT: Record<string, EnrichmentRecord> = {
  H:   { discoveryYear: 1766, discoverer: 'Henry Cavendish', etymologyOrigin: 'property', etymologyDescription: 'Greek hydro + genes: water-forming' },
  He:  { discoveryYear: 1868, discoverer: 'Pierre Janssen & Joseph Lockyer', etymologyOrigin: 'astronomical', etymologyDescription: 'Greek helios: the Sun, first observed in solar spectrum' },
  Li:  { discoveryYear: 1817, discoverer: 'Johan August Arfwedson', etymologyOrigin: 'property', etymologyDescription: 'Greek lithos: stone, discovered in mineral' },
  Be:  { discoveryYear: 1798, discoverer: 'Louis Nicolas Vauquelin', etymologyOrigin: 'mineral', etymologyDescription: 'Greek beryllos: the mineral beryl' },
  B:   { discoveryYear: 1808, discoverer: 'Humphry Davy', etymologyOrigin: 'mineral', etymologyDescription: 'Arabic buraq: borax, a white mineral' },
  C:   { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Latin carbo: charcoal' },
  N:   { discoveryYear: 1772, discoverer: 'Daniel Rutherford', etymologyOrigin: 'property', etymologyDescription: 'Greek nitron + genes: niter-forming' },
  O:   { discoveryYear: 1774, discoverer: 'Joseph Priestley & Carl Wilhelm Scheele', etymologyOrigin: 'property', etymologyDescription: 'Greek oxys + genes: acid-forming' },
  F:   { discoveryYear: 1886, discoverer: 'Henri Moissan', etymologyOrigin: 'property', etymologyDescription: 'Latin fluere: to flow, from use as flux' },
  Ne:  { discoveryYear: 1898, discoverer: 'William Ramsay & Morris Travers', etymologyOrigin: 'property', etymologyDescription: 'Greek neos: new' },
  Na:  { discoveryYear: 1807, discoverer: 'Humphry Davy', etymologyOrigin: 'property', etymologyDescription: 'English soda; symbol from Latin natrium' },
  Mg:  { discoveryYear: 1755, discoverer: 'Joseph Black', etymologyOrigin: 'place', etymologyDescription: 'Magnesia, a district in Thessaly, Greece' },
  Al:  { discoveryYear: 1825, discoverer: 'Hans Christian Ørsted', etymologyOrigin: 'mineral', etymologyDescription: 'Latin alumen: alum, a bitter salt' },
  Si:  { discoveryYear: 1824, discoverer: 'Jöns Jacob Berzelius', etymologyOrigin: 'property', etymologyDescription: 'Latin silex: flint, hard stone' },
  P:   { discoveryYear: 1669, discoverer: 'Hennig Brand', etymologyOrigin: 'mythology', etymologyDescription: 'Greek phosphoros: light-bearer, from its glow' },
  S:   { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Latin sulphur: brimstone' },
  Cl:  { discoveryYear: 1774, discoverer: 'Carl Wilhelm Scheele', etymologyOrigin: 'property', etymologyDescription: 'Greek chloros: pale green' },
  Ar:  { discoveryYear: 1894, discoverer: 'Lord Rayleigh & William Ramsay', etymologyOrigin: 'property', etymologyDescription: 'Greek argon: inactive, lazy' },
  K:   { discoveryYear: 1807, discoverer: 'Humphry Davy', etymologyOrigin: 'property', etymologyDescription: 'English potash; symbol from Latin kalium' },
  Ca:  { discoveryYear: 1808, discoverer: 'Humphry Davy', etymologyOrigin: 'property', etymologyDescription: 'Latin calx: lime' },
  Sc:  { discoveryYear: 1879, discoverer: 'Lars Fredrik Nilson', etymologyOrigin: 'place', etymologyDescription: 'Latin Scandia: Scandinavia' },
  Ti:  { discoveryYear: 1791, discoverer: 'William Gregor', etymologyOrigin: 'mythology', etymologyDescription: 'Greek Titans: primordial gods of mythology' },
  V:   { discoveryYear: 1801, discoverer: 'Andrés Manuel del Río', etymologyOrigin: 'mythology', etymologyDescription: 'Vanadis, Old Norse name for the goddess Freyja' },
  Cr:  { discoveryYear: 1797, discoverer: 'Louis Nicolas Vauquelin', etymologyOrigin: 'property', etymologyDescription: 'Greek chroma: color, from its vivid compounds' },
  Mn:  { discoveryYear: 1774, discoverer: 'Johan Gottlieb Gahn', etymologyOrigin: 'mineral', etymologyDescription: 'Latin magnes: magnet, from pyrolusite ore' },
  Fe:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Anglo-Saxon iron; symbol from Latin ferrum' },
  Co:  { discoveryYear: 1735, discoverer: 'Georg Brandt', etymologyOrigin: 'mythology', etymologyDescription: 'German Kobold: goblin, from miners\' superstition' },
  Ni:  { discoveryYear: 1751, discoverer: 'Axel Fredrik Cronstedt', etymologyOrigin: 'mythology', etymologyDescription: 'German Kupfernickel: devil\'s copper, a deceptive ore' },
  Cu:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'place', etymologyDescription: 'Latin cuprum: from Cyprus, where it was mined' },
  Zn:  { discoveryYear: 1746, discoverer: 'Andreas Sigismund Marggraf', etymologyOrigin: 'property', etymologyDescription: 'German Zink: prong or tooth, from crystal shape' },
  Ga:  { discoveryYear: 1875, discoverer: 'Paul Emile Lecoq de Boisbaudran', etymologyOrigin: 'place', etymologyDescription: 'Latin Gallia: France' },
  Ge:  { discoveryYear: 1886, discoverer: 'Clemens Winkler', etymologyOrigin: 'place', etymologyDescription: 'Latin Germania: Germany' },
  As:  { discoveryYear: 1250, discoverer: 'Albertus Magnus', etymologyOrigin: 'property', etymologyDescription: 'Greek arsenikon: potent, from its toxicity' },
  Se:  { discoveryYear: 1817, discoverer: 'Jöns Jacob Berzelius', etymologyOrigin: 'astronomical', etymologyDescription: 'Greek selene: the Moon' },
  Br:  { discoveryYear: 1826, discoverer: 'Antoine Jérôme Balard', etymologyOrigin: 'property', etymologyDescription: 'Greek bromos: stench' },
  Kr:  { discoveryYear: 1898, discoverer: 'William Ramsay & Morris Travers', etymologyOrigin: 'property', etymologyDescription: 'Greek kryptos: hidden' },
  Rb:  { discoveryYear: 1861, discoverer: 'Robert Bunsen & Gustav Kirchhoff', etymologyOrigin: 'property', etymologyDescription: 'Latin rubidus: deep red, from its spectral lines' },
  Sr:  { discoveryYear: 1790, discoverer: 'Adair Crawford', etymologyOrigin: 'place', etymologyDescription: 'Strontian, a village in Scotland' },
  Y:   { discoveryYear: 1794, discoverer: 'Johan Gadolin', etymologyOrigin: 'place', etymologyDescription: 'Ytterby, a village in Sweden' },
  Zr:  { discoveryYear: 1789, discoverer: 'Martin Heinrich Klaproth', etymologyOrigin: 'mineral', etymologyDescription: 'Arabic zargun: gold-colored, from zircon mineral' },
  Nb:  { discoveryYear: 1801, discoverer: 'Charles Hatchett', etymologyOrigin: 'mythology', etymologyDescription: 'Greek Niobe: daughter of Tantalus in mythology' },
  Mo:  { discoveryYear: 1781, discoverer: 'Carl Wilhelm Scheele', etymologyOrigin: 'mineral', etymologyDescription: 'Greek molybdos: lead, from resemblance to lead ore' },
  Tc:  { discoveryYear: 1937, discoverer: 'Carlo Perrier & Emilio Segrè', etymologyOrigin: 'property', etymologyDescription: 'Greek technetos: artificial, first synthetic element' },
  Ru:  { discoveryYear: 1844, discoverer: 'Karl Ernst Claus', etymologyOrigin: 'place', etymologyDescription: 'Latin Ruthenia: Russia' },
  Rh:  { discoveryYear: 1803, discoverer: 'William Hyde Wollaston', etymologyOrigin: 'property', etymologyDescription: 'Greek rhodon: rose, from its rose-red compounds' },
  Pd:  { discoveryYear: 1803, discoverer: 'William Hyde Wollaston', etymologyOrigin: 'astronomical', etymologyDescription: 'Pallas, asteroid discovered two years prior' },
  Ag:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Anglo-Saxon silver; symbol from Latin argentum: shiny' },
  Cd:  { discoveryYear: 1817, discoverer: 'Friedrich Stromeyer', etymologyOrigin: 'mineral', etymologyDescription: 'Latin cadmia: calamine, the zinc ore where found' },
  In:  { discoveryYear: 1863, discoverer: 'Ferdinand Reich & Hieronymus Richter', etymologyOrigin: 'property', etymologyDescription: 'Latin indicum: indigo, from its spectral line color' },
  Sn:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Anglo-Saxon tin; symbol from Latin stannum' },
  Sb:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'mineral', etymologyDescription: 'Greek anti + monos: not alone; symbol from Latin stibium' },
  Te:  { discoveryYear: 1783, discoverer: 'Franz-Joseph Müller von Reichenstein', etymologyOrigin: 'astronomical', etymologyDescription: 'Latin tellus: Earth' },
  I:   { discoveryYear: 1811, discoverer: 'Bernard Courtois', etymologyOrigin: 'property', etymologyDescription: 'Greek ioeides: violet, from its vapor color' },
  Xe:  { discoveryYear: 1898, discoverer: 'William Ramsay & Morris Travers', etymologyOrigin: 'property', etymologyDescription: 'Greek xenos: stranger, foreign' },
  Cs:  { discoveryYear: 1860, discoverer: 'Robert Bunsen & Gustav Kirchhoff', etymologyOrigin: 'property', etymologyDescription: 'Latin caesius: sky blue, from its spectral lines' },
  Ba:  { discoveryYear: 1808, discoverer: 'Humphry Davy', etymologyOrigin: 'property', etymologyDescription: 'Greek barys: heavy' },
  La:  { discoveryYear: 1839, discoverer: 'Carl Gustaf Mosander', etymologyOrigin: 'property', etymologyDescription: 'Greek lanthanein: to lie hidden' },
  Ce:  { discoveryYear: 1803, discoverer: 'Jöns Jacob Berzelius & Wilhelm Hisinger', etymologyOrigin: 'astronomical', etymologyDescription: 'Ceres, the dwarf planet discovered two years prior' },
  Pr:  { discoveryYear: 1885, discoverer: 'Carl Auer von Welsbach', etymologyOrigin: 'property', etymologyDescription: 'Greek prasios + didymos: green twin' },
  Nd:  { discoveryYear: 1885, discoverer: 'Carl Auer von Welsbach', etymologyOrigin: 'property', etymologyDescription: 'Greek neos + didymos: new twin' },
  Pm:  { discoveryYear: 1945, discoverer: 'Jacob Marinsky, Lawrence Glendenin & Charles Coryell', etymologyOrigin: 'mythology', etymologyDescription: 'Prometheus, the Titan who stole fire from the gods' },
  Sm:  { discoveryYear: 1879, discoverer: 'Paul Emile Lecoq de Boisbaudran', etymologyOrigin: 'person', etymologyDescription: 'Samarskite mineral, named after Vasili Samarsky-Bykhovets' },
  Eu:  { discoveryYear: 1901, discoverer: 'Eugène-Anatole Demarçay', etymologyOrigin: 'place', etymologyDescription: 'Europe' },
  Gd:  { discoveryYear: 1880, discoverer: 'Jean Charles Galissard de Marignac', etymologyOrigin: 'person', etymologyDescription: 'Johan Gadolin, Finnish chemist and mineralogist' },
  Tb:  { discoveryYear: 1843, discoverer: 'Carl Gustaf Mosander', etymologyOrigin: 'place', etymologyDescription: 'Ytterby, a village in Sweden' },
  Dy:  { discoveryYear: 1886, discoverer: 'Paul Emile Lecoq de Boisbaudran', etymologyOrigin: 'property', etymologyDescription: 'Greek dysprositos: hard to get at' },
  Ho:  { discoveryYear: 1878, discoverer: 'Marc Delafontaine & Jacques-Louis Soret', etymologyOrigin: 'place', etymologyDescription: 'Latin Holmia: Stockholm' },
  Er:  { discoveryYear: 1843, discoverer: 'Carl Gustaf Mosander', etymologyOrigin: 'place', etymologyDescription: 'Ytterby, a village in Sweden' },
  Tm:  { discoveryYear: 1879, discoverer: 'Per Teodor Cleve', etymologyOrigin: 'place', etymologyDescription: 'Thule, ancient name for Scandinavia' },
  Yb:  { discoveryYear: 1878, discoverer: 'Jean Charles Galissard de Marignac', etymologyOrigin: 'place', etymologyDescription: 'Ytterby, a village in Sweden' },
  Lu:  { discoveryYear: 1907, discoverer: 'Georges Urbain', etymologyOrigin: 'place', etymologyDescription: 'Latin Lutetia: ancient name for Paris' },
  Hf:  { discoveryYear: 1923, discoverer: 'Dirk Coster & George de Hevesy', etymologyOrigin: 'place', etymologyDescription: 'Latin Hafnia: Copenhagen' },
  Ta:  { discoveryYear: 1802, discoverer: 'Anders Gustaf Ekeberg', etymologyOrigin: 'mythology', etymologyDescription: 'Greek Tantalus: mythological king condemned to eternal hunger' },
  W:   { discoveryYear: 1783, discoverer: 'Juan José Elhuyar & Fausto Elhuyar', etymologyOrigin: 'mineral', etymologyDescription: 'Swedish tung sten: heavy stone; symbol from wolframite ore' },
  Re:  { discoveryYear: 1925, discoverer: 'Walter Noddack, Ida Tacke & Otto Berg', etymologyOrigin: 'place', etymologyDescription: 'Latin Rhenus: the Rhine river' },
  Os:  { discoveryYear: 1803, discoverer: 'Smithson Tennant', etymologyOrigin: 'property', etymologyDescription: 'Greek osme: smell, from its pungent oxide' },
  Ir:  { discoveryYear: 1803, discoverer: 'Smithson Tennant', etymologyOrigin: 'mythology', etymologyDescription: 'Greek Iris: goddess of the rainbow, from its colorful salts' },
  Pt:  { discoveryYear: 1735, discoverer: 'Antonio de Ulloa', etymologyOrigin: 'property', etymologyDescription: 'Spanish platina: little silver' },
  Au:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Anglo-Saxon gold; symbol from Latin aurum: shining dawn' },
  Hg:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'mythology', etymologyDescription: 'Mercury, the Roman messenger god; Latin hydrargyrum: liquid silver' },
  Tl:  { discoveryYear: 1861, discoverer: 'William Crookes', etymologyOrigin: 'property', etymologyDescription: 'Greek thallos: green twig, from its spectral line' },
  Pb:  { discoveryYear: null, discoverer: 'Known since antiquity', etymologyOrigin: 'property', etymologyDescription: 'Anglo-Saxon lead; symbol from Latin plumbum' },
  Bi:  { discoveryYear: 1753, discoverer: 'Claude François Geoffroy', etymologyOrigin: 'property', etymologyDescription: 'German Wismut: uncertain, possibly white mass' },
  Po:  { discoveryYear: 1898, discoverer: 'Marie Curie & Pierre Curie', etymologyOrigin: 'place', etymologyDescription: 'Poland, homeland of Marie Curie' },
  At:  { discoveryYear: 1940, discoverer: 'Dale Corson, Kenneth MacKenzie & Emilio Segrè', etymologyOrigin: 'property', etymologyDescription: 'Greek astatos: unstable' },
  Rn:  { discoveryYear: 1900, discoverer: 'Friedrich Ernst Dorn', etymologyOrigin: 'property', etymologyDescription: 'From radium, its parent element in decay chains' },
  Fr:  { discoveryYear: 1939, discoverer: 'Marguerite Perey', etymologyOrigin: 'place', etymologyDescription: 'France' },
  Ra:  { discoveryYear: 1898, discoverer: 'Marie Curie & Pierre Curie', etymologyOrigin: 'property', etymologyDescription: 'Latin radius: ray, from its intense radioactivity' },
  Ac:  { discoveryYear: 1899, discoverer: 'André-Louis Debierne', etymologyOrigin: 'property', etymologyDescription: 'Greek aktinos: ray' },
  Th:  { discoveryYear: 1829, discoverer: 'Jöns Jacob Berzelius', etymologyOrigin: 'mythology', etymologyDescription: 'Thor, the Norse god of thunder' },
  Pa:  { discoveryYear: 1913, discoverer: 'Kasimir Fajans & Oswald Helmuth Göhring', etymologyOrigin: 'property', etymologyDescription: 'Greek protos + aktinos: first ray, precursor to actinium' },
  U:   { discoveryYear: 1789, discoverer: 'Martin Heinrich Klaproth', etymologyOrigin: 'astronomical', etymologyDescription: 'Uranus, the planet discovered eight years prior' },
  Np:  { discoveryYear: 1940, discoverer: 'Edwin McMillan & Philip Abelson', etymologyOrigin: 'astronomical', etymologyDescription: 'Neptune, the planet beyond Uranus' },
  Pu:  { discoveryYear: 1940, discoverer: 'Glenn Seaborg, Edwin McMillan, Joseph Kennedy & Arthur Wahl', etymologyOrigin: 'astronomical', etymologyDescription: 'Pluto, the celestial body beyond Neptune' },
  Am:  { discoveryYear: 1944, discoverer: 'Glenn Seaborg, Ralph James, Leon Morgan & Albert Ghiorso', etymologyOrigin: 'place', etymologyDescription: 'Americas, by analogy with europium' },
  Cm:  { discoveryYear: 1944, discoverer: 'Glenn Seaborg, Ralph James & Albert Ghiorso', etymologyOrigin: 'person', etymologyDescription: 'Marie and Pierre Curie, pioneers of radioactivity' },
  Bk:  { discoveryYear: 1949, discoverer: 'Glenn Seaborg, Stanley Thompson & Albert Ghiorso', etymologyOrigin: 'place', etymologyDescription: 'Berkeley, California, where it was synthesized' },
  Cf:  { discoveryYear: 1950, discoverer: 'Glenn Seaborg, Stanley Thompson, Albert Ghiorso & Kenneth Street', etymologyOrigin: 'place', etymologyDescription: 'California, the state and university' },
  Es:  { discoveryYear: 1952, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'person', etymologyDescription: 'Albert Einstein' },
  Fm:  { discoveryYear: 1952, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'person', etymologyDescription: 'Enrico Fermi, nuclear physics pioneer' },
  Md:  { discoveryYear: 1955, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'person', etymologyDescription: 'Dmitri Mendeleev, creator of the periodic table' },
  No:  { discoveryYear: 1958, discoverer: 'Albert Ghiorso, Torbjørn Sikkeland, John Walton & Glenn Seaborg', etymologyOrigin: 'person', etymologyDescription: 'Alfred Nobel, inventor of dynamite' },
  Lr:  { discoveryYear: 1961, discoverer: 'Albert Ghiorso, Torbjørn Sikkeland, Almon Larsh & Robert Latimer', etymologyOrigin: 'person', etymologyDescription: 'Ernest O. Lawrence, cyclotron inventor' },
  Rf:  { discoveryYear: 1969, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'person', etymologyDescription: 'Ernest Rutherford, father of nuclear physics' },
  Db:  { discoveryYear: 1970, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'place', etymologyDescription: 'Dubna, Russian city with the Joint Institute for Nuclear Research' },
  Sg:  { discoveryYear: 1974, discoverer: 'Albert Ghiorso et al.', etymologyOrigin: 'person', etymologyDescription: 'Glenn T. Seaborg, prolific element discoverer' },
  Bh:  { discoveryYear: 1981, discoverer: 'Peter Armbruster & Gottfried Münzenberg', etymologyOrigin: 'person', etymologyDescription: 'Niels Bohr, quantum mechanics pioneer' },
  Hs:  { discoveryYear: 1984, discoverer: 'Peter Armbruster & Gottfried Münzenberg', etymologyOrigin: 'place', etymologyDescription: 'Latin Hassia: Hesse, the German state' },
  Mt:  { discoveryYear: 1982, discoverer: 'Peter Armbruster & Gottfried Münzenberg', etymologyOrigin: 'person', etymologyDescription: 'Lise Meitner, nuclear fission co-discoverer' },
  Ds:  { discoveryYear: 1994, discoverer: 'Sigurd Hofmann et al.', etymologyOrigin: 'place', etymologyDescription: 'Darmstadt, German city with GSI Helmholtz Centre' },
  Rg:  { discoveryYear: 1994, discoverer: 'Sigurd Hofmann et al.', etymologyOrigin: 'person', etymologyDescription: 'Wilhelm Conrad Röntgen, discoverer of X-rays' },
  Cn:  { discoveryYear: 1996, discoverer: 'Sigurd Hofmann et al.', etymologyOrigin: 'person', etymologyDescription: 'Nicolaus Copernicus, heliocentric model pioneer' },
  Nh:  { discoveryYear: 2003, discoverer: 'Kosuke Morita et al.', etymologyOrigin: 'place', etymologyDescription: 'Nihon: Japan, in Japanese' },
  Fl:  { discoveryYear: 1999, discoverer: 'Yuri Oganessian et al.', etymologyOrigin: 'place', etymologyDescription: 'Flerov Laboratory, named after Georgy Flyorov' },
  Mc:  { discoveryYear: 2003, discoverer: 'Yuri Oganessian et al.', etymologyOrigin: 'place', etymologyDescription: 'Moscow Oblast, Russia' },
  Lv:  { discoveryYear: 2000, discoverer: 'Yuri Oganessian et al.', etymologyOrigin: 'place', etymologyDescription: 'Lawrence Livermore National Laboratory, California' },
  Ts:  { discoveryYear: 2010, discoverer: 'Yuri Oganessian et al.', etymologyOrigin: 'place', etymologyDescription: 'Tennessee, US state with Oak Ridge National Laboratory' },
  Og:  { discoveryYear: 2002, discoverer: 'Yuri Oganessian et al.', etymologyOrigin: 'person', etymologyDescription: 'Yuri Oganessian, prolific superheavy element researcher' },
};

function run() {
  const raw = readFileSync(seedPath, 'utf-8');
  const elements = JSON.parse(raw);

  for (const el of elements) {
    const enrichment = ENRICHMENT[el.symbol];
    if (enrichment) {
      el.discoveryYear = enrichment.discoveryYear;
      el.discoverer = enrichment.discoverer;
      el.etymologyOrigin = enrichment.etymologyOrigin;
      el.etymologyDescription = enrichment.etymologyDescription;
    } else {
      console.warn(`No enrichment for ${el.symbol}`);
      el.discoveryYear = null;
      el.discoverer = 'Unknown';
      el.etymologyOrigin = 'unknown';
      el.etymologyDescription = '';
    }
  }

  writeFileSync(seedPath, JSON.stringify(elements, null, 2) + '\n');
  console.log(`Enriched ${elements.length} elements with discovery/etymology data`);
}

run();
