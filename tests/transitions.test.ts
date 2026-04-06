import { describe, it, expect } from 'vitest';
import { VT, vt } from '../src/lib/transitions';
import type { TransitionName } from '../src/lib/transitions';

describe('VT constants', () => {
  it('exports all expected transition names', () => {
    expect(VT.SYMBOL).toBe('element-symbol');
    expect(VT.NUMBER).toBe('element-number');
    expect(VT.NAME).toBe('element-name');
    expect(VT.CELL_BG).toBe('element-cell-bg');
    expect(VT.NAV_BACK).toBe('nav-back');
    expect(VT.COLOR_RULE).toBe('color-rule');
    expect(VT.VIZ_NAV).toBe('viz-nav');
    expect(VT.DATA_PLATE_GROUP).toBe('data-plate-group');
    expect(VT.DATA_PLATE_PERIOD).toBe('data-plate-period');
    expect(VT.DATA_PLATE_BLOCK).toBe('data-plate-block');
  });

  it('has 11 transition names', () => {
    expect(Object.keys(VT)).toHaveLength(11);
  });

  it('every value is a unique, non-empty string', () => {
    const values = Object.values(VT);
    values.forEach((v) => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('vt() conditional helper', () => {
  it('returns the transition name when active matches symbol', () => {
    expect(vt('Fe', 'Fe', VT.SYMBOL)).toBe('element-symbol');
  });

  it('returns undefined when active does not match symbol', () => {
    expect(vt('Fe', 'Cu', VT.SYMBOL)).toBeUndefined();
  });

  it('returns undefined when active is null', () => {
    expect(vt(null, 'Fe', VT.SYMBOL)).toBeUndefined();
  });

  it('works with all transition names', () => {
    const names: TransitionName[] = Object.values(VT);
    names.forEach((name) => {
      expect(vt('X', 'X', name)).toBe(name);
      expect(vt('X', 'Y', name)).toBeUndefined();
    });
  });
});
