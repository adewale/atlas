import rawElements from '../../data/generated/elements.json';
import type { ElementRecord } from './types';

export const allElements: ElementRecord[] = rawElements as ElementRecord[];

const bySymbol = new Map<string, ElementRecord>(
  allElements.map((el) => [el.symbol, el]),
);

const searchable = allElements.map((el) => ({
  el,
  symbolLower: el.symbol.toLowerCase(),
  nameLower: el.name.toLowerCase(),
}));

export function getElement(symbol: string): ElementRecord | undefined {
  return bySymbol.get(symbol);
}

export function searchElements(query: string): ElementRecord[] {
  if (!query.trim()) return allElements;
  const q = query.toLowerCase().trim();
  const matches: { el: ElementRecord; score: number }[] = [];

  for (const candidate of searchable) {
    const symbolIncludes = candidate.symbolLower.includes(q);
    const nameIncludes = candidate.nameLower.includes(q);
    if (!symbolIncludes && !nameIncludes) continue;

    const score =
      candidate.symbolLower === q
        ? 0
        : candidate.nameLower === q
          ? 1
          : candidate.symbolLower.startsWith(q)
            ? 2
            : candidate.nameLower.startsWith(q)
              ? 3
              : 4;

    matches.push({ el: candidate.el, score });
  }

  // Sort by relevance: exact symbol > exact name > symbol starts-with > name starts-with > rest
  matches.sort((a, b) => a.score - b.score || a.el.atomicNumber - b.el.atomicNumber);

  return matches.map((match) => match.el);
}
