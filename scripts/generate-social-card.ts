import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCanvas, registerFont, type CanvasRenderingContext2D } from 'canvas';
import elementsJson from '../data/generated/elements.json';
import { SITE_HOSTNAME } from '../src/lib/site';
import { ELEMENT_SOCIAL_CARD_VERSION, elementSocialImagePath } from '../src/lib/socialImages';
import type { ElementRecord } from '../src/lib/types';

export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;

const PAPER = '#f7f2e8';
const BLUE = '#133e7c';
const RED = '#9e1c2c';
const MUSTARD = '#c59b1a';
const BLACK = '#171717';
const SOCIAL_SANS = '"Atlas Social Sans"';
const SOCIAL_SERIF = '"Atlas Social Serif"';
const elements = [...(elementsJson as ElementRecord[])].sort((a, b) => a.atomicNumber - b.atomicNumber);

const socialCardFonts = [
  {
    path: resolve('assets', 'social-cards', 'fonts', 'SourceSans3-Bold.ttf'),
    family: 'Atlas Social Sans',
    weight: '700',
    sha256: '9214b9d95e4231c609802815c2646c98174e2102d0d37f88978a7f8e71006e6a',
  },
  {
    path: resolve('assets', 'social-cards', 'fonts', 'SourceSans3-Black.ttf'),
    family: 'Atlas Social Sans',
    weight: '900',
    sha256: 'ac3a8e48c6076b8dd800bdd6e69f20321ee039fa81aeca57ca630afd6d514d07',
  },
  {
    path: resolve('assets', 'social-cards', 'fonts', 'SourceSerif4-Black.ttf'),
    family: 'Atlas Social Serif',
    weight: '900',
    sha256: '9e99d6a487c6f4fab39c119b763d41cb2d849284521ce91620cb6286b58f97e6',
  },
] as const;

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function registerSocialCardFonts(): void {
  for (const font of socialCardFonts) {
    const actualHash = sha256(readFileSync(font.path));
    if (actualHash !== font.sha256) {
      throw new Error(`Social-card font checksum mismatch: ${font.path}`);
    }
    registerFont(font.path, { family: font.family, weight: font.weight });
  }
}

registerSocialCardFonts();

const blockColours: Record<ElementRecord['block'], string> = {
  s: BLUE,
  p: MUSTARD,
  d: RED,
  f: BLACK,
};

const blockTextColours: Record<ElementRecord['block'], string> = {
  s: PAPER,
  p: BLACK,
  d: PAPER,
  f: PAPER,
};

function createCard(opaque = false) {
  const canvas = createCanvas(SOCIAL_CARD_WIDTH, SOCIAL_CARD_HEIGHT);
  // Element cards are fully opaque. Encoding them as RGB removes an
  // unnecessary alpha channel and keeps the assets on the most conservative
  // social-media image-processing path.
  const context = opaque ? canvas.getContext('2d', { alpha: false }) : canvas.getContext('2d');
  context.fillStyle = PAPER;
  context.fillRect(0, 0, SOCIAL_CARD_WIDTH, SOCIAL_CARD_HEIGHT);
  return { canvas, context };
}

function drawAtlasBars(context: CanvasRenderingContext2D): void {
  context.fillStyle = BLUE;
  context.fillRect(0, 0, 42, SOCIAL_CARD_HEIGHT);
  context.fillStyle = RED;
  context.fillRect(42, 0, 14, SOCIAL_CARD_HEIGHT);
  context.fillStyle = MUSTARD;
  context.fillRect(56, 0, 8, SOCIAL_CARD_HEIGHT);
}

function fittedFont(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
  maximumSize: number,
  minimumSize: number,
  weight: number,
  family: string,
): string {
  let size = maximumSize;
  while (size > minimumSize) {
    const font = `${weight} ${size}px ${family}`;
    context.font = font;
    if (context.measureText(text).width <= maximumWidth) return font;
    size -= 2;
  }
  const minimumFont = `${weight} ${minimumSize}px ${family}`;
  context.font = minimumFont;
  if (context.measureText(text).width > maximumWidth) {
    throw new Error(`Social-card text does not fit its layout: ${text}`);
  }
  return minimumFont;
}

function drawMetric(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  maximumWidth: number,
): void {
  context.fillStyle = BLACK;
  context.font = `700 17px ${SOCIAL_SANS}`;
  context.fillText(label, x, y);
  context.fillStyle = BLUE;
  context.font = fittedFont(context, value, maximumWidth, 30, 16, 900, SOCIAL_SANS);
  context.fillText(value, x, y + 34);
}

export function renderDefaultSocialCard(): Buffer {
  const { canvas, context } = createCard();
  drawAtlasBars(context);

  // Byrne-inspired structural fields.
  context.fillStyle = BLACK;
  context.fillRect(1050, 0, 150, 150);
  context.fillStyle = MUSTARD;
  context.fillRect(1074, 24, 102, 102);
  context.fillStyle = PAPER;
  context.font = `900 58px ${SOCIAL_SERIF}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('118', 1125, 77);

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = BLUE;
  context.font = `900 154px ${SOCIAL_SERIF}`;
  context.fillText('ATLAS', 102, 224);

  context.fillStyle = BLACK;
  context.font = `700 32px ${SOCIAL_SANS}`;
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

  const cell = 43;
  const gap = 5;
  const startX = 108;
  const startY = 355;
  const compactBlockColours: Record<string, string> = { s: BLUE, p: MUSTARD, d: RED };
  for (const [column, row, block] of occupied) {
    const x = startX + column * (cell + gap);
    const y = startY + row * (cell * 0.56 + gap);
    context.fillStyle = compactBlockColours[block];
    context.fillRect(x, y, cell, cell * 0.56);
  }

  context.strokeStyle = BLACK;
  context.lineWidth = 2;
  context.strokeRect(108, 342, 882, 226);

  context.fillStyle = BLACK;
  context.font = `700 19px ${SOCIAL_SANS}`;
  context.fillText('118 ELEMENTS  ·  18 GROUPS  ·  7 PERIODS  ·  ONE CONNECTED ATLAS', 108, 602);

  return canvas.toBuffer('image/png');
}

export type ElementSocialCardContent = {
  atomicNumber: string;
  ordinal: string;
  symbol: string;
  name: string;
  mass: string;
  block: string;
  category: string;
  period: string;
  group: string;
  phase: string;
  url: string;
};

export function getElementSocialCardContent(element: ElementRecord): ElementSocialCardContent {
  return {
    atomicNumber: String(element.atomicNumber),
    ordinal: `ELEMENT ${String(element.atomicNumber).padStart(3, '0')} OF 118`,
    symbol: element.symbol,
    name: element.name,
    mass: `${element.mass} Da`,
    block: `${element.block.toUpperCase()} BLOCK`,
    category: element.category.toUpperCase(),
    period: String(element.period),
    group: element.group == null ? '—' : String(element.group),
    phase: element.phase.toUpperCase(),
    url: `${SITE_HOSTNAME}/elements/${element.symbol}`,
  };
}

export function renderElementSocialCard(element: ElementRecord): Buffer {
  const { canvas, context } = createCard(true);
  drawAtlasBars(context);
  const content = getElementSocialCardContent(element);

  const panelX = 108;
  const panelY = 70;
  const panelWidth = 410;
  const panelHeight = 474;
  const blockColour = blockColours[element.block];
  const blockTextColour = blockTextColours[element.block];

  context.fillStyle = blockColour;
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  context.strokeStyle = BLACK;
  context.lineWidth = 3;
  context.strokeRect(panelX, panelY, panelWidth, panelHeight);

  context.fillStyle = blockTextColour;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = `900 42px ${SOCIAL_SANS}`;
  context.fillText(content.atomicNumber, panelX + 28, panelY + 58);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = fittedFont(
    context,
    content.symbol,
    panelWidth - 52,
    244,
    170,
    900,
    SOCIAL_SERIF,
  );
  context.fillText(content.symbol, panelX + panelWidth / 2, panelY + panelHeight / 2 - 8);

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = `700 25px ${SOCIAL_SANS}`;
  context.fillText(content.mass, panelX + 28, panelY + panelHeight - 28);
  context.textAlign = 'right';
  context.fillText(content.block, panelX + panelWidth - 28, panelY + panelHeight - 28);

  const contentX = 570;
  const contentWidth = 568;
  context.textAlign = 'left';
  context.fillStyle = BLUE;
  context.font = `900 54px ${SOCIAL_SERIF}`;
  context.fillText('ATLAS', contentX, 116);

  context.fillStyle = BLACK;
  context.font = `700 18px ${SOCIAL_SANS}`;
  context.fillText(content.ordinal, contentX, 153);

  context.fillStyle = RED;
  context.fillRect(contentX, 174, contentWidth - 90, 7);
  context.fillStyle = MUSTARD;
  context.fillRect(contentX + contentWidth - 90, 174, 90, 7);

  context.fillStyle = BLACK;
  context.font = fittedFont(
    context,
    content.name,
    contentWidth,
    76,
    48,
    900,
    SOCIAL_SERIF,
  );
  context.fillText(content.name, contentX, 262);

  context.fillStyle = blockColour;
  context.font = fittedFont(
    context,
    content.category,
    contentWidth,
    30,
    22,
    700,
    SOCIAL_SANS,
  );
  context.fillText(content.category, contentX, 305);

  context.fillStyle = BLACK;
  context.fillRect(contentX, 329, contentWidth, 2);

  drawMetric(context, contentX, 369, 'PERIOD', content.period, 95);
  drawMetric(context, contentX + 135, 369, 'GROUP', content.group, 100);
  drawMetric(context, contentX + 270, 369, 'PHASE', content.phase, 298);

  context.fillStyle = BLACK;
  context.font = `700 19px ${SOCIAL_SANS}`;
  context.fillText('THE PERIODIC TABLE AS A NAVIGABLE GRAPH', contentX, 489);
  context.fillStyle = RED;
  context.fillRect(contentX, 510, contentWidth, 3);

  context.fillStyle = BLACK;
  context.font = `700 18px ${SOCIAL_SANS}`;
  context.fillText(content.url, contentX, 548);

  context.fillStyle = BLACK;
  context.font = `700 17px ${SOCIAL_SANS}`;
  context.fillText('118 ELEMENTS  ·  18 GROUPS  ·  7 PERIODS', 108, 602);

  return canvas.toBuffer('image/png');
}

export type GeneratedSocialCards = {
  defaultCardPath: string;
  elementCardPaths: string[];
  manifestPath: string;
  totalBytes: number;
};

export type SocialCardVersionManifest = {
  defaultCardSha256: string;
  elementCardSha256: Record<string, string>;
};

export type SocialCardManifest = {
  schemaVersion: 1;
  versions: Record<string, SocialCardVersionManifest>;
};

export type GenerateSocialCardsOptions = {
  outputRoot?: string;
  manifestPath?: string;
};

function readManifest(manifestPath: string): SocialCardManifest {
  if (!existsSync(manifestPath)) return { schemaVersion: 1, versions: {} };
  const value = JSON.parse(readFileSync(manifestPath, 'utf8')) as Partial<SocialCardManifest>;
  if (value.schemaVersion !== 1 || value.versions == null || typeof value.versions !== 'object') {
    throw new Error(`Invalid social-card manifest: ${manifestPath}`);
  }
  return value as SocialCardManifest;
}

export function generateSocialCards(options: GenerateSocialCardsOptions = {}): GeneratedSocialCards {
  const outputRoot = options.outputRoot ?? resolve('public');
  const manifestPath = options.manifestPath ?? resolve('assets', 'social-cards', 'manifest.json');
  if (elements.length !== 118) {
    throw new Error(`Expected 118 elements, received ${elements.length}.`);
  }

  const symbols = new Set(elements.map((element) => element.symbol));
  if (symbols.size !== elements.length) {
    throw new Error('Element symbols must be unique before social cards can be generated.');
  }
  for (const [index, element] of elements.entries()) {
    if (element.atomicNumber !== index + 1) {
      throw new Error(`Expected atomic number ${index + 1}, received ${element.atomicNumber}.`);
    }
  }

  const defaultCardPath = resolve(outputRoot, 'social-card.png');
  const defaultCard = renderDefaultSocialCard();
  const elementCardsRoot = resolve(outputRoot, 'social', 'elements');
  const currentVersionRoot = resolve(elementCardsRoot, ELEMENT_SOCIAL_CARD_VERSION);
  const stagingRoot = resolve(elementCardsRoot, `.${ELEMENT_SOCIAL_CARD_VERSION}-${process.pid}`);
  rmSync(stagingRoot, { recursive: true, force: true });

  const elementCardPaths: string[] = [];
  const elementCardSha256: Record<string, string> = {};
  let totalBytes = defaultCard.byteLength;
  try {
    for (const element of elements) {
      if (!/^[A-Z][a-z]?$/.test(element.symbol)) {
        throw new Error(`Cannot create a safe element card path for symbol ${element.symbol}.`);
      }
      const relativePath = elementSocialImagePath(element.symbol);
      const stagingPath = resolve(stagingRoot, `${element.symbol}.png`);
      const outputPath = resolve(outputRoot, relativePath.slice(1));
      const card = renderElementSocialCard(element);
      mkdirSync(dirname(stagingPath), { recursive: true });
      writeFileSync(stagingPath, card);
      elementCardPaths.push(outputPath);
      elementCardSha256[element.symbol] = sha256(card);
      totalBytes += card.byteLength;
    }

    const versionManifest: SocialCardVersionManifest = {
      defaultCardSha256: sha256(defaultCard),
      elementCardSha256,
    };
    const manifest = readManifest(manifestPath);
    const existingVersion = manifest.versions[ELEMENT_SOCIAL_CARD_VERSION];
    if (existingVersion && JSON.stringify(existingVersion) !== JSON.stringify(versionManifest)) {
      throw new Error(
        `Social-card output changed for immutable ${ELEMENT_SOCIAL_CARD_VERSION}; bump ELEMENT_SOCIAL_CARD_VERSION before regenerating.`,
      );
    }

    mkdirSync(dirname(defaultCardPath), { recursive: true });
    writeFileSync(defaultCardPath, defaultCard);
    mkdirSync(elementCardsRoot, { recursive: true });
    rmSync(currentVersionRoot, { recursive: true, force: true });
    renameSync(stagingRoot, currentVersionRoot);

    if (!existingVersion) {
      manifest.versions[ELEMENT_SOCIAL_CARD_VERSION] = versionManifest;
      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }

  return { defaultCardPath, elementCardPaths, manifestPath, totalBytes };
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (entrypoint === import.meta.url) {
  const result = generateSocialCards();
  console.log(
    `Generated ${result.elementCardPaths.length} element social cards and the Atlas fallback card (${(result.totalBytes / 1024 / 1024).toFixed(1)} MiB).`,
  );
}
