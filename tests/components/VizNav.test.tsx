import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import VizNav from '../../src/components/VizNav';

afterEach(cleanup);

function renderAt(pathname: string) {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <VizNav />
    </MemoryRouter>,
  );
  return within(screen.getByRole('navigation', { name: 'Visualisation pages' })).getAllByRole('link');
}

describe('VizNav', () => {
  it('links to every visualisation page, in order, with its label', () => {
    const links = renderAt('/');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Table', '/'],
      ['Phase', '/phase-landscape'],
      ['Anomalies', '/anomaly-explorer'],
      ['Scatter', '/property-scatter'],
      ['Timeline', '/discovery-timeline'],
      ['Etymology', '/etymology-map'],
      ['Discoverers', '/discoverer-network'],
      ['Explore', '/explore'],
    ]);
  });

  it('highlights only the link for the current page', () => {
    const links = renderAt('/etymology-map');
    const filled = links.filter((link) => link.style.background !== 'transparent');
    expect(filled.map((link) => link.getAttribute('href'))).toEqual(['/etymology-map']);
  });
});
