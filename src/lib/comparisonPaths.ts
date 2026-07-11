import type { ElementRecord } from './types';

type ComparisonElement = Pick<ElementRecord, 'atomicNumber' | 'symbol'>;
type FolioElement = Pick<ElementRecord, 'atomicNumber' | 'symbol' | 'neighbors'>;

export function canonicalComparisonPathForElements(
  elementA: ComparisonElement,
  elementB: ComparisonElement,
): string {
  if (elementA.atomicNumber === elementB.atomicNumber) {
    return `/elements/${elementA.symbol}`;
  }

  const [first, second] = elementA.atomicNumber < elementB.atomicNumber
    ? [elementA, elementB]
    : [elementB, elementA];
  return `/elements/${first.symbol}/compare/${second.symbol}`;
}

/**
 * Return the canonical comparison linked from an element folio.
 *
 * Folios deliberately surface one comparison each: the element's first
 * declared neighbour. Invalid and self-neighbour data produce no link rather
 * than silently falling back to an unrelated element.
 */
export function getFolioComparisonPath(
  element: FolioElement,
  resolveElement: (symbol: string) => ComparisonElement | undefined,
): string | null {
  const neighbourSymbol = element.neighbors[0];
  if (!neighbourSymbol) return null;

  const neighbour = resolveElement(neighbourSymbol);
  if (!neighbour || neighbour.atomicNumber === element.atomicNumber) return null;
  return canonicalComparisonPathForElements(element, neighbour);
}
