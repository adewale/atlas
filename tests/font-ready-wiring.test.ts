import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Wiring regression: the drop-cap overlap fix only works if the font-load
 * signal actually triggers measurement invalidation. This bug previously
 * regressed because `markReady` called pretext's `clearCache()` (which
 * leaves the canvas stale) instead of discarding our measurement canvas.
 *
 * These tests drive `useFontsReady`'s module-level font-load detection
 * with a fake `document.fonts` and assert that `invalidateMeasurementState`
 * is called when — and only when — the web font transitions from
 * unavailable to loaded.
 */

type Handler = () => void;

function installFakeFonts(opts: { initiallyLoaded: boolean }) {
  const handlers: Record<string, Handler[]> = {};
  const state = { loaded: opts.initiallyLoaded };
  let resolveReady!: () => void;
  const ready = new Promise<void>((res) => {
    resolveReady = res;
  });
  const fonts = {
    check: () => state.loaded,
    addEventListener: (type: string, fn: Handler) => {
      (handlers[type] ||= []).push(fn);
    },
    removeEventListener: (type: string, fn: Handler) => {
      handlers[type] = (handlers[type] || []).filter((f) => f !== fn);
    },
    ready,
    _fire(type: string) {
      [...(handlers[type] || [])].forEach((fn) => fn());
    },
    _setLoaded(v: boolean) {
      state.loaded = v;
    },
    _resolveReady() {
      resolveReady();
    },
  };
  Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
  return fonts;
}

describe('useFontsReady → measurement invalidation wiring', () => {
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(document, 'fonts', originalDescriptor);
    }
    vi.doUnmock('../src/lib/measurement-cache');
  });

  it('invalidates measurement state when the web font finishes loading', async () => {
    const fonts = installFakeFonts({ initiallyLoaded: false });
    const invalidate = vi.fn();
    vi.doMock('../src/lib/measurement-cache', () => ({
      invalidateMeasurementState: invalidate,
      measureCharWidth: () => 50,
    }));

    await import('../src/hooks/useFontsReady');
    // Flush the `document.fonts.ready.then(...)` backstop while the font is
    // still unavailable — it must not fire early.
    fonts._resolveReady();
    await Promise.resolve();
    await Promise.resolve();
    expect(invalidate).not.toHaveBeenCalled();

    // The web font arrives.
    fonts._setLoaded(true);
    fonts._fire('loadingdone');

    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate again on subsequent font-load batches', async () => {
    const fonts = installFakeFonts({ initiallyLoaded: false });
    const invalidate = vi.fn();
    vi.doMock('../src/lib/measurement-cache', () => ({
      invalidateMeasurementState: invalidate,
      measureCharWidth: () => 50,
    }));

    await import('../src/hooks/useFontsReady');
    fonts._setLoaded(true);
    fonts._fire('loadingdone');
    fonts._fire('loadingdone');

    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate on the reload path (font already cached at import)', async () => {
    installFakeFonts({ initiallyLoaded: true });
    const invalidate = vi.fn();
    vi.doMock('../src/lib/measurement-cache', () => ({
      invalidateMeasurementState: invalidate,
      measureCharWidth: () => 50,
    }));

    await import('../src/hooks/useFontsReady');
    await Promise.resolve();

    // Nothing was ever measured against a fallback, so nothing to invalidate.
    expect(invalidate).not.toHaveBeenCalled();
  });
});
