/**
 * Accessibility audits for SectionedCardList using axe-core.
 *
 * These tests run axe-core against the rendered DOM and assert the absence of
 * violations in the rule sets relevant to accordion patterns:
 *   - aria-allowed-attr / aria-required-children / aria-required-parent
 *   - button-name / link-name
 *   - aria-valid-attr-value (catches malformed aria-controls / aria-expanded)
 *   - color-contrast (skipped — jsdom has no layout to compute contrast)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import axe from 'axe-core';
import SectionedCardList from '../../src/components/SectionedCardList';
import type { Section } from '../../src/components/SectionedCardList';

afterEach(() => {
  cleanup();
});

const SECTIONS: Section[] = [
  {
    id: 'alpha',
    label: 'Alpha',
    color: '#133e7c',
    items: [
      { symbol: 'H', description: 'Hydrogen' },
      { symbol: 'He', description: 'Helium' },
    ],
  },
  {
    id: 'beta',
    label: 'Beta',
    color: '#9e1c2c',
    items: [{ symbol: 'Li', description: 'Lithium' }],
  },
];

const RUNS = {
  rules: {
    // jsdom does not lay out elements, so contrast / sizing rules are noisy.
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
    region: { enabled: false },
  },
};

async function audit(container: HTMLElement) {
  return axe.run(container, RUNS);
}

describe('SectionedCardList — axe-core a11y', () => {
  it('has no axe violations in the default (non-accordion) state', async () => {
    const { container } = render(
      <MemoryRouter>
        <SectionedCardList sections={SECTIONS} />
      </MemoryRouter>,
    );
    const results = await audit(container);
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when accordion is enabled', async () => {
    const { container } = render(
      <MemoryRouter>
        <SectionedCardList sections={SECTIONS} accordion />
      </MemoryRouter>,
    );
    const results = await audit(container);
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when sections are collapsed', async () => {
    const { container } = render(
      <MemoryRouter>
        <SectionedCardList sections={SECTIONS} accordion defaultCollapsed />
      </MemoryRouter>,
    );
    const results = await audit(container);
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations after toggling sections via keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SectionedCardList sections={SECTIONS} accordion />
      </MemoryRouter>,
    );
    const toggles = screen.getAllByRole('button', { name: /toggle/i });
    toggles[0].focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');
    const results = await audit(container);
    expect(results.violations).toEqual([]);
  });

  it('every accordion header exposes aria-expanded and aria-controls', () => {
    render(
      <MemoryRouter>
        <SectionedCardList sections={SECTIONS} accordion />
      </MemoryRouter>,
    );
    const toggles = screen.getAllByRole('button', { name: /toggle/i });
    for (const toggle of toggles) {
      expect(toggle).toHaveAttribute('aria-expanded');
      const controls = toggle.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls!)).not.toBeNull();
    }
  });
});
