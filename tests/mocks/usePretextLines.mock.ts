import { vi } from 'vitest';

vi.mock('../../src/hooks/usePretextLines', () => ({
  usePretextLines: ({ text }: { text: string }) => ({
    lines: [{ text: text.slice(0, 40), width: 160, x: 0, y: 0 }],
    lineHeight: 18,
  }),
  useShapedText: ({ text }: { text: string }) => ({
    lines: [
      { text: text.slice(0, 60), width: 300, x: 0, y: 0 },
      { text: text.slice(60, 120), width: 300, x: 0, y: 20 },
    ],
    lineHeight: 20,
    plateHeightInLines: 9,
    identityHeightInLines: 5,
  }),
  useDropCapText: ({ text }: { text: string }) => ({
    dropCap: { char: text[0], fontSize: 80 },
    lines: [
      { text: text.slice(1, 60), width: 300, x: 0, y: 0 },
      { text: text.slice(60, 120), width: 300, x: 0, y: 20 },
    ],
    lineHeight: 20,
  }),
}));
