import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import PretextSvg from '../../src/components/PretextSvg';

afterEach(cleanup);

describe('PretextSvg drop-cap text', () => {
  it.each([
    { text: 'ello world', char: 'H', expected: ['H', 'ello world'] },
    { text: 'x', char: 'A', expected: ['A', 'x'] },
    { text: '', char: 'A', expected: ['A', ''] },
    { text: 'Hello world', char: undefined, expected: ['H', 'ello world'] },
  ])('preserves the body text for $text with explicit initial $char', ({ text, char, expected }) => {
    const { container } = render(
      <svg>
        <PretextSvg
          lines={[{ text, width: 100, x: 0, y: 16 }]}
          lineHeight={20}
          dropCap={{ fontSize: 48, fill: '#202020', char }}
        />
      </svg>,
    );
    expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(expected);
  });
});
