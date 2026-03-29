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
  phase?: string;
  mass?: number;
  electronegativity?: number;
  ionizationEnergy?: number;
  radius?: number;
  summary?: string;
  image?: {
    title: string;
    url: string;
    artist?: string;
    license?: string;
    credit?: string;
  };
  neighbors: string[];
  rankings?: Record<string, number>;
};
