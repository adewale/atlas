/**
 * Font Family Token Linter — prevents font drift.
 *
 * The codebase centralizes font constants:
 *   - PRETEXT_SANS (src/lib/pretext.ts) — body/UI text
 *   - DROP_CAP_FONT (src/lib/pretext.ts) — Cinzel drop caps and wordmark
 *   - MONO_FONT (src/lib/theme.ts)      — monospace displays
 *
 * This linter flags hardcoded font family strings that should use
 * centralized constants instead.
 *
 * Usage:
 *   npx tsx scripts/lint-font-tokens.ts
 *   npx tsx scripts/lint-font-tokens.ts --strict  # exit 1 on violations
 *
 * Exit code 0 = clean (or warnings only), 1 = violations (--strict mode).
 */
import { readFileSync } from 'fs';
import { basename } from 'path';
import { SRC_DIR, COMMENT_RE, IMPORT_RE, walk, relPath, reportAndExit } from './lint-utils.js';

// Files that define the font tokens or document them — allowed to contain raw font strings
// Design.tsx is the design system showcase that labels fonts by name in descriptive text
const TOKEN_SOURCE_FILES = new Set(['pretext.ts', 'theme.ts', 'Design.tsx']);

// Font strings that MUST use a token. Map from pattern → suggested constant.
const FONT_VIOLATIONS: Array<{ pattern: RegExp; token: string; source: string }> = [
  {
    pattern: /Cinzel/,
    token: 'DROP_CAP_FONT',
    source: 'src/lib/pretext.ts',
  },
  {
    pattern: /["']Helvetica Neue["']/,
    token: 'PRETEXT_SANS',
    source: 'src/lib/pretext.ts',
  },
  {
    pattern: /SF Mono/,
    token: 'MONO_FONT',
    source: 'src/lib/theme.ts',
  },
  {
    pattern: /Cascadia Code/,
    token: 'MONO_FONT',
    source: 'src/lib/theme.ts',
  },
];

type Violation = {
  file: string;
  line: number;
  matched: string;
  token: string;
  source: string;
  text: string;
};

function lint(): Violation[] {
  const violations: Violation[] = [];
  const files = walk(SRC_DIR);

  for (const file of files) {
    if (TOKEN_SOURCE_FILES.has(basename(file))) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (COMMENT_RE.test(line) || IMPORT_RE.test(line)) continue;

      for (const rule of FONT_VIOLATIONS) {
        const match = rule.pattern.exec(line);
        if (match) {
          violations.push({
            file: relPath(file),
            line: i + 1,
            matched: match[0],
            token: rule.token,
            source: rule.source,
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
  cleanMessage: 'No hardcoded font family strings found outside token sources.',
  violationNoun: 'hardcoded font family string(s)',
  hint: 'Consider importing the centralized constant instead.',
  formatViolation: (v) => [
    `L${v.line}: "${v.matched}" \u2192 use ${v.token} from ${v.source}`,
    `       ${v.text.slice(0, 80)}`,
  ],
});
