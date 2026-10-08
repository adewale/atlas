import { describe, expect, it } from 'vitest';
import { allElements } from '../src/lib/data';
import type { FolioBundle } from '../src/lib/types';

const folioModules = import.meta.glob<{ default: FolioBundle }>(
  '../data/generated/folio-*.json',
  { eager: true },
);

const folios = new Map(
  Object.values(folioModules).map(({ default: bundle }) => [bundle.element.symbol, bundle]),
);

type Element = (typeof allElements)[number];
type NavigationKey = keyof FolioBundle['nav'];

const dimensions: ReadonlyArray<{
  name: string;
  previous: NavigationKey;
  next: NavigationKey;
  includes: (candidate: Element, current: Element) => boolean;
  compare: (a: Element, b: Element) => number;
}> = [
  {
    name: 'group',
    previous: 'prevInGroup',
    next: 'nextInGroup',
    includes: (candidate, current) => current.group != null && candidate.group === current.group,
    compare: (a, b) => a.period - b.period || a.atomicNumber - b.atomicNumber,
  },
  {
    name: 'period',
    previous: 'prevInPeriod',
    next: 'nextInPeriod',
    includes: (candidate, current) => candidate.period === current.period,
    compare: (a, b) => a.atomicNumber - b.atomicNumber,
  },
  {
    name: 'block',
    previous: 'prevInBlock',
    next: 'nextInBlock',
    includes: (candidate, current) => candidate.block === current.block,
    compare: (a, b) => a.atomicNumber - b.atomicNumber,
  },
  {
    name: 'category',
    previous: 'prevInCategory',
    next: 'nextInCategory',
    includes: (candidate, current) => candidate.category === current.category,
    compare: (a, b) => a.atomicNumber - b.atomicNumber,
  },
];

function asReference(element: Element | undefined) {
  return element ? { symbol: element.symbol, name: element.name } : null;
}

describe('generated folio navigation', () => {
  it('has one production bundle for every element', () => {
    expect(folios.size).toBe(allElements.length);
    for (const element of allElements) {
      expect(folios.has(element.symbol), `missing folio-${element.symbol}.json`).toBe(true);
    }
  });

  it.each(dimensions)('matches the complete ordered $name domain', (dimension) => {
    for (const element of allElements) {
      const bundle = folios.get(element.symbol);
      expect(bundle, `missing folio bundle for ${element.symbol}`).toBeDefined();

      const members = allElements
        .filter((candidate) => dimension.includes(candidate, element))
        .sort(dimension.compare);
      const index = members.findIndex((candidate) => candidate.symbol === element.symbol);

      expect(bundle!.nav[dimension.previous], `${element.symbol} previous in ${dimension.name}`).toEqual(
        asReference(index > 0 ? members[index - 1] : undefined),
      );
      expect(bundle!.nav[dimension.next], `${element.symbol} next in ${dimension.name}`).toEqual(
        asReference(index >= 0 && index < members.length - 1 ? members[index + 1] : undefined),
      );
    }
  });

  it.each(dimensions)('is reversible through production $name links', (dimension) => {
    for (const element of allElements) {
      const bundle = folios.get(element.symbol)!;
      const self = asReference(element);
      const previous = bundle.nav[dimension.previous];
      const next = bundle.nav[dimension.next];

      if (previous) {
        expect(
          folios.get(previous.symbol)?.nav[dimension.next],
          `${element.symbol} previous ${dimension.name} link`,
        ).toEqual(self);
      }
      if (next) {
        expect(
          folios.get(next.symbol)?.nav[dimension.previous],
          `${element.symbol} next ${dimension.name} link`,
        ).toEqual(self);
      }
    }
  });
});
