import { useState, useEffect } from 'react';

/**
 * Returns true once document.fonts reports all fonts are loaded.
 * Uses a module-level singleton so the promise is only awaited once,
 * and all hook consumers share the same resolved state.
 *
 * This is intentionally in its own file so that usePretextLines.ts
 * stays free of useState/useEffect (which would cause a flash of
 * empty content if the text-measurement hooks themselves were async).
 * Here the hook only triggers a *re-measurement* — the initial render
 * still produces content synchronously via useMemo.
 */
let globalFontsReady =
  typeof document !== 'undefined' && document.fonts?.status === 'loaded';
const listeners = new Set<() => void>();

if (typeof document !== 'undefined' && document.fonts && !globalFontsReady) {
  document.fonts.ready.then(() => {
    globalFontsReady = true;
    listeners.forEach((fn) => fn());
    listeners.clear();
  });
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
