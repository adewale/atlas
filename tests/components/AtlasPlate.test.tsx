import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// No pretext mock — uses real text measurement via node-canvas
import AtlasPlate from '../../src/components/AtlasPlate';
import type { ElementRecord } from '../../src/lib/types';

afterEach(() => {
  cleanup();
});

/** Minimal element record for testing. */
function makeElement(overrides: Partial<ElementRecord> = {}): ElementRecord {
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
    category: 'reactive nonmetal',
    phase: 'gas',
    mass: 1.008,
    electronegativity: 2.2,
    ionizationEnergy: 13.598,
    radius: 53,
    density: 0.00008988,
    meltingPoint: 14.01,
    boilingPoint: 20.28,
    halfLife: null,
    summary: 'Hydrogen is the lightest element.',
    discoveryYear: 1766,
    discoverer: 'Henry Cavendish',
    etymologyOrigin: 'greek',
    etymologyDescription: 'Greek: hydro + genes (water forming)',
    neighbors: ['He'],
    rankings: { mass: 1, electronegativity: 10, ionizationEnergy: 1, radius: 1 },
    ...overrides,
  };
}

function renderPlate(elements: ElementRecord[], caption = 'Test Caption', columns = 4) {
  return render(
    <MemoryRouter>
      <AtlasPlate elements={elements} caption={caption} columns={columns} />
    </MemoryRouter>,
  );
}

describe('AtlasPlate', () => {
  it('renders an SVG with role="img"', () => {
    renderPlate([makeElement()]);
    expect(screen.getByRole('img', { name: 'Test Caption' })).toBeInTheDocument();
  });

  it('renders one card per element', () => {
    const elements = [
      makeElement({ symbol: 'H', atomicNumber: 1 }),
      makeElement({ symbol: 'He', atomicNumber: 2, name: 'Helium' }),
      makeElement({ symbol: 'Li', atomicNumber: 3, name: 'Lithium' }),
    ];
    const { container } = renderPlate(elements);
    // Each card has a <g> with aria-label
    const cards = container.querySelectorAll('g[aria-label]');
    expect(cards.length).toBe(3);
  });

  it('element symbol list appears below the grid', () => {
    const elements = [
      makeElement({ symbol: 'H' }),
      makeElement({ symbol: 'He', atomicNumber: 2, name: 'Helium' }),
    ];
    renderPlate(elements);
    expect(screen.getByText('H · He')).toBeInTheDocument();
  });

  it('SVG has height: auto for responsive scaling', () => {
    const { container } = renderPlate([makeElement()]);
    const svg = container.querySelector('svg')!;
    expect(svg.style.height).toBe('auto');
  });

  it('SVG has maxWidth: 100%', () => {
    const { container } = renderPlate([makeElement()]);
    const svg = container.querySelector('svg')!;
    expect(svg.style.maxWidth).toBe('100%');
  });

  // Grid clamping: minimum 4 columns on desktop for consistent caption width
  it('clamps columns to minimum 4 — 1 element still gets 4-col grid width', () => {
    const { container } = renderPlate([makeElement()], 'Single Element', 4);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const width = parseInt(viewBox.split(' ')[2], 10);
    // min 4 cols: 4 * (100 + 4) - 4 = 412
    expect(width).toBe(412);
  });

  it('clamps columns — 2 elements still get 4-col grid width on desktop', () => {
    const elements = [
      makeElement({ symbol: 'H' }),
      makeElement({ symbol: 'He', atomicNumber: 2, name: 'Helium' }),
    ];
    const { container } = renderPlate(elements, 'Two', 4);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const width = parseInt(viewBox.split(' ')[2], 10);
    // min 4 cols: 4 * (100 + 4) - 4 = 412
    expect(width).toBe(412);
  });

  it('uses full column count when elements >= columns', () => {
    const elements = Array.from({ length: 6 }, (_, i) =>
      makeElement({ symbol: `E${i}`, atomicNumber: i + 1, name: `Element ${i}` }),
    );
    const { container } = renderPlate(elements, 'Six', 4);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const width = parseInt(viewBox.split(' ')[2], 10);
    // 4 cols: 4 * (100 + 4) - 4 = 412
    expect(width).toBe(412);
  });

  it('handles empty elements array without crashing', () => {
    const { container } = renderPlate([], 'Empty');
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders category name (abbreviated or full depending on font metrics)', () => {
    const { container } = renderPlate([
      makeElement({ category: 'alkaline earth metal' }),
    ]);
    const texts = container.querySelectorAll('text');
    const allText = Array.from(texts).map((t) => t.textContent).join(' ');
    // With real font metrics at 8px, the category may fit untruncated or be
    // abbreviated to "alk. earth". Either form is acceptable.
    expect(allText).toMatch(/alkaline earth metal|alk\.\s*eart/);
  });
});
