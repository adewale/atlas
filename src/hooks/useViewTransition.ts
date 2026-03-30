import { useCallback } from 'react';
import { useNavigate } from 'react-router';

/**
 * Hook that wraps React Router navigation with the View Transitions API.
 * Falls back to normal navigation when the API isn't available.
 *
 * Inspired by the "shared element transitions" pattern (Prateek Bhatnagar):
 * instead of a manual GhostLayer, the browser natively snapshots the old
 * and new DOM states, then crossfades/morphs elements with matching
 * view-transition-name values.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  const transitionNavigate = useCallback(
    (to: string) => {
      if (!document.startViewTransition) {
        navigate(to);
        return;
      }

      document.startViewTransition(() => {
        navigate(to);
        // Return a promise that resolves after React commits the new route
        return new Promise<void>((resolve) => {
          // requestAnimationFrame ensures React has flushed the update
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      });
    },
    [navigate],
  );

  return transitionNavigate;
}
