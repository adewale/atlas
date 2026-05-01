import { useState, useEffect } from 'react';
import { invalidateMeasurementState } from '../lib/measurement-cache';

/**
 * Returns true once the Cinzel web font (used for drop caps and the
 * ATLAS wordmark) is available for Canvas text measurement.
 *
 * Why not just `document.fonts.ready`?  On first page load the Google
 * Fonts `<link>` stylesheet may not have been fetched yet, so the
 * browser has no pending @font-face rules and `fonts.ready` resolves
 * immediately — before Cinzel is even known about.  On reload the CSS
 * is cached and the font is available instantly.
 *
 * Instead we use `document.fonts.check()` to probe for Cinzel and
 * listen to the `loadingdone` event which fires each time a batch of
 * fonts finishes loading.
 *
 * When fonts arrive we discard our cached measurement canvas and
 * pretext's width-cache (see `lib/measurement-cache`) so hooks which
 * depend on `fontsReady` re-measure against the real font metrics
 * instead of the fallback metrics from the pre-load period.
 *
 * This is intentionally in its own file so that usePretextLines.ts
 * stays free of useState/useEffect (the perf test asserts that).
 */
// Probe for Cinzel specifically — not the full fallback stack.
// document.fonts.check() returns true if ANY font in a comma-separated
// list matches, so "Cinzel, Georgia, serif" would match Georgia (system)
// before Cinzel loads. Probing "Cinzel" alone ensures we wait for the
// actual web font.
const FONT_PROBE = '700 48px Cinzel';

let globalFontsReady = false;
const listeners = new Set<() => void>();

function markReady() {
  if (globalFontsReady) return;
  globalFontsReady = true;
  // Discard the cached drop-cap canvas AND pretext's width-cache so the
  // next measurement runs against the just-loaded web font instead of
  // the stale fallback metrics.
  invalidateMeasurementState();
  listeners.forEach((fn) => fn());
  listeners.clear();
}

if (typeof document !== 'undefined' && document.fonts) {
  if (document.fonts.check(FONT_PROBE)) {
    // Cinzel already available (cached from previous visit)
    globalFontsReady = true;
  } else {
    // Listen for font-load batches until Cinzel arrives
    const onLoadingDone = () => {
      if (document.fonts.check(FONT_PROBE)) {
        markReady();
        document.fonts.removeEventListener('loadingdone', onLoadingDone);
      }
    };
    document.fonts.addEventListener('loadingdone', onLoadingDone);
    // Backstop: also wait on fonts.ready in case loadingdone already fired
    document.fonts.ready.then(onLoadingDone);
  }
}

export function useFontsReady(): boolean {
  const [ready, setReady] = useState(globalFontsReady);
  useEffect(() => {
    if (globalFontsReady) {
      setReady(true);
      return;
    }
    const cb = () => setReady(true);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return ready;
}
