import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Folio from '../../src/components/Folio';
import type { ElementRecord, ElementSources } from '../../src/lib/types';

afterEach(() => {
  cleanup();
});

// Mock pretext since jsdom has no canvas for font measurement
vi.mock('../../src/hooks/usePretextLines', () => ({
  useShapedText: ({ text }: { text: string }) => ({
    lines: [
      { text: text.slice(0, 60), width: 300, x: 0, y: 0 },
      { text: text.slice(60, 120), width: 300, x: 0, y: 20 },
    ],
    lineHeight: 20,
    plateHeightInLines: 9,
  }),
}));

const FE: ElementRecord = {
  atomicNumber: 26,
  symbol: 'Fe',
  name: 'Iron',
  wikidataId: 'Q677',
  wikipediaTitle: 'Iron',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Iron',
  period: 4,
  group: 8,
  block: 'd',
  category: 'transition metal',
  phase: 'solid',
  mass: 55.84,
  electronegativity: 1.83,
  ionizationEnergy: 7.902,
  radius: 194,
  summary:
    'Iron is a chemical element; it has symbol Fe and atomic number 26. It is a metal that belongs to the first transition series and group 8 of the periodic table.',
  neighbors: ['Mn', 'Co'],
  rankings: {
    mass: 93,
    electronegativity: 41,
    ionizationEnergy: 35,
    radius: 67,
  },
};

const FE_SOURCES: ElementSources = {
  structured: {
    provider: 'PubChem',
    license: 'public domain',
    url: 'https://pubchem.ncbi.nlm.nih.gov/element/26',
  },
  identifiers: {
    provider: 'Wikidata',
    license: 'CC0 1.0',
    url: 'https://www.wikidata.org/wiki/Q677',
  },
  summary: {
    provider: 'Wikipedia',
    title: 'Iron',
    url: 'https://en.wikipedia.org/wiki/Iron',
    license: 'CC BY-SA 4.0',
    accessDate: '2026-03-30',
  },
};

function renderFolio(props?: { sources?: ElementSources }) {
  return render(
    <MemoryRouter>
      <Folio element={FE} sources={props?.sources} animate={false} />
    </MemoryRouter>,
  );
}

describe('Folio', () => {
  it('renders element data with block-color accents', () => {
    renderFolio();
    // Giant atomic number (zero-padded)
    expect(screen.getByText('026')).toBeInTheDocument();
    // Symbol
    expect(screen.getByText('Fe')).toBeInTheDocument();
    // Name
    expect(screen.getByText('Iron')).toBeInTheDocument();
    // Category in marginalia
    expect(screen.getByText('transition metal')).toBeInTheDocument();
    // d-block color is warm red (#9e1c2c) — check the left color bar
    const colorBar = document.querySelector('[style*="background: rgb(158, 28, 44)"]');
    expect(colorBar).toBeInTheDocument();
  });

  it('shows data plate with group, period, block', () => {
    renderFolio();
    const plate = screen.getByTestId('data-plate');
    expect(plate).toBeInTheDocument();
    expect(screen.getByLabelText(/Data plate: Group 8, Period 4, Block d/)).toBeInTheDocument();
  });

  it('renders property bars', () => {
    renderFolio();
    expect(screen.getByLabelText(/Mass: ranked 93 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/EN: ranked 41 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/IE: ranked 35 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Radius: ranked 67 of 118/)).toBeInTheDocument();
  });

  it('renders neighbor links', () => {
    renderFolio();
    expect(screen.getByText('Mn')).toBeInTheDocument();
    expect(screen.getByText('Co')).toBeInTheDocument();
  });

  it('shows source strip with correct licensing text', () => {
    renderFolio({ sources: FE_SOURCES });
    expect(screen.getByText('PubChem')).toBeInTheDocument();
    expect(screen.getByText(/public domain/)).toBeInTheDocument();
    expect(screen.getByText('Wikidata')).toBeInTheDocument();
    expect(screen.getByText(/CC0 1.0/)).toBeInTheDocument();
    // Wikipedia title link (there are two "Iron" texts - heading + source link)
    const ironLinks = screen.getAllByText('Iron');
    expect(ironLinks.length).toBeGreaterThanOrEqual(2); // heading + source strip link
    expect(screen.getByText(/CC BY-SA 4.0/)).toBeInTheDocument();
    expect(screen.getByText(/No media in v1/)).toBeInTheDocument();
    expect(screen.getByText(/Fetched 2026-03-30/)).toBeInTheDocument();
  });

  it('renders compare link', () => {
    renderFolio();
    expect(screen.getByText('Compare →')).toBeInTheDocument();
  });

  it('shaped text lines are rendered in SVG', () => {
    renderFolio();
    const svgText = screen.getByLabelText('Element summary');
    expect(svgText).toBeInTheDocument();
  });
});
