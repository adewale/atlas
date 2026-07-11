import { describe, expect, test } from 'vitest';
import elementsJson from '../data/generated/elements.json';
import { getFolioComparisonPath } from '../src/lib/comparisonPaths';
import type { ElementRecord } from '../src/lib/types';

const elements = elementsJson as ElementRecord[];
const elementBySymbol = new Map(elements.map((element) => [element.symbol, element]));

describe('folio comparison paths', () => {
  test('all 118 folios link a valid first neighbour through 117 canonical pairs', () => {
    const paths = elements.map((element) =>
      getFolioComparisonPath(element, (symbol) => elementBySymbol.get(symbol)),
    );

    expect(paths.every((path) => path != null)).toBe(true);
    expect(new Set(paths).size).toBe(117);
    expect(paths[0]).toBe('/elements/H/compare/He');
    expect(paths[1]).toBe('/elements/H/compare/He');
  });

  test('does not invent a comparison for missing, invalid, or self neighbours', () => {
    const hydrogen = elementBySymbol.get('H');
    expect(hydrogen).toBeDefined();
    if (!hydrogen) throw new Error('Hydrogen fixture is missing');
    expect(getFolioComparisonPath({ ...hydrogen, neighbors: [] }, () => undefined)).toBeNull();
    expect(getFolioComparisonPath({ ...hydrogen, neighbors: ['Nope'] }, () => undefined)).toBeNull();
    expect(
      getFolioComparisonPath({ ...hydrogen, neighbors: ['H'] }, (symbol) => elementBySymbol.get(symbol)),
    ).toBeNull();
  });
});
