import rawElements from '../../data/generated/elements.json';
import type { ElementRecord } from './types';

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
  return allElements.filter(
    (el) =>
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q),
  );
}
