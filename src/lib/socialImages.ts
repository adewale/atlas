/**
 * Social networks cache preview images for long periods. Element-card PNGs are
 * committed and hash-locked in assets/social-cards/manifest.json. Bump this
 * value before intentionally changing their rendered design or content; the
 * generator retains prior version directories for previously shared URLs.
 */
export const ELEMENT_SOCIAL_CARD_VERSION = 'v1';

export function elementSocialImagePath(symbol: string): string {
  return `/social/elements/${ELEMENT_SOCIAL_CARD_VERSION}/${symbol}.png`;
}
