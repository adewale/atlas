import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import InfoTip from '../../src/components/InfoTip';
import HelpOverlay from '../../src/components/HelpOverlay';

vi.mock('../../src/hooks/usePretextLines', () => ({
  usePretextLines: ({ text }: { text: string }) => ({
    lines: [{ text, width: 320, x: 0, y: 0 }],
    lineHeight: 18,
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('lifecycle cleanup and listener churn', () => {
  it('clears pending InfoTip timeout on unmount (prevents timer leak)', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(
      <InfoTip label="details">density</InfoTip>,
    );

    const trigger = screen.getByRole('button', { name: 'details' });
    fireEvent.mouseLeave(trigger);

    const clearsBeforeUnmount = clearSpy.mock.calls.length;
    unmount();

    expect(clearSpy.mock.calls.length).toBeGreaterThan(clearsBeforeUnmount);

    vi.useRealTimers();
  });

  it('registers the global keydown listener once (avoids effect churn)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<HelpOverlay />);

    fireEvent.keyDown(window, { key: '?' });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: '?' });

    const keydownRegistrations = addSpy.mock.calls.filter((args) => args[0] === 'keydown');
    expect(keydownRegistrations).toHaveLength(1);
  });
});
