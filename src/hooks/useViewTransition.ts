import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { flushSync } from 'react-dom';

/**
 * Hook that wraps React Router navigation with the View Transitions API.
 * Falls back to normal navigation when the API isn't available.
 *
 * Uses flushSync so React commits the new route synchronously inside the
 * view transition callback, avoiding the browser's 4-second timeout on
 * routes with lazy components or data loaders.
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
        flushSync(() => {
          navigate(to);
        });
      });
    },
    [navigate],
  );

  return transitionNavigate;
}
