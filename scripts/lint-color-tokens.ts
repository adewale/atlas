/**
 * Hardcoded Colour Hex Linter — prevents Lesson #16.
 *
 * Lesson #16: MUSTARD appeared as `#c59b1a` in grid.ts (wrong, low contrast)
 *   while theme.ts had the correct `#856912`. Hardcoded `#fff` and `#555`
 *   appeared instead of PAPER and GREY_MID tokens.
 *
 * Usage:
 *   npx tsx scripts/lint-color-tokens.ts
 *
 * What it checks:
 *   Scans all .tsx and .ts files in src/ (except theme.ts itself) for raw
 *   hex colour literals (#xxx, #xxxxxx, #xxxxxxxx). Flags any that should
 *   be using a token from theme.ts instead.
 *
 * Exit code 0 = clean, 1 = violations found.
 */
import { readFileSync } from 'fs';
import { basename } from 'path';
import { SRC_DIR, COMMENT_RE, IMPORT_RE, walk, relPath, groupBy } from './lint-utils.js';

// Files that ARE the token source — allowed to define hex values
const TOKEN_SOURCE_FILES = new Set(['theme.ts', 'globals.css']);

// Hex patterns that are universally acceptable (not theme colours)
// e.g. SVG filter IDs, transparent, currentColor references
const ALLOWED_PATTERNS = new Set([
  'none',       // SVG fill="none"
]);

// Matches hex colour literals: #xxx, #xxxx, #xxxxxx, #xxxxxxxx
const HEX_COLOUR_RE = /#[0-9a-fA-F]{3,8}\b/g;

type Violation = {
  file: string;
  line: number;
  hex: string;
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

      // Skip comments and import lines
      if (COMMENT_RE.test(line) || IMPORT_RE.test(line)) continue;

      let match: RegExpExecArray | null;
      HEX_COLOUR_RE.lastIndex = 0;

      while ((match = HEX_COLOUR_RE.exec(line)) !== null) {
        const hex = match[0];
        if (ALLOWED_PATTERNS.has(hex)) continue;

        violations.push({
          file: relPath(file),
          line: i + 1,
          hex,
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
  console.log('✓ No hardcoded hex colour values found outside theme.ts.');
  process.exit(0);
} else {
  console.warn(`⚠ Found ${violations.length} hex colour literal(s) outside theme.ts:`);
  console.warn('  Consider importing from theme.ts instead.\n');

  // Group by file for readability
  const byFile = groupBy(violations, v => v.file);

  for (const [file, vs] of byFile) {
    console.warn(`  ${file}:`);
    for (const v of vs) {
      console.warn(`    L${v.line}: ${v.hex}  — ${v.text.slice(0, 80)}`);
    }
    console.warn('');
  }

  // Exit with warning (0) rather than failure — some hex values are legitimate
  // (e.g. SVG gradient stops derived from data). Use --strict flag for CI.
  if (process.argv.includes('--strict')) {
    process.exit(1);
  } else {
    console.warn('  Run with --strict to make this a hard failure.\n');
    process.exit(0);
  }
}
