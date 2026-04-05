import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ByrneChips from '../../src/components/ByrneChips';
import type { ChipOption } from '../../src/components/ByrneChips';

afterEach(cleanup);

const OPTIONS: ChipOption[] = [
  { value: 'element', label: 'Element', colour: '#133e7c', count: 118 },
  { value: 'group', label: 'Group', colour: '#133e7c', count: 18 },
  { value: 'anomaly', label: 'Anomaly', colour: '#9e1c2c', count: 5 },
];

describe('ByrneChips', () => {
  it('renders all chip options', () => {
    render(
      <ByrneChips options={OPTIONS} selected={new Set<string>()} onToggle={() => {}} />,
    );
    expect(screen.getByText('Element')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Anomaly')).toBeInTheDocument();
  });

  it('renders section label when provided', () => {
    render(
      <ByrneChips
        label="Entity type"
        options={OPTIONS}
        selected={new Set<string>()}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('Entity type')).toBeInTheDocument();
  });

  it('shows counts when provided', () => {
    render(
      <ByrneChips options={OPTIONS} selected={new Set<string>()} onToggle={() => {}} />,
    );
    expect(screen.getByText('(118)')).toBeInTheDocument();
    expect(screen.getByText('(18)')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('calls onToggle with the correct value when clicked', () => {
    const onToggle = vi.fn();
    render(
      <ByrneChips options={OPTIONS} selected={new Set<string>()} onToggle={onToggle} />,
    );
    fireEvent.click(screen.getByText('Anomaly'));
    expect(onToggle).toHaveBeenCalledWith('anomaly');
  });

  it('applies filled style to active chips', () => {
    render(
      <ByrneChips
        options={OPTIONS}
        selected={new Set(['element'])}
        onToggle={() => {}}
      />,
    );
    const elementButton = screen.getByText('Element').closest('button')!;
    // Active chip should have the colour as background
    expect(elementButton.style.background).toBe('rgb(19, 62, 124)');
  });

  it('applies outlined style to inactive chips', () => {
    render(
      <ByrneChips
        options={OPTIONS}
        selected={new Set<string>()}
        onToggle={() => {}}
      />,
    );
    const elementButton = screen.getByText('Element').closest('button')!;
    // Inactive chip should have transparent background
    expect(elementButton.style.background).toBe('transparent');
  });

  it('renders without counts', () => {
    const noCountOptions: ChipOption[] = [
      { value: 'a', label: 'Alpha', colour: '#000' },
      { value: 'b', label: 'Beta', colour: '#000' },
    ];
    render(
      <ByrneChips options={noCountOptions} selected={new Set<string>()} onToggle={() => {}} />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
