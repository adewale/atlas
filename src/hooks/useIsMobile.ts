import { useSyncExternalStore } from 'react';

// Shared singleton: one resize listener for all consumers
let listeners: Set<() => void> = new Set();
let currentWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    currentWidth = window.innerWidth;
    listeners.forEach((l) => l());
  });
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(
    subscribe,
    () => currentWidth < breakpoint,
    () => false,
  );
}
