import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

export const SRC_DIR = join(import.meta.dirname ?? __dirname, '..', 'src');
export const COMMENT_RE = /^\s*(\/\/|\/?\*|\*)/;
export const IMPORT_RE = /^\s*import\s/;

/** Recursively collect .ts/.tsx files (optionally include .jsx). */
export function walk(dir: string, extensions = ['.tsx', '.ts']): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full, extensions));
    } else if (extensions.includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

/** Normalize absolute path to relative 'src/...' format. */
export function relPath(file: string): string {
  return file.replace(SRC_DIR, 'src');
}

/** Group array items by a key function. */
export function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

type ReportOptions = {
  /** Displayed on clean run. E.g. "No hardcoded hex colours found." */
  cleanMessage: string;
  /** Prefix for violation summary. E.g. "hex colour literal(s)" */
  violationNoun: string;
  /** Guidance line shown below the count. */
  hint: string;
  /** Format a single violation into lines for display. */
  formatViolation: (v: any) => string[];
  /** If true, always exit 1 on violations. Otherwise only with --strict. */
  alwaysFail?: boolean;
};

/**
 * Shared report-and-exit logic for all lint scripts.
 * Handles the clean/warn/strict pattern so each linter only provides the scan.
 */
export function reportAndExit<T extends { file: string }>(violations: T[], opts: ReportOptions): never {
  if (violations.length === 0) {
    console.log(`\u2713 ${opts.cleanMessage}`);
    process.exit(0);
  }

  const log = opts.alwaysFail ? console.error : console.warn;
  const icon = opts.alwaysFail ? '\u2717' : '\u26A0';
  log(`${icon} Found ${violations.length} ${opts.violationNoun}:`);
  log(`  ${opts.hint}\n`);

  const byFile = groupBy(violations, (v) => v.file);
  for (const [file, vs] of byFile) {
    log(`  ${file}:`);
    for (const v of vs) {
      for (const line of opts.formatViolation(v)) {
        log(`    ${line}`);
      }
    }
    log('');
  }

  if (opts.alwaysFail || process.argv.includes('--strict')) {
    process.exit(1);
  } else {
    log('  Run with --strict to make this a hard failure.\n');
    process.exit(0);
  }
}
