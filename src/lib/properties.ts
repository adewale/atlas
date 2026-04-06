/**
 * Shared property definitions — single source of truth for the 7 numeric
 * element properties displayed across Compare, Folio rank rows, and
 * PropertyIndex pages.
 */

/** Numeric keys on ElementRecord that can be compared. */
export type NumericElementKey =
  | 'mass'
  | 'electronegativity'
  | 'ionizationEnergy'
  | 'radius'
  | 'density'
  | 'meltingPoint'
  | 'boilingPoint';

export type PropertyDef = {
  key: NumericElementKey;
  label: string;
  unit: string;
};

/** The 4 core properties shown in Folio rank rows. */
export const CORE_PROPERTIES: readonly PropertyDef[] = [
  { key: 'mass', label: 'Atomic Mass', unit: 'Da' },
  { key: 'electronegativity', label: 'Electronegativity', unit: '' },
  { key: 'ionizationEnergy', label: 'Ionisation Energy', unit: 'kJ/mol' },
  { key: 'radius', label: 'Atomic Radius', unit: 'pm' },
] as const;

/** All 7 numeric properties, including physical properties. */
export const ALL_PROPERTIES: readonly PropertyDef[] = [
  ...CORE_PROPERTIES,
  { key: 'density', label: 'Density', unit: 'g/cm³' },
  { key: 'meltingPoint', label: 'Melting Point', unit: 'K' },
  { key: 'boilingPoint', label: 'Boiling Point', unit: 'K' },
] as const;
