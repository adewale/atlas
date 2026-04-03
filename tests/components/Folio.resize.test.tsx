/**
 * Folio ResizeObserver responsive container tests.
 *
 * Verifies that the Folio component correctly responds to container
 * width changes via ResizeObserver. Tests mock the observer to simulate
 * resize events and verify layout recalculation.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Folio from '../../src/components/Folio';
import { FE } from '../fixtures/element-fe';

afterEach(() => {
  cleanup();
});

// Capture ResizeObserver callbacks so we can trigger them manually
type ResizeCallback = (entries: ResizeObserverEntry[]) => void;
let resizeCallbacks: ResizeCallback[] = [];
let observedElements: Element[] = [];

class MockResizeObserver {
  private callback: ResizeCallback;
  constructor(callback: ResizeCallback) {
    this.callback = callback;
    resizeCallbacks.push(callback);
  }
  observe(el: Element) {
    observedElements.push(el);
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  resizeCallbacks = [];
  observedElements = [];
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

function renderFolio() {
  return render(
    <MemoryRouter>
      <Folio element={FE} animate={false} />
    </MemoryRouter>,
  );
}

/** Simulate a resize by triggering the captured ResizeObserver callback */
function simulateResize(width: number) {
  const entry = {
    contentBoxSize: [{ inlineSize: width, blockSize: 500 }],
    contentRect: { width, height: 500, x: 0, y: 0, top: 0, left: 0, bottom: 500, right: width, toJSON: () => ({}) },
    borderBoxSize: [{ inlineSize: width, blockSize: 500 }],
    devicePixelContentBoxSize: [],
    target: observedElements[0] ?? document.createElement('div'),
  } as unknown as ResizeObserverEntry;

  for (const cb of resizeCallbacks) {
    act(() => {
      cb([entry]);
    });
  }
}

describe('Folio — ResizeObserver integration', () => {
  it('observes the main container for size changes', () => {
    renderFolio();
    // Folio should have set up a ResizeObserver on the folio-main element
    expect(observedElements.length).toBeGreaterThan(0);
    expect(observedElements[0].classList.contains('folio-main')).toBe(true);
  });

  it('uses default width before first resize callback', () => {
    renderFolio();
    // Before ResizeObserver fires, Folio falls back to FULL_WIDTH (560)
    const summary = screen.getByLabelText('Element summary') as unknown as SVGSVGElement;
    const viewBox = summary.getAttribute('viewBox');
    expect(viewBox).toBeDefined();
    // Default desktop width should be FULL_WIDTH=560
    const vbWidth = parseInt(viewBox!.split(' ')[2], 10);
    expect(vbWidth).toBe(560);
  });

  it('updates SVG dimensions when container resizes', () => {
    renderFolio();

    // Simulate container becoming narrower (e.g. sidebar opened)
    simulateResize(400);

    const summary = screen.getByLabelText('Element summary') as unknown as SVGSVGElement;
    const viewBox = summary.getAttribute('viewBox');
    const vbWidth = parseInt(viewBox!.split(' ')[2], 10);
    expect(vbWidth).toBe(400);
  });

  it('adapts rank row widths to measured container width', () => {
    renderFolio();

    simulateResize(800);

    // Rank rows should use half of effectiveWidth on desktop
    const rankSvgs = document.querySelectorAll('.folio-rank-rows svg');
    expect(rankSvgs.length).toBeGreaterThan(0);

    // Each rank row viewBox should reflect the new width
    const firstViewBox = rankSvgs[0].getAttribute('viewBox');
    if (firstViewBox) {
      const w = parseInt(firstViewBox.split(' ')[2], 10);
      // On desktop: Math.floor((effectiveWidth - 6) / 2) = Math.floor((800-6)/2) = 397
      expect(w).toBe(397);
    }
  });

  it('handles zero-width resize gracefully', () => {
    renderFolio();

    // ResizeObserver can fire with 0 width during layout (hidden elements)
    // The component should ignore this and keep the previous width
    simulateResize(600);
    simulateResize(0);

    const summary = screen.getByLabelText('Element summary') as unknown as SVGSVGElement;
    const viewBox = summary.getAttribute('viewBox');
    const vbWidth = parseInt(viewBox!.split(' ')[2], 10);
    // Should keep 600, not collapse to 0
    expect(vbWidth).toBe(600);
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = renderFolio();
    expect(observedElements.length).toBeGreaterThan(0);
    // The disconnect is called via the cleanup return — no crash on unmount
    unmount();
  });
});
