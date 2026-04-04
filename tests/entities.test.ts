import { describe, it, expect } from 'vitest';
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLOURS,
} from '../src/lib/entities';

describe('ENTITY_TYPES', () => {
  it('contains 5 result-worthy entity types', () => {
    expect(ENTITY_TYPES).toHaveLength(5);
  });

  it('every type has a label', () => {
    for (const type of ENTITY_TYPES) {
      expect(ENTITY_TYPE_LABELS[type]).toBeDefined();
      expect(typeof ENTITY_TYPE_LABELS[type]).toBe('string');
    }
  });

  it('every type has a colour', () => {
    for (const type of ENTITY_TYPES) {
      expect(ENTITY_TYPE_COLOURS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
