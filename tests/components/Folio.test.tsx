import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
import Folio from '../../src/components/Folio';
import type { ElementRecord, ElementSources } from '../../src/lib/types';

afterEach(() => {
  cleanup();
});

const TEST_ACCESS_DATE = new Date().toISOString().slice(0, 10);

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
  density: 7.874,
  meltingPoint: 1811,
  boilingPoint: 3134,
  halfLife: null,
  summary:
    'Iron is a chemical element; it has symbol Fe and atomic number 26. It is a metal that belongs to the first transition series and group 8 of the periodic table.',
  discoveryYear: null,
  discoverer: 'Known since antiquity',
  etymologyOrigin: 'property',
  etymologyDescription: 'Anglo-Saxon iron; symbol from Latin ferrum',
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
    accessDate: TEST_ACCESS_DATE,
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
    expect(screen.getByLabelText(/Atomic Mass: 55.84 Da, ranked 93 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Electronegativity: 1.83, ranked 41 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ionisation Energy: 7.902 kJ\/mol, ranked 35 of 118/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Atomic Radius: 194 pm, ranked 67 of 118/)).toBeInTheDocument();
  });

  it('renders neighbor links in marginalia', () => {
    renderFolio();
    // Mn and Co appear as neighbor chips in the marginalia
    const marginalia = document.querySelector('.folio-marginalia')!;
    expect(marginalia).toBeTruthy();
    const mnLink = marginalia.querySelector('a[href="/element/Mn"]');
    const coLink = marginalia.querySelector('a[href="/element/Co"]');
    expect(mnLink).toBeTruthy();
    expect(coLink).toBeTruthy();
  });

  it('shows source strip with correct licensing text', () => {
    renderFolio({ sources: FE_SOURCES });
    expect(screen.getByText('PubChem')).toBeInTheDocument();
    expect(screen.getByText(/public domain/)).toBeInTheDocument();
    expect(screen.getByText('Wikidata')).toBeInTheDocument();
    expect(screen.getByText(/CC0 1.0/)).toBeInTheDocument();
    // Wikipedia title link (there are two "Iron" texts - heading + source link)
    const ironLinks = screen.getAllByText('Iron');
    expect(ironLinks).toHaveLength(2); // heading + source strip link
    expect(screen.getByText(/CC BY-SA 4.0/)).toBeInTheDocument();
    expect(screen.getByText(/No media in v1/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Fetched ${TEST_ACCESS_DATE}`))).toBeInTheDocument();
  });

  it('data plate shows em-dash for null group', () => {
    const noGroup = { ...FE, group: null as number | null };
    render(<MemoryRouter><Folio element={noGroup} animate={false} /></MemoryRouter>);
    expect(screen.getByLabelText(/Data plate: Group —/)).toBeInTheDocument();
  });

  it('compare link points to correct URL and uses client-side routing', () => {
    renderFolio();
    const link = screen.getByText('Compare →');
    expect(link).toHaveAttribute('href', '/compare/Fe/Mn');
    // Should be rendered by React Router's Link, not a plain <a> tag.
    // MemoryRouter wraps Link output with onClick handlers; plain <a> won't
    // have the data-discover-* attributes or the internal click handling.
    // We check that it's inside a react-router link by verifying the
    // closest <a> has an onclick handler (react-router adds one).
    expect(link.onclick).not.toBeNull();
  });

  it('neighbor links use client-side routing', () => {
    renderFolio();
    const marginalia = document.querySelector('.folio-marginalia')!;
    const mnLink = marginalia.querySelector('a[href="/element/Mn"]') as HTMLAnchorElement;
    expect(mnLink).toBeTruthy();
    // React Router Link adds an onClick handler; plain <a> tags don't
    expect(mnLink!.onclick).not.toBeNull();
  });

  it('shaped text lines are rendered in SVG', () => {
    renderFolio();
    const svgText = screen.getByLabelText('Element summary');
    expect(svgText).toBeInTheDocument();
  });

  it('data plate links group, period, and block to atlas pages', () => {
    renderFolio();
    // Group label should link to /atlas/group/8
    const groupLink = screen.getByRole('link', { name: /group 8/i });
    expect(groupLink).toHaveAttribute('href', '/atlas/group/8');
    // Period label should link to /atlas/period/4
    const periodLink = screen.getByRole('link', { name: /period 4/i });
    expect(periodLink).toHaveAttribute('href', '/atlas/period/4');
    // Block label should link to /atlas/block/d
    const blockLink = screen.getByRole('link', { name: /block d/i });
    expect(blockLink).toHaveAttribute('href', '/atlas/block/d');
  });

  it('data plate shows group prev/next arrows for elements with a group', () => {
    renderFolio();
    // Fe is first in Group 8 (period 4). Next in group is Ru (period 5).
    const nextInGroup = screen.getByRole('link', { name: /Next: Ruthenium/i });
    expect(nextInGroup).toHaveAttribute('href', '/element/Ru');
  });

  it('data plate shows period and block prev/next arrows', () => {
    renderFolio();
    // Fe (Z=26) — prev in period/block is Mn (Z=25), next is Co (Z=27)
    // These appear in both the period and block rows, so use getAllByRole
    const prevLinks = screen.getAllByRole('link', { name: /Previous: Manganese/i });
    expect(prevLinks.length).toBeGreaterThanOrEqual(1);
    expect(prevLinks[0]).toHaveAttribute('href', '/element/Mn');

    const nextLinks = screen.getAllByRole('link', { name: /Next: Cobalt/i });
    expect(nextLinks.length).toBeGreaterThanOrEqual(1);
    expect(nextLinks[0]).toHaveAttribute('href', '/element/Co');
  });

  it('no group arrows for elements without a group', () => {
    const noGroup = { ...FE, group: null as number | null, symbol: 'La', name: 'Lanthanum', atomicNumber: 57 };
    render(<MemoryRouter><Folio element={noGroup} animate={false} /></MemoryRouter>);
    expect(screen.getByLabelText(/Data plate: Group —/)).toBeInTheDocument();
    // All arrow links should be /element/ links, none for group
    const arrowLinks = screen.queryAllByRole('link', { name: /Previous:|Next:/i });
    for (const link of arrowLinks) {
      expect(link.getAttribute('href')).toMatch(/^\/element\//);
    }
    // Ruthenium (next in Group 8) should NOT appear since group is null
    const ruLink = screen.queryByRole('link', { name: /Ruthenium/i });
    expect(ruLink).toBeNull();
  });


  it('category label links to atlas category page', () => {
    renderFolio();
    const catLink = screen.getByRole('link', { name: /transition metal/i });
    expect(catLink).toHaveAttribute('href', '/atlas/category/transition-metal');
  });

  it('etymology link points to specific origin hash', () => {
    renderFolio();
    const etymLink = screen.getByText('(property →)');
    expect(etymLink).toHaveAttribute('href', '/etymology-map#property');
  });

  it('discoverer link points to encoded discoverer URL', () => {
    renderFolio();
    const discovererLink = screen.getByText('Known since antiquity');
    expect(discovererLink).toHaveAttribute(
      'href',
      '/discoverer/Known%20since%20antiquity',
    );
  });

  it('timeline link falls back to /discovery-timeline when discoveryYear is null', () => {
    renderFolio();
    const timelineLink = screen.getByText('timeline →');
    expect(timelineLink).toHaveAttribute('href', '/discovery-timeline');
  });

  it('timeline link points to decade URL when discoveryYear is present', () => {
    const oxygen: ElementRecord = {
      ...FE,
      atomicNumber: 8,
      symbol: 'O',
      name: 'Oxygen',
      discoveryYear: 1774,
      discoverer: 'Joseph Priestley',
      neighbors: ['N', 'F'],
    };
    render(
      <MemoryRouter>
        <Folio element={oxygen} animate={false} />
      </MemoryRouter>,
    );
    const timelineLink = screen.getByText('timeline →');
    expect(timelineLink).toHaveAttribute('href', '/timeline/1770');
  });
});
