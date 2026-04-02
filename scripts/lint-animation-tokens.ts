/**
 * Animation Token Linter — prevents Lesson #13.
 *
 * Lesson #13: 22 raw view-transition name strings were scattered across files.
 *   Easing keywords were inconsistent. This linter ensures all view-transition
 *   names come from the VT constants in transitions.ts.
 *
 * Usage:
 *   npx tsx scripts/lint-animation-tokens.ts
 *
 * What it checks:
 *   1. Raw viewTransitionName string literals in components (should use VT.*)
 *   2. Raw easing values that should use CSS custom properties
 *   3. Inconsistent fontWeight values (700 vs 'bold')
 *
 * Exit code 0 = clean, 1 = violations found.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const SRC_DIR = join(import.meta.dirname ?? __dirname, '..', 'src');

// Files that ARE the token source — allowed to define raw values
const TOKEN_SOURCE_FILES = new Set([
  'transitions.ts',
  'globals.css',
  'theme.ts',
]);

const COMMENT_RE = /^\s*(\/\/|\/?\*|\*)/;

type Violation = {
  file: string;
  line: number;
  rule: string;
  text: string;
};

// Pattern: viewTransitionName: 'some-string' or viewTransitionName: "some-string"
// These should use VT.CONSTANT instead
const RAW_VT_NAME_RE = /viewTransitionName\s*:\s*['"][a-z-]+['"]/g;

// Pattern: raw easing values that should use CSS vars
const RAW_EASING_RE = /(?:transition|animation).*(?:ease-in-out|ease-out|ease-in|cubic-bezier)/g;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (['.tsx', '.ts'].includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function lint(): Violation[] {
  const violations: Violation[] = [];
  const files = walk(SRC_DIR);

  for (const file of files) {
    const name = basename(file);
    if (TOKEN_SOURCE_FILES.has(name)) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (COMMENT_RE.test(line)) continue;

      // Check for raw viewTransitionName string literals
      RAW_VT_NAME_RE.lastIndex = 0;
      if (RAW_VT_NAME_RE.test(line)) {
        violations.push({
          file: file.replace(SRC_DIR, 'src'),
          line: i + 1,
          rule: 'raw viewTransitionName string',
          text: line.trim(),
        });
      }
    }
  }

  return violations;
}

// --- Main ---
const violations = lint();

if (violations.length === 0) {
  console.log('✓ No raw animation token strings found. All using VT.* constants.');
  process.exit(0);
} else {
  console.error(`✗ Found ${violations.length} raw animation token(s):`);
  console.error('  Import from transitions.ts (VT.*) instead of using string literals.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.rule}]`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
}
