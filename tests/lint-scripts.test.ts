/**
 * Planted-violation tests for the custom linters in scripts/lint-*.ts.
 * A guard nobody has seen fail is not known to work (docs lesson #30: a
 * linter silently missed template-literal hrefs). Each linter runs against a
 * temporary source tree with one planted violation, and against a clean one.
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { lintE2e, readBaseline, readE2eFiles } from '../scripts/lint-e2e';

const ROOT = join(__dirname, '..');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const dirs: string[] = [];

function runLinter(script: string, files: Record<string, string>, args: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-lint-'));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  const result = spawnSync(TSX, [join(ROOT, 'scripts', script), ...args], {
    env: { ...process.env, LINT_SRC_DIR: dir },
    encoding: 'utf-8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

// Spawning tsx takes ~1-3 s per run; these budgets are for the subprocesses.
const SUBPROCESS_TIMEOUT = 30_000;

describe('scripts/lint-*.ts catch planted violations', () => {
  const cases: Array<{ script: string; label: string; bad: string; clean: string; args?: string[] }> = [
    {
      script: 'lint-internal-links.ts',
      label: 'plain href',
      bad: 'export const A = () => <a href="/elements/Fe">Iron</a>;\n',
      clean: 'export const A = () => <a href="https://example.com">x</a>;\n',
    },
    {
      script: 'lint-internal-links.ts',
      label: 'template-literal href',
      // Lesson #30: the template-literal form was once missed.
      bad: 'export const A = ({ s }: { s: string }) => <a href={`/elements/${s}`}>x</a>;\n',
      clean: 'export const A = () => <a href="#top">x</a>;\n',
    },
    {
      script: 'lint-non-null-assertions.ts',
      label: 'Map.get()!',
      bad: 'export const n = bySymbol.get("Fe")!.name;\n',
      clean: 'export const n = bySymbol.get("Fe")?.name;\n',
    },
    {
      script: 'lint-animation-tokens.ts',
      label: 'raw view-transition name',
      bad: "export const s = { viewTransitionName: 'folio-title' };\n",
      clean: 'export const s = { viewTransitionName: VT.FOLIO_TITLE };\n',
    },
    {
      script: 'lint-font-tokens.ts',
      label: 'raw Cinzel font string',
      bad: "export const f = '700 80px Cinzel, Georgia, serif';\n",
      clean: 'export const f = DROP_CAP_FONT;\n',
      args: ['--strict'],
    },
    {
      script: 'lint-color-tokens.ts',
      label: 'hex colour',
      bad: "export const c = '#ff0000';\n",
      clean: 'export const c = COLORS.accent;\n',
      args: ['--strict'],
    },
  ];

  for (const { script, label, bad, clean, args = [] } of cases) {
    const ext = script === 'lint-internal-links.ts' ? 'tsx' : 'ts';
    it(`${script} ${args.join(' ')} fails on a planted violation (${label})`, () => {
      const { status, output } = runLinter(script, { [`components/Planted.${ext}`]: bad }, args);
      expect(status, output).toBe(1);
      expect(output).toContain('Planted');
    }, SUBPROCESS_TIMEOUT);

    it(`${script} ${args.join(' ')} passes a clean tree (${label})`, () => {
      const { status, output } = runLinter(script, { [`components/Clean.${ext}`]: clean }, args);
      expect(status, output).toBe(0);
    }, SUBPROCESS_TIMEOUT);
  }

  it('lint-color-tokens.ts without --strict only warns (it is advisory in lint:all)', () => {
    const { status, output } = runLinter('lint-color-tokens.ts', { 'components/Planted.ts': "export const c = '#ff0000';\n" });
    expect(status).toBe(0);
    expect(output).toContain('Planted');
  }, SUBPROCESS_TIMEOUT);
});

describe('scripts/lint-e2e.ts', () => {
  const spec = (text: string) => ({ file: 'tests/e2e/planted.spec.ts', text });
  const ok = "import { test, expect } from './fixtures';\n";

  it('flags a new waitForTimeout in a file without an allowance', () => {
    const v = lintE2e([spec(`${ok}await page.waitForTimeout(500);\n`)], {});
    expect(v.map((x) => x.rule)).toEqual(['waitForTimeout']);
  });

  it('flags growth above the baseline and a baseline left above the actual count', () => {
    const text = `${ok}await page.waitForTimeout(1);\nawait page.waitForTimeout(2);\n`;
    expect(lintE2e([spec(text)], { 'tests/e2e/planted.spec.ts': 1 }).map((x) => x.rule)).toEqual(['waitForTimeout']);
    expect(lintE2e([spec(text)], { 'tests/e2e/planted.spec.ts': 3 }).map((x) => x.rule)).toEqual(['waitForTimeout ratchet']);
    expect(lintE2e([spec(text)], { 'tests/e2e/planted.spec.ts': 2 })).toEqual([]);
  });

  it('flags baseline entries for files that no longer exist', () => {
    expect(lintE2e([], { 'tests/e2e/gone.spec.ts': 1 }).map((x) => x.rule)).toEqual(['waitForTimeout ratchet']);
  });

  it("flags specs that import test from '@playwright/test' but allows type imports", () => {
    expect(lintE2e([spec("import { test, expect } from '@playwright/test';\n")], {}).map((x) => x.rule)).toEqual(['fixtures import']);
    expect(lintE2e([spec(`${ok}import type { Page } from '@playwright/test';\n`)], {})).toEqual([]);
  });

  it('flags browser.newContext() without serveFontsLocally()', () => {
    const text = `${ok}const c = await browser.newContext({});\n`;
    expect(lintE2e([spec(text)], {}).map((x) => x.rule)).toEqual(['newContext fonts']);
    expect(lintE2e([spec(`${text}await serveFontsLocally(c);\n`)], {})).toEqual([]);
  });

  it('passes on the repository as committed', () => {
    expect(lintE2e(readE2eFiles(), readBaseline())).toEqual([]);
  });
});
