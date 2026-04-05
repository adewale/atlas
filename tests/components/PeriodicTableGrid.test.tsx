/**
 * Tests for the shared PeriodicTableGrid component.
 *
 * RED phase: these tests define the contract for the reusable grid.
 * The component doesn't exist yet — all tests should fail.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PeriodicTableGrid from '../../src/components/PeriodicTableGrid';
import { allElements } from '../../src/lib/data';
import { VIEWBOX_W, VIEWBOX_H, CELL_WIDTH, CELL_HEIGHT } from '../../src/lib/grid';

afterEach(cleanup);

const defaultFill = () => '#ffffff';
const noop = () => {};

describe('PeriodicTableGrid', () => {
  it('renders 118 element cells as SVG groups', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} />,
    );
    const cells = container.querySelectorAll('g[role="button"]');
    expect(cells).toHaveLength(118);
  });

  it('uses fillFn to determine each cell background', () => {
    const fillFn = (el: { symbol: string }) =>
      el.symbol === 'Fe' ? '#ff0000' : '#ffffff';
    const { container } = render(
      <PeriodicTableGrid fillFn={fillFn} onClick={noop} />,
    );
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    const rect = feCell.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#ff0000');
  });

  it('calls onClick with element symbol when a cell is clicked', () => {
    const onClick = vi.fn();
    render(<PeriodicTableGrid fillFn={defaultFill} onClick={onClick} />);
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    fireEvent.click(feCell);
    expect(onClick).toHaveBeenCalledWith('Fe');
  });

  it('calls onHover with element symbol on mouse enter', () => {
    const onHover = vi.fn();
    render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} onHover={onHover} />,
    );
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    fireEvent.mouseEnter(feCell);
    expect(onHover).toHaveBeenCalledWith('Fe');
  });

  it('highlights the active cell with WARM_RED stroke', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} activeSymbol="Fe" />,
    );
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    const rect = feCell.querySelector('rect');
    // Active cell gets a heavier stroke
    const strokeWidth = parseFloat(rect!.getAttribute('stroke-width') ?? '0');
    expect(strokeWidth).toBeGreaterThan(1);
  });

  it('applies viewTransitionName to the active cell', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} activeSymbol="Fe" />,
    );
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    const rect = feCell.querySelector('rect');
    expect(rect!.style.viewTransitionName).toBeTruthy();
  });

  it('renders period rules between rows', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} />,
    );
    const lines = container.querySelectorAll('line');
    // At least 6 period rules + 1 f-block dashed rule
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });

  it('uses correct SVG viewBox dimensions', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
  });

  it('each cell shows the element symbol', () => {
    render(<PeriodicTableGrid fillFn={defaultFill} onClick={noop} />);
    // Spot-check a few symbols
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    const texts = feCell.querySelectorAll('text');
    const symbols = Array.from(texts).map((t) => t.textContent);
    expect(symbols).toContain('Fe');
  });

  it('computes contrasting text color from fill', () => {
    // Dark fill should get light text
    const fillFn = () => '#000000';
    render(<PeriodicTableGrid fillFn={fillFn} onClick={noop} />);
    const feCell = screen.getByLabelText(/Fe.*Iron/);
    const symbolText = Array.from(feCell.querySelectorAll('text')).find(
      (t) => t.textContent === 'Fe',
    );
    // On a black background, text should be light (PAPER = #f5f0e8)
    expect(symbolText!.getAttribute('fill')).not.toBe('#000000');
  });

  it('accepts custom viewBox height for content below the grid', () => {
    const extraHeight = 100;
    const { container } = render(
      <PeriodicTableGrid
        fillFn={defaultFill}
        onClick={noop}
        extraHeight={extraHeight}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute(
      'viewBox',
      `0 0 ${VIEWBOX_W} ${VIEWBOX_H + extraHeight}`,
    );
  });

  it('renders children inside the SVG (for overlays)', () => {
    const { container } = render(
      <PeriodicTableGrid fillFn={defaultFill} onClick={noop}>
        <text data-testid="overlay">overlay</text>
      </PeriodicTableGrid>,
    );
    expect(container.querySelector('[data-testid="overlay"]')).toBeInTheDocument();
  });
});
