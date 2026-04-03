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
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const SRC_DIR = join(import.meta.dirname ?? __dirname, '..', 'src');

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

// Contexts to skip
const COMMENT_RE = /^\s*(\/\/|\/?\*|\*)/;
const IMPORT_RE = /^\s*import\s/;

type Violation = {
  file: string;
  line: number;
  matched: string;
  token: string;
  source: string;
  text: string;
};

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
            file: file.replace(SRC_DIR, 'src'),
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
const violations = lint();

if (violations.length === 0) {
  console.log('✓ No hardcoded font family strings found outside token sources.');
  process.exit(0);
} else {
  console.warn(`⚠ Found ${violations.length} hardcoded font family string(s):`);
  console.warn('  Consider importing the centralized constant instead.\n');

  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  for (const [file, vs] of byFile) {
    console.warn(`  ${file}:`);
    for (const v of vs) {
      console.warn(`    L${v.line}: "${v.matched}" → use ${v.token} from ${v.source}`);
      console.warn(`           ${v.text.slice(0, 80)}`);
    }
    console.warn('');
  }

  if (process.argv.includes('--strict')) {
    process.exit(1);
  } else {
    console.warn('  Run with --strict to make this a hard failure.\n');
    process.exit(0);
  }
}
