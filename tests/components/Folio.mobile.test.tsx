/**
 * Tests for Folio mobile layout behaviour.
 * Uses useIsMobile mock to force mobile rendering path.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/useIsMobile.mock';
import Folio from '../../src/components/Folio';
import { FE } from '../fixtures/element-fe';

afterEach(() => {
  cleanup();
});

function renderMobileFolio() {
  return render(
    <MemoryRouter>
      <Folio element={FE} animate={false} />
    </MemoryRouter>,
  );
}

describe('Folio — mobile layout', () => {
  it('layout uses column flex direction on mobile', () => {
    renderMobileFolio();
    const layout = document.querySelector('.folio-layout') as HTMLElement;
    expect(layout).toBeTruthy();
    expect(layout.style.flexDirection).toBe('column');
  });

  it('data plate is position:static on mobile (not absolute)', () => {
    renderMobileFolio();
    const plate = screen.getByTestId('data-plate');
    expect(plate.style.position).toBe('static');
  });

  it('identity block is position:static on mobile', () => {
    renderMobileFolio();
    const identity = document.querySelector('.folio-identity') as HTMLElement;
    expect(identity).toBeTruthy();
    expect(identity.style.position).toBe('static');
  });

  it('summary area has auto minHeight on mobile', () => {
    renderMobileFolio();
    const summary = document.querySelector('.folio-summary-area') as HTMLElement;
    expect(summary).toBeTruthy();
    expect(summary.style.minHeight).toBe('auto');
  });

  it('marginalia panel has auto width on mobile', () => {
    renderMobileFolio();
    const marginalia = document.querySelector('.folio-marginalia') as HTMLElement;
    expect(marginalia).toBeTruthy();
    expect(marginalia.style.width).toBe('auto');
  });

  it('renders all major sections', () => {
    renderMobileFolio();
    expect(screen.getByLabelText(/Data plate/)).toBeInTheDocument();
    expect(screen.getByLabelText('Element summary')).toBeInTheDocument();
    expect(screen.getByText('Known since antiquity')).toBeInTheDocument();
  });
});
