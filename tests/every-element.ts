/**
 * The element table is a small finite domain (118 records), so properties
 * "for every element" are checked exhaustively instead of sampled: the
 * fast-check `fc.integer(0..117).map(i => allElements[i])` pattern it
 * replaces saw roughly 70 distinct elements per 100-run property.
 * A failure names the element that broke the property.
 */
type Named = { symbol: string };

export function forEveryElement<T extends Named>(elements: readonly T[], check: (el: T) => void): void {
  for (const el of elements) {
    try {
      check(el);
    } catch (error) {
      if (error instanceof Error) error.message = `[${el.symbol}] ${error.message}`;
      throw error;
    }
  }
}

/** Every ordered pair of elements (118 x 118). */
export function forEveryElementPair<T extends Named>(elements: readonly T[], check: (a: T, b: T) => void): void {
  for (const a of elements) {
    for (const b of elements) {
      try {
        check(a, b);
      } catch (error) {
        if (error instanceof Error) error.message = `[${a.symbol}, ${b.symbol}] ${error.message}`;
        throw error;
      }
    }
  }
}
