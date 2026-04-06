import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CompareView from '../../src/components/CompareView';
import type { ElementRecord } from '../../src/lib/types';

afterEach(() => {
  cleanup();
});

function makeElement(overrides: Partial<ElementRecord>): ElementRecord {
  return {
    atomicNumber: 1,
    symbol: 'H',
    name: 'Hydrogen',
    wikidataId: 'Q556',
    wikipediaTitle: 'Hydrogen',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Hydrogen',
    period: 1,
    group: 1,
    block: 's',
    category: 'nonmetal',
    phase: 'gas',
    mass: 1.008,
    electronegativity: 2.2,
    ionizationEnergy: 1312,
    radius: 120,
    density: 0.00008988,
    meltingPoint: 13.81,
    boilingPoint: 20.28,
    halfLife: null,
    discoveryYear: 1766,
    discoverer: 'Henry Cavendish',
    etymologyOrigin: 'property',
    etymologyDescription: 'Greek hydro + genes: water-forming',
    summary: 'Hydrogen is a chemical element.',
    neighbors: ['He'],
    rankings: { mass: 118, electronegativity: 17, ionizationEnergy: 8, radius: 99 },
    ...overrides,
  };
}

const elementA = makeElement({});
const elementB = makeElement({
  atomicNumber: 2,
  symbol: 'He',
  name: 'Helium',
  block: 'p',
  category: 'noble gas',
  phase: 'gas',
  mass: 4.0026,
  electronegativity: null,
  ionizationEnergy: 2372.3,
  radius: 140,
  density: 0.0001785,
  meltingPoint: 0.95,
  boilingPoint: 4.22,
  discoveryYear: 1868,
  discoverer: 'Pierre Janssen',
  etymologyOrigin: 'astronomical',
  etymologyDescription: 'Greek helios: sun',
  neighbors: ['H'],
  rankings: { mass: 117, electronegativity: 0, ionizationEnergy: 1, radius: 115 },
});

function renderCompare(a = elementA, b = elementB, vertical = false) {
  return render(
    <MemoryRouter>
      <CompareView elementA={a} elementB={b} animate={false} vertical={vertical} />
    </MemoryRouter>,
  );
}

describe('CompareView', () => {
  it('renders both element symbols', () => {
    renderCompare();
    // SVG text elements — use getAllByText since symbols appear in titles too
    expect(screen.getAllByText('H').length).toBeGreaterThan(0);
    expect(screen.getAllByText('He').length).toBeGreaterThan(0);
  });

  it('has accessible aria-label with both names', () => {
    renderCompare();
    const svg = screen.getByRole('img', { name: /Comparison of Hydrogen and Helium/i });
    expect(svg).toBeInTheDocument();
  });

  // --- NEW: Additional property bars ---

  it('renders Density property label', () => {
    renderCompare();
    expect(screen.getByText(/Density/)).toBeInTheDocument();
  });

  it('renders Melting Point property label', () => {
    renderCompare();
    expect(screen.getByText(/Melting Point/)).toBeInTheDocument();
  });

  it('renders Boiling Point property label', () => {
    renderCompare();
    expect(screen.getByText(/Boiling Point/)).toBeInTheDocument();
  });

  // --- NEW: Discovery info ---

  it('shows discoverer names for both elements', () => {
    renderCompare();
    expect(screen.getByText('Henry Cavendish')).toBeInTheDocument();
    expect(screen.getByText('Pierre Janssen')).toBeInTheDocument();
  });

  it('shows discovery years for both elements', () => {
    renderCompare();
    expect(screen.getByText('1766')).toBeInTheDocument();
    expect(screen.getByText('1868')).toBeInTheDocument();
  });

  it('links discoverer names to discoverer pages', () => {
    renderCompare();
    const links = screen.getAllByRole('link');
    const discovererLinks = links.filter(
      (l) => l.getAttribute('href')?.startsWith('/discoverers/'),
    );
    expect(discovererLinks.length).toBeGreaterThanOrEqual(2);
  });

  // --- NEW: Etymology info ---

  it('shows etymology descriptions for both elements', () => {
    renderCompare();
    expect(screen.getByText(/water-forming/)).toBeInTheDocument();
    expect(screen.getByText(/helios.*sun|sun/)).toBeInTheDocument();
  });
});

describe('CompareView mobile (vertical)', () => {
  it('renders both element symbols in vertical mode', () => {
    renderCompare(elementA, elementB, true);
    expect(screen.getAllByText('H').length).toBeGreaterThan(0);
    expect(screen.getAllByText('He').length).toBeGreaterThan(0);
  });

  it('uses 400px viewBox width in vertical mode', () => {
    renderCompare(elementA, elementB, true);
    const svg = screen.getByRole('img', { name: /Comparison/ });
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 400/);
  });

  it('still shows discoverer names in vertical mode', () => {
    renderCompare(elementA, elementB, true);
    expect(screen.getByText('Henry Cavendish')).toBeInTheDocument();
    expect(screen.getByText('Pierre Janssen')).toBeInTheDocument();
  });

  it('still shows etymology descriptions in vertical mode', () => {
    renderCompare(elementA, elementB, true);
    expect(screen.getByText(/water-forming/)).toBeInTheDocument();
  });

  it('info section stacks labels above values on mobile', () => {
    renderCompare(elementA, elementB, true);
    // In vertical mode, CompareRow should use flexDirection: column or wrap
    // Find the info container and check it has the vertical CSS class or style
    const discoveredLabel = screen.getByText('Discovered');
    const row = discoveredLabel.closest('[data-compare-row]');
    expect(row).toBeTruthy();
    const style = row ? (row as HTMLElement).style : null;
    expect(style?.flexDirection).toBe('column');
  });

  it('long discoverer names have overflow handling', () => {
    const longDiscoverer = makeElement({
      discoverer: 'Marie Skłodowska-Curie & Pierre Curie',
    });
    renderCompare(longDiscoverer, elementB, true);
    const nameEl = screen.getByText('Marie Skłodowska-Curie & Pierre Curie');
    // overflowWrap is on the <span> value container which wraps the <a> link
    // Walk up to find the span with the style
    let el: HTMLElement | null = nameEl as HTMLElement;
    let found = false;
    while (el && !found) {
      const s = el.style;
      if (s.overflowWrap === 'anywhere' || s.wordBreak === 'break-word' || s.overflow === 'hidden') {
        found = true;
      }
      el = el.parentElement;
    }
    expect(found).toBe(true);
  });
});
