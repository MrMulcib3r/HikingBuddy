// Datový model HikingBuddy — viz PRDRequirements/PRD-MVP.md (v4) v repozitáři.

export type WeightType = 'base' | 'worn' | 'consumable';

export const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  base: 'Base Weight',
  worn: 'Worn Weight',
  consumable: 'Consumable',
};

export type UnitPreference = 'metric' | 'imperial';

export interface Category {
  id: string;
  name: string;
}

export const UNCATEGORIZED = 'Uncategorized';

/** Položka v Gear Vaultu (osobní databáze vybavení). FR-1, FR-9. */
export interface GearItem {
  id: string;
  name: string;
  categoryId: string | null;
  weightType: WeightType;
  /** Váha jedné jednotky, vždy v gramech (FR-3). */
  weightGrams: number;
  /** Výchozí množství při přidání do gearlistu. */
  defaultQuantity: number;
  note: string;
}

export type GearListStatus = 'draft' | 'finalized';

/**
 * Položka uvnitř gearlistu.
 *
 * `gearItemId` je odkaz na zdrojovou položku v Gear Vaultu. Dokud je
 * neprázdný, jde o "linked" položku: pole name/categoryName/weightGrams se
 * zrcadlí z Gear Vaultu při každé jeho editaci (FR-5, po potvrzení
 * uživatelem). `weightType` a `quantity` jdou nastavit per-list nezávisle
 * (FR-9 override).
 *
 * Jakmile se gearlist finalizuje (FR-6), `gearItemId` se nastaví na `null`
 * u všech položek — od té chvíle jsou to nezávislé zmrazené kopie a Gear
 * Vault na ně nemá žádný vliv. Stejně tak se `gearItemId` vynuluje, pokud je
 * zdrojová položka v Gear Vaultu smazána (item se "odpojí", ale zůstane v
 * gearlistu se svými posledními známými hodnotami).
 */
export interface GearListItem {
  id: string;
  gearItemId: string | null;
  name: string;
  categoryName: string;
  weightGrams: number;
  /** Efektivní typ váhy použitý pro výpočty (override, nebo zrcadlo z Vaultu). */
  weightType: WeightType;
  /** Explicitní override typu váhy pro tento konkrétní gearlist (FR-9). Null = použij hodnotu z Vaultu (jen u linked položek). */
  weightTypeOverride: WeightType | null;
  quantity: number;
  note: string;
}

export interface GearListBase {
  id: string;
  name: string;
  createdAt: string;
}

export interface DraftGearList extends GearListBase {
  status: 'draft';
  items: GearListItem[];
}

export interface FinalizedGearList extends GearListBase {
  status: 'finalized';
  items: GearListItem[];
  finalizedAt: string;
}

export type GearList = DraftGearList | FinalizedGearList;

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
