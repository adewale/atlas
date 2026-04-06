import type { ElementRecord } from './types';

/**
 * Generate structured comparison notes between two elements.
 * Template rules applied in order; skip if not applicable.
 */
export function generateComparisonNotes(a: ElementRecord, b: ElementRecord): string[] {
  const notes: string[] = [];

  if (a.block === b.block) {
    notes.push(`Both ${a.block}-block elements.`);
  }

  if (a.period === b.period) {
    notes.push(`Share period ${a.period}.`);
  }

  if (a.category === b.category) {
    notes.push(`Both classified as ${a.category}.`);
  }

  if (a.phase !== b.phase) {
    notes.push(`${a.name} is ${a.phase}; ${b.name} is ${b.phase} at STP.`);
  }

  if (a.group !== null && b.group !== null) {
    if (a.group === b.group) {
      notes.push(`Share group ${a.group}.`);
    } else {
      notes.push(`Groups ${a.group} and ${b.group}.`);
    }
  }

  const massRankA = a.rankings.mass ?? 0;
  const massRankB = b.rankings.mass ?? 0;
  if (massRankA > 0 && massRankB > 0 && Math.abs(massRankA - massRankB) <= 5) {
    notes.push(`Similar mass ranking (${massRankA} vs ${massRankB} of 118).`);
  }

  // Discovery: same discoverer
  if (a.discoverer && b.discoverer && a.discoverer === b.discoverer) {
    notes.push(`Both discovered by ${a.discoverer}.`);
  }

  // Discovery: year proximity
  if (a.discoveryYear != null && b.discoveryYear != null) {
    const gap = Math.abs(a.discoveryYear - b.discoveryYear);
    if (gap === 0) {
      notes.push(`Both discovered in ${a.discoveryYear}.`);
    } else if (gap <= 10) {
      const earlier = a.discoveryYear < b.discoveryYear ? a : b;
      const later = a.discoveryYear < b.discoveryYear ? b : a;
      notes.push(`Discovered ${gap} year${gap === 1 ? '' : 's'} apart — ${earlier.name} in ${earlier.discoveryYear}, ${later.name} in ${later.discoveryYear}.`);
    }
  }

  // Etymology: same origin
  if (a.etymologyOrigin && b.etymologyOrigin && a.etymologyOrigin === b.etymologyOrigin) {
    const origin = a.etymologyOrigin;
    const label =
      origin === 'person' ? 'a person'
      : origin === 'place' ? 'a place'
      : origin === 'astronomical' ? 'an astronomical body'
      : origin === 'property' ? 'a property'
      : origin === 'mythological' ? 'a mythological reference'
      : /^[aeiou]/i.test(origin) ? `an ${origin}` : `a ${origin}`;
    notes.push(`Both named for ${label}.`);
  }

  // Shared neighbors
  if (a.neighbors.length > 0 && b.neighbors.length > 0) {
    const shared = a.neighbors.filter((n) => b.neighbors.includes(n));
    if (shared.length === 1) {
      notes.push(`Share a neighbor: ${shared[0]}.`);
    } else if (shared.length > 1) {
      notes.push(`Share neighbors: ${shared.join(', ')}.`);
    }
  }

  return notes;
}
