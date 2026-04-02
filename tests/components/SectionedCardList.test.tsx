import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
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
    items: [
      { symbol: 'Li', description: 'Lithium' },
    ],
  },
  {
    id: 'gamma',
    label: 'Gamma',
    color: '#856912',
    items: [
      { symbol: 'Be', description: 'Beryllium' },
      { symbol: 'B', description: 'Boron' },
      { symbol: 'C', description: 'Carbon' },
    ],
  },
];

function renderComponent(props: Partial<React.ComponentProps<typeof SectionedCardList>> = {}) {
  return render(
    <MemoryRouter>
      <SectionedCardList sections={SECTIONS} {...props} />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Structure tests
// ---------------------------------------------------------------------------
describe('SectionedCardList — structure', () => {
  it('renders one <section> per section entry', () => {
    renderComponent();
    const sections = screen.getAllByRole('region');
    expect(sections).toHaveLength(3);
  });

  it('renders a semantic <h2> heading in each section', () => {
    renderComponent();
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent('Alpha');
    expect(headings[1]).toHaveTextContent('Beta');
    expect(headings[2]).toHaveTextContent('Gamma');
  });

  it('shows item count badge in each section header', () => {
    renderComponent();
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('2');
    expect(headings[1]).toHaveTextContent('1');
    expect(headings[2]).toHaveTextContent('3');
  });

  it('renders element cards as links to /element/:symbol', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/elements/H');
    expect(hrefs).toContain('/elements/He');
    expect(hrefs).toContain('/elements/Li');
    expect(hrefs).toContain('/elements/Be');
    expect(hrefs).toContain('/elements/B');
    expect(hrefs).toContain('/elements/C');
  });

  it('displays element symbol text inside each card', () => {
    renderComponent();
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('He')).toBeInTheDocument();
    expect(screen.getByText('Li')).toBeInTheDocument();
  });

  it('displays description text inside each card', () => {
    renderComponent();
    expect(screen.getByText('Hydrogen')).toBeInTheDocument();
    expect(screen.getByText('Helium')).toBeInTheDocument();
  });

  it('applies section id as HTML id attribute for anchor linking', () => {
    renderComponent();
    expect(document.getElementById('alpha')).not.toBeNull();
    expect(document.getElementById('beta')).not.toBeNull();
    expect(document.getElementById('gamma')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Accordion tests
// ---------------------------------------------------------------------------
describe('SectionedCardList — accordion', () => {
  it('all sections are expanded by default when accordion is not enabled', () => {
    renderComponent();
    // All 6 links should be visible
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('renders expand/collapse toggle buttons when accordion is enabled', () => {
    renderComponent({ accordion: true });
    const toggles = screen.getAllByRole('button', { name: /toggle/i });
    expect(toggles).toHaveLength(3);
  });

  it('all sections start expanded by default when accordion is enabled', () => {
    renderComponent({ accordion: true });
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('starts collapsed when defaultCollapsed is true', () => {
    renderComponent({ accordion: true, defaultCollapsed: true });
    // No links should be visible when all sections are collapsed
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('toggle button has aria-expanded attribute', () => {
    renderComponent({ accordion: true });
    const toggles = screen.getAllByRole('button', { name: /toggle/i });
    toggles.forEach(t => {
      expect(t).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('clicking toggle collapses and re-expands a section', async () => {
    const user = userEvent.setup();
    renderComponent({ accordion: true });

    const toggles = screen.getAllByRole('button', { name: /toggle/i });
    // Collapse alpha section
    await user.click(toggles[0]);

    // Alpha cards should be gone, beta and gamma still visible
    expect(screen.queryByText('Hydrogen')).not.toBeInTheDocument();
    expect(screen.getByText('Lithium')).toBeInTheDocument();
    expect(screen.getByText('Beryllium')).toBeInTheDocument();

    // aria-expanded should be false now
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');

    // Re-expand
    await user.click(toggles[0]);
    expect(screen.getByText('Hydrogen')).toBeInTheDocument();
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders expand-all / collapse-all control when accordion enabled', () => {
    renderComponent({ accordion: true });
    expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument();
  });

  it('collapse-all hides all cards, expand-all restores them', async () => {
    const user = userEvent.setup();
    renderComponent({ accordion: true });

    await user.click(screen.getByRole('button', { name: /collapse all/i }));
    expect(screen.queryAllByRole('link')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /expand all/i }));
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
describe('SectionedCardList — edge cases', () => {
  it('renders nothing when sections array is empty', () => {
    renderComponent({ sections: [] });
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });

  it('renders section header even when items are empty', () => {
    renderComponent({
      sections: [{ id: 'empty', label: 'Empty', color: '#000', items: [] }],
    });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Empty');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('0');
  });
});
