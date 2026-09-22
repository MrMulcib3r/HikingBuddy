import type { UnitPreference } from '../types';

const GRAMS_PER_OUNCE = 28.349523125;
const GRAMS_PER_KG = 1000;
const OUNCES_PER_POUND = 16;

/** Formátuje váhu v gramech pro zobrazení podle preferované jednotkové soustavy (FR-3). */
export function formatWeight(grams: number, unit: UnitPreference): string {
  if (unit === 'metric') {
    if (Math.abs(grams) >= GRAMS_PER_KG) {
      return `${(grams / GRAMS_PER_KG).toFixed(2)} kg`;
    }
    return `${Math.round(grams)} g`;
  }
  const totalOunces = grams / GRAMS_PER_OUNCE;
  if (Math.abs(totalOunces) >= OUNCES_PER_POUND) {
    return `${(totalOunces / OUNCES_PER_POUND).toFixed(2)} lb`;
  }
  return `${totalOunces.toFixed(1)} oz`;
}

/** Krátká jednotka pro vstupní pole (uživatel zadává váhu jedné kusu v této jednotce). */
export function inputUnitLabel(unit: UnitPreference): string {
  return unit === 'metric' ? 'g' : 'oz';
}

/** Převede hodnotu zadanou uživatelem (ve zvolené jednotce) na gramy pro interní uložení. */
export function toGrams(value: number, unit: UnitPreference): number {
  return unit === 'metric' ? value : value * GRAMS_PER_OUNCE;
}

/** Převede interně uložené gramy na hodnotu ve zvolené jednotce (pro předvyplnění vstupu při editaci). */
export function fromGrams(grams: number, unit: UnitPreference): number {
  return unit === 'metric' ? grams : grams / GRAMS_PER_OUNCE;
}
