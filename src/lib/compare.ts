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
    notes.push(`Groups ${a.group} and ${b.group}.`);
  }

  const massRankA = a.rankings.mass ?? 0;
  const massRankB = b.rankings.mass ?? 0;
  if (massRankA > 0 && massRankB > 0 && Math.abs(massRankA - massRankB) <= 5) {
    notes.push(`Similar mass ranking (${massRankA} vs ${massRankB} of 118).`);
  }

  return notes;
}
