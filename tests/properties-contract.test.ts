import { describe, it, expect } from 'vitest';
import { ALL_PROPERTIES } from '../src/lib/properties';
import { ENTITIES } from '../src/lib/routeMeta';

describe('property metadata contract', () => {
  it('exposes the seven browseable numeric properties from one source of truth', () => {
    expect(ALL_PROPERTIES.map((p) => p.key)).toEqual([
      'mass',
      'electronegativity',
      'ionizationEnergy',
      'radius',
      'density',
      'meltingPoint',
      'boilingPoint',
    ]);
  });

  it('uses eV for ionisation energy everywhere shared metadata is consumed', () => {
    const ionization = ALL_PROPERTIES.find((p) => p.key === 'ionizationEnergy');
    expect(ionization?.unit).toBe('eV');
  });

  it('keeps route metadata count and examples in sync with property definitions', () => {
    const propertyEntity = ENTITIES.find((entity) => entity.id === 'property');
    expect(propertyEntity).toBeDefined();
    expect(propertyEntity?.count).toBe(String(ALL_PROPERTIES.length));

    const propertyKeys = new Set<string>(ALL_PROPERTIES.map((property) => property.key));
    for (const example of propertyEntity?.examples ?? []) {
      const key = example.href.split('/').pop();
      expect(propertyKeys.has(key ?? ''), `${example.href} should reference a known property`).toBe(true);
    }
  });
});
