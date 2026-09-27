/**
 * E2E Hygiene Linter — prevents Lesson #29 and network-dependent E2E runs.
 *
 * Lesson #29: fixed sleeps (`page.waitForTimeout`) are slow when the page is
 *   ready early and flaky when the machine is loaded. Use the condition waits
 *   in tests/e2e/helpers/settle.ts instead.
 *
 * Usage:
 *   npx tsx scripts/lint-e2e.ts
 *
 * What it checks (tests/e2e/**\/*.ts):
 *   1. waitForTimeout ratchet: no file may have more calls than
 *      tests/e2e/wait-for-timeout-baseline.json allows, and files not listed
 *      may have none. When a file gets below its allowance, the baseline must
 *      be lowered too, so the removed sleeps cannot silently come back.
 *   2. Specs import `test` from './fixtures', not '@playwright/test', so every
 *      context serves the committed fonts instead of Google Fonts.
 *   3. Every `browser.newContext(...)` in a spec is paired with
 *      `serveFontsLocally(...)` for the same reason.
 *
 * Exit code 0 = clean, 1 = violations found.
 */
import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { pathToFileURL } from 'url';
import { walk, reportAndExit } from './lint-utils.js';

const ROOT = join(import.meta.dirname ?? __dirname, '..');

export type E2eFile = { file: string; text: string };
export type Baseline = Record<string, number>;
export type Violation = { file: string; rule: string; detail: string };

const WAIT_FOR_TIMEOUT_RE = /\bwaitForTimeout\s*\(/g;
// Value imports only; `import type { Page } from '@playwright/test'` is fine.
const PLAYWRIGHT_VALUE_IMPORT_RE = /^\s*import\s+(?!type\b)[^;]*from\s+['"]@playwright\/test['"]/m;
const NEW_CONTEXT_RE = /\bbrowser\.newContext\s*\(/g;
const SERVE_FONTS_RE = /\bserveFontsLocally\s*\(/g;

function count(re: RegExp, text: string): number {
  return text.match(re)?.length ?? 0;
}

export function lintE2e(files: E2eFile[], baseline: Baseline): Violation[] {
  const violations: Violation[] = [];
  const seen = new Set<string>();

  for (const { file, text } of files) {
    seen.add(file);
    const allowed = baseline[file] ?? 0;
    const actual = count(WAIT_FOR_TIMEOUT_RE, text);
    if (actual > allowed) {
      violations.push({
        file,
        rule: 'waitForTimeout',
        detail: `${actual} waitForTimeout call(s), baseline allows ${allowed}. Wait for a condition instead (tests/e2e/helpers/settle.ts).`,
      });
    } else if (actual < allowed) {
      violations.push({
        file,
        rule: 'waitForTimeout ratchet',
        detail: `${actual} waitForTimeout call(s) but baseline still allows ${allowed}. Lower it in tests/e2e/wait-for-timeout-baseline.json.`,
      });
    }

    if (file.endsWith('.spec.ts')) {
      if (PLAYWRIGHT_VALUE_IMPORT_RE.test(text)) {
        violations.push({
          file,
          rule: 'fixtures import',
          detail: "imports from '@playwright/test'; import { test, expect } from './fixtures' so fonts are served locally.",
        });
      }
      const contexts = count(NEW_CONTEXT_RE, text);
      const served = count(SERVE_FONTS_RE, text);
      if (contexts > served) {
        violations.push({
          file,
          rule: 'newContext fonts',
          detail: `${contexts} browser.newContext() call(s) but ${served} serveFontsLocally() call(s).`,
        });
      }
    }
  }

  for (const file of Object.keys(baseline)) {
    if (!seen.has(file)) {
      violations.push({ file, rule: 'waitForTimeout ratchet', detail: 'file no longer exists; remove it from the baseline.' });
    }
  }
  return violations;
}

export function readE2eFiles(root = ROOT): E2eFile[] {
  return walk(join(root, 'tests', 'e2e'), ['.ts'])
    .map((path) => ({ file: relative(root, path).split('\\').join('/'), text: readFileSync(path, 'utf-8') }))
    .filter(({ file }) => !file.includes('-snapshots/'));
}

export function readBaseline(root = ROOT): Baseline {
  const path = join(root, 'tests', 'e2e', 'wait-for-timeout-baseline.json');
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf-8')) as Baseline) : {};
}

// --- Main ---
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  reportAndExit(lintE2e(readE2eFiles(), readBaseline()), {
    cleanMessage: 'E2E specs use condition waits within the ratchet and serve fonts locally.',
    violationNoun: 'E2E hygiene violation(s)',
    hint: 'See scripts/lint-e2e.ts for the rules.',
    formatViolation: (v) => [`[${v.rule}] ${v.detail}`],
    alwaysFail: true,
  });
}
