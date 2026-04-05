import rawGridElements from '../../data/generated/grid-elements.json';
import type { GridElement } from './types';

/**
 * Slim element records (grid-elements.json, ~35 KB) — loaded eagerly for
 * modules that need sync access at module scope (grid.ts adjacency maps,
 * PeriodicTable cell positions, symbol validation in route loaders).
 *
 * Pages that need full ElementRecord fields (summary, rankings, discoverer,
 * etymology, etc.) obtain them from their route loaders (folio bundles,
 * timeline.json, etc.) — NOT from this module.
 */
export const allElements: GridElement[] = rawGridElements as GridElement[];

const bySymbol = new Map<string, GridElement>(
  allElements.map((el) => [el.symbol, el]),
);

export function getElement(symbol: string): GridElement | undefined {
  return bySymbol.get(symbol);
}

/** @test-only — used by tests only; runtime search uses searchLocal.ts */
export function searchElements(query: string): GridElement[] {
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

