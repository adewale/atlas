import '@testing-library/jest-dom/vitest';
import { registerCinzelWithNodeCanvas } from './fonts';

// jsdom lacks OffscreenCanvas — polyfill with node-canvas so @chenglou/pretext
// can do real text measurement instead of requiring mocks everywhere.
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas, registerFont } = require('canvas');
    // Measure the drop cap with Cinzel's real metrics, as Chromium does once
    // the web font loads, instead of a fallback font
    // (tests/e2e/measurement-parity.spec.ts checks the two agree).
    registerCinzelWithNodeCanvas(registerFont);
    (globalThis as Record<string, unknown>).OffscreenCanvas = class OffscreenCanvas {
      private _canvas: ReturnType<typeof createCanvas>;
      constructor(w: number, h: number) { this._canvas = createCanvas(w, h); }
      getContext(type: string) { return this._canvas.getContext(type); }
    };
  } catch (error) {
    // canvas is a devDependency; without it pretext has no measurement engine.
    throw new Error('tests/setup.ts: could not set up node-canvas', { cause: error });
  }
}

// jsdom doesn't provide ResizeObserver — stub it for component tests
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
