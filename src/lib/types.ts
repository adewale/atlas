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
  summary: string;
  neighbors: string[];
  rankings: Record<string, number>;
  sources?: ElementSources;
};

export type GroupData = { n: number; elements: string[] };
export type PeriodData = { n: number; elements: string[] };
export type BlockData = { block: string; elements: string[] };
export type CategoryData = { slug: string; elements: string[] };
export type RankingsData = Record<string, string[]>;
export type AnomalyData = {
  slug: string;
  label: string;
  description: string;
  elements: string[];
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
