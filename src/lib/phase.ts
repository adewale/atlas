/**
 * Compute the phase of an element at a given temperature.
 *
 * Uses melting and boiling points (in Kelvin) to classify:
 *   temp < mp         → solid
 *   mp ≤ temp < bp    → liquid
 *   temp ≥ bp         → gas
 *
 * When one or both thresholds are null (synthetic/unknown elements),
 * the function degrades gracefully:
 *   mp only   → solid | liquid
 *   bp only   → solid | gas
 *   neither   → unknown
 */
export type Phase = 'solid' | 'liquid' | 'gas' | 'unknown';

export function phaseAtTemperature(
  tempK: number,
  meltingPoint: number | null,
  boilingPoint: number | null,
): Phase {
  if (meltingPoint == null && boilingPoint == null) {
    return 'unknown';
  }

  if (meltingPoint != null && boilingPoint != null) {
    if (tempK < meltingPoint) return 'solid';
    if (tempK < boilingPoint) return 'liquid';
    return 'gas';
  }

  if (meltingPoint != null) {
    return tempK < meltingPoint ? 'solid' : 'liquid';
  }

  // boilingPoint != null
  return tempK < boilingPoint! ? 'solid' : 'gas';
}
