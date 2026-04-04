import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SvgPrevNext from '../../src/components/SvgPrevNext';

afterEach(() => {
  cleanup();
});

function renderNav(props: Partial<React.ComponentProps<typeof SvgPrevNext>> = {}) {
  return render(
    <MemoryRouter>
      <SvgPrevNext {...props} />
    </MemoryRouter>,
  );
}

describe('SvgPrevNext', () => {
  it('renders nothing when both prev and next are undefined', () => {
    const { container } = renderNav();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders SVG when prev is provided', () => {
    const { container } = renderNav({ prev: { label: 'Previous', to: '/prev' } });
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders SVG when next is provided', () => {
    const { container } = renderNav({ next: { label: 'Next', to: '/next' } });
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders both prev and next labels', () => {
    const { container } = renderNav({
      prev: { label: 'Alpha', to: '/a' },
      next: { label: 'Gamma', to: '/g' },
    });
    const texts = container.querySelectorAll('text');
    const textContent = Array.from(texts).map((t) => t.textContent);
    expect(textContent.some((t) => t?.includes('Alpha'))).toBe(true);
    expect(textContent.some((t) => t?.includes('Gamma'))).toBe(true);
  });

  it('prev link has correct href', () => {
    const { container } = renderNav({ prev: { label: 'Previous', to: '/prev-page' } });
    const link = container.querySelector('a[href="/prev-page"]');
    expect(link).not.toBeNull();
  });

  it('next link has correct href', () => {
    const { container } = renderNav({ next: { label: 'Next', to: '/next-page' } });
    const link = container.querySelector('a[href="/next-page"]');
    expect(link).not.toBeNull();
  });

  it('viewBox is 400 units wide', () => {
    const { container } = renderNav({ prev: { label: 'A', to: '/a' } });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 24');
  });

  it('applies custom ariaLabel', () => {
    const { container } = renderNav({
      prev: { label: 'A', to: '/a' },
      ariaLabel: 'Era navigation',
    });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-label')).toBe('Era navigation');
  });

  it('maxWidth is capped at 560px', () => {
    const { container } = renderNav({ prev: { label: 'A', to: '/a' } });
    const svg = container.querySelector('svg')!;
    expect(svg.style.maxWidth).toBe('560px');
  });
});
