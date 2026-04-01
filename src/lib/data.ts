import rawElements from '../../data/generated/elements.json';
import type { ElementRecord } from './types';

/**
 * All 118 elements — loaded eagerly for modules that need sync access at
 * module scope (grid.ts adjacency maps, PeriodicTable cell positions).
 *
 * Vite code-splits the JSON into its own chunk (`elements-*.js`) via the
 * static import, so this does NOT bloat the index bundle.
 */
export const allElements: ElementRecord[] = rawElements as ElementRecord[];

const bySymbol = new Map<string, ElementRecord>(
  allElements.map((el) => [el.symbol, el]),
);

export function getElement(symbol: string): ElementRecord | undefined {
  return bySymbol.get(symbol);
}

export function searchElements(query: string): ElementRecord[] {
  if (!query.trim()) return allElements;
  const q = query.toLowerCase().trim();
  const matches = allElements.filter(
    (el) =>
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q),
  );
  // Sort by relevance: exact symbol > exact name > symbol starts-with > name starts-with > rest
  return matches.sort((a, b) => {
    const aSymL = a.symbol.toLowerCase();
    const bSymL = b.symbol.toLowerCase();
    const aNameL = a.name.toLowerCase();
    const bNameL = b.name.toLowerCase();
    const aScore =
      aSymL === q ? 0 : aNameL === q ? 1 : aSymL.startsWith(q) ? 2 : aNameL.startsWith(q) ? 3 : 4;
    const bScore =
      bSymL === q ? 0 : bNameL === q ? 1 : bSymL.startsWith(q) ? 2 : bNameL.startsWith(q) ? 3 : 4;
    return aScore - bScore || a.atomicNumber - b.atomicNumber;
  });
}

