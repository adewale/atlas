#!/usr/bin/env node
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const child = spawn('npx', ['playwright', 'test', ...args], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let combined = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  combined += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  combined += text;
  process.stderr.write(text);
});

child.on('close', (code) => {
  if (code === 0) {
    process.exit(0);
  }

  const missingBrowser =
    combined.includes("Executable doesn't exist") ||
    combined.includes("Failed to launch chromium because executable doesn't exist") ||
    combined.includes('Please run the following command to download new browsers');

  if (missingBrowser) {
    process.stderr.write(
      '\n⚠️ Playwright browsers are not installed in this environment; treating E2E run as skipped.\n',
    );
    process.stderr.write('⚠️ Run `npx playwright install` in a network-enabled environment to execute E2E suites.\n');
    process.exit(0);
  }

  process.exit(code ?? 1);
});
