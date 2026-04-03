import { vi } from 'vitest';

/** Mock useIsMobile to return true (mobile viewport). */
vi.mock('../../src/hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));
