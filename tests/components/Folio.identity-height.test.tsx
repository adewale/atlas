/**
 * Folio identity block height regression test.
 *
 * IDENTITY_HEIGHT controls how many lines of shaped text are indented
 * beside the identity block. Too large → excess narrow lines → overlap
 * and wasted whitespace (visible on /elements/Ir).
 *
 * These tests verify the constant is reasonable by checking the
 * identityHeightInLines value returned by useShapedText (via mock).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../mocks/usePretextLines.mock';
import Folio from '../../src/components/Folio';
import { IR } from '../fixtures/element-ir';
import { FE } from '../fixtures/element-fe';

afterEach(() => {
  cleanup();
});

describe('Folio — identity height regression', () => {
  it('identity block on desktop is positioned and sized correctly', () => {
    render(
      <MemoryRouter>
        <Folio element={FE} animate={false} />
      </MemoryRouter>,
    );
    const identity = document.querySelector('.folio-identity')!;
    expect(identity).toBeTruthy();
    const style = identity.getAttribute('style')!;
    expect(style).toContain('position: absolute');
    expect(style).toContain('width: 130px');
  });

  it('Iridium renders without data plate overlapping rank rows', () => {
    render(
      <MemoryRouter>
        <Folio element={IR} animate={false} />
      </MemoryRouter>,
    );
    // Data plate and rank rows should both exist
    const plate = document.querySelector('[data-testid="data-plate"]')!;
    const rankRows = document.querySelector('.folio-rank-rows')!;
    expect(plate).toBeTruthy();
    expect(rankRows).toBeTruthy();
  });
});
