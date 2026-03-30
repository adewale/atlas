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

  it('search filters correctly — searching "iron" shows Fe', () => {
    renderTable();
    const input = screen.getByPlaceholderText('Search · press / to focus');
    fireEvent.change(input, { target: { value: 'iron' } });
    // Fe cell should still be visible (not dimmed)
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('search for "Fe" by symbol works', () => {
    renderTable();
    const input = screen.getByPlaceholderText('Search · press / to focus');
    fireEvent.change(input, { target: { value: 'Fe' } });
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('highlight mode dropdown changes fill colors', () => {
    renderTable();
    const select = screen.getByLabelText('Colour by');
    fireEvent.change(select, { target: { value: 'block' } });
    // After changing to block mode, verify select updated
    expect((select as HTMLSelectElement).value).toBe('block');
    // Also verify a d-block element got the warm red fill
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

  it('search dims non-matching elements', () => {
    renderTable();
    const input = screen.getByPlaceholderText('Search · press / to focus');
    fireEvent.change(input, { target: { value: 'iron' } });
    // He should be dimmed — fill changes to DIM color (#ece7db)
    const heCell = screen.getByLabelText(/^Helium,/);
    const rect = heCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#ece7db');
  });

  it('block highlight mode colors cells by block', () => {
    renderTable();
    const select = screen.getByLabelText('Colour by');
    fireEvent.change(select, { target: { value: 'block' } });
    // H is s-block, should have deep blue fill (#133e7c)
    const hCell = screen.getByLabelText(/^Hydrogen,/);
    const rect = hCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#133e7c');
  });

  it('shows property selector when property mode is selected', () => {
    renderTable();
    const select = screen.getByLabelText('Colour by');
    fireEvent.change(select, { target: { value: 'property' } });
    const propSelect = screen.getByLabelText('Property');
    expect(propSelect).toBeInTheDocument();
  });

  it('property selector includes all four numeric properties', () => {
    renderTable();
    const select = screen.getByLabelText('Colour by');
    fireEvent.change(select, { target: { value: 'property' } });
    const propSelect = screen.getByLabelText('Property') as HTMLSelectElement;
    const options = Array.from(propSelect.options).map((o) => o.value);
    expect(options).toContain('mass');
    expect(options).toContain('electronegativity');
    expect(options).toContain('ionizationEnergy');
    expect(options).toContain('radius');
  });
});
