/** License display helpers */

export function formatLicense(license: string): string {
  const map: Record<string, string> = {
    'CC BY-SA 4.0': 'CC BY-SA 4.0',
    'CC0 1.0': 'CC0 1.0',
    'public domain': 'Public Domain',
  };
  return map[license] ?? license;
}

export function licenseUrl(license: string): string | null {
  const urls: Record<string, string> = {
    'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
    'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  };
  return urls[license] ?? null;
}
