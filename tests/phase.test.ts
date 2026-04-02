import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { phaseAtTemperature } from '../src/lib/phase';

// ---------------------------------------------------------------------------
// Unit tests — phaseAtTemperature
// ---------------------------------------------------------------------------
describe('phaseAtTemperature', () => {
  // ---- Basic classification ------------------------------------------------
  it('returns "solid" when temperature is below melting point', () => {
    // Iron: mp=1811, bp=3134
    expect(phaseAtTemperature(1000, 1811, 3134)).toBe('solid');
  });

  it('returns "liquid" when temperature is between melting and boiling point', () => {
    expect(phaseAtTemperature(2000, 1811, 3134)).toBe('liquid');
  });

  it('returns "gas" when temperature is at or above boiling point', () => {
    expect(phaseAtTemperature(4000, 1811, 3134)).toBe('gas');
  });

  // ---- Boundary values -----------------------------------------------------
  it('returns "liquid" at exactly the melting point', () => {
    expect(phaseAtTemperature(1811, 1811, 3134)).toBe('liquid');
  });

  it('returns "gas" at exactly the boiling point', () => {
    expect(phaseAtTemperature(3134, 1811, 3134)).toBe('gas');
  });

  it('returns "solid" at just below the melting point', () => {
    expect(phaseAtTemperature(1810.99, 1811, 3134)).toBe('solid');
  });

  // ---- Null handling -------------------------------------------------------
  it('returns "unknown" when both melting and boiling point are null', () => {
    expect(phaseAtTemperature(300, null, null)).toBe('unknown');
  });

  it('classifies by melting point alone when boiling point is null', () => {
    // If temp < mp → solid, if temp >= mp → liquid (best guess without bp)
    expect(phaseAtTemperature(100, 500, null)).toBe('solid');
    expect(phaseAtTemperature(600, 500, null)).toBe('liquid');
  });

  it('classifies by boiling point alone when melting point is null', () => {
    // If temp < bp → solid (best guess), if temp >= bp → gas
    expect(phaseAtTemperature(100, null, 500)).toBe('solid');
    expect(phaseAtTemperature(600, null, 500)).toBe('gas');
  });

  // ---- Real element spot checks -------------------------------------------
  it('Mercury (mp=234.32, bp=629.88) is liquid at STP (273K)', () => {
    expect(phaseAtTemperature(273, 234.32, 629.88)).toBe('liquid');
  });

  it('Bromine (mp=265.95, bp=331.95) is liquid at STP (273K)', () => {
    expect(phaseAtTemperature(273, 265.95, 331.95)).toBe('liquid');
  });

  it('Hydrogen (mp=13.81, bp=20.28) is gas at STP (273K)', () => {
    expect(phaseAtTemperature(273, 13.81, 20.28)).toBe('gas');
  });

  it('Iron (mp=1811, bp=3134) is solid at STP (273K)', () => {
    expect(phaseAtTemperature(273, 1811, 3134)).toBe('solid');
  });

  it('Tungsten (mp=3695, bp=5828) is gas at 6000K', () => {
    expect(phaseAtTemperature(6000, 3695, 5828)).toBe('gas');
  });

  it('Helium (mp=0.95, bp=4.22) is solid at 0.5K', () => {
    expect(phaseAtTemperature(0.5, 0.95, 4.22)).toBe('solid');
  });

  // ---- Edge: 0K (absolute zero) -------------------------------------------
  it('all elements with data are solid at 0K', () => {
    // The lowest melting point is 0.95K (Helium), so at 0K everything is solid
    expect(phaseAtTemperature(0, 0.95, 4.22)).toBe('solid');
    expect(phaseAtTemperature(0, 1811, 3134)).toBe('solid');
    expect(phaseAtTemperature(0, 13.81, 20.28)).toBe('solid');
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------
describe('phaseAtTemperature — property-based', () => {
  const arbTemp = fc.double({ min: 0, max: 10000, noNaN: true });
  const arbMP = fc.double({ min: 0.1, max: 6000, noNaN: true });
  const arbBP = fc.double({ min: 0.1, max: 10000, noNaN: true });

  it('always returns one of the four valid phases', () => {
    fc.assert(
      fc.property(arbTemp, fc.option(arbMP), fc.option(arbBP), (temp, mp, bp) => {
        const result = phaseAtTemperature(temp, mp ?? null, bp ?? null);
        expect(['solid', 'liquid', 'gas', 'unknown']).toContain(result);
      }),
      { numRuns: 500 },
    );
  });

  it('phase progresses solid → liquid → gas as temperature increases (when both mp and bp exist, mp < bp)', () => {
    fc.assert(
      fc.property(arbMP, arbBP, (mp, bp) => {
        // Ensure mp < bp
        const lo = Math.min(mp, bp);
        const hi = Math.max(mp, bp);
        if (hi - lo < 1) return; // skip degenerate cases

        const atLow = phaseAtTemperature(lo - 1, lo, hi);
        const atMid = phaseAtTemperature((lo + hi) / 2, lo, hi);
        const atHigh = phaseAtTemperature(hi + 1, lo, hi);

        expect(atLow).toBe('solid');
        expect(atMid).toBe('liquid');
        expect(atHigh).toBe('gas');
      }),
      { numRuns: 200 },
    );
  });

  it('unknown only when both mp and bp are null', () => {
    fc.assert(
      fc.property(arbTemp, arbMP, arbBP, (temp, mp, bp) => {
        // When at least one value exists, result should never be "unknown"
        const result = phaseAtTemperature(temp, mp, bp);
        expect(result).not.toBe('unknown');
      }),
      { numRuns: 200 },
    );
  });
});
