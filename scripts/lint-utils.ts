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
