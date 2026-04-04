/**
 * Precompute text metrics in a real browser using Playwright + Pretext.
 *
 * Runs Chromium headless, loads Pretext via the built app, and measures
 * every text string that components need at runtime. Writes results to
 * data/generated/text-metrics.json.
 *
 * This gives identical measurements to what the browser would compute,
 * because it IS the browser computing them.
 *
 * Usage: npx tsx scripts/precompute-metrics.ts
 * Requires: npm run build (so dist/ exists for the preview server)
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, execSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'data', 'generated', 'text-metrics.json');

// Read seed data
const elements: { atomicNumber: number; symbol: string; name: string; category: string }[] =
  JSON.parse(readFileSync(join(ROOT, 'data', 'generated', 'elements.json'), 'utf-8'));

const discoverers: { name: string; elements: string[] }[] =
  JSON.parse(readFileSync(join(ROOT, 'data', 'generated', 'discoverers.json'), 'utf-8'));

const categories = [...new Set(elements.map((e) => e.category))].sort();

const PROPERTY_LABELS: Record<string, string> = {
  mass: 'Atomic mass (u)',
  electronegativity: 'Electronegativity',
  ionizationEnergy: 'Ionisation energy (eV)',
  radius: 'Atomic radius (pm)',
  density: 'Density (g/cm³)',
  meltingPoint: 'Melting point (K)',
  boilingPoint: 'Boiling point (K)',
  halfLife: 'Longest half-life (s)',
  atomicNumber: 'Atomic number',
  period: 'Period',
  group: 'Group',
  discoveryYear: 'Discovery year',
};

// Build the measurement jobs — each is { text, font, key }
type Job = { text: string; font: string; key: string };

const jobs: Job[] = [];

for (const el of elements) {
  const padded = String(el.atomicNumber).padStart(3, '0');
  const nameUpper = el.name.toUpperCase();
  const s = el.symbol;

  // Identity block measurements
  jobs.push({ text: padded, font: 'bold 48px "SFMono-Regular", Menlo, Monaco, Consolas, monospace', key: `el.${s}.num48` });
  jobs.push({ text: padded, font: 'bold 56px "SFMono-Regular", Menlo, Monaco, Consolas, monospace', key: `el.${s}.num56` });
  jobs.push({ text: el.symbol, font: 'bold 36px system-ui, sans-serif', key: `el.${s}.sym36` });
  jobs.push({ text: nameUpper, font: '10px system-ui, sans-serif', key: `el.${s}.nameUpper10` });

  // Scatter hover card
  jobs.push({ text: el.name, font: 'bold 14px system-ui, sans-serif', key: `el.${s}.name14` });

  // Neighbour chip text: "Mn — Manganese" at 11px bold
  const chipText = `${el.symbol} — ${el.name}`;
  jobs.push({ text: chipText, font: 'bold 11px system-ui, sans-serif', key: `el.${s}.chip11` });

  // DataPlateRow category value
  const catDisplay = el.category.replace(/\b\w/g, (c: string) => c.toUpperCase());
  jobs.push({ text: catDisplay, font: 'bold 13px system-ui, sans-serif', key: `el.${s}.cat13` });
}

// Category-level
for (const cat of categories) {
  const display = cat.replace(/\b\w/g, (c: string) => c.toUpperCase());
  jobs.push({ text: display, font: 'bold 13px system-ui, sans-serif', key: `cat.${cat}.13` });
  jobs.push({ text: display, font: 'bold 18px system-ui, sans-serif', key: `cat.${cat}.18` });
}

// Discoverer-level
for (const d of discoverers) {
  jobs.push({ text: d.name, font: '11px "Helvetica Neue", Helvetica, Arial, sans-serif', key: `disc.${d.name}.nav11` });
  jobs.push({ text: d.name, font: 'bold 16px "Helvetica Neue", Helvetica, Arial, sans-serif', key: `disc.${d.name}.cap16` });
}

// Property labels
for (const [key, label] of Object.entries(PROPERTY_LABELS)) {
  jobs.push({ text: label, font: '10px system-ui, sans-serif', key: `prop.${key}.10` });
  jobs.push({ text: label.toUpperCase(), font: 'bold 11px system-ui, sans-serif', key: `prop.${key}.11bold` });
}

// Edge labels for EntityMap
const EDGE_LABELS = [
  'belongs to (n:1)', 'classified as (n:1)', 'ranked in (n:m)',
  'discovered by (n:1)', 'discovered in (n:1)', 'named for (n:1)',
  'adjacent to (n:m)', 'compared in (n:m)', 'contains (1:n)',
  'active in (n:m)', 'related to (n:m)',
];
for (const label of EDGE_LABELS) {
  jobs.push({ text: label, font: 'bold 11px system-ui, sans-serif', key: `edge.${label}` });
}

async function main() {
  console.log(`Measuring ${jobs.length} text strings in Chromium...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Start preview server in background
  const server = spawn('npx', ['vite', 'preview', '--port', '4199'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
  });
  server.unref();
  // Wait for server to be ready
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto('http://localhost:4199', { timeout: 2000 });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));

  // Measure all jobs in the browser context using canvas
  const results = await page.evaluate((jobsArg: Job[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const widths: Record<string, number> = {};
    for (const job of jobsArg) {
      ctx.font = job.font;
      widths[job.key] = Math.ceil(ctx.measureText(job.text).width);
    }
    return widths;
  }, jobs);

  await browser.close();
  // Kill preview server
  try { process.kill(-server.pid!, 'SIGTERM'); } catch { /* ignore */ }

  // Now assemble the structured output
  const elementMetrics: Record<string, {
    identityWidth: number;
    identityWidthMobile: number;
    nameWidth14: number;
    nameWidth10: number;
    chipWidth11: number;
    catWidth13: number;
  }> = {};

  for (const el of elements) {
    const s = el.symbol;
    const numW = results[`el.${s}.num48`] ?? 60;
    const numWMobile = results[`el.${s}.num56`] ?? 70;
    const symW = results[`el.${s}.sym36`] ?? 30;
    const nameW10 = Math.ceil((results[`el.${s}.nameUpper10`] ?? 40) * 1.2); // letter-spacing

    elementMetrics[s] = {
      identityWidth: Math.ceil(Math.max(numW, symW, nameW10)) + 8,
      identityWidthMobile: Math.ceil(Math.max(numWMobile, symW, nameW10)) + 8,
      nameWidth14: results[`el.${s}.name14`] ?? 60,
      nameWidth10: nameW10,
      chipWidth11: results[`el.${s}.chip11`] ?? 80,
      catWidth13: results[`el.${s}.cat13`] ?? 80,
    };
  }

  const categoryMetrics: Record<string, { width13: number; width18: number }> = {};
  for (const cat of categories) {
    categoryMetrics[cat] = {
      width13: results[`cat.${cat}.13`] ?? 60,
      width18: results[`cat.${cat}.18`] ?? 80,
    };
  }

  const discovererMetrics: Record<string, { navWidth: number; captionWidth: number }> = {};
  for (const d of discoverers) {
    discovererMetrics[d.name] = {
      navWidth: results[`disc.${d.name}.nav11`] ?? 80,
      captionWidth: results[`disc.${d.name}.cap16`] ?? 100,
    };
  }

  const propertyMetrics: Record<string, { width10: number; width11bold: number }> = {};
  for (const key of Object.keys(PROPERTY_LABELS)) {
    propertyMetrics[key] = {
      width10: results[`prop.${key}.10`] ?? 80,
      width11bold: results[`prop.${key}.11bold`] ?? 100,
    };
  }

  const edgeMetrics: Record<string, number> = {};
  for (const label of EDGE_LABELS) {
    edgeMetrics[label] = results[`edge.${label}`] ?? 80;
  }

  const textMetrics = {
    _generated: new Date().toISOString(),
    _jobCount: jobs.length,
    elements: elementMetrics,
    categories: categoryMetrics,
    discoverers: discovererMetrics,
    properties: propertyMetrics,
    edges: edgeMetrics,
  };

  writeFileSync(OUT, JSON.stringify(textMetrics, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(`  ${Object.keys(elementMetrics).length} elements, ${Object.keys(categoryMetrics).length} categories, ${Object.keys(discovererMetrics).length} discoverers, ${Object.keys(propertyMetrics).length} properties, ${Object.keys(edgeMetrics).length} edges`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
