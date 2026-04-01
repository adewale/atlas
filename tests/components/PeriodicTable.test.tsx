import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
import PeriodicTable from '../../src/components/PeriodicTable';

afterEach(() => {
  cleanup();
});

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
