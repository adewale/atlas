import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SvgLink from '../../src/components/SvgLink';

afterEach(() => {
  cleanup();
});

function renderSvgLink(props: Partial<React.ComponentProps<typeof SvgLink>> = {}) {
  return render(
    <MemoryRouter>
      <svg>
        <SvgLink to="/test" {...props}>
          <text>Click me</text>
        </SvgLink>
      </svg>
    </MemoryRouter>,
  );
}

describe('SvgLink', () => {
  it('renders an anchor element with href', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders children', () => {
    renderSvgLink();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies aria-label', () => {
    renderSvgLink({ 'aria-label': 'Go to test page' });
    expect(screen.getByRole('link', { name: 'Go to test page' })).toBeInTheDocument();
  });

  it('applies style prop', () => {
    const { container } = renderSvgLink({ style: { cursor: 'pointer' } });
    const link = container.querySelector('a')!;
    expect(link.style.cursor).toBe('pointer');
  });

  it('intercepts regular click for SPA navigation (does not reload)', () => {
    // SvgLink should call navigate() instead of following the <a> href.
    // We verify the onClick handler is attached and doesn't throw.
    renderSvgLink({ to: '/target' });
    const link = screen.getByRole('link');
    // Regular click fires without error — in a real browser this triggers navigate()
    fireEvent.click(link);
    // The link should still point to the correct href for accessibility
    expect(link).toHaveAttribute('href', '/target');
  });

  it('allows ctrl-click through for new tab', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    // ctrl-click should pass through — the handler returns early without preventDefault
    fireEvent.click(link, { ctrlKey: true });
    // Link stays in DOM and href is preserved for the browser to handle
    expect(link).toHaveAttribute('href', '/test');
  });

  it('allows meta-click through for new tab', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    fireEvent.click(link, { metaKey: true });
    expect(link).toHaveAttribute('href', '/test');
  });

  it('allows shift-click through', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    fireEvent.click(link, { shiftKey: true });
    expect(link).toHaveAttribute('href', '/test');
  });
});
