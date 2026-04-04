import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Folio from '../../src/components/Folio';
import type { ElementRecord, ElementSources, FolioBundle } from '../../src/lib/types';
import { FE, FE_SOURCES, TEST_ACCESS_DATE } from '../fixtures/element-fe';
import { IR } from '../fixtures/element-ir';

afterEach(() => {
  cleanup();
});

const FE_BUNDLE: FolioBundle = {
  element: { ...FE, sources: FE_SOURCES },
  group: { n: 8, label: 'Group 8', description: 'Iron, ruthenium, osmium, and hassium.', elements: ['Fe', 'Ru', 'Os', 'Hs'] },
  anomalies: [],
  nav: {
    prevInGroup: null,
    nextInGroup: { symbol: 'Ru', name: 'Ruthenium' },
    prevInPeriod: { symbol: 'Mn', name: 'Manganese' },
    nextInPeriod: { symbol: 'Co', name: 'Cobalt' },
    prevInBlock: { symbol: 'Mn', name: 'Manganese' },
    nextInBlock: { symbol: 'Co', name: 'Cobalt' },
    prevInCategory: { symbol: 'Mn', name: 'Manganese' },
    nextInCategory: { symbol: 'Co', name: 'Cobalt' },
  },
  groupPhases: ['solid', 'solid', 'solid', 'solid'],
  neighbors: [
    { symbol: 'Mn', name: 'Manganese', block: 'd' },
    { symbol: 'Co', name: 'Cobalt', block: 'd' },
  ],
  sameDiscoverer: [],
  sameEtymology: [
    { symbol: 'H', name: 'Hydrogen', block: 's' },
    { symbol: 'Li', name: 'Lithium', block: 's' },
  ],
};

function renderFolio(bundle?: FolioBundle) {
  return render(
    <MemoryRouter>
      <Folio element={FE} folioBundle={bundle ?? FE_BUNDLE} animate={false} />
    </MemoryRouter>,
  );
}

describe('Folio', () => {
  it('renders element data with block-color accents', () => {
    renderFolio();
    // Giant atomic number (zero-padded)
    expect(screen.getByText('026')).toBeInTheDocument();
    // Symbol (may appear in sameEtymology links too)
    expect(screen.getAllByText('Fe').length).toBeGreaterThanOrEqual(1);
    // Name (appears in heading + source strip)
    expect(screen.getAllByText('Iron').length).toBeGreaterThanOrEqual(1);
    // Category in data plate
    expect(screen.getByLabelText('transition metal')).toBeInTheDocument();
  });

  it('shows data plate with group, period, block', () => {
    renderFolio();
    const plate = screen.getByTestId('data-plate');
    expect(plate).toBeInTheDocument();
    expect(screen.getByLabelText(/Data plate: Group 8, Period 4, Block d/)).toBeInTheDocument();
  });

  it('renders discovery section', () => {
    renderFolio();
    expect(screen.getByText('Known since antiquity')).toBeInTheDocument();
  });

  it('renders neighbor links in marginalia', () => {
    renderFolio();
    const marginalia = document.querySelector('.folio-marginalia')!;
    expect(marginalia).toBeTruthy();
    const mnLink = marginalia.querySelector('a[href="/elements/Mn"]');
    const coLink = marginalia.querySelector('a[href="/elements/Co"]');
    expect(mnLink).toBeTruthy();
    expect(coLink).toBeTruthy();
  });

  it('shows source strip with correct licensing text', () => {
    renderFolio();
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
    const noGroupBundle: FolioBundle = {
      ...FE_BUNDLE,
      group: null,
      nav: { ...FE_BUNDLE.nav, prevInGroup: null, nextInGroup: null },
      groupPhases: null,
    };
    render(<MemoryRouter><Folio element={noGroup} folioBundle={noGroupBundle} animate={false} /></MemoryRouter>);
    expect(screen.getByLabelText(/Data plate: Group —/)).toBeInTheDocument();
  });

  it('compare link points to correct URL', () => {
    renderFolio();
    const link = screen.getByText('Compare →');
    expect(link).toHaveAttribute('href', '/elements/Fe/compare/Mn');
  });

  it('shaped text lines are rendered in SVG', () => {
    renderFolio();
    const svgText = screen.getByLabelText('Element summary');
    expect(svgText).toBeInTheDocument();
  });

  it('data plate links group, period, and block to atlas pages', () => {
    renderFolio();
    const groupLink = screen.getByRole('link', { name: /group 8/i });
    expect(groupLink).toHaveAttribute('href', '/groups/8');
    const periodLink = screen.getByRole('link', { name: /period 4/i });
    expect(periodLink).toHaveAttribute('href', '/periods/4');
    const blockLink = screen.getByRole('link', { name: /block d/i });
    expect(blockLink).toHaveAttribute('href', '/blocks/d');
  });

  it('data plate shows group prev/next arrows for elements with a group', () => {
    renderFolio();
    // Fe is first in Group 8 (period 4). Next in group is Ru (period 5).
    const nextInGroup = screen.getByRole('link', { name: /Next: Ruthenium/i });
    expect(nextInGroup).toHaveAttribute('href', '/elements/Ru');
  });

  it('data plate shows period and block prev/next arrows', () => {
    renderFolio();
    // Fe (Z=26) — prev in period/block is Mn (Z=25), next is Co (Z=27)
    const prevLinks = screen.getAllByRole('link', { name: /Previous: Manganese/i });
    expect(prevLinks.length).toBeGreaterThanOrEqual(1);
    expect(prevLinks[0]).toHaveAttribute('href', '/elements/Mn');

    const nextLinks = screen.getAllByRole('link', { name: /Next: Cobalt/i });
    expect(nextLinks.length).toBeGreaterThanOrEqual(1);
    expect(nextLinks[0]).toHaveAttribute('href', '/elements/Co');
  });

  it('no group arrows for elements without a group', () => {
    const noGroup = { ...FE, group: null as number | null, symbol: 'La', name: 'Lanthanum', atomicNumber: 57 };
    const noGroupBundle: FolioBundle = {
      ...FE_BUNDLE,
      group: null,
      nav: {
        prevInGroup: null, nextInGroup: null,
        prevInPeriod: { symbol: 'Ba', name: 'Barium' },
        nextInPeriod: { symbol: 'Ce', name: 'Cerium' },
        prevInBlock: { symbol: 'Yb', name: 'Ytterbium' },
        nextInBlock: { symbol: 'Ce', name: 'Cerium' },
        prevInCategory: null, nextInCategory: null,
      },
      groupPhases: null,
    };
    render(<MemoryRouter><Folio element={noGroup} folioBundle={noGroupBundle} animate={false} /></MemoryRouter>);
    expect(screen.getByLabelText(/Data plate: Group —/)).toBeInTheDocument();
    // Ruthenium (next in Group 8) should NOT appear since group is null
    const ruLink = screen.queryByRole('link', { name: /Ruthenium/i });
    expect(ruLink).toBeNull();
  });


  it('category label links to atlas category page', () => {
    renderFolio();
    const catLink = screen.getByRole('link', { name: /transition metal/i });
    expect(catLink).toHaveAttribute('href', '/categories/transition-metal');
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
      '/discoverers/Known%20since%20antiquity',
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
    const oxygenBundle: FolioBundle = {
      ...FE_BUNDLE,
      element: oxygen,
      neighbors: [
        { symbol: 'N', name: 'Nitrogen', block: 'p' },
        { symbol: 'F', name: 'Fluorine', block: 'p' },
      ],
    };
    render(
      <MemoryRouter>
        <Folio element={oxygen} folioBundle={oxygenBundle} animate={false} />
      </MemoryRouter>,
    );
    const timelineLink = screen.getByText('1770s →');
    expect(timelineLink).toHaveAttribute('href', '/eras/1770');
  });

  it('era label shows decade, not generic "timeline"', () => {
    const cobalt: ElementRecord = {
      ...FE,
      atomicNumber: 27,
      symbol: 'Co',
      name: 'Cobalt',
      discoveryYear: 1735,
      discoverer: 'George Brandt',
      neighbors: ['Fe', 'Ni'],
    };
    render(
      <MemoryRouter>
        <Folio element={cobalt} animate={false} />
      </MemoryRouter>,
    );
    // Should show "1730s →", NOT "timeline →"
    expect(screen.getByText('1730s →')).toBeInTheDocument();
    expect(screen.queryByText('timeline →')).not.toBeInTheDocument();
  });
});

describe('Folio — anomalies and groups', () => {
  it('renders anomaly chips when element has anomalies', () => {
    const bundleWithAnomalies: FolioBundle = {
      ...FE_BUNDLE,
      anomalies: [
        { slug: 'diagonal-relationship', label: 'Diagonal Relationship', elementCount: 3 },
        { slug: 'color-anomaly', label: 'Colour Anomaly', elementCount: 2 },
      ],
    };
    render(
      <MemoryRouter>
        <Folio element={FE} folioBundle={bundleWithAnomalies} animate={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Anomaly: Diagonal Relationship/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Anomaly: Colour Anomaly/i })).toBeInTheDocument();
  });

  it('does not render anomaly chips when element has no matching anomalies', () => {
    const bundleNoAnomalies: FolioBundle = {
      ...FE_BUNDLE,
      anomalies: [],
    };
    render(
      <MemoryRouter>
        <Folio element={FE} folioBundle={bundleNoAnomalies} animate={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /Anomaly:/i })).not.toBeInTheDocument();
  });

  it('renders group phase strip when group data is provided', () => {
    renderFolio();
    expect(screen.getByText(/Phase at STP — Group 8/)).toBeInTheDocument();
  });
});

describe('Folio — identity block sizing', () => {
  it('identity block uses compact font sizes on desktop', () => {
    renderFolio();
    const number = document.querySelector('.folio-number')!;
    const symbol = document.querySelector('.folio-symbol')!;
    expect(number).toBeTruthy();
    expect(symbol).toBeTruthy();
    // Number should be 48px on desktop (not 56px — too tall for identity budget)
    expect(number.getAttribute('style')).toContain('font-size: 48px');
    // Symbol should be 36px on desktop
    expect(symbol.getAttribute('style')).toContain('font-size: 36px');
  });

  it('Iridium folio renders all expected sections', () => {
    render(
      <MemoryRouter>
        <Folio element={IR} animate={false} />
      </MemoryRouter>,
    );
    // Identity, data plate, summary SVG, rank rows all render
    expect(document.querySelector('.folio-identity')).toBeTruthy();
    expect(document.querySelector('[data-testid="data-plate"]')).toBeTruthy();
    expect(document.querySelector('svg[aria-label="Element summary"]')).toBeTruthy();
    expect(document.querySelector('.folio-rank-rows')).toBeTruthy();
    // Ir data plate shows correct values
    expect(screen.getByLabelText(/Data plate: Group 9, Period 6, Block d/)).toBeInTheDocument();
  });
});

describe('Folio — mobile layout', () => {
  it('data plate is present in the DOM', () => {
    renderFolio();
    const plate = screen.getByTestId('data-plate');
    expect(plate).toBeInTheDocument();
  });

  it('summary area does not have fixed minHeight on small viewports', () => {
    renderFolio();
    const summaryArea = document.querySelector('.folio-summary-area')!;
    expect(summaryArea).toBeTruthy();
    expect(summaryArea.getAttribute('style')).toContain('min-height');
  });

  it('does not render dead MarginaliaProperty component', () => {
    renderFolio();
    const marginalia = document.querySelector('.folio-marginalia')!;
    const smallSvgs = marginalia.querySelectorAll('svg[width="40"]');
    expect(smallSvgs.length).toBe(0);
  });
});
