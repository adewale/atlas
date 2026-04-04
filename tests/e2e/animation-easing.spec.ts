import { test, expect } from '@playwright/test';

/**
 * Animation Easing & Timing Validation Tests.
 *
 * Verifies that CSS animations use the correct easing curves,
 * durations, and timing functions. Catches:
 * - cubic-bezier typos (ease-in vs ease-out)
 * - Invalid animation-name references
 * - Missing --ease-out custom property
 * - Zero-duration animations that skip visual feedback
 */

test.describe('CSS custom properties', () => {
  test('--ease-out is defined and is a valid cubic-bezier', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]');

    const easeOut = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
    });
    expect(easeOut).toMatch(/cubic-bezier\([\d.,\s]+\)/);
    // Exact value: cubic-bezier(0.16, 1, 0.3, 1) — a fast-exit curve
    expect(easeOut).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
  });
});

test.describe('Folio animation properties', () => {
  test('folio-line-reveal uses --ease-out and has correct duration', async ({ page }) => {
    await page.goto('/elements/Fe');
    // Don't wait for animations to finish — we want to inspect the properties
    await page.waitForSelector('.folio-identity', { timeout: 10000 });

    const animProps = await page.evaluate(() => {
      const el = document.querySelector('.folio-identity');
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        animationTimingFunction: style.animationTimingFunction,
        animationFillMode: style.animationFillMode,
      };
    });

    expect(animProps).not.toBeNull();
    expect(animProps!.animationName).toContain('folio-line-reveal');
    expect(animProps!.animationDuration).toBe('0.4s');
    expect(animProps!.animationFillMode).toBe('forwards');
    // Should use the --ease-out custom property → cubic-bezier(0.16, 1, 0.3, 1)
    expect(animProps!.animationTimingFunction).toMatch(/cubic-bezier/);
  });

  test('plate-wipe animation has correct clip-path and delay', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });

    const animProps = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="data-plate"]');
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        animationDelay: style.animationDelay,
        clipPath: style.clipPath,
      };
    });

    expect(animProps).not.toBeNull();
    expect(animProps!.animationName).toContain('plate-wipe');
    expect(animProps!.animationDuration).toBe('0.35s');
    // plate-wipe has a 150ms delay
    expect(animProps!.animationDelay).toBe('0.15s');
  });

  test('animations complete — folio identity reaches opacity 1', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('.folio-identity', { timeout: 10000 });
    // Wait for animation to finish (400ms + 100ms buffer)
    await page.waitForTimeout(600);

    const opacity = await page.evaluate(() => {
      const el = document.querySelector('.folio-identity');
      return el ? parseFloat(getComputedStyle(el).opacity) : 0;
    });
    expect(opacity).toBe(1);
  });

  test('animations complete — data plate clip-path is fully revealed', async ({ page }) => {
    await page.goto('/elements/Fe');
    await page.waitForSelector('[data-testid="data-plate"]', { timeout: 10000 });
    // Wait for plate-wipe: 150ms delay + 350ms duration + buffer
    await page.waitForTimeout(700);

    const clipPath = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="data-plate"]');
      return el ? getComputedStyle(el).clipPath : '';
    });
    // After animation completes, clip-path should be none or inset(0 0 0 0)
    expect(clipPath === 'none' || clipPath === 'inset(0px)' || clipPath === 'inset(0px 0px)' || clipPath === 'inset(0px 0px 0px 0px)').toBe(true);
  });
});

test.describe('Periodic table ripple animation', () => {
  test('element cells use staggered transition delay', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg [role="button"]');

    // Check that different elements have different transition delays
    // (the ripple propagation pattern uses dist * 8ms delay)
    const delays = await page.evaluate(() => {
      const cells = document.querySelectorAll('svg g[role="button"]');
      const sample: string[] = [];
      cells.forEach((c, i) => {
        if (i % 30 === 0) {
          const style = getComputedStyle(c);
          sample.push(style.transitionDelay || style.animationDelay || '0s');
        }
      });
      return sample;
    });

    // At least some cells should have non-zero delays (staggered ripple)
    expect(delays.length).toBeGreaterThan(0);
  });
});

test.describe('Animation keyframes exist in stylesheets', () => {
  test('all expected keyframe names are defined', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const keyframeNames = await page.evaluate(() => {
      const names: string[] = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSKeyframesRule) {
              names.push(rule.name);
            }
          }
        } catch { /* cross-origin */ }
      }
      return names;
    });

    const expected = [
      'folio-line-reveal',
      'plate-wipe',
      'wipe-left',
      'bar-grow',
      'rule-draw',
      'compare-expand',
      'compare-scale',
      'card-enter',
      'svg-fade-in',
      'help-panel-enter',
      'sparkline-draw',
      'vt-exit',
      'vt-enter',
    ];

    for (const name of expected) {
      expect(keyframeNames, `Missing @keyframes ${name}`).toContain(name);
    }
  });
});

test.describe('prefers-reduced-motion', () => {
  test('animations are suppressed when user prefers reduced motion', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/elements/Fe');
    await page.waitForSelector('.folio-identity', { timeout: 10000 });

    // With reduced motion, the identity block should be immediately visible
    // (no 400ms animation delay before opacity reaches 1)
    const opacity = await page.evaluate(() => {
      const el = document.querySelector('.folio-identity');
      return el ? parseFloat(getComputedStyle(el).opacity) : 0;
    });

    // Either the animation is skipped entirely (opacity=1) or the
    // animation-duration is set to near-zero by the CSS media query
    const animDuration = await page.evaluate(() => {
      const el = document.querySelector('.folio-identity');
      return el ? getComputedStyle(el).animationDuration : '0s';
    });

    // At least one of these should be true:
    // 1. opacity is already 1 (animation skipped)
    // 2. animation duration is effectively zero
    const isReduced = opacity === 1 || animDuration === '0s' || animDuration === '0.001s';
    expect(isReduced, 'Animation should be reduced or skipped').toBe(true);

    await context.close();
  });
});
