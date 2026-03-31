import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import PeriodicTable from '../../src/components/PeriodicTable';

afterEach(() => {
  cleanup();
});

// Mock pretext hooks — jsdom has no canvas for font measurement
vi.mock('../../src/hooks/usePretextLines', () => ({
  usePretextLines: ({ text }: { text: string }) => ({
    lines: [{ text: text.slice(0, 40), width: 160, x: 0, y: 0 }],
    lineHeight: 18,
  }),
  useShapedText: ({ text }: { text: string }) => ({
    lines: [
      { text: text.slice(0, 60), width: 300, x: 0, y: 0 },
      { text: text.slice(60, 120), width: 300, x: 0, y: 20 },
    ],
    lineHeight: 20,
    plateHeightInLines: 9,
    identityHeightInLines: 7,
  }),
  useDropCapText: ({ text }: { text: string }) => ({
    dropCap: { char: text[0], fontSize: 80 },
    lines: [
      { text: text.slice(1, 60), width: 300, x: 0, y: 0 },
      { text: text.slice(60, 120), width: 300, x: 0, y: 20 },
    ],
    lineHeight: 20,
  }),
}));

function renderTable(onSelect = vi.fn()) {
  return render(
    <MemoryRouter>
      <PeriodicTable onSelectElement={onSelect} />
    </MemoryRouter>,
  );
}

describe('PeriodicTable', () => {
  it('renders 118 element cells', () => {
    renderTable();
    const cells = screen.getAllByRole('button').filter(
      (el) => {
        const label = el.getAttribute('aria-label') ?? '';
        return /^[A-Z][a-z]?\s\d+\s/.test(label);
      },
    );
    expect(cells.length).toBe(118);
  });

  it('block colour chip changes fill colours', () => {
    renderTable();
    const blockBtn = screen.getByRole('button', { name: /block/i });
    fireEvent.click(blockBtn);
    // d-block element (Iron) should get warm red fill
    const feCell = screen.getByLabelText(/Iron/);
    const rect = feCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#9e1c2c');
  });

  it('clicking an element calls onSelectElement', () => {
    const onSelect = vi.fn();
    renderTable(onSelect);
    const feCell = screen.getByLabelText(/Iron/);
    fireEvent.click(feCell);
    expect(onSelect).toHaveBeenCalledWith('Fe');
  });

  it('block chip colours s-block elements with deep blue', () => {
    renderTable();
    const blockBtn = screen.getByRole('button', { name: /block/i });
    fireEvent.click(blockBtn);
    const hCell = screen.getByLabelText(/Hydrogen/);
    const rect = hCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#133e7c');
  });

  it('property chip reveals property sub-options', () => {
    renderTable();
    const propBtn = screen.getByRole('button', { name: /property/i });
    fireEvent.click(propBtn);
    expect(screen.getByRole('button', { name: /mass/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /electronegativity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ionisation energy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /radius/i })).toBeInTheDocument();
  });

  it('renders introductory paragraph with drop cap', () => {
    renderTable();
    // The drop cap character ('O' from "One hundred...") should be rendered
    // via PretextSvg inside an SVG element
    const svgs = document.querySelectorAll('svg');
    // At least one SVG should exist before the periodic table SVG for the intro
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
