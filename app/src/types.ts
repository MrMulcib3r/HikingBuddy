// Datový model HikingBuddy — viz PRDRequirements/PRD-MVP.md (v5) v repozitáři.

export type UnitPreference = 'metric' | 'imperial';

export interface Category {
  id: string;
  name: string;
  order: number;
}

export const UNCATEGORIZED = 'Uncategorized';

/** Položka v Gear Vaultu (osobní databáze vybavení). FR-1. */
export interface GearItem {
  id: string;
  name: string;
  categoryId: string | null;
  /** Váha jedné jednotky, vždy v gramech (FR-3). */
  weightGrams: number;
  /** Výchozí množství při přidání do gearlistu. */
  defaultQuantity: number;
  note: string;
  order: number;
}

/**
 * Položka uvnitř gearlistu.
 *
 * `gearItemId` je odkaz na zdrojovou položku v Gear Vaultu. Dokud je
 * neprázdný, jde o "linked" položku: pole name/categoryName/weightGrams se
 * zrcadlí z Gear Vaultu při každé jeho editaci (FR-5, po potvrzení
 * uživatelem — Cancel / Create a copy / Continue).
 *
 * `gearItemId` se vynuluje (item se "odpojí"), pokud je zdrojová položka v
 * Gear Vaultu smazána, nebo pokud uživatel při editaci zvolí "Create a copy" —
 * od té chvíle je to nezávislá kopie se svými posledními hodnotami.
 *
 * `isWorn` a `isConsumable` jsou nezávislé příznaky vázané pouze na tento
 * konkrétní gearlist (FR-9/FR-10) — nikdy nejsou vlastností Gear Vault
 * položky a jejich přepnutí nikdy nezobrazuje potvrzovací dialog, protože
 * neovlivňuje žádný jiný gearlist.
 */
export interface GearListItem {
  id: string;
  gearItemId: string | null;
  name: string;
  categoryName: string;
  weightGrams: number;
  quantity: number;
  note: string;
  isWorn: boolean;
  isConsumable: boolean;
  order: number;
}

/** Zmrazená kopie obsahu gearlistu v okamžiku uložení (FR-6). Jeden snapshot na gearlist,
 * opakované uložení ten předchozí přepíše. */
export interface GearListSnapshot {
  savedAt: string;
  items: GearListItem[];
}

/** Gearlist je vždy editovatelný — žádný Draft/Finalized přepínač. Snapshot je jediný
 * mechanismus, jak si "zamrazit" stav pro cestu, aniž by to bránilo dalším úpravám. */
export interface GearList {
  id: string;
  name: string;
  createdAt: string;
  items: GearListItem[];
  snapshot: GearListSnapshot | null;
  order: number;
}

export interface WeightBreakdown {
  base: number;
  worn: number;
  consumable: number;
  total: number;
}

export interface AppState {
  categories: Category[];
  gearItems: GearItem[];
  gearLists: GearList[];
  unitPreference: UnitPreference;
}
