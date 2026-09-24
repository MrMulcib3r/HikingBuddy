# HikingBuddy – Backlog

Jedno místo pro všechno, co je potřeba udělat, opravit nebo promyslet. Píše sem Martin (PM) a Claude Code podle něj pracuje.

---

## Jak sem psát (pro Martina)

**1. Nové věci piš vždy do sekce 📥 Inbox, na konec.** Nemusíš je třídit hned, hlavně je zachyť, než je zapomeneš.

**2. Jedna položka = jeden řádek v tomto formátu:**

```
- [ ] [TYP] Krátký název – co se děje / co chci (datum)
```

**3. Typ položky:**

| Typ         | Kdy                                                       | Příklad                                                                                                |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `[BUG]`     | Něco nefunguje, jak má                                    | `[BUG] Smazání kategorie – položky zmizí i z gearlistu (2026-09-24)`                                   |
| `[CR]`      | Change Request, drobná úprava aplikace, která není chybou | `[CR] When updating gear items in a gearlist(-s) the user needs to know which gear lists are affected. |
| `[UI]`      | Funguje to, ale vypadá nebo se ovládá špatně              | `[UI] Save snapshot – tlačítko je moc schované, chci ho vedle názvu gearlistu`                         |
| `[FEATURE]` | Nová schopnost appky                                      | `[FEATURE] Export gearlistu do PDF pro tisk`                                                           |
| `[VISION]`  | Větší směr produktu, ne úkol na hned                      | `[VISION] Appka hlídá i množství jídla podle počtu dní treku`                                          |

**4. Dobrá položka:**
- **Bug:** co jsi udělal → co se stalo → co jsi čekal. Screenshot ulož do složky `design/` a odkaž na něj.
- **UI:** konkrétně, ne „hezčí“, ale třeba „váhy zarovnat doprava, součty tučně“. Screenshot nebo náčrt do `design/`.
- **Feature:** hlavně **proč** (jaký problém řeší), ne jen co.
- Když položka potřebuje delší popis, odsaď ho pod ni jako podbody.

**5. Třídění (jednou za čas, třeba před prací s Claude Code):** položky z Inboxu přesuň do:
- **🔴 Teď:** děláme jako další, seřazené podle priority (nahoře = první)
- **🟡 Brzy:** chceme, ale ne hned
- **⚪ Někdy:** dobrý nápad, bez termínu
- **🔭 Vize:** velké směry, řešíme v Coworku a v PRD, ne rovnou v kódu

Co nedává smysl, klidně smaž.

**6. Práce s Claude Code:** stačí napsat „Pusť se do první položky v sekci Teď“ nebo „Oprav všechny bugy v sekci Teď, jeden po druhém“.

---

## Instrukce pro Claude Code

- Pracuj **jen na položkách, které Martin zadá**, nebo na položkách ze sekce **🔴 Teď** v pořadí shora. Neměň pořadí ani priority, to je rozhodnutí PM.
- Položky `[VISION]` **neimplementuj**. Když se na ně Martin zeptá, doporuč nejdřív je rozpracovat v PRD.
- U `[FEATURE]` a větších `[UI]` nejdřív stručně česky popiš navrhované řešení a počkej na Martinův souhlas.
- Když je položka nejasná, zeptej se. Nehádej.
- **Po dokončení položky:**
  1. ověř ji (`npm run build` + vyzkoušení v appce),
  2. commitni,
  3. zaškrtni ji `[x]`, přesuň do sekce ✅ Hotovo a doplň datum dokončení,
  4. zapiš ji do `PRDRequirements/build-status.md`,
  5. pokud se změnilo chování appky, uprav i PRD.
- Když při práci narazíš na jiný problém, **neopravuj ho potichu**. Přidej ho do 📥 Inbox s poznámkou `(našel Claude)` a řekni o něm Martinovi.

---
Template (nemazat): - [TYP] Krátký název – co se děje / co chci (datum)

## 📥 Inbox

- [ ] [FEATURE] Automatické testy – přidat do projektu sadu testů, které po každé změně ověří klíčová pravidla z PRD (dialog Cancel/Copy/Continue, žádné duplicitní řádky, snapshot…). Proč: dnes se vše ověřuje ručně a chyba se může vloudit nepozorovaně. (2026-09-23, navrhl Claude)
- [ ] [FEATURE] Nasazení na hosting (Vercel/Netlify) – appka dostupná přes odkaz i z mobilu, bez spouštění na počítači. Proč: testování v reálu a sdílení s lidmi pro feedback. (2026-09-23, navrhl Claude)
- [ ] [FEATURE] Lokální auto-save do souboru na disku (File System Access API) – appka by si jednou vybrala složku a pak do ní automaticky ukládala zálohu při každé změně, bez nutnosti ručně klikat na Export. Proč: dnešní Export/Import (viz Hotovo, 2026-09-24) vyžaduje, aby si na to Martin sám vzpomněl – tohle by bylo bez námahy. Viz PRD sekce 6a, bod 1. (2026-09-24, navrhl Claude)
- [ ] [FEATURE] Skutečná databáze na serveru – appka s účtem, data uložená na serveru místo jen v prohlížeči. Proč: jediné řešení bez ručních kroků a zároveň technický základ pro sync mezi zařízeními (PRD sekce 7, bod 2) i komunitní sdílení (PRD sekce 9). Větší krok, dává smysl řešit až s těmito featurami, ne samostatně kvůli záloze. Viz PRD sekce 6a, bod 2. (2026-09-24, navrhl Claude)
- [ ] - [CR] When updating gear items in a gearlist(-s) the user needs to know which gear lists are affected. (24.9.2026)
![[Pasted image 20260924165604.png|376]]
- [ ] - [BUG] Categories cannot be edited. It should be possible to edit all categories including the template one. (24.9.2026)
![[Pasted image 20260924170230.png|360]]
- [Bug] When creating new item and clicking out of the dialogue window whole window is closed. (24.9.2026)
![[Pasted image 20260924174122.png|361]]

- [CR] Rename Shelter to "Shelter system" (24.9.2026).

## 🔴 Teď

_(prázdné: přesuň sem, co se má dělat jako další)_

## 🟡 Brzy

## ⚪ Někdy

- [ ] [FEATURE] Gearlist Template – nový gearlist předvyplněný ze šablony opakovaně používaného vybavení. Viz PRD sekce 7, bod 5 (obsahuje i otevřené otázky).
- [ ] [FEATURE] Víc snapshotů na gearlist (historie). Viz PRD sekce 7, bod 6.
- [ ] [FEATURE] Koláčový graf rozložení váhy podle kategorie. Viz PRD sekce 7, bod 4.
- [ ] [FEATURE] Offline PWA (instalace na telefon, přístup bez signálu). Viz PRD sekce 7, bod 1.
- [ ] [FEATURE] Přihlašování a synchronizace mezi zařízeními. Viz PRD sekce 7, bod 2.
- [ ] [FEATURE] Veřejné sdílení gearlistu přes URL. Viz PRD sekce 7, bod 3.

## 🔭 Vize

- [ ] [VISION] Komunitní sdílení gearlistů + monetizace. Viz PRD sekce 9 (otevřené otázky).

## ✅ Hotovo

- [x] Smazán prázdný soubor `WeightTypeToggle.tsx` (2026-09-23)
- [x] `.obsidian/` přidáno do `.gitignore` (2026-09-23)
- [x] [BUG] Data appky nebyla ničím chráněná – smazání dat prohlížeče by appku vynulovalo, a přechod na v7 tohle skoro způsobil omylem (stará data zůstala "neviditelná" pod starým klíčem). Přidána automatická zpětná migrace (staré gearlisty a vybavení se objevily zpátky) + politika verzované migrace do budoucna + Export/Import zálohy do souboru. Viz PRD v8 sekce 6a. (2026-09-24, nahlásil Martin)
