import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createCanvas } from 'canvas';

const WIDTH = 1200;
const HEIGHT = 630;
const PAPER = '#f7f2e8';
const BLUE = '#133e7c';
const RED = '#9e1c2c';
const MUSTARD = '#c59b1a';
const BLACK = '#171717';

const canvas = createCanvas(WIDTH, HEIGHT);
const context = canvas.getContext('2d');

context.fillStyle = PAPER;
context.fillRect(0, 0, WIDTH, HEIGHT);

// Byrne-inspired structural fields.
context.fillStyle = BLUE;
context.fillRect(0, 0, 42, HEIGHT);
context.fillStyle = RED;
context.fillRect(42, 0, 14, HEIGHT);
context.fillStyle = MUSTARD;
context.fillRect(56, 0, 8, HEIGHT);

context.fillStyle = BLACK;
context.fillRect(1050, 0, 150, 150);
context.fillStyle = MUSTARD;
context.fillRect(1074, 24, 102, 102);
context.fillStyle = PAPER;
context.font = '900 58px Georgia, serif';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText('118', 1125, 77);

context.textAlign = 'left';
context.textBaseline = 'alphabetic';
context.fillStyle = BLUE;
context.font = '900 154px Georgia, serif';
context.fillText('ATLAS', 102, 224);

context.fillStyle = BLACK;
context.font = '700 32px Arial, sans-serif';
context.fillText('THE PERIODIC TABLE AS A NAVIGABLE GRAPH', 108, 282);

context.fillStyle = RED;
context.fillRect(108, 310, 880, 8);
context.fillStyle = MUSTARD;
context.fillRect(988, 310, 102, 8);

// A compact periodic-table field: accurate 18-column silhouette, simplified
// to keep the card legible at social-preview sizes.
const occupied: Array<[number, number, string]> = [];
const rows: number[][] = [
  [1, 18],
  [1, 2, 13, 14, 15, 16, 17, 18],
  [1, 2, 13, 14, 15, 16, 17, 18],
  Array.from({ length: 18 }, (_, index) => index + 1),
  Array.from({ length: 18 }, (_, index) => index + 1),
  Array.from({ length: 18 }, (_, index) => index + 1),
  Array.from({ length: 18 }, (_, index) => index + 1),
];
for (let row = 0; row < rows.length; row += 1) {
  for (const column of rows[row]) {
    const block = column <= 2 ? 's' : column >= 13 ? 'p' : 'd';
    occupied.push([column - 1, row, block]);
  }
}

const CELL = 43;
const GAP = 5;
const startX = 108;
const startY = 355;
const blockColours: Record<string, string> = { s: BLUE, p: MUSTARD, d: RED };
for (const [column, row, block] of occupied) {
  const x = startX + column * (CELL + GAP);
  const y = startY + row * (CELL * 0.56 + GAP);
  context.fillStyle = blockColours[block];
  context.fillRect(x, y, CELL, CELL * 0.56);
}

context.strokeStyle = BLACK;
context.lineWidth = 2;
context.strokeRect(108, 342, 882, 226);

context.fillStyle = BLACK;
context.font = '700 19px Arial, sans-serif';
context.fillText('118 ELEMENTS  ·  18 GROUPS  ·  7 PERIODS  ·  ONE CONNECTED ATLAS', 108, 602);

const outputPath = resolve('public/social-card.png');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, canvas.toBuffer('image/png'));
console.log(`Generated ${outputPath} (${WIDTH}×${HEIGHT})`);
