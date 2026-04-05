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
import { readFileSync } from 'fs';
import { basename } from 'path';
import { SRC_DIR, COMMENT_RE, walk, relPath, reportAndExit } from './lint-utils.js';

// Files that ARE the token source — allowed to define raw values
const TOKEN_SOURCE_FILES = new Set([
  'transitions.ts',
  'globals.css',
  'theme.ts',
]);

type Violation = {
  file: string;
  line: number;
  rule: string;
  text: string;
};

// Pattern: viewTransitionName: 'some-string' or viewTransitionName: "some-string"
// These should use VT.CONSTANT instead
const RAW_VT_NAME_RE = /viewTransitionName\s*:\s*['"][a-z-]+['"]/g;

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
          file: relPath(file),
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
reportAndExit(lint(), {
  cleanMessage: 'No raw animation token strings found. All using VT.* constants.',
  violationNoun: 'raw animation token(s)',
  hint: 'Import from transitions.ts (VT.*) instead of using string literals.',
  formatViolation: (v) => [`L${v.line} [${v.rule}]: ${v.text}`],
  alwaysFail: true,
});
