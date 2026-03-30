import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
    // Element cells have role="button" with aria-label containing "atomic number"
    const cells = screen.getAllByRole('button').filter(
      (el) => el.getAttribute('aria-label')?.includes('atomic number'),
    );
    expect(cells.length).toBe(118);
  });

  it('filter narrows visible elements — typing "iron" keeps Fe', () => {
    renderTable();
    const input = screen.getByLabelText(/Filter elements/);
    fireEvent.change(input, { target: { value: 'iron' } });
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('filter by symbol "Fe" works', () => {
    renderTable();
    const input = screen.getByLabelText(/Filter elements/);
    fireEvent.change(input, { target: { value: 'Fe' } });
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('block colour chip changes fill colours', () => {
    renderTable();
    const blockBtn = screen.getByRole('button', { name: /block/i });
    fireEvent.click(blockBtn);
    // d-block element (Iron) should get warm red fill
    const feCell = screen.getByLabelText(/^Iron,/);
    const rect = feCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#9e1c2c');
  });

  it('clicking an element calls onSelectElement', () => {
    const onSelect = vi.fn();
    renderTable(onSelect);
    const feCell = screen.getByLabelText(/^Iron,/);
    fireEvent.click(feCell);
    expect(onSelect).toHaveBeenCalledWith('Fe');
  });

  it('filter dims non-matching elements', () => {
    renderTable();
    const input = screen.getByLabelText(/Filter elements/);
    fireEvent.change(input, { target: { value: 'iron' } });
    // He should be dimmed — fill changes to DIM color (#ece7db)
    const heCell = screen.getByLabelText(/^Helium,/);
    const rect = heCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#ece7db');
  });

  it('block chip colours s-block elements with deep blue', () => {
    renderTable();
    const blockBtn = screen.getByRole('button', { name: /block/i });
    fireEvent.click(blockBtn);
    // H is s-block, should have deep blue fill (#133e7c)
    const hCell = screen.getByLabelText(/^Hydrogen,/);
    const rect = hCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#133e7c');
  });

  it('property chip reveals property sub-options', () => {
    renderTable();
    const propBtn = screen.getByRole('button', { name: /property/i });
    fireEvent.click(propBtn);
    // Should now see Mass, Electronegativity, Ionisation Energy, Radius buttons
    expect(screen.getByRole('button', { name: /mass/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /electronegativity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ionisation energy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /radius/i })).toBeInTheDocument();
  });
});
