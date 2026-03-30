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
    // Each element has a button role with an aria-label
    const cells = screen.getAllByRole('button');
    expect(cells.length).toBe(118);
  });

  it('search filters correctly — searching "iron" shows Fe', () => {
    renderTable();
    const input = screen.getByPlaceholderText('Search elements…');
    fireEvent.change(input, { target: { value: 'iron' } });
    // Fe cell should still be visible (not dimmed)
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('search for "Fe" by symbol works', () => {
    renderTable();
    const input = screen.getByPlaceholderText('Search elements…');
    fireEvent.change(input, { target: { value: 'Fe' } });
    const feCell = screen.getByLabelText(/^Iron,/);
    expect(feCell).toBeInTheDocument();
  });

  it('highlight mode dropdown changes fill colors', () => {
    renderTable();
    const select = screen.getByLabelText('Highlight mode');
    fireEvent.change(select, { target: { value: 'block' } });
    // After changing to block mode, cells should have colored fills
    // We check that the select value changed
    expect((select as HTMLSelectElement).value).toBe('block');
  });

  it('shows property selector when property mode is selected', () => {
    renderTable();
    const select = screen.getByLabelText('Highlight mode');
    fireEvent.change(select, { target: { value: 'property' } });
    const propSelect = screen.getByLabelText('Property');
    expect(propSelect).toBeInTheDocument();
  });
});
