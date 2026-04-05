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
import { SRC_DIR, COMMENT_RE, walk, relPath, reportAndExit } from './lint-utils.js';

// Patterns that indicate a non-null assertion on a nullable lookup
// Matches: getElement(...)!, .find(...)!, .get(...)!, bySymbol.get(...)!
const DANGEROUS_PATTERNS = [
  /getElement\([^)]*\)\s*!/g,
  /\.find\([^)]*\)\s*!/g,
  /\.get\([^)]*\)\s*!/g,
  /bySymbol\.get\([^)]*\)\s*!/g,
];

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
reportAndExit(lint(), {
  cleanMessage: 'No dangerous non-null assertions on data lookups found.',
  violationNoun: 'non-null assertion(s) on nullable lookups',
  hint: 'Use type guards instead of ! to handle null safely.',
  formatViolation: (v) => [`L${v.line} (${v.pattern}): ${v.text}`],
  alwaysFail: true,
});
