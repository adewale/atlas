import elementsJson from '../../data/generated/elements.json';
import groupsJson from '../../data/generated/groups.json';
import periodsJson from '../../data/generated/periods.json';
import blocksJson from '../../data/generated/blocks.json';
import categoriesJson from '../../data/generated/categories.json';
import anomaliesJson from '../../data/generated/anomalies.json';
import discoverersJson from '../../data/generated/discoverers.json';
import { ERA_BINS } from '../../shared/era-bins';
import { ALL_PROPERTIES } from './properties';
import { toUrlSlug } from './slugs';
import type {
  AnomalyData,
  BlockData,
  CategoryData,
  DiscovererData,
  ElementRecord,
  GroupData,
  PeriodData,
} from './types';

export const SITE_ORIGIN = 'https://atlas-48p.pages.dev';
export const SITE_NAME = 'Atlas';
export const SOCIAL_IMAGE_PATH = '/social-card.png';
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}${SOCIAL_IMAGE_PATH}`;
export const SOCIAL_IMAGE_ALT = 'Atlas periodic table rendered as a geometric field of chemical elements';

const DEFAULT_DESCRIPTION =
  'Explore all 118 chemical elements through an interactive periodic table, element folios, discovery history, etymology, properties, and comparisons.';
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex,follow';

const elements = elementsJson as ElementRecord[];
const groups = groupsJson as GroupData[];
const periods = periodsJson as PeriodData[];
const blocks = blocksJson as BlockData[];
const categories = categoriesJson as CategoryData[];
const anomalies = anomaliesJson as AnomalyData[];
const discoverers = discoverersJson as DiscovererData[];

const elementBySymbol = new Map(elements.map((element) => [element.symbol, element]));

type SchemaNode = Record<string, unknown>;

export type SeoMetadata = {
  path: string;
  canonicalPath: string;
  canonicalUrl: string;
  title: string;
  description: string;
  robots: string;
  ogType: 'website';
  imageUrl: string;
  imageAlt: string;
  schema: SchemaNode;
};

type Breadcrumb = { name: string; path: string };
type ListEntry = { name: string; path: string };

type StaticPage = {
  heading: string;
  description: string;
  schemaType?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  breadcrumbs?: Breadcrumb[];
  listEntries?: () => ListEntry[];
};

function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function normalizePath(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] || '/';
  if (withoutQueryOrHash === '/') return '/';
  return `/${withoutQueryOrHash.replace(/^\/+|\/+$/g, '')}`;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

function concise(value: string, maxLength = 200): string {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const candidate = text.slice(0, maxLength - 1);
  const boundary = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, boundary > maxLength * 0.65 ? boundary : candidate.length).trimEnd()}…`;
}

function breadcrumbNode(canonicalUrl: string, breadcrumbs: Breadcrumb[]): SchemaNode | null {
  if (breadcrumbs.length === 0) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function itemListNode(canonicalUrl: string, entries: ListEntry[]): SchemaNode {
  return {
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#item-list`,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      url: absoluteUrl(entry.path),
    })),
  };
}

function createPageMetadata(options: {
  path: string;
  heading: string;
  description: string;
  schemaType?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  breadcrumbs?: Breadcrumb[];
  listEntries?: ListEntry[];
  extraNodes?: SchemaNode[];
  mainEntityId?: string;
  canonicalPath?: string;
  robots?: string;
}): SeoMetadata {
  const canonicalPath = options.canonicalPath ?? options.path;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const description = concise(options.description);
  const pageId = `${canonicalUrl}#webpage`;
  const breadcrumbs = options.breadcrumbs ?? [];
  const breadcrumb = breadcrumbNode(canonicalUrl, breadcrumbs);
  const list = options.listEntries ? itemListNode(canonicalUrl, options.listEntries) : null;
  const pageNode: SchemaNode = {
    '@type': options.schemaType ?? 'WebPage',
    '@id': pageId,
    url: canonicalUrl,
    name: options.heading,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    primaryImageOfPage: { '@id': `${canonicalUrl}#primaryimage` },
  };

  if (breadcrumb) pageNode.breadcrumb = { '@id': `${canonicalUrl}#breadcrumb` };
  if (options.mainEntityId) pageNode.mainEntity = { '@id': options.mainEntityId };
  else if (list) pageNode.mainEntity = { '@id': `${canonicalUrl}#item-list` };

  const imageNode: SchemaNode = {
    '@type': 'ImageObject',
    '@id': `${canonicalUrl}#primaryimage`,
    url: SOCIAL_IMAGE_URL,
    contentUrl: SOCIAL_IMAGE_URL,
    width: 1200,
    height: 630,
    caption: SOCIAL_IMAGE_ALT,
  };

  const graph: SchemaNode[] = [pageNode, imageNode];
  if (breadcrumb) graph.push(breadcrumb);
  if (list) graph.push(list);
  if (options.extraNodes) graph.push(...options.extraNodes);

  return {
    path: options.path,
    canonicalPath,
    canonicalUrl,
    title: `${options.heading} — ${SITE_NAME}`,
    description,
    robots: options.robots ?? INDEX_ROBOTS,
    ogType: 'website',
    imageUrl: SOCIAL_IMAGE_URL,
    imageAlt: SOCIAL_IMAGE_ALT,
    schema: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  };
}

function homeMetadata(): SeoMetadata {
  const canonicalUrl = `${SITE_ORIGIN}/`;
  const pageNode: SchemaNode = {
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: 'Atlas — Interactive Periodic Table',
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en',
    isPartOf: { '@id': `${canonicalUrl}#website` },
    primaryImageOfPage: { '@id': `${canonicalUrl}#primaryimage` },
    mainEntity: { '@id': `${canonicalUrl}#application` },
  };
  const graph: SchemaNode[] = [
    {
      '@type': 'WebSite',
      '@id': `${canonicalUrl}#website`,
      url: canonicalUrl,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_ORIGIN}/explore?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    pageNode,
    {
      '@type': 'WebApplication',
      '@id': `${canonicalUrl}#application`,
      url: canonicalUrl,
      name: 'Atlas Interactive Periodic Table',
      description: DEFAULT_DESCRIPTION,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
      isAccessibleForFree: true,
      inLanguage: 'en',
    },
    {
      '@type': 'Dataset',
      '@id': `${canonicalUrl}#dataset`,
      url: canonicalUrl,
      name: 'Atlas chemical element dataset',
      description: 'Structured reference data for all 118 known chemical elements, including identifiers, periodic position, physical properties, discovery history, and etymology.',
      inLanguage: 'en',
      keywords: ['periodic table', 'chemical elements', 'atomic properties', 'element discoveries'],
      variableMeasured: ['Atomic number', 'Atomic mass', ...ALL_PROPERTIES.map((property) => property.label)],
      isBasedOn: [
        'https://pubchem.ncbi.nlm.nih.gov/',
        'https://www.wikidata.org/',
        'https://en.wikipedia.org/',
      ],
    },
    {
      '@type': 'ImageObject',
      '@id': `${canonicalUrl}#primaryimage`,
      url: SOCIAL_IMAGE_URL,
      contentUrl: SOCIAL_IMAGE_URL,
      width: 1200,
      height: 630,
      caption: SOCIAL_IMAGE_ALT,
    },
  ];

  return {
    path: '/',
    canonicalPath: '/',
    canonicalUrl,
    title: 'Atlas — Interactive Periodic Table',
    description: DEFAULT_DESCRIPTION,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    imageUrl: SOCIAL_IMAGE_URL,
    imageAlt: SOCIAL_IMAGE_ALT,
    schema: { '@context': 'https://schema.org', '@graph': graph },
  };
}

const staticPages: Record<string, StaticPage> = {
  '/elements': {
    heading: 'Chemical Elements',
    description: 'Browse all 118 known chemical elements by atomic number, from hydrogen to oganesson, with direct links to every Atlas element folio.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Elements', path: '/elements' }],
    listEntries: () => elements.map((element) => ({ name: `${element.name} (${element.symbol})`, path: `/elements/${element.symbol}` })),
  },
  '/groups': {
    heading: 'Periodic Table Groups',
    description: 'Browse the 18 IUPAC groups of the periodic table and see how shared valence structures connect each vertical family of elements.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Groups', path: '/groups' }],
    listEntries: () => groups.map((group) => ({ name: `Group ${group.n}: ${group.label}`, path: `/groups/${group.n}` })),
  },
  '/periods': {
    heading: 'Periodic Table Periods',
    description: 'Browse all seven periods of the periodic table, from hydrogen and helium in period 1 to the actinides and superheavy elements in period 7.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Periods', path: '/periods' }],
    listEntries: () => periods.map((period) => ({ name: period.label, path: `/periods/${period.n}` })),
  },
  '/blocks': {
    heading: 'Electron Blocks',
    description: 'Explore the s, p, d, and f electron blocks that organize elements by the orbital filled by their outermost electrons.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Blocks', path: '/blocks' }],
    listEntries: () => blocks.map((block) => ({ name: block.label, path: `/blocks/${block.block}` })),
  },
  '/categories': {
    heading: 'Element Categories',
    description: 'Explore chemical families including alkali metals, transition metals, metalloids, halogens, noble gases, lanthanides, and actinides.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Categories', path: '/categories' }],
    listEntries: () => categories.map((category) => ({ name: category.label, path: `/categories/${toUrlSlug(category.slug)}` })),
  },
  '/properties': {
    heading: 'Element Property Rankings',
    description: 'Rank all chemical elements by atomic mass, electronegativity, ionisation energy, radius, density, melting point, or boiling point.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Properties', path: '/properties' }],
    listEntries: () => ALL_PROPERTIES.map((property) => ({ name: property.label, path: `/properties/${property.key}` })),
  },
  '/anomalies': {
    heading: 'Periodic Table Anomalies',
    description: 'Explore the elements and relationships that break simple periodic trends, from electron-configuration exceptions to the metalloid boundary.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Anomalies', path: '/anomalies' }],
    listEntries: () => anomalies.map((anomaly) => ({ name: anomaly.label, path: `/anomalies/${anomaly.slug}` })),
  },
  '/about': {
    heading: 'About Atlas',
    description: 'How Atlas turns the periodic table into a navigable graph, combining Oliver Byrne-inspired geometry with dense, linked chemical reference data.',
    schemaType: 'AboutPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'About', path: '/about' }],
  },
  '/about/credits': {
    heading: 'Data Sources and Credits',
    description: 'Sources, licences, and attribution for the PubChem, Wikidata, Wikipedia, and open-source software data used throughout Atlas.',
    schemaType: 'AboutPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'About', path: '/about' }, { name: 'Credits', path: '/about/credits' }],
  },
  '/about/design': {
    heading: 'Atlas Design Language',
    description: 'The colour, typography, spacing, and geometric principles behind Atlas and its Byrne- and Tufte-inspired presentation of chemical data.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'About', path: '/about' }, { name: 'Design', path: '/about/design' }],
  },
  '/about/animation-palette': {
    heading: 'Atlas Animation Palette',
    description: 'A reference for the motion patterns, durations, easing curves, and view transitions used throughout the Atlas interface.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'About', path: '/about' }, { name: 'Animation Palette', path: '/about/animation-palette' }],
  },
  '/about/entity-map': {
    heading: 'Atlas Entity Map',
    description: 'A map of every navigable entity in Atlas, connecting elements with groups, periods, blocks, categories, properties, anomalies, discoverers, and eras.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'About', path: '/about' }, { name: 'Entity Map', path: '/about/entity-map' }],
  },
  '/discoverers': {
    heading: 'Element Discoverers',
    description: 'Browse the scientists, teams, and historical sources credited with the discovery of the 118 chemical elements.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Discoverers', path: '/discoverers' }],
    listEntries: () => discoverers.map((discoverer) => ({ name: discoverer.name, path: `/discoverers/${encodeURIComponent(discoverer.name)}` })),
  },
  '/eras': {
    heading: 'Element Discovery Eras',
    description: 'Browse eight eras of element discovery, from substances known in antiquity to the synthetic superheavy elements of the 21st century.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Eras', path: '/eras' }],
    listEntries: () => ERA_BINS.map((era) => ({ name: era.label, path: `/eras/${era.slug}` })),
  },
  '/explore': {
    heading: 'Explore the Periodic Table',
    description: 'Search and filter the Atlas graph across elements, groups, categories, properties, discoverers, eras, etymologies, and anomalies.',
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Explore', path: '/explore' }],
  },
  '/discovery-timeline': {
    heading: 'Element Discovery Timeline',
    description: 'Explore when all 118 chemical elements were discovered, from substances known in antiquity to modern laboratory synthesis.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Discovery Timeline', path: '/discovery-timeline' }],
  },
  '/phase-landscape': {
    heading: 'Element Phase Landscape',
    description: 'Compare the melting and boiling points of all 118 elements in an interactive phase landscape coloured by electron block.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Phase Landscape', path: '/phase-landscape' }],
  },
  '/property-scatter': {
    heading: 'Element Property Scatter Plot',
    description: 'Plot atomic mass, electronegativity, ionisation energy, radius, density, melting point, and boiling point against one another.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Property Scatter', path: '/property-scatter' }],
  },
  '/anomaly-explorer': {
    heading: 'Periodic Anomaly Explorer',
    description: 'Interactively explore chemical elements that break expected periodic trends and the deeper physical effects behind those exceptions.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Anomaly Explorer', path: '/anomaly-explorer' }],
  },
  '/etymology-map': {
    heading: 'Element Etymology Map',
    description: 'Explore the origins of chemical element names, grouped by people, places, mythology, minerals, astronomical objects, and properties.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Etymology Map', path: '/etymology-map' }],
  },
  '/discoverer-network': {
    heading: 'Element Discoverer Network',
    description: 'Explore the network connecting scientists and teams to their chemical element discoveries, collaborations, and historical eras.',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Discoverer Network', path: '/discoverer-network' }],
  },
};

export const STATIC_SEO_PATHS = ['/', ...Object.keys(staticPages)] as const;

function staticMetadata(path: string): SeoMetadata | null {
  if (path === '/') return homeMetadata();
  const page = staticPages[path];
  if (!page) return null;
  return createPageMetadata({
    path,
    heading: page.heading,
    description: page.description,
    schemaType: page.schemaType,
    breadcrumbs: page.breadcrumbs,
    listEntries: page.listEntries?.(),
  });
}

function elementSchema(element: ElementRecord, canonicalUrl: string, description: string): SchemaNode {
  const properties: SchemaNode[] = [
    { '@type': 'PropertyValue', name: 'Atomic number', value: element.atomicNumber },
    { '@type': 'PropertyValue', name: 'Atomic mass', value: element.mass, unitText: 'Da' },
    { '@type': 'PropertyValue', name: 'Period', value: element.period },
    { '@type': 'PropertyValue', name: 'Electron block', value: `${element.block}-block` },
    { '@type': 'PropertyValue', name: 'Category', value: element.category },
    { '@type': 'PropertyValue', name: 'Phase at standard conditions', value: element.phase },
  ];
  if (element.group != null) properties.push({ '@type': 'PropertyValue', name: 'Group', value: element.group });
  if (element.electronegativity != null) properties.push({ '@type': 'PropertyValue', name: 'Electronegativity', value: element.electronegativity });
  if (element.ionizationEnergy != null) properties.push({ '@type': 'PropertyValue', name: 'Ionisation energy', value: element.ionizationEnergy, unitText: 'eV' });
  if (element.radius != null) properties.push({ '@type': 'PropertyValue', name: 'Atomic radius', value: element.radius, unitText: 'pm' });
  if (element.density != null) properties.push({ '@type': 'PropertyValue', name: 'Density', value: element.density, unitText: 'g/cm³' });
  if (element.meltingPoint != null) properties.push({ '@type': 'PropertyValue', name: 'Melting point', value: element.meltingPoint, unitText: 'K' });
  if (element.boilingPoint != null) properties.push({ '@type': 'PropertyValue', name: 'Boiling point', value: element.boilingPoint, unitText: 'K' });

  return {
    '@type': 'ChemicalSubstance',
    '@id': `${canonicalUrl}#element`,
    url: canonicalUrl,
    name: element.name,
    alternateName: element.symbol,
    description,
    chemicalComposition: element.symbol,
    image: SOCIAL_IMAGE_URL,
    identifier: [
      { '@type': 'PropertyValue', name: 'Chemical symbol', value: element.symbol },
      { '@type': 'PropertyValue', name: 'Atomic number', value: element.atomicNumber },
      { '@type': 'PropertyValue', propertyID: 'Wikidata', value: element.wikidataId },
    ],
    sameAs: [element.wikipediaUrl, `https://www.wikidata.org/wiki/${element.wikidataId}`],
    additionalProperty: properties,
    mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
  };
}

function elementMetadata(element: ElementRecord): SeoMetadata {
  const path = `/elements/${element.symbol}`;
  const canonicalUrl = absoluteUrl(path);
  const description = concise(
    `${element.name} (${element.symbol}) is the chemical element with atomic number ${element.atomicNumber}. ${element.summary}`,
  );
  return createPageMetadata({
    path,
    heading: `${element.name} (${element.symbol}) — Atomic Number ${element.atomicNumber}`,
    description,
    breadcrumbs: [
      { name: 'Atlas', path: '/' },
      { name: 'Elements', path: '/elements' },
      { name: element.name, path },
    ],
    mainEntityId: `${canonicalUrl}#element`,
    extraNodes: [elementSchema(element, canonicalUrl, description)],
  });
}

function groupMetadata(group: GroupData): SeoMetadata {
  const path = `/groups/${group.n}`;
  return createPageMetadata({
    path,
    heading: `Group ${group.n}: ${group.label}`,
    description: group.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Groups', path: '/groups' }, { name: `Group ${group.n}`, path }],
    listEntries: group.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function periodMetadata(period: PeriodData): SeoMetadata {
  const path = `/periods/${period.n}`;
  return createPageMetadata({
    path,
    heading: period.label,
    description: period.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Periods', path: '/periods' }, { name: period.label, path }],
    listEntries: period.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function blockMetadata(block: BlockData): SeoMetadata {
  const path = `/blocks/${block.block}`;
  return createPageMetadata({
    path,
    heading: block.label,
    description: block.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Blocks', path: '/blocks' }, { name: block.label, path }],
    listEntries: block.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function categoryMetadata(category: CategoryData): SeoMetadata {
  const path = `/categories/${toUrlSlug(category.slug)}`;
  return createPageMetadata({
    path,
    heading: category.label,
    description: category.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Categories', path: '/categories' }, { name: category.label, path }],
    listEntries: category.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function propertyMetadata(property: (typeof ALL_PROPERTIES)[number]): SeoMetadata {
  const path = `/properties/${property.key}`;
  const ranked = [...elements]
    .filter((element) => element[property.key] != null)
    .sort((a, b) => (b[property.key] as number) - (a[property.key] as number));
  return createPageMetadata({
    path,
    heading: `Elements Ranked by ${property.label}`,
    description: `Compare all chemical elements with known ${property.label.toLowerCase()} values, ranked from highest to lowest${property.unit ? ` in ${property.unit}` : ''}.`,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Properties', path: '/properties' }, { name: property.label, path }],
    listEntries: ranked.map((element) => ({ name: element.name, path: `/elements/${element.symbol}` })),
  });
}

function anomalyMetadata(anomaly: AnomalyData): SeoMetadata {
  const path = `/anomalies/${anomaly.slug}`;
  return createPageMetadata({
    path,
    heading: anomaly.label,
    description: anomaly.description,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Anomalies', path: '/anomalies' }, { name: anomaly.label, path }],
    listEntries: anomaly.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function discovererMetadata(discoverer: DiscovererData): SeoMetadata {
  const path = `/discoverers/${encodeURIComponent(discoverer.name)}`;
  const elementNames = discoverer.elements.map((symbol) => elementBySymbol.get(symbol)?.name ?? symbol);
  return createPageMetadata({
    path,
    heading: `${discoverer.name} — Element Discoveries`,
    description: `${discoverer.name} is credited in Atlas with ${discoverer.elements.length} element discover${discoverer.elements.length === 1 ? 'y' : 'ies'}: ${elementNames.join(', ')}.`,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Discoverers', path: '/discoverers' }, { name: discoverer.name, path }],
    listEntries: discoverer.elements.map((symbol) => ({ name: elementBySymbol.get(symbol)?.name ?? symbol, path: `/elements/${symbol}` })),
  });
}

function eraMetadata(era: (typeof ERA_BINS)[number]): SeoMetadata {
  const path = `/eras/${era.slug}`;
  const eraElements = elements.filter((element) => {
    const year = element.discoveryYear;
    if (era.minYear == null) return year == null || year < 1700;
    if (year == null || year < era.minYear) return false;
    return era.maxYear == null || year <= era.maxYear;
  });
  return createPageMetadata({
    path,
    heading: `${era.label} — Element Discovery Era`,
    description: `Explore the ${eraElements.length} chemical elements associated with the ${era.label} discovery era, their discoverers, properties, and neighbouring eras.`,
    schemaType: 'CollectionPage',
    breadcrumbs: [{ name: 'Atlas', path: '/' }, { name: 'Eras', path: '/eras' }, { name: era.label, path }],
    listEntries: eraElements.map((element) => ({ name: element.name, path: `/elements/${element.symbol}` })),
  });
}

export function canonicalComparisonPath(symbol: string, other: string): string | null {
  const elementA = elementBySymbol.get(symbol);
  const elementB = elementBySymbol.get(other);
  if (!elementA || !elementB) return null;
  if (elementA.atomicNumber === elementB.atomicNumber) return `/elements/${elementA.symbol}`;
  const [first, second] = elementA.atomicNumber < elementB.atomicNumber
    ? [elementA, elementB]
    : [elementB, elementA];
  return `/elements/${first.symbol}/compare/${second.symbol}`;
}

function comparisonMetadata(elementA: ElementRecord, elementB: ElementRecord): SeoMetadata {
  const canonicalPath = canonicalComparisonPath(elementA.symbol, elementB.symbol);
  if (!canonicalPath || canonicalPath === `/elements/${elementA.symbol}`) return elementMetadata(elementA);
  const [first, second] = elementA.atomicNumber < elementB.atomicNumber
    ? [elementA, elementB]
    : [elementB, elementA];
  const canonicalUrl = absoluteUrl(canonicalPath);
  const firstId = `${absoluteUrl(`/elements/${first.symbol}`)}#element`;
  const secondId = `${absoluteUrl(`/elements/${second.symbol}`)}#element`;
  return createPageMetadata({
    path: canonicalPath,
    canonicalPath,
    heading: `${first.name} vs ${second.name} — Element Comparison`,
    description: `Compare ${first.name} (${first.symbol}) and ${second.name} (${second.symbol}) side by side: atomic structure, physical properties, discovery history, etymology, and periodic relationships.`,
    breadcrumbs: [
      { name: 'Atlas', path: '/' },
      { name: 'Elements', path: '/elements' },
      { name: first.name, path: `/elements/${first.symbol}` },
      { name: `${first.symbol} vs ${second.symbol}`, path: canonicalPath },
    ],
    mainEntityId: `${canonicalUrl}#comparison`,
    extraNodes: [
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#comparison`,
        numberOfItems: 2,
        itemListElement: [
          { '@type': 'ListItem', position: 1, item: { '@id': firstId, name: first.name, url: absoluteUrl(`/elements/${first.symbol}`) } },
          { '@type': 'ListItem', position: 2, item: { '@id': secondId, name: second.name, url: absoluteUrl(`/elements/${second.symbol}`) } },
        ],
      },
    ],
  });
}

export function getSeoMetadata(pathname: string): SeoMetadata | null {
  const path = normalizePath(pathname);
  const knownStatic = staticMetadata(path);
  if (knownStatic) return knownStatic;

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === 'elements') {
    const symbol = safeDecode(segments[1]);
    const element = symbol ? elementBySymbol.get(symbol) : undefined;
    return element ? elementMetadata(element) : null;
  }
  if (segments.length === 4 && segments[0] === 'elements' && segments[2] === 'compare') {
    const symbol = safeDecode(segments[1]);
    const other = safeDecode(segments[3]);
    const elementA = symbol ? elementBySymbol.get(symbol) : undefined;
    const elementB = other ? elementBySymbol.get(other) : undefined;
    return elementA && elementB ? comparisonMetadata(elementA, elementB) : null;
  }
  if (segments.length !== 2) return null;

  const value = safeDecode(segments[1]);
  if (value == null) return null;
  switch (segments[0]) {
    case 'groups': {
      if (!/^(?:[1-9]|1[0-8])$/.test(value)) return null;
      const group = groups.find((entry) => entry.n === Number(value));
      return group ? groupMetadata(group) : null;
    }
    case 'periods': {
      if (!/^[1-7]$/.test(value)) return null;
      const period = periods.find((entry) => entry.n === Number(value));
      return period ? periodMetadata(period) : null;
    }
    case 'blocks': {
      const block = blocks.find((entry) => entry.block === value);
      return block ? blockMetadata(block) : null;
    }
    case 'categories': {
      const category = categories.find((entry) => toUrlSlug(entry.slug) === value);
      return category ? categoryMetadata(category) : null;
    }
    case 'properties': {
      const property = ALL_PROPERTIES.find((entry) => entry.key === value);
      return property ? propertyMetadata(property) : null;
    }
    case 'anomalies': {
      const anomaly = anomalies.find((entry) => entry.slug === value);
      return anomaly ? anomalyMetadata(anomaly) : null;
    }
    case 'discoverers': {
      const discoverer = discoverers.find((entry) => entry.name === value);
      return discoverer ? discovererMetadata(discoverer) : null;
    }
    case 'eras': {
      const era = ERA_BINS.find((entry) => entry.slug === value);
      return era ? eraMetadata(era) : null;
    }
    default:
      return null;
  }
}

export function getNotFoundMetadata(pathname: string): SeoMetadata {
  const path = normalizePath(pathname);
  return createPageMetadata({
    path,
    canonicalPath: '/',
    heading: 'Page Not Found',
    description: 'The requested Atlas page could not be found. Return to the interactive periodic table to continue exploring the chemical elements.',
    robots: NOINDEX_ROBOTS,
    breadcrumbs: [{ name: 'Atlas', path: '/' }],
  });
}

export function* getIndexableSeoRoutes(): Generator<SeoMetadata> {
  for (const path of STATIC_SEO_PATHS) {
    const metadata = getSeoMetadata(path);
    if (metadata) yield metadata;
  }
  for (const element of elements) yield elementMetadata(element);
  for (const group of groups) yield groupMetadata(group);
  for (const period of periods) yield periodMetadata(period);
  for (const block of blocks) yield blockMetadata(block);
  for (const category of categories) yield categoryMetadata(category);
  for (const property of ALL_PROPERTIES) yield propertyMetadata(property);
  for (const anomaly of anomalies) yield anomalyMetadata(anomaly);
  for (const discoverer of discoverers) yield discovererMetadata(discoverer);
  for (const era of ERA_BINS) yield eraMetadata(era);
  for (let first = 0; first < elements.length; first += 1) {
    for (let second = first + 1; second < elements.length; second += 1) {
      yield comparisonMetadata(elements[first], elements[second]);
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

export function renderSeoHead(metadata: SeoMetadata): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonical = escapeHtml(metadata.canonicalUrl);
  const image = escapeHtml(metadata.imageUrl);
  const imageAlt = escapeHtml(metadata.imageAlt);
  return [
    `    <title>${title}</title>`,
    `    <meta name="description" content="${description}" data-atlas-seo />`,
    `    <meta name="robots" content="${escapeHtml(metadata.robots)}" data-atlas-seo />`,
    `    <meta name="googlebot" content="${escapeHtml(metadata.robots)}" data-atlas-seo />`,
    `    <link rel="canonical" href="${canonical}" data-atlas-seo />`,
    '    <meta property="og:locale" content="en_GB" data-atlas-seo />',
    '    <meta property="og:site_name" content="Atlas" data-atlas-seo />',
    `    <meta property="og:type" content="${metadata.ogType}" data-atlas-seo />`,
    `    <meta property="og:title" content="${title}" data-atlas-seo />`,
    `    <meta property="og:description" content="${description}" data-atlas-seo />`,
    `    <meta property="og:url" content="${canonical}" data-atlas-seo />`,
    `    <meta property="og:image" content="${image}" data-atlas-seo />`,
    `    <meta property="og:image:secure_url" content="${image}" data-atlas-seo />`,
    '    <meta property="og:image:type" content="image/png" data-atlas-seo />',
    '    <meta property="og:image:width" content="1200" data-atlas-seo />',
    '    <meta property="og:image:height" content="630" data-atlas-seo />',
    `    <meta property="og:image:alt" content="${imageAlt}" data-atlas-seo />`,
    '    <meta name="twitter:card" content="summary_large_image" data-atlas-seo />',
    `    <meta name="twitter:title" content="${title}" data-atlas-seo />`,
    `    <meta name="twitter:description" content="${description}" data-atlas-seo />`,
    `    <meta name="twitter:image" content="${image}" data-atlas-seo />`,
    `    <meta name="twitter:image:alt" content="${imageAlt}" data-atlas-seo />`,
    `    <script id="atlas-structured-data" type="application/ld+json" data-atlas-seo>${safeJson(metadata.schema)}</script>`,
  ].join('\n');
}

export function renderSitemap(routes: Iterable<SeoMetadata>): string {
  const entries = [...routes]
    .map((route) => `  <url><loc>${escapeHtml(route.canonicalUrl)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function renderRobotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

function ensureSingleElement<T extends Element>(
  selector: string,
  create: () => T,
  root: ParentNode = document.head,
): T {
  const matches = [...root.querySelectorAll<T>(selector)];
  const element = matches.shift() ?? create();
  for (const duplicate of matches) duplicate.remove();
  if (!element.parentNode) document.head.appendChild(element);
  element.setAttribute('data-atlas-seo', '');
  return element;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  const element = ensureSingleElement(`meta[${attribute}="${key}"]`, () => document.createElement('meta'));
  element.setAttribute(attribute, key);
  element.setAttribute('content', content);
}

export function applySeoMetadata(metadata: SeoMetadata): void {
  document.title = metadata.title;
  setMeta('name', 'description', metadata.description);
  setMeta('name', 'robots', metadata.robots);
  setMeta('name', 'googlebot', metadata.robots);

  const canonical = ensureSingleElement('link[rel="canonical"]', () => document.createElement('link'));
  canonical.setAttribute('rel', 'canonical');
  canonical.setAttribute('href', metadata.canonicalUrl);

  const openGraph: Record<string, string> = {
    'og:locale': 'en_GB',
    'og:site_name': SITE_NAME,
    'og:type': metadata.ogType,
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:url': metadata.canonicalUrl,
    'og:image': metadata.imageUrl,
    'og:image:secure_url': metadata.imageUrl,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': metadata.imageAlt,
  };
  for (const [key, value] of Object.entries(openGraph)) setMeta('property', key, value);

  const twitter: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    'twitter:image': metadata.imageUrl,
    'twitter:image:alt': metadata.imageAlt,
  };
  for (const [key, value] of Object.entries(twitter)) setMeta('name', key, value);

  const structuredData = ensureSingleElement(
    'script#atlas-structured-data',
    () => document.createElement('script'),
  );
  structuredData.id = 'atlas-structured-data';
  structuredData.setAttribute('type', 'application/ld+json');
  structuredData.textContent = JSON.stringify(metadata.schema);
}
