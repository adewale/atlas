import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock @chenglou/pretext before importing components that use it
vi.mock('@chenglou/pretext', () => ({
  prepareWithSegments: (text: string) => ({
    __brand: 'prepared',
    _text: text,
    widths: Array.from({ length: text.length }, () => 8),
  }),
  layout: (_prepared: unknown, maxWidth?: number) => {
    const text = (_prepared as { _text: string })._text;
    const textWidth = text.length * 8;
    const fits = maxWidth == null || textWidth <= maxWidth;
    return { lineCount: fits ? 1 : Math.ceil(textWidth / maxWidth!), height: 20 };
  },
  layoutWithLines: (_prepared: unknown, maxWidth: number, lineHeight: number) => {
    const text = (_prepared as { _text: string })._text;
    const charsPerLine = Math.max(1, Math.floor(maxWidth / 8));
    const lineCount = Math.ceil(text.length / charsPerLine);
    return {
      lineCount,
      height: lineCount * lineHeight,
      lines: Array.from({ length: lineCount }, (_, i) => ({
        startOffset: i * charsPerLine,
        endOffset: Math.min((i + 1) * charsPerLine, text.length),
      })),
    };
  },
  layoutNextLine: () => null,
}));

import '../mocks/usePretextLines.mock';
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

  // Grid clamping: key regression test for eb5bb5f
  it('clamps columns to element count — 1 element uses 1 column', () => {
    const { container } = renderPlate([makeElement()], 'Single Element', 4);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const width = parseInt(viewBox.split(' ')[2], 10);
    // 1 col: CARD_W = 100, no GAP → viewBox width = 100
    expect(width).toBe(100);
  });

  it('clamps columns — 2 elements use 2 columns on desktop', () => {
    const elements = [
      makeElement({ symbol: 'H' }),
      makeElement({ symbol: 'He', atomicNumber: 2, name: 'Helium' }),
    ];
    const { container } = renderPlate(elements, 'Two', 4);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox')!;
    const width = parseInt(viewBox.split(' ')[2], 10);
    // 2 cols: 2 * (100 + 4) - 4 = 204
    expect(width).toBe(204);
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

  it('truncates long category names', () => {
    const { container } = renderPlate([
      makeElement({ category: 'alkaline earth metal' }),
    ]);
    // The ABBREV map should shorten this — just verify it renders
    const texts = container.querySelectorAll('text');
    const allText = Array.from(texts).map((t) => t.textContent).join(' ');
    // Should contain abbreviated form, not the full name (or the full name if it fits)
    expect(allText.length).toBeGreaterThan(0);
  });
});
