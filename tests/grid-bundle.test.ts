// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { build } from 'vite';
import fullElements from '../data/generated/elements.json';

describe('the shipped grid and lookup modules stay slim', () => {
  it('bundles their public exports without including the full element dataset', async () => {
    const built = await build({
      configFile: false,
      logLevel: 'silent',
      build: {
        write: false,
        minify: false,
        rollupOptions: {
          input: [resolve(__dirname, '../src/lib/grid.ts'), resolve(__dirname, '../src/lib/data.ts')],
          preserveEntrySignatures: 'strict',
        },
      },
    });
    const outputs = (Array.isArray(built) ? built : [built])
      .flatMap(result => 'output' in result ? result.output : []);
    const chunks = outputs.filter(output => output.type === 'chunk');
    expect(chunks.length).toBeGreaterThan(0);
    const included = chunks.flatMap(chunk => Object.keys(chunk.modules));
    expect(included).not.toContain(resolve(__dirname, '../data/generated/elements.json'));
    // Keep the same relative size requirement as the data suitability contract.
    expect(chunks.reduce((bytes, chunk) => bytes + Buffer.byteLength(chunk.code), 0))
      .toBeLessThan(Buffer.byteLength(JSON.stringify(fullElements)) * 0.5);
  });
});
