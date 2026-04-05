export type SourceAttribution = {
  provider: string;
  license: string;
  url?: string;
  title?: string;
  accessDate?: string;
};

export type ElementSources = {
  structured: SourceAttribution;
  identifiers: SourceAttribution;
  summary: SourceAttribution;
};

export type ElementRecord = {
  atomicNumber: number;
  symbol: string;
  name: string;
  wikidataId: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  period: number;
  group: number | null;
  block: 's' | 'p' | 'd' | 'f';
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
  sources?: ElementSources;
};

export type GroupData = { n: number; label: string; description: string; elements: string[] };
export type PeriodData = { n: number; label: string; description: string; elements: string[] };
export type BlockData = { block: string; label: string; description: string; elements: string[] };
export type CategoryData = { slug: string; label: string; description: string; elements: string[] };
export type RankingsData = Record<string, string[]>;
export type AnomalyData = {
  slug: string;
  label: string;
  description: string;
  elements: string[];
};

export type DiscovererData = { name: string; elements: string[] };

export type TimelineEntry = { symbol: string; year: number | null; discoverer: string };
export type TimelineData = {
  antiquity: TimelineEntry[];
  timeline: TimelineEntry[];
};

/** Minimal element fields for the periodic table grid (grid-elements.json). */
export type GridElement = {
  atomicNumber: number;
  symbol: string;
  name: string;
  block: 's' | 'p' | 'd' | 'f';
  group: number | null;
  period: number;
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
  neighbors: string[];
};

/** Resolved element reference for folio navigation. */
export type ElementRef = { symbol: string; name: string };

/** Pre-resolved folio bundle (folio-{Symbol}.json). */
export type FolioBundle = {
  element: ElementRecord;
  group: GroupData | null;
  anomalies: { slug: string; label: string; elementCount: number }[];
  nav: {
    prevInGroup: ElementRef | null;
    nextInGroup: ElementRef | null;
    prevInPeriod: ElementRef | null;
    nextInPeriod: ElementRef | null;
    prevInBlock: ElementRef | null;
    nextInBlock: ElementRef | null;
    prevInCategory: ElementRef | null;
    nextInCategory: ElementRef | null;
  };
  groupPhases: (string | null)[] | null;
  neighbors: { symbol: string; name: string; block: string }[];
  sameDiscoverer: { symbol: string; name: string; block: string }[];
  sameEtymology: { symbol: string; name: string; block: string }[];
};

/* ------------------------------------------------------------------ */
/* Enrichment types (entity-enrichment-spec.md)                       */
/* ------------------------------------------------------------------ */

/** A single enrichment section returned from the API. */
export type EnrichedSection = {
  entityId: string;
  sectionSlug: string;
  sectionTitle: string;
  bodyText: string;
  sourceUrl: string | null;
  license: string | null;
};

/** A directional cross-reference between two entities. */
export type EntityRef = {
  sourceId: string;
  targetId: string;
  relType: string;
};

export type CreditsData = {
  structured: { provider: string; license: string; url: string };
  identifiers: { provider: string; license: string; url: string };
  summaries: Array<{
    symbol: string;
    name: string;
    title: string;
    url: string;
    license: string;
    accessDate: string;
  }>;
  software: Array<{ name: string; url: string; license: string }>;
};
