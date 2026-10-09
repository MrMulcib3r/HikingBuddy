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

Po implementaci přesouvá Claude položky z 🔴 Teď do **🧪 Test** (s popisem „Jak otestovat"). Martin je ověří v appce: funguje → ✅ Hotovo, nefunguje → poznámka k položce a zpět do 🔴 Teď.

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
  3. přesuň ji do sekce 🧪 Test s krátkým „Jak otestovat" a datem implementace — do ✅ Hotovo ji přesouvá až Martin po ověření,
  4. zapiš ji do `PRDRequirements/build-status.md`,
  5. pokud se změnilo chování appky, uprav i PRD.
- Když při práci narazíš na jiný problém, **neopravuj ho potichu**. Přidej ho do 📥 Inbox s poznámkou `(našel Claude)` a řekni o něm Martinovi.

---
Template (nemazat): - [TYP] Krátký název – co se děje / co chci (datum)

## 📥 Inbox

- [ ] [FEATURE] Automatické testy – přidat do projektu sadu testů, které po každé změně ověří klíčová pravidla z PRD (dialog Cancel/Copy/Continue, žádné duplicitní řádky, snapshot…). Proč: dnes se vše ověřuje ručně a chyba se může vloudit nepozorovaně. (2026-09-23, navrhl Claude)
- [ ] ~~[FEATURE] Skutečná databáze na serveru – appka s účtem, data uložená na serveru místo jen v prohlížeči. Proč: jediné řešení bez ručních kroků a zároveň technický základ pro sync mezi zařízeními (PRD sekce 7, bod 2) i komunitní sdílení (PRD sekce 9). Větší krok, dává smysl řešit až s těmito featurami, ne samostatně kvůli záloze. Viz PRD sekce 6a, bod 2. (2026-09-24, navrhl Claude)~~ **Vyřazeno ve v16 (2026-10-09)**, data řeší auto-save do souboru (FR-16).

## 🔴 Teď

_Finální scope appky je v PRD v16 (sekce 0 a 2). Položky níže jsou seřazené: nejdřív všechno dodělat a vyzkoušet lokálně, nasazení na web až nakonec (viz 🟡 Brzy). Souběžně s tím Martin prochází položky v 🧪 Test._

- [ ] [FEATURE] Automatické ukládání do datového souboru („lokální databáze“) – PRD FR-16. Proč: data dnes žijí jen v prohlížeči a smazání dat prohlížeče je smaže; Export/Import chrání, jen když si na něj Martin vzpomene. (2026-10-09, Martin)
  - „Connect data file“ v hlavičce → appka po každé změně sama ukládá do vybraného `.json` souboru; stav ukládání vidět v hlavičce.
  - Připojení souboru s daty → dialog Cancel / Load data from file / Overwrite file with current data (s počty).
  - Po znovuotevření prohlížeče pruh „Reconnect to your data file“; bez potvrzení se do souboru nic nezapisuje.
  - Formát stejný jako Export (`{ schemaVersion, state }`) → platí migrace (FR-15).
  - Jen Chrome/Edge na počítači; jinde krátká informace a appka funguje jako dnes.
  - Do `.gitignore` přidat `data/` (pro případ, že by Martin chtěl soubor v repu).
- [ ] [FEATURE] Load demo data + uvítací karta pro prázdnou appku – PRD FR-17. Proč: prezentace na pohovorech; prázdná appka nic neukáže. (2026-10-09, Martin)
  - Prázdná appka → karta s „Load demo data“ / „Start empty“; tlačítko i v hlavičce (s potvrzením, pokud appka obsahuje data).
  - Při připojeném datovém souboru (FR-16) nejde použít, aby si Martin nepřepsal skutečná data.
  - Demo postavit na `Claude outputs/Weekend_Hikes-HikingBuddy-import.json` a doplnit: 2 gearlisty se sdílenými položkami, snapshot, šablona, Worn i Consumable. Obsah dema ukázat Martinovi ke schválení.
- [ ] [FEATURE] Sdílení gearlistu přes URL, jen pro čtení, bez serveru – PRD FR-18. Proč: poslat gearlist kamarádovi nebo na fórum, ukázka na pohovoru. (2026-10-09, Martin)
  - Tlačítko „Share“ → odkaz s gearlistem zakódovaným za `#` + „Copy link“ + upozornění, že odkaz je kopie a pozdější změny v něm nebudou.
  - Stránka sdíleného gearlistu: položky po kategoriích, rozpad váhy, přepínač jednotek; data otevírajícího se nemění.
  - Formát odkazu verzovaný (`v1`), aby staré odkazy fungovaly i po změně datového modelu.


## 🟡 Brzy

- [ ] [UI] Design system + vizualizace váhy batohem místo koláčového grafu – PRD FR-19. Proč: appka má vypadat dobře pro prezentaci a batoh je srozumitelnější a originálnější než koláč na LighterPacku. **Čeká na Martina:** ten nejdřív vytvoří design system (Claude → Artifacts → Design System) a rozhodne otevřené otázky ve FR-19 (co je v batohu, pořadí vrstev). Claude Code nezačíná, dokud to Martin nepřesune do Teď. (2026-10-09, Martin)
- [ ] [FEATURE] Nasazení na web jako statická appka (Cloudflare Pages / Netlify / Vercel, zdarma) – PRD FR-20. Proč: veřejný odkaz pro pohovory. Až po dokončení všeho v Teď + design (FR-19) a Martinově testu lokálně. Při nasazení rozhodnout: veřejný, nebo soukromý repozitář (a zkontrolovat, že v repu není nic osobního). (2026-10-09, Martin; původně navrhl Claude 2026-09-23)

## ⚪ Někdy

_Ve v16 (2026-10-09) Martin uzavřel scope: všechno přeškrtnuté je vyřazené, ne jen odložené._

- [ ] ~~[FEATURE] Duplicate gearlist – nový gearlist jako kopie existujícího. Viz PRD sekce 7, bod 8. (2026-10-07)~~ Vyřazeno ve v16.
- [ ] ~~[FEATURE] Víc snapshotů na gearlist (historie). Viz PRD sekce 7, bod 6.~~
- [ ] ~~[FEATURE] Koláčový graf rozložení váhy podle kategorie. Viz PRD sekce 7, bod 4.~~ Nahrazeno batohem (🟡 Brzy, FR-19).
- [ ] ~~[FEATURE] Offline PWA (instalace na telefon, přístup bez signálu). Viz PRD sekce 7, bod 1.~~
- [ ] ~~[FEATURE] Přihlašování a synchronizace mezi zařízeními. Viz PRD sekce 7, bod 2.~~

## 🔭 Vize

- [ ] ~~[VISION] Komunitní sdílení gearlistů + monetizace. Viz PRD sekce 9 (otevřené otázky).~~

## 🧪 Test

_Hotovo od Claude, čeká na Martinovo ověření v appce. Když to funguje, přesuň do ✅ Hotovo; když ne, napiš k položce, co je špatně, a vrať ji do 🔴 Teď._

- [ ] [CR] When updating gear items in a gearlist(-s) the user needs to know which gear lists are affected. (24.9.2026) → **Jak otestovat:** změň váhu/název položky z Vaultu, která je ve 2+ gearlistech → dialog pod textem vypíše „Affected gearlists:" s jejich názvy. Totéž při Delete a při změně přímo v gearlistu (tam se vypíšou ostatní gearlisty). (implementováno 2026-10-08)
![[Pasted image 20260924165604.png|376]]
- [ ] [BUG] Categories cannot be edited. It should be possible to edit all categories including the template one. (24.9.2026) → **Jak otestovat:** klikni na název kategorie v nadpisu skupiny ve Vaultu (např. FOOD), přepiš, Enter. Escape zruší. Funguje i v dialogu „Categories" (klik na název). (implementováno 2026-10-08)
![[Pasted image 20260924170230.png|360]]
- [ ] [BUG] When creating new item and clicking out of the dialogue window whole window is closed. (24.9.2026) → **Jak otestovat:** otevři „+ Add gear", něco napiš, klikni mimo okno → okno zůstane. Zavře ho Cancel nebo Escape. (implementováno 2026-10-08)
![[Pasted image 20260924174122.png|361]]
- [ ] [CR] Rename Shelter to "Shelter system" (24.9.2026) → **Jak otestovat:** po obnovení stránky se tvoje kategorie Shelter jmenuje „Shelter System" (velké S kvůli shodě se „Sleep System" — kdyžtak přejmenuj kliknutím na nadpis). (implementováno 2026-10-08)
- [ ] [UI] Prázdné kategorie se ve Vaultu nezobrazují; vždy viditelné tlačítko „+ Add gear" v hlavičce Vaultu. (2026-10-08, Martin) → **Jak otestovat:** ve Vaultu jsou jen kategorie s položkami, každá s „+ Add item" na konci; „+ Add gear" vpravo nahoře u „Categories". (implementováno 2026-10-08)
- [ ] [UI] „+ Add gear" otevře formulář s předvybranou dlaždicí „Other". (2026-10-08, Martin) → **Jak otestovat:** klik na „+ Add gear" → „Other" je zvýrazněné a pole pro novou kategorii otevřené, kurzor je v poli Name. Když napíšeš název nové kategorie a rovnou dáš Add, kategorie se založí. (implementováno 2026-10-08)
- [ ] [BUG] Ve formuláři šlo mít vybrané „Other" a zároveň jinou kategorii. (2026-10-08, Martin) → **Jak otestovat:** klikej střídavě na „Other" a jinou dlaždici — vždy svítí jen jedna. (implementováno 2026-10-08)
- [ ] [FEATURE] Možnost přejmenovat kategorie. (2026-10-08, Martin) → stejné jako bug „Categories cannot be edited" výše. (implementováno 2026-10-08)

- [ ] [UI] Přidej možnost smazat kategorii — jen uživatelem vytvořené („Other“) kategorie. (2026-10-08, Martin) → **Jak otestovat:** „+ Add gear“ → „Other“ → založ kategorii → na její dlaždici je vpravo nahoře ×. Klik → potvrzení (řekne, kolik položek se stane Uncategorized) → kategorie zmizí, formulář zůstane otevřený. Výchozí kategorie × nemají. (implementováno 2026-10-08) **Doplněno po rozhodnutí Martina:** ani v dialogu „Categories“ už nejde smazat výchozí kategorie — Delete mají jen vlastní, s potvrzením. Otestuj i tam. (PRD v15)
  ![[Pasted image 20261008153514.png]]
- [ ] [UI] Přesuň tlačítko Add Gear do Gear Vaultu — dominantnější, blíž palci na mobilu, lépe vidět na desktopu. (2026-10-08, Martin) → **Jak otestovat:** dole v panelu Gear Vault je velké modré „+ Add gear“ přes celou šířku; zůstává vidět i při posouvání seznamu. (implementováno 2026-10-08)
- [ ] [FEATURE] Gearlist Template – nový gearlist předvyplněný ze šablony (PRD sekce 7, bod 5, T-1 až T-6). (implementováno 2026-10-08) → **Jak otestovat:**
  1. V gearlistu s položkami se objeví pruh „Use this gearlist as your template?“ → „Create template“ (nebo kdykoli tlačítko „Save as template“). Křížek pruh skryje natrvalo.
  2. V rozbalovacím výběru gearlistů je nahoře 📋 Template — otevři, uprav množství / Worn / přidej nebo odeber položku. Gearlisty se nemění.
  3. „+ New gearlist“ → volba „From template“ (předvybraná) / „Blank gearlist“ → nový gearlist má položky šablony včetně množství a Worn/Consumable.
  4. Změň ve Vaultu váhu položky, která je v šabloně → dialog Cancel / Copy / Continue uvádí „Template“ i u položky, která není v žádném gearlistu.
  5. Smaž ve Vaultu položku, která je jen v šabloně → varování „…will also remove it from the template“.
  6. „Delete template“ smaže šablonu, gearlisty z ní vytvořené zůstanou.

## ✅ Hotovo

- [x] [UI] "+ Add item" v Gear Vaultu přesunuto z hlavičky na konec každé kategorie (jako lighterpack.com), kategorie se ve formuláři předvybere. Viz PRD v12. (2026-10-08, požadavek Martina)
- [x] Smazán prázdný soubor `WeightTypeToggle.tsx` (2026-09-23)
- [x] `.obsidian/` přidáno do `.gitignore` (2026-09-23)
- [x] [BUG] Data appky nebyla ničím chráněná – smazání dat prohlížeče by appku vynulovalo, a přechod na v7 tohle skoro způsobil omylem (stará data zůstala "neviditelná" pod starým klíčem). Přidána automatická zpětná migrace (staré gearlisty a vybavení se objevily zpátky) + politika verzované migrace do budoucna + Export/Import zálohy do souboru. Viz PRD v8 sekce 6a. (2026-09-24, nahlásil Martin)
