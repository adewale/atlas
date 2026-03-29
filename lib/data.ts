import elements from '@/data/generated/elements.json';
import textCredits from '@/data/generated/text-credits.json';
import imageCredits from '@/data/generated/image-credits.json';
import type { ElementRecord } from './types';

export const allElements = elements as ElementRecord[];
export const textCreditsIndex = textCredits as Record<string, { wikipediaTitle: string; wikipediaUrl: string }>;
export const imageCreditsIndex = imageCredits as Record<string, { title: string; source: string; license: string; artist?: string }>;

export const bySymbol = new Map(allElements.map((el) => [el.symbol.toUpperCase(), el]));

export function getElement(symbol: string) {
  return bySymbol.get(symbol.toUpperCase());
}

export function searchElements(q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return allElements;
  return allElements.filter((el) => el.name.toLowerCase().includes(term) || el.symbol.toLowerCase().includes(term));
}
