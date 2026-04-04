import type { ElementRecord, ElementSources } from '../../src/lib/types';

export const TEST_ACCESS_DATE = new Date().toISOString().slice(0, 10);

export const FE: ElementRecord = {
  atomicNumber: 26,
  symbol: 'Fe',
  name: 'Iron',
  wikidataId: 'Q677',
  wikipediaTitle: 'Iron',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Iron',
  period: 4,
  group: 8,
  block: 'd',
  category: 'transition metal',
  phase: 'solid',
  mass: 55.84,
  electronegativity: 1.83,
  ionizationEnergy: 7.902,
  radius: 194,
  density: 7.874,
  meltingPoint: 1811,
  boilingPoint: 3134,
  halfLife: null,
  summary:
    'Iron is a chemical element; it has symbol Fe and atomic number 26. It is a metal that belongs to the first transition series and group 8 of the periodic table.',
  discoveryYear: null,
  discoverer: 'Known since antiquity',
  etymologyOrigin: 'property',
  etymologyDescription: 'Anglo-Saxon iron; symbol from Latin ferrum',
  neighbors: ['Mn', 'Co'],
  rankings: {
    mass: 93,
    electronegativity: 41,
    ionizationEnergy: 35,
    radius: 67,
  },
};

export const FE_SOURCES: ElementSources = {
  structured: {
    provider: 'PubChem',
    license: 'public domain',
    url: 'https://pubchem.ncbi.nlm.nih.gov/element/26',
  },
  identifiers: {
    provider: 'Wikidata',
    license: 'CC0 1.0',
    url: 'https://www.wikidata.org/wiki/Q677',
  },
  summary: {
    provider: 'Wikipedia',
    title: 'Iron',
    url: 'https://en.wikipedia.org/wiki/Iron',
    license: 'CC BY-SA 4.0',
    accessDate: TEST_ACCESS_DATE,
  },
};
