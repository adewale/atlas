/**
 * Era bins — the single source of truth for historical era definitions.
 *
 * 8 eras that correspond to real chapters of element discovery history.
 * Every file that maps a discovery year to an era imports from here.
 */

export type EraBin = {
  slug: string;
  label: string;
  minYear: number | null;
  maxYear: number | null;
};

export const ERA_BINS: EraBin[] = [
  { slug: 'ancient',    label: 'Ancient',         minYear: null, maxYear: 1699 },
  { slug: '1700s',      label: '1700s',            minYear: 1700, maxYear: 1799 },
  { slug: '1800-1849',  label: '1800\u20131849',  minYear: 1800, maxYear: 1849 },
  { slug: '1850-1899',  label: '1850\u20131899',  minYear: 1850, maxYear: 1899 },
  { slug: '1900-1939',  label: '1900\u20131939',  minYear: 1900, maxYear: 1939 },
  { slug: '1940-1955',  label: '1940\u20131955',  minYear: 1940, maxYear: 1955 },
  { slug: '1956-1999',  label: '1956\u20131999',  minYear: 1956, maxYear: 1999 },
  { slug: '2000s',      label: '2000s',            minYear: 2000, maxYear: null },
];

/** Map a discovery year (or null for antiquity) to the matching era bin. */
export function yearToEra(year: number | null | undefined): EraBin {
  if (year == null || year < 1700) return ERA_BINS[0];
  for (const bin of ERA_BINS) {
    if (bin.minYear != null && year >= bin.minYear) {
      if (bin.maxYear == null || year <= bin.maxYear) return bin;
    }
  }
  return ERA_BINS[ERA_BINS.length - 1];
}

/** Find an EraBin by its URL slug. */
export function eraBySlug(slug: string): EraBin | undefined {
  return ERA_BINS.find(b => b.slug === slug);
}

/** Check if a year falls within a given era bin. */
export function yearInEra(year: number | null | undefined, bin: EraBin): boolean {
  if (year == null) return bin.slug === 'ancient';
  if (bin.minYear == null) return year < 1700;
  if (bin.maxYear == null) return year >= bin.minYear;
  return year >= bin.minYear && year <= bin.maxYear;
}
