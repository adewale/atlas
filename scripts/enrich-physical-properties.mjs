/**
 * Enrichment script: adds density, melting point, boiling point, and half-life
 * to data/seed/elements.json.
 *
 * - Density (g/cm³), melting point (K), boiling point (K): from PubChem
 * - Half-life of longest-lived isotope (seconds): reference data (NUBASE2020)
 *   Stable elements use null (no observed decay).
 *
 * Run: node scripts/enrich-physical-properties.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// PubChem physical data (density g/cm³, melting point K, boiling point K)
// Source: https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON
// License: public domain
// ---------------------------------------------------------------------------
const PUBCHEM = {
  1: { density: 0.00008988, meltingPoint: 13.81, boilingPoint: 20.28 },
  2: { density: 0.0001785, meltingPoint: 0.95, boilingPoint: 4.22 },
  3: { density: 0.534, meltingPoint: 453.65, boilingPoint: 1615 },
  4: { density: 1.85, meltingPoint: 1560, boilingPoint: 2744 },
  5: { density: 2.37, meltingPoint: 2348, boilingPoint: 4273 },
  6: { density: 2.267, meltingPoint: 3823, boilingPoint: 4098 },
  7: { density: 0.0012506, meltingPoint: 63.15, boilingPoint: 77.36 },
  8: { density: 0.001429, meltingPoint: 54.36, boilingPoint: 90.2 },
  9: { density: 0.001696, meltingPoint: 53.53, boilingPoint: 85.03 },
  10: { density: 0.0008999, meltingPoint: 24.56, boilingPoint: 27.07 },
  11: { density: 0.97, meltingPoint: 370.95, boilingPoint: 1156 },
  12: { density: 1.74, meltingPoint: 923, boilingPoint: 1363 },
  13: { density: 2.70, meltingPoint: 933.437, boilingPoint: 2792 },
  14: { density: 2.3296, meltingPoint: 1687, boilingPoint: 3538 },
  15: { density: 1.82, meltingPoint: 317.3, boilingPoint: 553.65 },
  16: { density: 2.067, meltingPoint: 388.36, boilingPoint: 717.75 },
  17: { density: 0.003214, meltingPoint: 171.65, boilingPoint: 239.11 },
  18: { density: 0.0017837, meltingPoint: 83.8, boilingPoint: 87.3 },
  19: { density: 0.89, meltingPoint: 336.53, boilingPoint: 1032 },
  20: { density: 1.54, meltingPoint: 1115, boilingPoint: 1757 },
  21: { density: 2.99, meltingPoint: 1814, boilingPoint: 3109 },
  22: { density: 4.5, meltingPoint: 1941, boilingPoint: 3560 },
  23: { density: 6.0, meltingPoint: 2183, boilingPoint: 3680 },
  24: { density: 7.15, meltingPoint: 2180, boilingPoint: 2944 },
  25: { density: 7.3, meltingPoint: 1519, boilingPoint: 2334 },
  26: { density: 7.874, meltingPoint: 1811, boilingPoint: 3134 },
  27: { density: 8.86, meltingPoint: 1768, boilingPoint: 3200 },
  28: { density: 8.912, meltingPoint: 1728, boilingPoint: 3186 },
  29: { density: 8.933, meltingPoint: 1357.77, boilingPoint: 2835 },
  30: { density: 7.134, meltingPoint: 692.68, boilingPoint: 1180 },
  31: { density: 5.91, meltingPoint: 302.91, boilingPoint: 2477 },
  32: { density: 5.323, meltingPoint: 1211.4, boilingPoint: 3106 },
  33: { density: 5.776, meltingPoint: 1090, boilingPoint: 887 },
  34: { density: 4.809, meltingPoint: 493.65, boilingPoint: 958 },
  35: { density: 3.11, meltingPoint: 265.95, boilingPoint: 331.95 },
  36: { density: 0.003733, meltingPoint: 115.79, boilingPoint: 119.93 },
  37: { density: 1.53, meltingPoint: 312.46, boilingPoint: 961 },
  38: { density: 2.64, meltingPoint: 1050, boilingPoint: 1655 },
  39: { density: 4.47, meltingPoint: 1795, boilingPoint: 3618 },
  40: { density: 6.52, meltingPoint: 2128, boilingPoint: 4682 },
  41: { density: 8.57, meltingPoint: 2750, boilingPoint: 5017 },
  42: { density: 10.2, meltingPoint: 2896, boilingPoint: 4912 },
  43: { density: 11, meltingPoint: 2430, boilingPoint: 4538 },
  44: { density: 12.1, meltingPoint: 2607, boilingPoint: 4423 },
  45: { density: 12.4, meltingPoint: 2237, boilingPoint: 3968 },
  46: { density: 12.0, meltingPoint: 1828.05, boilingPoint: 3236 },
  47: { density: 10.501, meltingPoint: 1234.93, boilingPoint: 2435 },
  48: { density: 8.69, meltingPoint: 594.22, boilingPoint: 1040 },
  49: { density: 7.31, meltingPoint: 429.75, boilingPoint: 2345 },
  50: { density: 7.287, meltingPoint: 505.08, boilingPoint: 2875 },
  51: { density: 6.685, meltingPoint: 903.78, boilingPoint: 1860 },
  52: { density: 6.232, meltingPoint: 722.66, boilingPoint: 1261 },
  53: { density: 4.93, meltingPoint: 386.85, boilingPoint: 457.55 },
  54: { density: 0.005887, meltingPoint: 161.36, boilingPoint: 165.03 },
  55: { density: 1.93, meltingPoint: 301.59, boilingPoint: 944 },
  56: { density: 3.62, meltingPoint: 1000, boilingPoint: 2170 },
  57: { density: 6.15, meltingPoint: 1191, boilingPoint: 3737 },
  58: { density: 6.770, meltingPoint: 1071, boilingPoint: 3697 },
  59: { density: 6.77, meltingPoint: 1204, boilingPoint: 3793 },
  60: { density: 7.01, meltingPoint: 1294, boilingPoint: 3347 },
  61: { density: 7.26, meltingPoint: 1315, boilingPoint: 3273 },
  62: { density: 7.52, meltingPoint: 1347, boilingPoint: 2067 },
  63: { density: 5.24, meltingPoint: 1095, boilingPoint: 1802 },
  64: { density: 7.90, meltingPoint: 1586, boilingPoint: 3546 },
  65: { density: 8.23, meltingPoint: 1629, boilingPoint: 3503 },
  66: { density: 8.55, meltingPoint: 1685, boilingPoint: 2840 },
  67: { density: 8.80, meltingPoint: 1747, boilingPoint: 2973 },
  68: { density: 9.07, meltingPoint: 1802, boilingPoint: 3141 },
  69: { density: 9.32, meltingPoint: 1818, boilingPoint: 2223 },
  70: { density: 6.90, meltingPoint: 1092, boilingPoint: 1469 },
  71: { density: 9.84, meltingPoint: 1936, boilingPoint: 3675 },
  72: { density: 13.3, meltingPoint: 2506, boilingPoint: 4876 },
  73: { density: 16.4, meltingPoint: 3290, boilingPoint: 5731 },
  74: { density: 19.3, meltingPoint: 3695, boilingPoint: 5828 },
  75: { density: 20.8, meltingPoint: 3459, boilingPoint: 5869 },
  76: { density: 22.57, meltingPoint: 3306, boilingPoint: 5285 },
  77: { density: 22.42, meltingPoint: 2719, boilingPoint: 4701 },
  78: { density: 21.46, meltingPoint: 2041.55, boilingPoint: 4098 },
  79: { density: 19.282, meltingPoint: 1337.33, boilingPoint: 3129 },
  80: { density: 13.5336, meltingPoint: 234.32, boilingPoint: 629.88 },
  81: { density: 11.8, meltingPoint: 577, boilingPoint: 1746 },
  82: { density: 11.342, meltingPoint: 600.61, boilingPoint: 2022 },
  83: { density: 9.807, meltingPoint: 544.55, boilingPoint: 1837 },
  84: { density: 9.32, meltingPoint: 527, boilingPoint: 1235 },
  85: { density: 7, meltingPoint: 575, boilingPoint: null },
  86: { density: 0.00973, meltingPoint: 202, boilingPoint: 211.45 },
  87: { density: null, meltingPoint: 300, boilingPoint: null },
  88: { density: 5, meltingPoint: 973, boilingPoint: 1413 },
  89: { density: 10.07, meltingPoint: 1324, boilingPoint: 3471 },
  90: { density: 11.72, meltingPoint: 2023, boilingPoint: 5061 },
  91: { density: 15.37, meltingPoint: 1845, boilingPoint: null },
  92: { density: 18.95, meltingPoint: 1408, boilingPoint: 4404 },
  93: { density: 20.25, meltingPoint: 917, boilingPoint: 4175 },
  94: { density: 19.84, meltingPoint: 913, boilingPoint: 3501 },
  95: { density: 13.69, meltingPoint: 1449, boilingPoint: 2284 },
  96: { density: 13.51, meltingPoint: 1618, boilingPoint: 3400 },
  97: { density: 14, meltingPoint: 1323, boilingPoint: null },
  98: { density: null, meltingPoint: 1173, boilingPoint: null },
  99: { density: null, meltingPoint: 1133, boilingPoint: null },
  100: { density: null, meltingPoint: 1800, boilingPoint: null },
  101: { density: null, meltingPoint: 1100, boilingPoint: null },
  102: { density: null, meltingPoint: 1100, boilingPoint: null },
  103: { density: null, meltingPoint: 1900, boilingPoint: null },
  104: { density: null, meltingPoint: null, boilingPoint: null },
  105: { density: null, meltingPoint: null, boilingPoint: null },
  106: { density: null, meltingPoint: null, boilingPoint: null },
  107: { density: null, meltingPoint: null, boilingPoint: null },
  108: { density: null, meltingPoint: null, boilingPoint: null },
  109: { density: null, meltingPoint: null, boilingPoint: null },
  110: { density: null, meltingPoint: null, boilingPoint: null },
  111: { density: null, meltingPoint: null, boilingPoint: null },
  112: { density: null, meltingPoint: null, boilingPoint: null },
  113: { density: null, meltingPoint: null, boilingPoint: null },
  114: { density: null, meltingPoint: null, boilingPoint: null },
  115: { density: null, meltingPoint: null, boilingPoint: null },
  116: { density: null, meltingPoint: null, boilingPoint: null },
  117: { density: null, meltingPoint: null, boilingPoint: null },
  118: { density: null, meltingPoint: null, boilingPoint: null },
};

// ---------------------------------------------------------------------------
// Half-life data (longest-lived isotope, in seconds)
// null = stable (no radioactive decay observed)
// Sources: NUBASE2020, IAEA Nuclear Data Services
// ---------------------------------------------------------------------------
const HALF_LIFE = {
  // Stable elements
  H: null, He: null, Li: null, Be: null, B: null, C: null, N: null, O: null,
  F: null, Ne: null, Na: null, Mg: null, Al: null, Si: null, P: null, S: null,
  Cl: null, Ar: null, K: null, Ca: null, Sc: null, Ti: null, V: null, Cr: null,
  Mn: null, Fe: null, Co: null, Ni: null, Cu: null, Zn: null, Ga: null, Ge: null,
  As: null, Se: null, Br: null, Kr: null, Rb: null, Sr: null, Y: null, Zr: null,
  Nb: null, Mo: null, Ru: null, Rh: null, Pd: null, Ag: null, Cd: null, In: null,
  Sn: null, Sb: null, Te: null, I: null, Xe: null, Cs: null, Ba: null, La: null,
  Ce: null, Pr: null, Nd: null, Sm: null, Eu: null, Gd: null, Tb: null, Dy: null,
  Ho: null, Er: null, Tm: null, Yb: null, Lu: null, Hf: null, Ta: null, W: null,
  Re: null, Os: null, Ir: null, Pt: null, Au: null, Hg: null, Tl: null, Pb: null,
  Bi: null, Th: null, U: null,

  // Radioactive elements (longest-lived isotope, seconds)
  Tc: 1.3e14,     // Tc-97:  4.21e6 y
  Pm: 5.6e8,      // Pm-145: 17.7 y
  Po: 3.5e9,      // Po-209: ~125 y
  At: 2.9e4,      // At-210: 8.1 h
  Rn: 3.3e5,      // Rn-222: 3.82 d
  Fr: 1.3e3,      // Fr-223: 22 min
  Ra: 5.1e10,     // Ra-226: 1600 y
  Ac: 6.9e8,      // Ac-227: 21.77 y
  Pa: 1.0e12,     // Pa-231: 3.276e4 y
  Np: 6.8e13,     // Np-237: 2.144e6 y
  Pu: 2.5e15,     // Pu-244: 8.0e7 y
  Am: 2.3e11,     // Am-243: 7370 y
  Cm: 4.9e14,     // Cm-247: 1.56e7 y
  Bk: 4.4e10,     // Bk-247: 1380 y
  Cf: 2.8e10,     // Cf-251: 898 y
  Es: 3.5e7,      // Es-252: 1.293 y
  Fm: 8.7e6,      // Fm-257: 100.5 d
  Md: 4.4e6,      // Md-258: 51.5 d
  No: 1.7e3,      // No-259: 58 min
  Lr: 6.5e4,      // Lr-266: ~11 h
  Rf: 6.6e4,      // Rf-267: ~1.3 h
  Db: 1.1e5,      // Db-268: ~1.3 d
  Sg: 4.7e2,      // Sg-269: ~14 min
  Bh: 6.1e1,      // Bh-270: ~2 min
  Hs: 1.2e1,      // Hs-269: ~12 s
  Mt: 4.4e1,      // Mt-278: ~4 s
  Ds: 1.3e1,      // Ds-281: ~13 s
  Rg: 2.6e1,      // Rg-282: ~2 min
  Cn: 1.8e2,      // Cn-285: ~28 s
  Nh: 2.0e1,      // Nh-286: ~20 s
  Fl: 1.9,        // Fl-289: ~1.9 s
  Mc: 0.22,       // Mc-290: ~0.65 s
  Lv: 0.061,      // Lv-293: ~61 ms
  Ts: 0.051,      // Ts-294: ~51 ms
  Og: 0.0007,     // Og-294: ~0.7 ms
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const seedPath = join(process.cwd(), 'data', 'seed', 'elements.json');
const elements = JSON.parse(readFileSync(seedPath, 'utf-8'));

let enriched = 0;
for (const el of elements) {
  const pc = PUBCHEM[el.atomicNumber];
  el.density = pc?.density ?? null;
  el.meltingPoint = pc?.meltingPoint ?? null;
  el.boilingPoint = pc?.boilingPoint ?? null;
  el.halfLife = HALF_LIFE[el.symbol] ?? null;
  enriched++;
}

writeFileSync(seedPath, JSON.stringify(elements, null, 2));
console.log(`Enriched ${enriched} elements with density, melting/boiling point, half-life`);

const withDensity = elements.filter((e) => e.density != null).length;
const withMp = elements.filter((e) => e.meltingPoint != null).length;
const withBp = elements.filter((e) => e.boilingPoint != null).length;
const withHl = elements.filter((e) => e.halfLife != null).length;
console.log(`  density: ${withDensity}/118`);
console.log(`  meltingPoint: ${withMp}/118`);
console.log(`  boilingPoint: ${withBp}/118`);
console.log(`  halfLife: ${withHl}/118 (stable elements = null)`);
