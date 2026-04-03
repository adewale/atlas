import '@testing-library/jest-dom/vitest';

// jsdom lacks OffscreenCanvas — polyfill with node-canvas so @chenglou/pretext
// can do real text measurement instead of requiring mocks everywhere.
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('canvas');
    (globalThis as Record<string, unknown>).OffscreenCanvas = class OffscreenCanvas {
      private _canvas: ReturnType<typeof createCanvas>;
      constructor(w: number, h: number) { this._canvas = createCanvas(w, h); }
      getContext(type: string) { return this._canvas.getContext(type); }
    };
  } catch {
    // canvas package not installed — tests that need pretext must still mock it
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
