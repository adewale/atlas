/**
 * Canonical slug transformations.
 *
 * Created from Lesson #3: category pages showed no elements because URL slugs
 * used hyphens (`transition-metal`) while data JSON used spaces
 * (`transition metal`). This module provides a single source of truth so the
 * mismatch can never recur.
 *
 * Rule: URLs use hyphens, data files use spaces. These two functions convert
 * between the two forms. Every place that builds or reads a slug-based URL
 * must use these — never hand-roll the replacement.
 */

/** Convert a data-file slug (spaces) to a URL slug (hyphens). */
export function toUrlSlug(dataSlug: string): string {
  return dataSlug.toLowerCase().replace(/\s+/g, '-');
}

/** Convert a URL slug (hyphens) back to a data-file slug (spaces). */
export function fromUrlSlug(urlSlug: string): string {
  return urlSlug.replace(/-/g, ' ');
}

/**
 * Normalise any slug to the canonical data-file form (lowercase, spaces).
 * Handles both hyphenated URL slugs and raw data slugs.
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/-/g, ' ').trim();
}

/**
 * Compare two slugs for equality regardless of form (URL vs data).
 * Use this when checking if a URL param matches a data record.
 */
export function slugsEqual(a: string, b: string): boolean {
  return normalizeSlug(a) === normalizeSlug(b);
}
