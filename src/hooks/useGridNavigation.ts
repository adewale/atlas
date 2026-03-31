import { useState, useCallback } from 'react';
import { adjacencyMap, type Direction } from '../lib/grid';
import { allElements } from '../lib/data';

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

type UseGridNavigationOptions = {
  onActivate?: (symbol: string) => void;
};

export function useGridNavigation({ onActivate }: UseGridNavigationOptions = {}) {
  const [activeSymbol, setActiveSymbol] = useState<string>(allElements[0].symbol);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        const adj = adjacencyMap.get(activeSymbol);
        if (adj) {
          const next = adj[dir];
          if (next) setActiveSymbol(next);
        }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate?.(activeSymbol);
      }
    },
    [activeSymbol, onActivate],
  );

  return { activeSymbol, setActiveSymbol, onKeyDown };
}
