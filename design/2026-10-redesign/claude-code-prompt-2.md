Druhé kolo redesignu: zapracuj design system v2. Jde o úpravy po mém testu první implementace. Chování appky se nemění, s výjimkou bodu 2, kde zmizí duplicitní dlaždice s váhami.

## Podklady
- `design/2026-10-redesign/README.md`, sekce 5: co a proč se mění
- `design/2026-10-redesign/design-system/`: aktualizovaný README, `components/bundle.js` (nová verze `HB.backpack`), `components/bundle.css` a README komponent BackpackChart, IconButton, Button, GearlistItemRow, VaultItemRow, Badge, AppShell
- `design-system/screenshots/`: nové AppShell.png, BackpackChart.png, GearlistItemRow.png, Button.png (písmo na nich je náhradní)

Nejdřív mi napiš krátký plán a počkej na moje OK.

## Změny
1. **Hlavička panelu Gearlists:** „GEARLISTS“ ve stylu „GEAR VAULT“, vpravo ikonové tlačítko + (New gearlist). Pod ní řádek s názvem gearlistu a přepínačem (chevron) a vpravo akce gearlistu: Snapshot, Share, Template jako tlačítko s ikonou a textem (`hb-btn--secondary hb-btn--sm`), Delete jako ikona koše.
2. **Odstraň čtyři dlaždice s váhami (WeightSummary) z gearlistu, šablony i sdílené stránky.** Rozpad pod batohem dostane poslední řádek **Total** (ikona `mountain`, tučně) = v batohu + worn.
3. **BackpackChart v2:** přepiš podle nové `HB.backpack` v `bundle.js`:
   - větší graf (až 480 px, viewBox 0 0 340 280),
   - minimální výška vrstvy přes `layerHeights` (ostatní vrstvy se proporčně zmenší),
   - procento u každé kategorie: uvnitř vrstvy, nebo u tenkých vrstev venku vpravo s odkazovou čárou; popisky se nepřekrývají,
   - odstraň eliptickou čáru víka,
   - procenta se kreslí nad obrysem kapsy,
   - zvýraznění při najetí myší funguje i pro venkovní popisky.
4. **Ikony vs. text:**
   - Jen ikona zůstává u +, koše, × a kopírování.
   - Export a Import v hlavičce mají ikonu + text.
   - Ovládání datového souboru (Connect, Reconnect, Disconnect) má vždy text.
   - Štítek „použito v gearlistech“ ve Vaultu je karabina + text „N lists“.
5. **Hlavička sloupců v gearlistu** (`hb-list-head`) nad první kategorií: Item, Worn, Cons., Weight, Qty, Total. Sloupce musí lícovat s řádky. Pod 560 px se skryje.

## Pravidla
Stejná jako v `claude-code-prompt.md`: nesahat na datový model ani storage, texty UI anglicky, každý commit samostatně, `npm run build` a `npm run lint` musí projít.

## Ověření a záznam
- Playwright screenshoty s mými reálnými kategoriemi (včetně malých jako Water system 2 % a Hygiene 1 %) i s demo daty, desktop 1440 px a telefon 390 px. Ulož do `design/2026-10-redesign/implemented/v2/`.
- Zkontroluj, že se na každou vrstvu dá najet myší a že se popisky nepřekrývají.
- PRD: drobná aktualizace FR-19 (bez dlaždic vah, Total v rozpadu, procenta u všech kategorií, pravidlo ikona vs. text), nová verze a záznam do historie.
- Zápis do `build-status.md` a česky shrnutí pro mě.
