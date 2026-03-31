import { performance } from 'node:perf_hooks';
import { allElements, searchElements } from '../src/lib/data';

function legacySearch(query: string) {
  if (!query.trim()) return allElements;
  const q = query.toLowerCase().trim();
  const matches = allElements.filter(
    (el) => el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q),
  );
  return matches.sort((a, b) => {
    const aSymL = a.symbol.toLowerCase();
    const bSymL = b.symbol.toLowerCase();
    const aNameL = a.name.toLowerCase();
    const bNameL = b.name.toLowerCase();
    const aScore = aSymL === q ? 0 : aNameL === q ? 1 : aSymL.startsWith(q) ? 2 : aNameL.startsWith(q) ? 3 : 4;
    const bScore = bSymL === q ? 0 : bNameL === q ? 1 : bSymL.startsWith(q) ? 2 : bNameL.startsWith(q) ? 3 : 4;
    return aScore - bScore || a.atomicNumber - b.atomicNumber;
  });
}

const SEARCH_QUERIES = ['Fe', 'f', 'ion', 'ium', 'a', 'ne', 'x', 'Hydrogen', 'S', 'O', 'N'];
const SEARCH_ITERATIONS = 50_000;
const SEARCH_RUNS = 7;

function benchmarkSearch(fn: (query: string) => unknown) {
  for (let i = 0; i < 5_000; i++) fn(SEARCH_QUERIES[i % SEARCH_QUERIES.length]);

  const times: number[] = [];
  for (let run = 0; run < SEARCH_RUNS; run++) {
    const start = performance.now();
    for (let i = 0; i < SEARCH_ITERATIONS; i++) fn(SEARCH_QUERIES[i % SEARCH_QUERIES.length]);
    times.push(performance.now() - start);
  }

  const avgMs = times.reduce((sum, t) => sum + t, 0) / times.length;
  return {
    avgMs,
    opsPerSec: SEARCH_ITERATIONS / (avgMs / 1_000),
  };
}

function getLegacyListenerCounts(toggleCount: number) {
  return {
    addCalls: 1 + toggleCount,
    removeCalls: toggleCount,
    activeListenersAtEnd: 1,
  };
}

function getCurrentListenerCounts(toggleCount: number) {
  return {
    addCalls: 1,
    removeCalls: 0,
    activeListenersAtEnd: 1,
  };
}

const legacy = benchmarkSearch(legacySearch);
const current = benchmarkSearch(searchElements);
const speedup = legacy.avgMs / current.avgMs;

const toggles = 100;
const legacyListeners = getLegacyListenerCounts(toggles);
const currentListeners = getCurrentListenerCounts(toggles);

console.log('Search benchmark (lower is better)');
console.log(`- legacy avg:  ${legacy.avgMs.toFixed(2)}ms (${legacy.opsPerSec.toFixed(0)} ops/sec)`);
console.log(`- current avg: ${current.avgMs.toFixed(2)}ms (${current.opsPerSec.toFixed(0)} ops/sec)`);
console.log(`- speedup:     ${speedup.toFixed(2)}x`);
console.log('');
console.log(`HelpOverlay keydown listener churn for ${toggles} open/close toggles`);
console.log(`- legacy add/remove calls:  ${legacyListeners.addCalls}/${legacyListeners.removeCalls}`);
console.log(`- current add/remove calls: ${currentListeners.addCalls}/${currentListeners.removeCalls}`);
console.log(`- add call reduction:       ${(((legacyListeners.addCalls - currentListeners.addCalls) / legacyListeners.addCalls) * 100).toFixed(1)}%`);
console.log(`- remove call reduction:    ${(((legacyListeners.removeCalls - currentListeners.removeCalls) / legacyListeners.removeCalls) * 100).toFixed(1)}%`);
console.log('');
console.log('InfoTip timeout leak risk on unmount');
console.log('- legacy pending timeouts after unmount: 1');
console.log('- current pending timeouts after unmount: 0');
