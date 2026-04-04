/**
 * Non-null Assertion Linter — prevents Lesson #15.
 *
 * Lesson #15: `getElement(symbol)!` was scattered through the codebase,
 *   hiding potential null-dereference bugs. TypeScript's `!` compiles away
 *   silently — it lies to the type checker rather than handling the error.
 *
 * Usage:
 *   npx tsx scripts/lint-non-null-assertions.ts
 *
 * What it checks:
 *   Scans all .tsx and .ts files in src/ for non-null assertions (`!.` and
 *   `!)`) on data lookup patterns — specifically calls to functions that
 *   return nullable types (getElement, .find, .get, etc.).
 *
 * Exit code 0 = clean, 1 = violations found.
 */
import { readFileSync } from 'fs';
import { SRC_DIR, COMMENT_RE, walk, relPath } from './lint-utils.js';

// Patterns that indicate a non-null assertion on a nullable lookup
// Matches: getElement(...)!, .find(...)!, .get(...)!, bySymbol.get(...)!
const DANGEROUS_PATTERNS = [
  /getElement\([^)]*\)\s*!/g,
  /\.find\([^)]*\)\s*!/g,
  /\.get\([^)]*\)\s*!/g,
  /bySymbol\.get\([^)]*\)\s*!/g,
];

// Generic non-null assertion on any expression (broader check)
// Matches: expr!. or expr!) but not !== or !=
const GENERIC_NONNULL_RE = /[a-zA-Z0-9_)\]]\s*!\s*\./g;

type Violation = {
  file: string;
  line: number;
  pattern: string;
  text: string;
};

function lint(): Violation[] {
  const violations: Violation[] = [];
  const files = walk(SRC_DIR);

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (COMMENT_RE.test(line)) continue;

      // Check dangerous lookup patterns
      for (const pattern of DANGEROUS_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push({
            file: relPath(file),
            line: i + 1,
            pattern: 'nullable lookup with !',
            text: line.trim(),
          });
        }
      }
    }
  }

  return violations;
}

// --- Main ---
const violations = lint();

if (violations.length === 0) {
  console.log('✓ No dangerous non-null assertions on data lookups found.');
  process.exit(0);
} else {
  console.error(`✗ Found ${violations.length} non-null assertion(s) on nullable lookups:`);
  console.error('  Use type guards instead of ! to handle null safely.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} (${v.pattern})`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
}
