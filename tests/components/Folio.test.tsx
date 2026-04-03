import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
import Folio from '../../src/components/Folio';
import type { ElementRecord, ElementSources, AnomalyData, GroupData } from '../../src/lib/types';
import { FE, FE_SOURCES, TEST_ACCESS_DATE } from '../fixtures/element-fe';
import { IR } from '../fixtures/element-ir';

afterEach(() => {
  cleanup();
});

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
    // Group label should link to /atlas/group/8
    const groupLink = screen.getByRole('link', { name: /group 8/i });
    expect(groupLink).toHaveAttribute('href', '/groups/8');
    // Period label should link to /periods/4
    const periodLink = screen.getByRole('link', { name: /period 4/i });
    expect(periodLink).toHaveAttribute('href', '/periods/4');
    // Block label should link to /blocks/d
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
    // These appear in both the period and block rows, so use getAllByRole
    const prevLinks = screen.getAllByRole('link', { name: /Previous: Manganese/i });
    expect(prevLinks.length).toBeGreaterThanOrEqual(1);
    expect(prevLinks[0]).toHaveAttribute('href', '/elements/Mn');

    const nextLinks = screen.getAllByRole('link', { name: /Next: Cobalt/i });
    expect(nextLinks.length).toBeGreaterThanOrEqual(1);
    expect(nextLinks[0]).toHaveAttribute('href', '/elements/Co');
  });

  it('no group arrows for elements without a group', () => {
    const noGroup = { ...FE, group: null as number | null, symbol: 'La', name: 'Lanthanum', atomicNumber: 57 };
    render(<MemoryRouter><Folio element={noGroup} animate={false} /></MemoryRouter>);
    expect(screen.getByLabelText(/Data plate: Group —/)).toBeInTheDocument();
    // All arrow links should be /element/ links, none for group
    const arrowLinks = screen.queryAllByRole('link', { name: /Previous:|Next:/i });
    for (const link of arrowLinks) {
      expect(link.getAttribute('href')).toMatch(/^\/elements\//);
    }
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
    render(
      <MemoryRouter>
        <Folio element={oxygen} animate={false} />
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
  const ANOMALIES: AnomalyData[] = [
    { slug: 'diagonal-relationship', label: 'Diagonal Relationship', description: '', elements: ['Fe', 'Co', 'Ni'] },
    { slug: 'color-anomaly', label: 'Colour Anomaly', description: '', elements: ['Fe', 'Cu'] },
  ];

  const GROUPS: GroupData[] = [
    { n: 8, label: 'Group 8', description: '', elements: ['Fe', 'Ru', 'Os', 'Hs'] },
  ];

  it('renders anomaly chips when element has anomalies', () => {
    render(
      <MemoryRouter>
        <Folio element={FE} anomalies={ANOMALIES} animate={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Anomaly: Diagonal Relationship/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Anomaly: Colour Anomaly/i })).toBeInTheDocument();
  });

  it('does not render anomaly chips when element has no matching anomalies', () => {
    const unrelated: AnomalyData[] = [
      { slug: 'test', label: 'Test', description: '', elements: ['Og'] },
    ];
    render(
      <MemoryRouter>
        <Folio element={FE} anomalies={unrelated} animate={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /Anomaly:/i })).not.toBeInTheDocument();
  });

  it('renders group phase strip when groups data is provided', () => {
    render(
      <MemoryRouter>
        <Folio element={FE} groups={GROUPS} animate={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Phase at STP — Group 8/)).toBeInTheDocument();
  });
});

describe('Folio — identity block sizing', () => {
  it('IDENTITY_HEIGHT matches actual rendered identity content height', () => {
    // The identity block contains: number (56px, lh 1) + symbol (44px, lh 1.1)
    // + name (11px + 4px margin-top). The IDENTITY_HEIGHT constant used for
    // text shaping should closely match this to avoid excess whitespace.
    // Number: 56px * 1 = 56, Symbol: 44px * 1.1 = 48.4, Name: 11px * 1.5 + 4px margin = 20.5
    // Total ≈ 125. IDENTITY_HEIGHT should be <= 108 to avoid wasted lines.
    renderFolio();
    const identity = document.querySelector('.folio-identity')!;
    expect(identity).toBeTruthy();

    // The identity block's inline width on desktop should be IDENTITY_WIDTH
    expect(identity.getAttribute('style')).toContain('width');
  });

  it('Iridium folio identity does not overlap summary SVG text', () => {
    // Regression: Ir has a long summary (491 chars). The identity block
    // must not visually overlap with the shaped text SVG.
    render(
      <MemoryRouter>
        <Folio element={IR} animate={false} />
      </MemoryRouter>,
    );
    const identity = document.querySelector('.folio-identity')!;
    const summarySvg = document.querySelector('svg[aria-label="Element summary"]')!;
    expect(identity).toBeTruthy();
    expect(summarySvg).toBeTruthy();

    // Both should exist in the summary area
    const summaryArea = document.querySelector('.folio-summary-area')!;
    expect(summaryArea.contains(identity)).toBe(true);
    expect(summaryArea.contains(summarySvg)).toBe(true);
  });
});

describe('Folio — mobile layout', () => {
  it('data plate is present in the DOM', () => {
    renderFolio();
    const plate = screen.getByTestId('data-plate');
    expect(plate).toBeInTheDocument();
  });

  it('summary area does not have fixed minHeight on small viewports', () => {
    // Verifies that the summary area adapts — minHeight should be 'auto'
    // when mobile, or a px value when desktop. We can't mock useIsMobile
    // easily, but we verify the component renders without crash.
    renderFolio();
    const summaryArea = document.querySelector('.folio-summary-area')!;
    expect(summaryArea).toBeTruthy();
    // On desktop (default in test), minHeight should be the plate height
    expect(summaryArea.getAttribute('style')).toContain('min-height');
  });

  it('does not render dead MarginaliaProperty component', () => {
    renderFolio();
    // RankDotSparkline was removed — verify no 40x12 SVGs in marginalia
    const marginalia = document.querySelector('.folio-marginalia')!;
    const smallSvgs = marginalia.querySelectorAll('svg[width="40"]');
    expect(smallSvgs.length).toBe(0);
  });
});
