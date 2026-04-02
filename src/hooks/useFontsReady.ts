import { useState, useEffect } from 'react';

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
 * This is intentionally in its own file so that usePretextLines.ts
 * stays free of useState/useEffect (the perf test asserts that).
 */
const FONT_PROBE = '700 48px Cinzel';

let globalFontsReady = false;
const listeners = new Set<() => void>();

function markReady() {
  if (globalFontsReady) return;
  globalFontsReady = true;
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
