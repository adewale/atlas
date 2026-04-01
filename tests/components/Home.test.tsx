import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
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
    expect(screen.getByRole('heading', { name: /atlas/i })).toBeInTheDocument();
  });

  it('renders the periodic table with 118 elements', () => {
    renderHome();
    const cells = screen.getAllByRole('button').filter(
      (el) => /^[A-Z][a-z]?\s\d+\s/.test(el.getAttribute('aria-label') ?? ''),
    );
    expect(cells.length).toBe(118);
  });

  it('shows keyboard shortcut hint', () => {
    renderHome();
    expect(screen.getByText(/keyboard shortcuts/)).toBeInTheDocument();
  });

  it('has navigation links to About, Credits, and Design', () => {
    renderHome();
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toHaveAttribute('href', '/about');
    const creditsLink = screen.getByRole('link', { name: /credits/i });
    expect(creditsLink).toHaveAttribute('href', '/credits');
    const designLink = screen.getByRole('link', { name: /design/i });
    expect(designLink).toHaveAttribute('href', '/design');
  });
});
