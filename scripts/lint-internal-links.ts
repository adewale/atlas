/**
 * Internal Link Linter — prevents Lesson #7.
 *
 * Lesson #7: Plain `<a>` tags used for internal navigation caused full page
 *   reloads, breaking the SPA experience (white flash, lost scroll position,
 *   re-fetched JS). This happened because there was no automated check
 *   enforcing React Router `<Link>` for internal URLs.
 *
 * Usage:
 *   npx tsx scripts/lint-internal-links.ts
 *
 * What it checks:
 *   1. JSX/TSX files using `<a href="/...">` for internal paths (should be <Link to="...">)
 *   2. JSX/TSX files using `<a href="/">` for the homepage (should be <Link to="/">)
 *   3. Ignores external URLs (http://, https://, mailto:, #)
 *   4. Ignores non-JSX files (plain HTML, markdown, etc.)
 *
 * Exit code 0 = clean, 1 = violations found.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const SRC_DIR = join(import.meta.dirname ?? __dirname, '..', 'src');

// Matches <a href="/..." or <a href='/' patterns in JSX
// Ignores: external URLs, anchors, mailto, tel
const INTERNAL_LINK_RE = /<a\s+[^>]*href\s*=\s*["'](\/[^"']*?)["']/g;

// Matches <a href={`/...`} or <a href={"/..."} template literal patterns
const TEMPLATE_LINK_RE = /<a\s+[^>]*href\s*=\s*\{[`"'](\/[^`"'}]*)/g;

// Also catch href={someVar} where the var is known to contain an internal route
// This is harder to lint statically, so we just catch the template literal case

// Files allowed to use plain <a> for internal links
// SvgLink.tsx wraps <a> with navigate() for SPA routing inside SVG elements
const ALLOWED_FILES = new Set<string>(['SvgLink.tsx']);

type Violation = {
  file: string;
  line: number;
  href: string;
  text: string;
};

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (['.tsx', '.jsx'].includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function lint(): Violation[] {
  const violations: Violation[] = [];
  const files = walk(SRC_DIR);

  for (const file of files) {
    if (ALLOWED_FILES.has(basename(file))) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      INTERNAL_LINK_RE.lastIndex = 0;

      while ((match = INTERNAL_LINK_RE.exec(line)) !== null) {
        const href = match[1];
        violations.push({
          file: file.replace(SRC_DIR, 'src'),
          line: i + 1,
          href,
          text: line.trim(),
        });
      }

      // Also check template literal hrefs: <a href={`/path/${var}`}>
      TEMPLATE_LINK_RE.lastIndex = 0;
      while ((match = TEMPLATE_LINK_RE.exec(line)) !== null) {
        const href = match[1];
        violations.push({
          file: file.replace(SRC_DIR, 'src'),
          line: i + 1,
          href: href + '...`}',
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
  console.log('✓ No plain <a> tags for internal links found.');
  process.exit(0);
} else {
  console.error(`✗ Found ${violations.length} plain <a> tag(s) for internal links:`);
  console.error('  These should use <Link to="..."> from react-router instead.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    href="${v.href}"`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
}
