import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DiscovererChip, AnomalyChip, NeighbourChip } from '../../src/components/EntityChip';

afterEach(() => {
  cleanup();
});

describe('DiscovererChip', () => {
  it('renders name and links to encoded discoverer URL', () => {
    render(
      <MemoryRouter>
        <DiscovererChip name="Marie Curie" elementCount={2} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Discoverer: Marie Curie/i });
    expect(link).toHaveAttribute('href', '/discoverers/Marie%20Curie');
  });

  it('shows element count as secondary text', () => {
    render(
      <MemoryRouter>
        <DiscovererChip name="Davy" elementCount={6} />
      </MemoryRouter>,
    );
    expect(screen.getByText('6 elements')).toBeInTheDocument();
  });

  it('pluralises correctly for 1 element', () => {
    render(
      <MemoryRouter>
        <DiscovererChip name="Solo" elementCount={1} />
      </MemoryRouter>,
    );
    expect(screen.getByText('1 element')).toBeInTheDocument();
  });

  it('prefers yearRange over elementCount', () => {
    render(
      <MemoryRouter>
        <DiscovererChip name="Davy" elementCount={6} yearRange="1807–1808" />
      </MemoryRouter>,
    );
    expect(screen.getByText('1807–1808')).toBeInTheDocument();
    expect(screen.queryByText('6 elements')).not.toBeInTheDocument();
  });

  it('has CSS text-overflow: ellipsis on primary label', () => {
    render(
      <MemoryRouter>
        <DiscovererChip name="Very Long Discoverer Name That Should Be Clipped" />
      </MemoryRouter>,
    );
    const primary = screen.getByText(/Very Long/);
    expect(primary.style.textOverflow).toBe('ellipsis');
    expect(primary.style.overflow).toBe('hidden');
    expect(primary.style.whiteSpace).toBe('nowrap');
  });
});

describe('AnomalyChip', () => {
  it('renders label and links to anomaly URL', () => {
    render(
      <MemoryRouter>
        <AnomalyChip slug="diagonal-relationship" label="Diagonal Relationship" elementCount={4} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Anomaly: Diagonal Relationship/i });
    expect(link).toHaveAttribute('href', '/anomalies/diagonal-relationship');
    expect(screen.getByText('4 elements')).toBeInTheDocument();
  });
});

describe('NeighbourChip', () => {
  it('renders symbol — name and links to element URL', () => {
    render(
      <MemoryRouter>
        <NeighbourChip symbol="Co" name="Cobalt" color="#9e1c2c" direction="→ right" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Neighbour: Cobalt/i });
    expect(link).toHaveAttribute('href', '/elements/Co');
    expect(screen.getByText('Co — Cobalt')).toBeInTheDocument();
    expect(screen.getByText('→ right')).toBeInTheDocument();
  });

  it('shows "neighbour" as default direction', () => {
    render(
      <MemoryRouter>
        <NeighbourChip symbol="Mn" name="Manganese" color="#133e7c" />
      </MemoryRouter>,
    );
    expect(screen.getByText('neighbour')).toBeInTheDocument();
  });

  it('uses flex layout for responsive width', () => {
    render(
      <MemoryRouter>
        <NeighbourChip symbol="Au" name="Gold" color="#856912" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Neighbour: Gold/i });
    expect(link.style.flex).toBe('1 1 160px');
    expect(link.style.maxWidth).toBe('280px');
    expect(link.style.minWidth).toBe('120px');
  });
});
