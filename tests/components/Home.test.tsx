import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from '../../src/pages/Home';

afterEach(() => {
  cleanup();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  it('renders the atlas heading', () => {
    renderHome();
    expect(screen.getByText('A T L A S')).toBeInTheDocument();
  });

  it('renders the periodic table with 118 elements', () => {
    renderHome();
    // Element cells have role="button" with aria-label containing "atomic number"
    const cells = screen.getAllByRole('button').filter(
      (el) => el.getAttribute('aria-label')?.includes('atomic number'),
    );
    expect(cells.length).toBe(118);
  });

  it('shows the status bar', () => {
    renderHome();
    expect(screen.getByText(/118 elements/)).toBeInTheDocument();
    expect(screen.getByText(/Arrow keys to navigate/)).toBeInTheDocument();
  });

  it('has navigation links to About and Credits', () => {
    renderHome();
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toHaveAttribute('href', '/about');
    const creditsLink = screen.getByRole('link', { name: /credits/i });
    expect(creditsLink).toHaveAttribute('href', '/credits');
  });
});
