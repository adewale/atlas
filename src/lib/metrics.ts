/**
 * Precomputed text metrics — measured in a real browser at build time.
 *
 * These widths are identical to what Pretext/canvas would compute at runtime,
 * because they were measured by the same rendering engine (Chromium).
 *
 * Use these instead of calling measureLines() for single-line width lookups.
 * Multi-line layout (shaped text, paragraphs) still uses Pretext at runtime
 * because it depends on container width.
 */
import metrics from '../../data/generated/text-metrics.json';

type ElementMetrics = {
  identityWidth: number;
  identityWidthMobile: number;
  nameWidth14: number;
  nameWidth10: number;
  chipWidth11: number;
  catWidth13: number;
};

type CategoryMetrics = { width13: number; width18: number };
type DiscovererMetrics = { navWidth: number; captionWidth: number };
type PropertyMetrics = { width10: number; width11bold: number };

const elMap = metrics.elements as Record<string, ElementMetrics>;
const catMap = metrics.categories as Record<string, CategoryMetrics>;
const discMap = metrics.discoverers as Record<string, DiscovererMetrics>;
const propMap = metrics.properties as Record<string, PropertyMetrics>;
const edgeMap = metrics.edges as Record<string, number>;

/** Get precomputed metrics for an element by symbol. */
export function getElementMetrics(symbol: string): ElementMetrics | undefined {
  return elMap[symbol];
}

/** Get precomputed metrics for a category. */
export function getCategoryMetrics(category: string): CategoryMetrics | undefined {
  return catMap[category];
}

/** Get precomputed metrics for a discoverer. */
export function getDiscovererMetrics(name: string): DiscovererMetrics | undefined {
  return discMap[name];
}

/** Get precomputed metrics for a property label. */
export function getPropertyMetrics(key: string): PropertyMetrics | undefined {
  return propMap[key];
}

/** Get precomputed width for an edge label. */
export function getEdgeWidth(label: string): number {
  return edgeMap[label] ?? 80;
}
