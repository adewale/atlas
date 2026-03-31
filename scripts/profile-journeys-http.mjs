#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { execFileSync } from 'node:child_process';

const ROUTES = [
  '/',
  '/element/Fe',
  '/atlas/group/8',
  '/atlas/period/4',
  '/atlas/block/d',
  '/atlas/category/transition%20metal',
  '/atlas/rank/mass',
  '/atlas/anomaly/synthetic-heavy',
  '/compare/Fe/Mn',
  '/about',
  '/credits',
  '/design',
  '/entity-map',
  '/discovery-timeline',
  '/phase-landscape',
  '/property-scatter',
  '/anomaly-explorer',
  '/neighborhood-graph',
  '/etymology-map',
  '/discoverer-network',
  '/discoverer/Albert%20Ghiorso%20et%20al.',
  '/timeline/2010',
];

const baseURL = 'http://127.0.0.1:4317';

function percentile(sorted, p) {
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const out = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], { encoding: 'utf8' });
      const status = Number(out.trim());
      if (status > 0 && status < 500) return;
    } catch {
      // keep waiting
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for server: ${url}`);
}

async function main() {
  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4317', '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk.toString()));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk.toString()));

  try {
    await waitForServer(baseURL);

    const journeys = [];
    for (const from of ROUTES) {
      for (const to of ROUTES) {
        if (from === to) continue;
        const url = `${baseURL}${to}?__journey_from=${encodeURIComponent(from)}&__t=${Date.now()}`;
        const out = execFileSync(
          'curl',
          ['-s', '-o', '/dev/null', '-w', '%{http_code} %{size_download} %{time_total}', url],
          { encoding: 'utf8' },
        ).trim();
        const [statusStr, sizeStr, timeStr] = out.split(' ');

        journeys.push({
          from,
          to,
          status: Number(statusStr),
          durationMs: Number(timeStr) * 1000,
          contentLength: Number(sizeStr),
        });
      }
    }

    const durations = journeys.map((j) => j.durationMs).sort((a, b) => a - b);
    const summary = {
      routeCount: ROUTES.length,
      journeyCount: journeys.length,
      meanMs: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50Ms: percentile(durations, 0.5),
      p95Ms: percentile(durations, 0.95),
      p99Ms: percentile(durations, 0.99),
      minMs: durations[0],
      maxMs: durations[durations.length - 1],
      slowestJourneys: [...journeys].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10),
    };

    mkdirSync('artifacts', { recursive: true });
    writeFileSync('artifacts/journey-profile.http.json', JSON.stringify({ summary, journeys }, null, 2), 'utf8');
    console.log('\nWrote artifacts/journey-profile.http.json');
    console.log(summary);
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
