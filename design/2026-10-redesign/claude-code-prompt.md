Implementuj nový vzhled HikingBuddy podle hotového design systému (PRD FR-19). Jde o redesign vzhledu, chování appky se měnit nesmí.

## Podklady (přečti si je celé, než začneš)
- `CLAUDE.md`, `PRDRequirements/PRD-MVP.md`, `PRDRequirements/build-status.md`
- `design/2026-10-redesign/README.md`: inventura současného UI a moje rozhodnutí z 2026-10-12
- `design/2026-10-redesign/design-system/README.md`: hlavní pravidla vzhledu. Sekce „For Claude Code“ mapuje staré části appky na nové komponenty.
- `design-system/tokens.json` a `tokens.css`: barvy, písma, rozestupy, zaoblení, stíny
- `design-system/components/<Komponenta>/README.md`: pravidla pro každou komponentu. `preview.html` je ukázkové HTML.
- `design-system/components/bundle.css` a `bundle.js`: referenční implementace (CSS třídy `hb-…`, vlastní ikony, vizualizace batohem `HB.backpack`). Slouží jako předloha. Přepiš ji do React/TS komponent, nekopíruj ji do appky tak, jak je.
- `design-system/screenshots/`: jak to má vypadat (desktop + `AppShell-phone.png`). Pozor: screenshoty jsou s náhradním písmem, skutečná písma jsou Barlow Condensed a Overpass.
- `design-system/assets/`: SVG ikony (pohorka, karabina, hiker, logo) a ilustrace krajiny na pozadí

## Nejdřív plán, pak práce
Než cokoli změníš, napiš mi česky krátký plán po krocích a seznam nejasností nebo rozporů s PRD. Počkej na moje OK.

## Pevná pravidla
- **Chování se nemění:** inline editace (Enter/blur uloží, Escape zruší), blokující 3-cestný dialog, Worn/Consumable na řádku gearlistu bez dialogu, snapshot, drag & drop, sdílení, datový soubor, demo data. Měníš jen vzhled a text tlačítek za ikony podle design systému.
- **Datový model se nemění:** nesahej na `src/types.ts`, `src/storage.ts`, `STORAGE_KEY` ani `CURRENT_SCHEMA_VERSION`. Barvy kategorií se neukládají, ale odvozují:
  - výchozí kategorie podle svého id (`cat-backpack` → `--cat-backpack` atd.),
  - vlastní kategorie podle pořadí mezi vlastními kategoriemi → `--cat-custom-1` až `4`, pak znovu od začátku.
- Texty v UI zůstávají anglicky. Každé tlačítko jen s ikonou má `aria-label` a tooltip se stejným textem.
- Ikony: Lucide (už je v projektu jako `lucide-react`), Consumable = `Utensils`, Food zůstává `Apple`. Vlastní ikony (Boot pro Worn, Carabiner, Hiker, logo) udělej jako React komponenty v `src/components/icons/`.
- Batoh: tvar „rounded“ (A) z `bundle.js`, nahoře v panelu gearlistu, v batohu jen Base + Consumables, nejtěžší kategorie dole. Pod batohem rozpad Base / Consumables / Worn. Zobrazuje se u gearlistu, šablony i na sdílené stránce.
- Responzivita a dotyk podle sekce „Screen sizes and touch“ v README: pod 900 px se panely skládají pod sebe, pod 560 px se řádky zalamují. Na dotykových zařízeních nic neschovávat za hover a cíle mají aspoň 44 px. Samostatná mobilní verze je mimo scope.
- Žádné osobní data do gitu. Když něco v design systému odporuje PRD nebo chování, zeptej se mě.

## Postup (po každém kroku commit, `npm run build` musí projít)
1. **PRD v21:** propiš rozhodnutí FR-19 z `design/2026-10-redesign/README.md`: světlé téma, batoh tvar A nahoře v gearlistu, Base + Consumables v batohu, Worn zvlášť, nejtěžší dole, ikony místo textu s tooltipy, krajina v pozadí, minimum pro malé obrazovky a dotyk. Přidej záznam do historie a do sekce 8 „Rozhodnutí“.
2. **Základ:** tokeny jako CSS proměnné v `index.css`, písma Barlow Condensed + Overpass z Google Fonts v `index.html`. V `App.css` nesmí zůstat žádná natvrdo napsaná barva, velikost písma ani zaoblení, jen `var(--…)`.
3. **Ikony:** vlastní ikonové komponenty a mapa akcí podle README (camera, images, signpost, map, trash-2, copy-plus…).
4. **Základní prvky:** tlačítka, ikonová tlačítka s tooltipem, inline pole, inputy a hledání, přepínač jednotek, dlaždice kategorií, štítky, bannery, dialogy.
5. **Panely a řádky:** Gear Vault (nadpisy kategorií s barevnou tečkou, řádky, „Add item“, tlačítko „Add gear“) a gearlist (řádky s ikonovými přepínači Worn/Consumable, souhrn vah).
6. **BackpackChart.tsx:** port `HB.backpack` včetně zvýraznění při najetí myší, legendy a rozpadu vah. Použij ho v gearlistu, šabloně a na sdílené stránce.
7. **Rám appky:** hlavička s logem, krajina na pozadí, rozložení panelů. Sdílená stránka (FR-18) ve stejném stylu.
8. **Ověření:** `npm run build` a `npm run lint`. Pak Playwright screenshoty s demo daty: desktop 1440 px a telefon 390 px. Hlavní obrazovka, gearlist s batohem, 3-cestný dialog, formulář „Add item“, sdílená stránka. Ulož je do `design/2026-10-redesign/implemented/` a porovnej se `screenshots/`. Proklikej, že chování funguje jako dřív: inline editace včetně Escape, 3-cestný dialog, Worn/Consumable bez dialogu, drag & drop z Vaultu, snapshot, share link.
9. **Záznam:** zápis do `build-status.md`, aktualizace `BACKLOG.md` (FR-19 hotovo, čeká na můj test). Na konci mi česky shrň, co se změnilo, co jsi ověřil, co se nepovedlo a jak si to mám vyzkoušet.
