import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import elementsJson from '../data/generated/elements.json';
import {
  SOCIAL_CARD_HEIGHT,
  SOCIAL_CARD_WIDTH,
  generateSocialCards,
  getElementSocialCardContent,
  type SocialCardManifest,
  type GeneratedSocialCards,
} from '../scripts/generate-social-card';
import { SITE_HOSTNAME } from '../src/lib/site';
import { ELEMENT_SOCIAL_CARD_VERSION, elementSocialImagePath } from '../src/lib/socialImages';
import type { ElementRecord } from '../src/lib/types';

const elements = elementsJson as ElementRecord[];
let outputRoot: string;
let generated: GeneratedSocialCards;

function expectValidSocialPng(card: Buffer, expectedColorType?: number): void {
  expect(card.length).toBeGreaterThan(10_000);
  expect(card.toString('ascii', 1, 4)).toBe('PNG');
  expect(card.readUInt32BE(16)).toBe(SOCIAL_CARD_WIDTH);
  expect(card.readUInt32BE(20)).toBe(SOCIAL_CARD_HEIGHT);
  expect(card.readUInt8(24)).toBe(8); // bit depth
  if (expectedColorType != null) expect(card.readUInt8(25)).toBe(expectedColorType);
  expect(card.readUInt8(26)).toBe(0); // standard compression
  expect(card.readUInt8(27)).toBe(0); // standard filter method
  expect(card.readUInt8(28)).toBe(0); // non-interlaced
}

beforeAll(() => {
  outputRoot = mkdtempSync(join(tmpdir(), 'atlas-social-cards-'));
  const stalePath = join(outputRoot, 'social', 'elements', 'v0', 'stale.png');
  mkdirSync(join(outputRoot, 'social', 'elements', 'v0'), { recursive: true });
  writeFileSync(stalePath, 'stale');
  generated = generateSocialCards({
    outputRoot,
    manifestPath: join(outputRoot, 'social-card-manifest.json'),
  });
}, 30_000);

afterAll(() => {
  rmSync(outputRoot, { recursive: true, force: true });
});

describe('social card generation', () => {
  test('uses a fresh v2 image cache key', () => {
    expect(ELEMENT_SOCIAL_CARD_VERSION).toBe('v2');
    expect(elementSocialImagePath('Pm')).toBe('/social/elements/v2/Pm.png');
  });

  test('writes exactly one valid, unique PNG for every element', () => {
    expect(generated.elementCardPaths).toHaveLength(118);
    expect(existsSync(join(outputRoot, 'social', 'elements', 'v0', 'stale.png'))).toBe(true);

    const cardDirectory = join(outputRoot, 'social', 'elements', ELEMENT_SOCIAL_CARD_VERSION);
    const filenames = readdirSync(cardDirectory).sort();
    const expectedFilenames = elements.map((element) => `${element.symbol}.png`).sort();
    expect(filenames).toEqual(expectedFilenames);

    const hashes = new Set<string>();
    for (const element of elements) {
      const path = join(outputRoot, elementSocialImagePath(element.symbol).slice(1));
      const card = readFileSync(path);
      expectValidSocialPng(card, 2); // truecolour RGB, no alpha channel
      hashes.add(createHash('sha256').update(card).digest('hex'));
    }
    expect(hashes.size).toBe(118);
  });

  test('records exact immutable hashes for each symbol without deleting earlier versions', () => {
    const manifest = JSON.parse(readFileSync(generated.manifestPath, 'utf8')) as SocialCardManifest;
    const version = manifest.versions[ELEMENT_SOCIAL_CARD_VERSION];
    expect(manifest.schemaVersion).toBe(1);
    expect(Object.keys(version.elementCardSha256)).toHaveLength(118);

    for (const element of elements) {
      const card = readFileSync(join(outputRoot, elementSocialImagePath(element.symbol).slice(1)));
      expect(version.elementCardSha256[element.symbol]).toBe(createHash('sha256').update(card).digest('hex'));
    }
  });

  test('refuses to overwrite an immutable version when its manifest differs', () => {
    const manifest = JSON.parse(readFileSync(generated.manifestPath, 'utf8')) as SocialCardManifest;
    manifest.versions[ELEMENT_SOCIAL_CARD_VERSION].elementCardSha256.H = '0'.repeat(64);
    const mismatchManifestPath = join(outputRoot, 'mismatch-manifest.json');
    writeFileSync(mismatchManifestPath, `${JSON.stringify(manifest)}\n`);

    expect(() => generateSocialCards({
      outputRoot: join(outputRoot, 'mismatch-output'),
      manifestPath: mismatchManifestPath,
    })).toThrow(`bump ELEMENT_SOCIAL_CARD_VERSION`);
  }, 30_000);

  test('derives every rendered field and URL from the element record and shared site origin', () => {
    for (const element of elements) {
      expect(getElementSocialCardContent(element)).toEqual({
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
      });
    }
  });

  test('preserves the generic Atlas fallback card', () => {
    expectValidSocialPng(readFileSync(generated.defaultCardPath));
  });
});
