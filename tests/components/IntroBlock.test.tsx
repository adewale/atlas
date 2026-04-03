import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import IntroBlock from '../../src/components/IntroBlock';

afterEach(() => {
  cleanup();
});

function renderIntroBlock(props: Partial<React.ComponentProps<typeof IntroBlock>> = {}) {
  return render(
    <MemoryRouter>
      <IntroBlock text="The periodic table organises all known elements." color="#133e7c" {...props} />
    </MemoryRouter>,
  );
}

describe('IntroBlock', () => {
  it('renders an SVG element', () => {
    const { container } = renderIntroBlock();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('sets viewBox width to desktopWidth by default', () => {
    const { container } = renderIntroBlock();
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    expect(viewBox).toMatch(/^0 0 760 /); // default desktopWidth=760
  });

  it('respects custom desktopWidth', () => {
    const { container } = renderIntroBlock({ desktopWidth: 600 });
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    expect(viewBox).toMatch(/^0 0 600 /);
  });

  it('enforces minHeight in viewBox', () => {
    const { container } = renderIntroBlock({ minHeight: 120 });
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const height = parseInt(viewBox.split(' ')[3], 10);
    expect(height).toBeGreaterThanOrEqual(120);
  });

  it('applies marginBottom style', () => {
    const { container } = renderIntroBlock({ marginBottom: '24px' });
    const svg = container.querySelector('svg')!;
    expect(svg.style.marginBottom).toBe('24px');
  });

  it('sets maxWidth to introWidth', () => {
    const { container } = renderIntroBlock({ desktopWidth: 500 });
    const svg = container.querySelector('svg')!;
    expect(svg.style.maxWidth).toBe('500px');
  });

  it('renders with different dropCapSize', () => {
    // Just verifies no crash with different sizes
    const { container } = renderIntroBlock({ dropCapSize: 80 });
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
