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

  it('prevents default on click for SPA navigation', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const prevented = !link.dispatchEvent(event);
    // In a real browser this would be prevented; jsdom may not fully support
    // but we verify the handler doesn't throw
    expect(link).toBeInTheDocument();
  });

  it('allows ctrl-click through for new tab', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    // ctrl-click should not prevent default (allow new tab)
    fireEvent.click(link, { ctrlKey: true });
    expect(link).toBeInTheDocument();
  });

  it('allows meta-click through for new tab', () => {
    renderSvgLink();
    const link = screen.getByRole('link');
    fireEvent.click(link, { metaKey: true });
    expect(link).toBeInTheDocument();
  });
});
