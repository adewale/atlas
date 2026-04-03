/**
 * Grid Alignment Verifier — validates AtlasPlate SVG viewBox dimensions.
 *
 * For every context where AtlasPlate renders a card grid (discoverer pages,
 * timeline eras, block pages, category pages, group pages, period pages,
 * anomaly pages), this script checks that:
 *
 *   1. The SVG viewBox width = cols * (CARD_W + GAP) - GAP
 *   2. The total height = captionH + 8 + rows * (CARD_H + GAP) - GAP
 *   3. No card extends outside the viewBox bounds
 *   4. No cards overlap each other
 *
 * Usage:
 *   npx tsx scripts/verify-grid-alignment.ts
 *
 * Exit code 0 = all grids valid, 1 = alignment issues found.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// ---------- constants matching AtlasPlate.tsx ----------
const CARD_W = 100;
const CARD_H = 80;
const GAP = 4;
const DESKTOP_COLS = 4;
const MOBILE_COLS = 2;

// Minimum caption height: single line of bold 16px text with padding.
// measureLines() in the browser uses canvas, so we approximate: at least one
// line of 20px line-height plus 12px padding top + 12px padding bottom = 44px.
const CAPTION_LINE_H = 20;
const CAPTION_PADDING = 12;
const GRID_Y_OFFSET = 8; // gap between caption strip and first card row

// ---------- data paths ----------
const DATA_DIR = join(import.meta.dirname ?? __dirname, '..', 'data', 'generated');

function readJSON<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, name), 'utf-8')) as T;
}

// ---------- types (mirroring src/lib/types.ts) ----------
type GroupData = { n: number; label: string; description: string; elements: string[] };
type PeriodData = { n: number; label: string; description: string; elements: string[] };
type BlockData = { block: string; label: string; description: string; elements: string[] };
type CategoryData = { slug: string; label: string; description: string; elements: string[] };
type AnomalyData = { slug: string; label: string; description: string; elements: string[] };
type DiscovererData = { name: string; elements: string[] };
type TimelineEntry = { symbol: string; year: number | null; discoverer: string };
type TimelineData = { antiquity: TimelineEntry[]; timeline: TimelineEntry[] };

// ---------- grid math (mirrors AtlasPlate) ----------
type GridCheck = {
  context: string;
  elementCount: number;
  cols: number;
  rows: number;
  viewBoxW: number;
  viewBoxH: number;
  issues: string[];
};

/**
 * Estimate caption height. In the browser this uses canvas measureLines();
 * we approximate by assuming the caption fits on one line for short captions
 * and wraps for long ones. The grid-W available for text is
 * gridW - 2*CAPTION_PADDING. With bold 16px sans-serif, roughly 8px/char.
 */
function estimateCaptionH(caption: string, gridW: number): number {
  const maxTextW = gridW - CAPTION_PADDING * 2;
  const approxCharW = 8; // conservative estimate for bold 16px
  const charsPerLine = Math.max(1, Math.floor(maxTextW / approxCharW));
  const lineCount = Math.max(1, Math.ceil(caption.length / charsPerLine));
  return lineCount * CAPTION_LINE_H + CAPTION_PADDING * 2;
}

function checkGrid(context: string, elementCount: number, cols: number, caption: string): GridCheck {
  const rows = Math.ceil(elementCount / cols);
  const gridW = cols * (CARD_W + GAP) - GAP;
  const captionH = estimateCaptionH(caption, gridW);
  const gridH = rows * (CARD_H + GAP) - GAP;
  const totalH = captionH + GRID_Y_OFFSET + gridH;
  const viewBoxW = gridW;
  const viewBoxH = totalH;

  const issues: string[] = [];

  // Verify each card position
  for (let i = 0; i < elementCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (CARD_W + GAP);
    const y = captionH + GRID_Y_OFFSET + row * (CARD_H + GAP);

    // Card must not extend past the right edge
    if (x + CARD_W > viewBoxW) {
      issues.push(
        `Card ${i} (col ${col}, row ${row}): right edge ${x + CARD_W} exceeds viewBox width ${viewBoxW}`,
      );
    }

    // Card must not extend past the bottom edge
    if (y + CARD_H > viewBoxH) {
      issues.push(
        `Card ${i} (col ${col}, row ${row}): bottom edge ${y + CARD_H} exceeds viewBox height ${viewBoxH}`,
      );
    }

    // Check overlap with the next card in the same row
    if (col < cols - 1 && i + 1 < elementCount) {
      const nextX = (col + 1) * (CARD_W + GAP);
      if (x + CARD_W > nextX) {
        issues.push(
          `Card ${i} overlaps card ${i + 1} horizontally: ${x + CARD_W} > ${nextX}`,
        );
      }
    }

    // Check overlap with the card directly below
    const belowIdx = i + cols;
    if (belowIdx < elementCount) {
      const nextY = captionH + GRID_Y_OFFSET + (row + 1) * (CARD_H + GAP);
      if (y + CARD_H > nextY) {
        issues.push(
          `Card ${i} overlaps card ${belowIdx} vertically: ${y + CARD_H} > ${nextY}`,
        );
      }
    }
  }

  // Verify viewBox width matches the formula
  const expectedW = cols * (CARD_W + GAP) - GAP;
  if (viewBoxW !== expectedW) {
    issues.push(
      `viewBox width ${viewBoxW} does not match expected ${expectedW}`,
    );
  }

  // Verify viewBox height matches the formula
  const expectedH = captionH + GRID_Y_OFFSET + rows * (CARD_H + GAP) - GAP;
  if (viewBoxH !== expectedH) {
    issues.push(
      `viewBox height ${viewBoxH} does not match expected ${expectedH}`,
    );
  }

  return { context, elementCount, cols, rows, viewBoxW, viewBoxH, issues };
}

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

// ---------- main ----------
function main(): void {
  const groups: GroupData[] = readJSON('groups.json');
  const periods: PeriodData[] = readJSON('periods.json');
  const blocks: BlockData[] = readJSON('blocks.json');
  const categories: CategoryData[] = readJSON('categories.json');
  const anomalies: AnomalyData[] = readJSON('anomalies.json');
  const discoverers: DiscovererData[] = readJSON('discoverers.json');
  const { antiquity, timeline }: TimelineData = readJSON('timeline.json');

  const allChecks: GridCheck[] = [];

  // Helper: check both mobile and desktop viewports
  function checkBothViewports(context: string, count: number, caption: string) {
    if (count === 0) return;
    allChecks.push(checkGrid(`${context} [desktop ${DESKTOP_COLS}-col]`, count, DESKTOP_COLS, caption));
    allChecks.push(checkGrid(`${context} [mobile ${MOBILE_COLS}-col]`, count, MOBILE_COLS, caption));
  }

  // 1. Groups
  for (const g of groups) {
    checkBothViewports(`Group ${g.n} — ${g.label}`, g.elements.length, g.label);
  }

  // 2. Periods
  for (const p of periods) {
    checkBothViewports(`Period ${p.n} — ${p.label}`, p.elements.length, p.label);
  }

  // 3. Blocks
  for (const b of blocks) {
    checkBothViewports(`Block ${b.block} — ${b.label}`, b.elements.length, b.label);
  }

  // 4. Categories
  for (const c of categories) {
    checkBothViewports(`Category — ${c.label}`, c.elements.length, c.label);
  }

  // 5. Anomalies
  for (const a of anomalies) {
    checkBothViewports(`Anomaly — ${a.label}`, a.elements.length, a.label);
  }

  // 6. Discoverers
  for (const d of discoverers) {
    checkBothViewports(`Discoverer — ${d.name}`, d.elements.length, d.name);
  }

  // 7. Timeline eras
  // Antiquity
  checkBothViewports('Timeline era — Antiquity', antiquity.length, 'Antiquity');

  // Decades
  const decadeMap = new Map<number, TimelineEntry[]>();
  for (const entry of timeline) {
    if (entry.year != null) {
      const d = decadeOf(entry.year);
      if (!decadeMap.has(d)) decadeMap.set(d, []);
      decadeMap.get(d)!.push(entry);
    }
  }
  for (const [decade, entries] of [...decadeMap.entries()].sort((a, b) => a[0] - b[0])) {
    checkBothViewports(`Timeline era — ${decade}s`, entries.length, `${decade}s`);
  }

  // ---------- report ----------
  const failed = allChecks.filter((c) => c.issues.length > 0);
  const total = allChecks.length;

  console.log(`Checked ${total} grid configurations across ${total / 2} contexts.\n`);

  // Summary table
  const contextsSeen = new Set<string>();
  for (const c of allChecks) {
    const baseCtx = c.context.replace(/ \[(desktop|mobile).*\]/, '');
    if (contextsSeen.has(baseCtx)) continue;
    contextsSeen.add(baseCtx);
    const desktop = allChecks.find((x) => x.context === `${baseCtx} [desktop ${DESKTOP_COLS}-col]`)!;
    const mobile = allChecks.find((x) => x.context === `${baseCtx} [mobile ${MOBILE_COLS}-col]`)!;
    const ok = desktop.issues.length === 0 && mobile.issues.length === 0;
    const mark = ok ? '\u2713' : '\u2717';
    console.log(
      `  ${mark} ${baseCtx}: ${desktop.elementCount} elements ` +
      `(desktop: ${desktop.cols}x${desktop.rows} ${desktop.viewBoxW}x${desktop.viewBoxH}, ` +
      `mobile: ${mobile.cols}x${mobile.rows} ${mobile.viewBoxW}x${mobile.viewBoxH})`,
    );
  }

  if (failed.length === 0) {
    console.log(`\n\u2713 All ${total} grid configurations are correctly aligned.`);
    process.exit(0);
  } else {
    console.error(`\n\u2717 Found alignment issues in ${failed.length} configuration(s):\n`);
    for (const c of failed) {
      console.error(`  ${c.context} (${c.elementCount} elements, ${c.cols} cols):`);
      for (const issue of c.issues) {
        console.error(`    - ${issue}`);
      }
      console.error('');
    }
    process.exit(1);
  }
}

main();
