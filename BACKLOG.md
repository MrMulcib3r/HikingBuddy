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

- [ ] [FEATURE] „Import to my HikingBuddy“ na stránce sdíleného gearlistu – návštěvník si sdílený gearlist jedním klikem uloží k sobě (gearlist + jeho položky do Vaultu), bez účtů a serveru, protože odkaz (FR-18) už celý gearlist nese. Položky se přidají jako nové, bez párování s Vaultem (rozhodnutí Martina, PRD 9.3). Proč: malá „lokální“ verze nápadu z PRD sekce 9.3. Mimo uzavřený scope, rozhoduje Martin. (2026-10-13, navrhl Claude)
- [x] [CR] `npm audit` hlásí 1 „high“ zranitelnost v `source-map-js` — balíček používá jen sestavovací nástroj (Vite) při vývoji, do appky v prohlížeči se nedostane. Opravit `npm audit fix` před nasazením (FR-20). (2026-10-09, našel Claude) **Opraveno 2026-10-13** (`npm audit fix`, 0 zranitelností).

## 🔴 Teď

_Finální scope appky je v PRD v16 (sekce 0 a 2). Položky níže jsou seřazené: nejdřív všechno dodělat a vyzkoušet lokálně, nasazení na web až nakonec (viz 🟡 Brzy). Souběžně s tím Martin prochází položky v 🧪 Test._

_Zbývají jen dvě položky, které jdou ověřit až po nasazení na web (FR-20). Opravy z Martinova testu 2026-10-14 jsou v 🧪 Test._


## 🟡 Brzy

_Cíl (PRD v33, 2026-10-21): uživatel si připojí vlastní AI klienta (Claude, ChatGPT) přes MCP server HikingBuddy; AI umí všechno, co uživatel, a odpovídá s widgety HikingBuddy přímo v chatu. Pořadí je závazné, každý krok zvlášť. Zadání pro Claude Code: `PRDRequirements/mcp-integration/claude-code-prompts.md`, pro Claude Design: `PRDRequirements/mcp-integration/claude-design-prompt.md`._

- [ ] [UI] Design pro účty, Connect to AI, Activity a widgety MCP Apps – zadat Claude Design (`claude-design-prompt.md`). Proč: widgety v chatu a nové obrazovky zatím nemají design; potřeba před krokem 5, ideálně dřív. (2026-10-21, Martin)
- [ ] [FEATURE] Krok 6: Eval MCP serveru – 10 zadání, před/po úpravě popisů nástrojů. PRD FR-26. (2026-10-21, Martin)
- [ ] ~~[FEATURE] Gear advisor (GenAI) – návrh vybavení s vlastním API klíčem. PRD FR-22.~~ **Nahrazeno MCP serverem ve v33 (2026-10-21)**, viz PRD sekce 8z.

## ⚪ Někdy

_Ve v16 (2026-10-09) Martin uzavřel scope: všechno přeškrtnuté je vyřazené, ne jen odložené._

- [ ] [FEATURE] GDPR minimum – zásady ochrany osobních údajů, možnost smazat účet a data. Proč: s účty appka ukládá osobní údaje (Google účet, data na serveru); potřeba dřív, než appku s účtem začnou používat cizí lidé. PRD sekce 8z. (2026-10-21, Martin)
- [ ] [UI] Tmavý režim widgetů v AI klientovi – návrh připraví Claude Design (součást `claude-design-prompt.md`), implementace později. Proč: AI klienty běží často tmavě. PRD FR-27. (2026-10-21, Martin)
- [ ] ~~[FEATURE] Přihlašování a synchronizace mezi zařízeními.~~ → přihlášení přes Google a data na serveru jsou od v33 v 🟡 Brzy (krok 1).

- [ ] [FEATURE] Obvyklé teploty v místě a období treku – u gearlistu zadám období (měsíc nebo dny) a místo (např. Kvikkjokk) a uvidím obvyklé denní a noční teploty. Proč: vím, na jaké teploty balím (spacák, oblečení). Nice-to-have, mimo uzavřený scope, ale jde to bez serveru. Viz PRD sekce 7, bod 9. (2026-10-13, Martin)
- [ ] [FEATURE] URL shortener: Současná URL sdíleného linku vypadá např. [takto](https://hikingbuddy.mmalinek.workers.dev/#share=v2:N4IgdiBcIOoKZwNZzAEwAQAkCWyDOIANCAK5QgC2RIAxlANr0gBCAhjYgA7uLUBGPbhxABdQkwDKACzgAbAC5wATugkBPPIqrE8MhctHiQE2Qk6qNW6nlNxOhpgGFZAe3lTsYAObUar954+Yk4uLoiBvqHh3g4gAGKhqNQAZomxMKyKStQA7pkGwSAAoqY08kouYNg0BMRycGUVVTWxmGpe2Chw1FLtnWDdhQCy2Hh0xBSjdCJiINgMTADiLnh4rBTK6ItwrCoAMi5Ko+gAbgBMRAAMhACsNwDMhACMxFeFEkMAIlv5OYnoNFYnG6z0I9ye1xeIDeRgAKih5OhNKx8EQXgAOQgANlehEuhU+LhyYHQAEcSNgFEQztizpDcfijABJMDJWSZVh8UxI2ycQLobhJQg0+4AFnp0LxhVhSlYlPQShIYAGSlqjyx4tBkqehRw0S8AtYYHkauF6IlaOlAFpdNglPIiI8nvdMVDLUYJC4OKbRU6GQSiSSAFY8OAOsFgiFamFMABKcuDofDjzO9wtUqMzBIyWSjsImrdGaWrhOcB9fsljKYRVLSgGOXQsOw8iN2BIFHQAFU9ugAApuIii55PIeFqsgRyZAFGpHyFylwfPUf+owwTyoMZKBAQfPCgCc0aLID22C8Uiyi6eN0P44knFCO6HrpXknv3hBQ+XlcKcRIcnQAAUrCyDQLhSC4sgAJSXpc6ZnO8zTIKqRDXjc1w0pK8FGI4Mg5PyXjtihS6HlhIQ5ggRGikOGHUoUjiHGAahEWhwq4qRIAssixqGsiREjgA7KxmGFDWyj1ugfBuPI3JPAAdDcshEDi9w4mO7ysDkaibCMNAVKo5IIAAXiCOJYteamrvk2TYs8aFwbqOwYHOSg0FIRCCaK5kviA-Y5MoAhgLwhCCSOB4WUwnYSMwVqONOXIgiFXnfkYAAa2CsC4kzoFe7nPHuz7JZIlRqOgMBxFaEKwSlQyirlNyqd5MpEnIRCuhWMYgLCLiUmGhrAtZmKigVHVxHamjoHKGDhOGrp0je0pbog+oChBZZEAeopzYWOpGEMhysOgzisKs1ToGALiyegFyEGFW3eb27KaKdAg+DdtnzSIAC+QA).
- [ ] ~~[FEATURE] Duplicate gearlist – nový gearlist jako kopie existujícího. Viz PRD sekce 7, bod 8. (2026-10-07)~~ Vyřazeno ve v16.
- [ ] ~~[FEATURE] Víc snapshotů na gearlist (historie). Viz PRD sekce 7, bod 6.~~
- [ ] ~~[FEATURE] Koláčový graf rozložení váhy podle kategorie. Viz PRD sekce 7, bod 4.~~ Nahrazeno batohem (🟡 Brzy, FR-19).
- [ ] ~~[FEATURE] Offline PWA (instalace na telefon, přístup bez signálu). Viz PRD sekce 7, bod 1.~~

## 🔭 Vize

_Mimo scope. Uložené nápady pro případ, že by appka vyšla veřejně s monetizací (PRD sekce 9). Neimplementovat._

- [ ] [VISION] Komunitní katalog vybavení jako výchozí Gear Vault – nový uživatel nezačíná s prázdným Vaultem, ale s vybavením od komunity; může nahrávat vlastní položky; ochrana proti duplicitám, vulgaritám a zahlcení databáze. Proč: prázdný Vault je největší bariéra pro nového uživatele. Viz PRD sekce 9.2. (2026-10-13, Martin)
- [ ] [VISION] Kopírování sdíleného gearlistu „pod svůj účet“ – tlačítko na sdíleném gearlistu. Proč: cizí gearlist jako základ pro vlastní trek. Viz PRD sekce 9.3. (2026-10-13, Martin)
- [ ] [VISION] Komunitní sdílení gearlistů (procházení gearlistů ostatních) + monetizace. Viz PRD sekce 9.4. (původní vize z v6)

## 🧪 Test

_Hotovo od Claude, čeká na Martinovo ověření v appce. Když to funguje, přesuň do ✅ Hotovo; když ne, napiš k položce, co je špatně, a vrať ji do 🔴 Teď._

- [ ] [FEATURE] Krok 5: Widgety MCP Apps v AI klientovi – souhrn gearlistu, seznam vybavení, karta položky, návrh změn s Confirm / Reject / Confirm all, stavy (uloženo, prázdné, limit, chyba, zastaralý návrh), „Open in HikingBuddy“. PRD FR-27 (upřesnění v38). (2026-10-21, Martin; implementováno 2026-10-22) → **Jak otestovat** (na veřejné adrese po pushi; HikingBuddy už máš v Claude připojený z kroku 3/4, nic nového nenastavuješ):
  1. V **novém** chatu v Claude se zapnutým konektorem HikingBuddy napiš „Show me my Kungsleden gearlist“ (nebo název svého gearlistu). Pod odpovědí se objeví **karta HikingBuddy**: Total, Base / Consumables / Worn, malý batoh s úrovní (např. Ultralight) a kategorie s vahou a procenty. Pokud Claude poprvé zobrazí dotaz, jestli smí HikingBuddy ukázat, povol to.
  2. „Show the gear in it“ → seznam po kategoriích, 8 řádků a „Show all N items“ (rozbalí se na místě, nic se uvnitř nescrolluje). „Show me my rain jacket“ → karta položky s gearlisty, kde je použitá.
  3. **Hlavní test:** „Make my Kungsleden pack lighter, propose the changes.“ → karta **PROPOSED CHANGES** s dopadem na base weight a tlačítky. Na webu se zatím nic nezměnilo.
  4. U jednoho řádku klikni **Confirm** → řádek „Confirmed“, na webu (po přepnutí na záložku) je změna a v Activity nový řádek „Claude“. U dalšího **Reject** → přeškrtnutý, **Undo** ho vrátí. Pak **Confirm all** → zbytek se uloží jedním krokem (jeden řádek v Activity) a karta se změní na „Saved to …“.
  5. Pokud návrh obsahuje změnu položky, která je i v jiném gearlistu, má místo Confirm „Create a copy“ / „Update everywhere“ a Confirm all ji přeskočí (napíše to).
  6. **Zastaralý návrh:** nech si navrhnout změny, ale nepotvrzuj; na webu v tom gearlistu něco změň; pak v Claude klikni Confirm → „This proposal is out of date“.
  7. **Open in HikingBuddy** v kartě otevře web přímo na tom gearlistu (u karty položky posune Vault na položku a krátce ji zvýrazní).
  8. Zavři chat uprostřed rozhodování a otevři ho znovu → potvrzené řádky zůstanou potvrzené.
  Screenshoty všech widgetů (360 a 680 px) jsou v `design/2026-10-mcp/implemented/step5/`.
- [ ] [FEATURE] Krok 4: Pop-up „Connect to AI“ – krátký návod pro Claude a ChatGPT, adresa MCP serveru s Copy, OK. PRD FR-28 (upřesnění v37). (2026-10-21, Martin; implementováno 2026-10-22) → **Jak otestovat** (po nasazení na https://hikingbuddy.mmalinek.workers.dev):
  1. **Host:** odhlášený klikni vpravo nahoře na „Connect to AI“ → vysvětlení, že je potřeba účet, „Not now“ a tlačítko Google. Přihlas se v něm → okno se nezavře a ukáže návod.
  2. **Přihlášený:** „Connect to AI“ v hlavičce i v nabídce účtu (avatar → Connect to AI) otevře stejný pop-up. Přepni záložky Claude / ChatGPT (okno neposkočí), klikni Copy → „Copied“, OK okno zavře.
  3. **Hlavní test:** pokud už HikingBuddy v Claude máš z kroku 3, odeber ho (Customize › Connectors). Pak připoj Claude **jen podle návodu v pop-upu** a napiš „List my gearlists“. Kde návod nesedí na to, co v Claude vidíš, napiš mi přesné znění tlačítek.
  4. ChatGPT netestuješ (podle OpenAI dnes jen tarify Business / Enterprise); stačí přečíst, že návod dává smysl.
- [ ] [FEATURE] Krok 1: Server, databáze D1 a přihlášení přes Google – režim bez účtu zůstává, po přihlášení data na serveru, import lokálních dat. PRD FR-23, FR-24 (upřesnění v34). (2026-10-21, Martin; implementováno 2026-10-21) → **Jak otestovat** (nejdřív nastavení Google a Cloudflare podle Claudova návodu v chatu):
  1. **Bez přihlášení** (lokálně i na webu): appka funguje jako dřív – Vault, gearlisty, datový soubor, demo, Export/Import. Vpravo nahoře přibylo jen „Sign in“.
  2. **Přihlášení lokálně:** `npm run dev` v `app/`, otevři http://localhost:5173 → Sign in → dialog s výhodami → tlačítko Google → vyber účet. Vpravo nahoře uvidíš „Saved“ a svůj avatar se jménem.
  3. **Import:** při prvním přihlášení v prohlížeči, kde máš data (nebo připojený datový soubor), se ukáže „Import your local gear?“ s počty. Zvol import → v účtu jsou stejná data. Lokální data zůstanou (odhlas se a uvidíš je).
  4. **Jiný prohlížeč:** přihlas se stejným účtem např. v Edge nebo v anonymním okně → stejná data, bez nabídky importu. Změna v jednom prohlížeči se ve druhém objeví po přepnutí zpět na jeho záložku.
  5. **Druhý Google účet:** přihlas se jiným účtem → prázdný účet (uvítací karta s „Load demo data“), nevidí nic z prvního účtu.
  6. **Offline:** v DevTools (F12 → Network → Offline) udělej změnu → žlutý pruh „You are offline.“ a „Offline · changes kept“. Vrať připojení → „Saved“ a změna je v jiném prohlížeči.
  7. **3-cestný dialog** s účtem: uprav váhu položky použité ve dvou gearlistech → dialog Cancel / Create a copy / Continue jako dřív.
  8. **Odhlášení:** avatar → Sign out → zase režim bez účtu s lokálními daty.
  9. **Na veřejné adrese** (po pushi): totéž na https://hikingbuddy.mmalinek.workers.dev.
- [ ] [FEATURE] Krok 2: Historie změn a Undo – panel Activity (avatar → Activity), štítky You / AI, Undo jedné změny, celého kroku AI i všech AI změn dne, konflikt, smazané věci jdou vrátit 30 dní. PRD FR-25 (upřesnění v35). (2026-10-21, Martin; implementováno 2026-10-21) → **Jak otestovat** (přihlášený; lokálně `npm run db:migrate:local` a `npm run dev` v `app/`, na webu po pushi nic nastavovat nemusíš):
  1. Udělej pár změn: přidej položku do Vaultu, změň váhu, přidej ji do gearlistu, uprav množství a **smaž celý gearlist** (s položkami a snapshotem).
  2. Avatar vpravo nahoře → **Activity**. Zprava se vysune panel: nadpis „Today · …“, tvoje změny se štítkem „You“, časem a popisem (např. „Changed weight of **X**: 85 g → 79 g“). Smazaný gearlist je přeškrtnutý se štítkem „Restorable until …“.
  3. U smazaného gearlistu klikni **Undo** → gearlist je zpátky i s položkami a snapshotem. Nahoře přibude „Undid your change from …“, původní záznam má „Undone …“.
  4. U „Undid …“ klikni Undo → gearlist zase zmizí („Redid …“). Původní záznam jde znovu vrátit.
  5. **Konflikt:** změň váhu položky (A → B), pak ještě jednou (B → C). U první změny klikni Undo → žluté upozornění „Undo would overwrite 1 later change“ s druhou změnou; Cancel nic neudělá, „Undo anyway“ vrátí váhu na A.
  6. Přepnutí jednotek ani zavření banneru šablony se do historie nezapisuje. Import lokálních dat nebo zálohy je jeden záznam s Undo.
  7. AI změny („Claude“, krok AI s rozbalením, „Undo all AI changes from this day“) uvidíš naostro až po kroku 3 (MCP). Ověřil jsem je lokálně simulovaným klientem, screenshoty v `design/2026-10-mcp/implemented/step2/`.

- [ ] [FEATURE] Krok 3: MCP server s OAuth (zatím jen text) – AI klient (Claude) se připojí k HikingBuddy, přihlásí se stejným Google účtem a umí všechno, co ty: číst, přidávat, měnit i mazat. Pravidla PRD platí i pro AI (FR-5 jako povinná volba, snapshot/šablona jen s potvrzením). Každý krok AI je v Activity jako „Claude“ s Undo; v Activity je sekce „Connected AI apps“ s „Revoke access“. PRD FR-26 (upřesnění v36). (2026-10-21, Martin; implementováno 2026-10-22) → **Jak otestovat** (na veřejné adrese po pushi; lokálně Claude MCP server nevidí):
  1. **Připojení:** claude.ai → Settings → Connectors → **Add custom connector** → název „HikingBuddy“, URL `https://hikingbuddy.mmalinek.workers.dev/mcp` → Add → Connect. Otevře se okno HikingBuddy: když nejsi přihlášený, „Sign in with Google“; pak „Allow Claude to use your HikingBuddy?“ → **Allow**. Okno se zavře a konektor je „Connected“.
  2. V novém chatu zapni konektor HikingBuddy (ikona nástrojů pod polem pro zprávu) a zkus těchto 5 vět:
     - „Create a gearlist for 3 days in Jeseníky with rain from my gear“ → gearlist se objeví na webu (po přepnutí na záložku) a v Activity je jeden záznam „Claude … Created gearlist … with N items“ s Undo.
     - „What's the base weight of my Weekend Hikes list and what are its three heaviest items?“ → odpoví bez jakékoli změny (v Activity nic nového).
     - „Make my rain jacket 20 g heavier.“ → **musí se zeptat**, jestli změnit všude, nebo vytvořit kopii (FR-5); po odpovědi změnu udělá.
     - „Remove everything I don't need for a day hike from the Jeseníky list.“ → odebere řádky; v Activity jeden krok s rozbalením na jednotlivé změny.
     - „Undo your last change.“ → odebrané řádky se vrátí (v Activity „Undid Claude's change from …“).
  3. **Undo na webu:** v Activity klikni Undo u kroku „Created gearlist …“ → gearlist zmizí z webu.
  4. **Revoke:** Activity → Connected AI apps → Claude → **Revoke access** → potvrzení. Další dotaz v Claude už HikingBuddy nedosáhne (Claude nabídne znovu připojit).
  5. ChatGPT na bezplatném účtu vlastní konektory neumí (viz chat), proto netestuj.


## ✅ Hotovo

- [x] [UI] "+ Add item" v Gear Vaultu přesunuto z hlavičky na konec každé kategorie (jako lighterpack.com), kategorie se ve formuláři předvybere. Viz PRD v12. (2026-10-08, požadavek Martina)
- [x] Smazán prázdný soubor `WeightTypeToggle.tsx` (2026-09-23)
- [x] `.obsidian/` přidáno do `.gitignore` (2026-09-23)
- [x] [BUG] Data appky nebyla ničím chráněná – smazání dat prohlížeče by appku vynulovalo, a přechod na v7 tohle skoro způsobil omylem (stará data zůstala "neviditelná" pod starým klíčem). Přidána automatická zpětná migrace (staré gearlisty a vybavení se objevily zpátky) + politika verzované migrace do budoucna + Export/Import zálohy do souboru. Viz PRD v8 sekce 6a. (2026-09-24, nahlásil Martin)
- [ ] ~~[UI] Design system + vizualizace váhy batohem – PRD FR-19 (v21, kolo 2 v24, kolo 3 v25). (2026-10-09, Martin; implementováno 2026-10-12, kola 2 a 3 2026-10-13) → **Jak otestovat** (obnov stránku appky, F5):~~
  1. ~~Světlý vzhled s krajinou dole, logo v hlavičce, písma Barlow Condensed / Overpass. Porovnej se screenshoty v `design/2026-10-redesign/implemented/` a s návrhem v `design-system/screenshots/`.~~
  2. ~~Batoh nahoře v gearlistu (i v šabloně a na sdílené stránce): nejtěžší kategorie dole, v batohu jen Base + Consumables, pod ním Base / Consumables / Worn. Najeď myší na vrstvu nebo řádek legendy → zvýrazní se obojí. Přepni Worn/Consumable u řádku → batoh se hned přepočítá.~~
  3. ~~Ikony místo textu: v hlavičce gearlistu (snapshot, zobrazit snapshot, sdílet, šablona, smazat, nový gearlist), Export/Import, Disconnect, odebrání/smazání řádku. Po najetí myší se ukáže popis.~~
  4. ~~Worn = bota, Consumable = příbor (zapnuté jsou oranžově podbarvené). Kategorie je u položky v druhém řádku pod názvem, pořád jde změnit kliknutím. Karabina u položky ve Vaultu = položka je použitá v gearlistu/šabloně (tooltip řekne kde).~~
  5. ~~Chování se nemá lišit: inline editace (Enter/Escape), 3-cestný dialog, snapshot, přetažení z Vaultu, sdílení, datový soubor, demo data.~~
  6. ~~Telefon: otevři appku v telefonu nebo zmenši okno pod 900 px → panely pod sebou, nic nepřetéká, akce u řádků jsou vidět i bez myši.~~
  7. ~~Sdílený odkaz je nově `#share=v2:…` (nese barvy kategorií); staré odkazy `v1` dál fungují.~~
  ~~**Kolo 2 (PRD v24, 2026-10-13)** — po tvém testu:~~
  8. ~~Pravý panel má hlavičku GEARLISTS s + (nový gearlist). Pod ní název gearlistu a tlačítka s ikonou i textem: Save/Update snapshot, Share, Save as/Update template; koš smaže gearlist. „View snapshot“ je vedle zeleného štítku „Snapshot saved…“.~~
  9. ~~Dlaždice vah zmizely; Base / Consumables / Worn / **Total** jsou pod batohem.~~
  10. ~~Batoh je větší a každá kategorie má procento (malé vpravo s čárou). Najeď myší na každou vrstvu i na popisek vpravo.~~
  11. ~~Nad seznamem je hlavička sloupců (Item, Worn, Cons., Weight, Qty, Total), lícuje s řádky; na úzké obrazovce se skryje.~~
  12. ~~Hlavička appky: Export a Import s textem, Disconnect s textem. Ve Vaultu karabina + „N lists“.~~
  13. ~~Písma jsou přibalená v appce (nic se nestahuje od Googlu).~~
  ~~**Kolo 3 (PRD v25, 2026-10-13)** — úrovně batohu:~~
  14. ~~Demo „Weekend Hikes“ je Ultralight (zelený štítek, holý batoh). Zvyš u „Down quilt“ počet kusů na 3 → Lightweight: připne se karimatka a štítek jednou pulzne. Na 7 → Traditional: cepín, hůlky, kapsy a boty. Pod štítkem je, kolik zbývá do lehčí úrovně.~~
  15. ~~Uprav něco uvnitř úrovně (např. kolíky ×7) → nic se neanimuje.~~
  16. ~~Přepni na oz / lb → nápověda v librách (10 lb / 15 lb).~~
  17. ~~Screenshoty: `design/2026-10-redesign/implemented/v2/` a `v3/`; s tvými daty jen u tebe v `data/screenshots/` (mimo git).~~
  ~~**Úpravy v26 (2026-10-13):**~~
  18. ~~V hlavičce GEARLISTS je tlačítko „+ New gearlist“ s textem.~~
  19. ~~„Add item from Gear Vault“ je vpravo nad hlavičkou sloupců (lícuje s pravým okrajem seznamu).~~
  20. ~~Hlavička sloupců (ITEM, WORN, CONS., …) má větší písmo (13 px, jako hlavička legendy).~~
  21. ~~Legenda vedle batohu je na širokém okně užší (max. 420 px), váha a procenta jsou blízko názvů.~~
  ~~**Opravy podle UI review 2026-10-14 (PRD v27):**~~
  22. ~~„Add item from Gear Vault“ je plné oranžové (jako „+ Add gear“), na svém místě vpravo nad hlavičkou sloupců. Sloupec Worn / Cons. je širší, popisky sedí nad ikonami.~~
  23. ~~„+ Add gear“ → formulář bez vybrané kategorie. Add bez kategorie → červený obrys a „Choose a category.“, dialog zůstane. „+ Other“ otevře pole jen s Add; klik na jinou dlaždici ho zavře. „Add item“ v kategorii ji předvybere.~~
  24. ~~V řádcích je kategorie a prázdné „Add a note…“ vidět jen při najetí myší (na telefonu vždy); řádky se při tom nehýbou. Klik na kategorii → širší výběr (180 px).~~
  25. ~~Dialog „Add gear to this gearlist“: text hledání začíná za lupou, položky jsou po kategoriích s tečkou, „In list ×6“ u toho, co už v gearlistu je, tlačítka Add jsou sekundární.~~
  26. ~~3-cestný dialog má Cancel / Create a copy / Continue na jednom řádku; texty „1 gearlist“ / „3 gearlists“ místo „(s)“; datum snapshotu „12 Sep 2026, 8:30“.~~
  27. ~~Sdílená stránka na telefonu: u ×1 jen jedna váha.~~ 
  28. ~~Screenshoty: `design/2026-10-redesign/implemented/v4/`.~~
  29. ~~Akční dlaždice ve formuláři se jmenuje „New category“ (dřív „Other“) — u tebe už nejsou dvě „Other“. Výběr kategorie v řádku má 180 px (pokud ne, obnov stránku Ctrl+F5).~~
- [x] ~~[CR] When updating gear items in a gearlist(-s) the user needs to know which gear lists are affected. (24.9.2026) → **Jak otestovat:** změň váhu/název položky z Vaultu, která je ve 2+ gearlistech → dialog pod textem vypíše „Affected gearlists:" s jejich názvy. Totéž při Delete a při změně přímo v gearlistu (tam se vypíšou ostatní gearlisty). (implementováno 2026-10-08)~~
~~![[Pasted image 20260924165604.png|376]]~~
- [x] ~~[BUG] Categories cannot be edited. It should be possible to edit all categories including the template one. (24.9.2026) → **Jak otestovat:** klikni na název kategorie v nadpisu skupiny ve Vaultu (např. FOOD), přepiš, Enter. Escape zruší. Funguje i v dialogu „Categories" (klik na název). (implementováno 2026-10-08)~~
~~![[Pasted image 20260924170230.png|360]]~~
- [x] ~~[BUG] When creating new item and clicking out of the dialogue window whole window is closed. (24.9.2026) → **Jak otestovat:** otevři „+ Add gear", něco napiš, klikni mimo okno → okno zůstane. Zavře ho Cancel nebo Escape. (implementováno 2026-10-08)~~
~~![[Pasted image 20260924174122.png|361]]~~
- [x] ~~[CR] Rename Shelter to "Shelter system" (24.9.2026) → **Jak otestovat:** po obnovení stránky se tvoje kategorie Shelter jmenuje „Shelter System" (velké S kvůli shodě se „Sleep System" — kdyžtak přejmenuj kliknutím na nadpis). (implementováno 2026-10-08)~~
- [x] ~~[UI] Prázdné kategorie se ve Vaultu nezobrazují; vždy viditelné tlačítko „+ Add gear" v hlavičce Vaultu. (2026-10-08, Martin) → **Jak otestovat:** ve Vaultu jsou jen kategorie s položkami, každá s „+ Add item" na konci; „+ Add gear" vpravo nahoře u „Categories". (implementováno 2026-10-08)~~
- [x] ~~[UI] „+ Add gear" otevře formulář s předvybranou dlaždicí „Other". (2026-10-08, Martin) → **Jak otestovat:** klik na „+ Add gear" → „Other" je zvýrazněné a pole pro novou kategorii otevřené, kurzor je v poli Name. Když napíšeš název nové kategorie a rovnou dáš Add, kategorie se založí. (implementováno 2026-10-08)~~
- [x] ~~[BUG] Ve formuláři šlo mít vybrané „Other" a zároveň jinou kategorii. (2026-10-08, Martin) → **Jak otestovat:** klikej střídavě na „Other" a jinou dlaždici — vždy svítí jen jedna. (implementováno 2026-10-08)~~
- [x] ~~[FEATURE] Možnost přejmenovat kategorie. (2026-10-08, Martin) → stejné jako bug „Categories cannot be edited" výše. (implementováno 2026-10-08)~~

- [x] ~~[UI] Přidej možnost smazat kategorii — jen uživatelem vytvořené („Other“) kategorie. (2026-10-08, Martin) → **Jak otestovat:** „+ Add gear“ → „Other“ → založ kategorii → na její dlaždici je vpravo nahoře ×. Klik → potvrzení (řekne, kolik položek se stane Uncategorized) → kategorie zmizí, formulář zůstane otevřený. Výchozí kategorie × nemají. (implementováno 2026-10-08) **Doplněno po rozhodnutí Martina:** ani v dialogu „Categories“ už nejde smazat výchozí kategorie — Delete mají jen vlastní, s potvrzením. Otestuj i tam. (PRD v15)~~
  ~~![[Pasted image 20261008153514.png]]~~
- [x] ~~[UI] Přesuň tlačítko Add Gear do Gear Vaultu — dominantnější, blíž palci na mobilu, lépe vidět na desktopu. (2026-10-08, Martin) → **Jak otestovat:** dole v panelu Gear Vault je velké modré „+ Add gear“ přes celou šířku; zůstává vidět i při posouvání seznamu. (implementováno 2026-10-08)~~
- [x] ~~[FEATURE] Gearlist Template – nový gearlist předvyplněný ze šablony (PRD sekce 7, bod 5, T-1 až T-6). (implementováno 2026-10-08) → **Jak otestovat:**~~
  1. ~~V gearlistu s položkami se objeví pruh „Use this gearlist as your template?“ → „Create template“ (nebo kdykoli tlačítko „Save as template“). Křížek pruh skryje natrvalo.~~
  2. ~~V rozbalovacím výběru gearlistů je nahoře 📋 Template — otevři, uprav množství / Worn / přidej nebo odeber položku. Gearlisty se nemění.~~
  3. ~~„+ New gearlist“ → volba „From template“ (předvybraná) / „Blank gearlist“ → nový gearlist má položky šablony včetně množství a Worn/Consumable.~~
  4. ~~Změň ve Vaultu váhu položky, která je v šabloně → dialog Cancel / Copy / Continue uvádí „Template“ i u položky, která není v žádném gearlistu.~~
  5. ~~Smaž ve Vaultu položku, která je jen v šabloně → varování „…will also remove it from the template“.~~
  6. ~~„Delete template“ smaže šablonu, gearlisty z ní vytvořené zůstanou.~~
- [x] ~~[UI] Možnost aktualizovat šablonu, aby se nemusela vyklikávat znovu. (2026-10-12, Martin; implementováno 2026-10-12) → **Jak otestovat:** když máš šablonu, tlačítko na gearlistu se jmenuje „Update template“ → klik → potvrzení → šablona má obsah tohoto gearlistu (gearlisty vytvořené dřív ze šablony se nemění). Jen pár položek změníš přímo v šabloně: rozbalovací výběr gearlistů → 📋 Template. Po smazání šablony je tlačítko zase „Save as template“. **Doplněno (Martin):** potvrzovací dialog u „Update template“ je výraznější: řekne, kolik položek šablona má a kolik jich přijde z gearlistu, že původní obsah nejde obnovit, a potvrzuje se červeným „Replace template“. Cancel nic nezmění.~~
- [x] ~~[UI] Součet váhy u každé kategorie v gearlistu. (2026-10-12, Martin; implementováno 2026-10-12) → **Jak otestovat:** v gearlistu (i šabloně) je vpravo u nadpisu každé kategorie její celková váha (váha × počet kusů všech řádků), zarovnaná pod váhami řádků. Změň počet kusů nebo váhu → součet se hned přepočítá; přepni kg/lb.~~
- [x] ~~[BUG] Nelze editovat název kategorie v gearlistu. (2026-10-12, Martin; opraveno 2026-10-12) → **Jak otestovat:** v gearlistu klikni na nadpis kategorie (např. SHELTER SYSTEM) → přepiš → Enter. Kategorie se přejmenuje i ve Vaultu, v ostatních gearlistech a v šabloně; snapshot zůstane beze změny. Escape zruší. „Uncategorized“ přejmenovat nejde (není to skutečná kategorie).~~
- [x] ~~[UI] Přidání položky do gearlistu přetažením (drag & drop) přímo z Gear Vaultu; tlačítko „Add item“ zůstává kvůli mobilu. (2026-10-12, Martin; implementováno 2026-10-12) → **Jak otestovat:**~~
  1. ~~Chyť položku ve Vaultu (kdekoli na řádku) a přetáhni ji do pravého panelu → gearlist se orámuje a nahoře se ukáže „Drop to add to …“ → pusť → položka je v gearlistu.~~
  2. ~~Přetáhni položku, která už v gearlistu je → nevznikne druhý řádek, jen se zvýší počet (×2).~~
  3. ~~Totéž v šabloně (📋 Template).~~
  4. ~~Přeřazování pořád funguje: položky ve Vaultu, kategorie ve Vaultu (za nadpis), řádky v gearlistu, gearlisty v rozbalovacím výběru.~~
- [x] ~~[FEATURE] Automatické ukládání do datového souboru – PRD FR-16. (implementováno 2026-10-09) → **Jak otestovat** (v Chrome nebo Edge):~~
  1. ~~Doporučuji nejdřív „Export backup“ (pro jistotu).~~
  2. ~~„Connect data file“ → „Create new file“ → ulož např. do OneDrive jako `hikingbuddy-data.json`. V hlavičce se objeví „Saved to hikingbuddy-data.json · čas“.~~
  3. ~~Něco změň (váhu, název) → do ~1 s se čas v hlavičce aktualizuje. Soubor jde otevřít v Poznámkovém bloku.~~
  4. ~~Zavři prohlížeč úplně a otevři appku znovu → pruh „Reconnect to your data file“ → Reconnect → prohlížeč se zeptá na povolení → povol. (Chrome někdy nabídne „povolit při každé návštěvě“, pak se pruh už neukazuje.)~~
  5. ~~Dokud nedáš Reconnect, udělej změnu → po Reconnect přijde dialog Cancel / Load data from file / Overwrite file with current data s počty.~~
  6. ~~Přesuň nebo smaž soubor a udělej změnu → červený pruh „Can't find your data file“ + „Connect another file“.~~
  7. ~~„Choose existing file“ → vyber třeba starší Export → dialog s počty; „Load data from file“ načte data (i ze starší verze).~~
  8. ~~Ve Firefoxu se místo tlačítka ukáže „Auto-save to file: Chrome / Edge only“.~~
- [x] ~~[FEATURE] Load demo data + uvítací karta – PRD FR-17. (implementováno 2026-10-09) → **Jak otestovat** (nejlépe v anonymním okně, ať nesáhneš na svá data):~~
  1. ~~Prázdná appka → uvítací karta → „Load demo data“ → 46 položek, gearlisty „Weekend Hikes“ (se snapshotem) a „Kungsleden – 7 days“, šablona.~~
  2. ~~Ve Vaultu změň váhu „SMD Gatewood cape“ → dialog vypíše Template + oba gearlisty.~~
  3. ~~Tlačítko „Load demo data“ v hlavičce s daty → potvrzení, co se přepíše.~~
  4. ~~S připojeným datovým souborem je tlačítko zašedlé a po kliknutí vysvětlí „Disconnect your data file first“.~~
  5. ~~**Prosím schval obsah dema** (popis v PRD FR-17, „Upřesnění v17“; data jsou v `app/src/demo/demo-data.json`) — hlavně jestli v něm nechceš něco změnit nebo odebrat jako osobní.~~
- [ ] ~~[FEATURE] Sdílení gearlistu přes URL – PRD FR-18. (implementováno 2026-10-09) → **Jak otestovat:**~~
  1. ~~Na gearlistu „Share“ → „Copy link“ → vlož odkaz do jiného prohlížeče nebo anonymního okna.~~
  2. ~~Uvidíš gearlist jen pro čtení: kategorie, váhy, rozpad váhy, přepínač kg/lb a „Open HikingBuddy“.~~
  3. ~~Ve svém okně pak gearlist změň → už odeslaný odkaz změnu neukáže (je to kopie).~~
  4. ~~Otevření odkazu ve vlastním prohlížeči nic nezmění na tvých datech.~~
  5. ~~Pozn.: lokálně odkaz začíná `http://localhost:5173`, takže funguje jen na tvém počítači. Skutečně poslat ho půjde až po nasazení na web (FR-20).
- [ ] ~~[BUG/CR/UI] Opravy z Martinova testu (BACKLOG „Teď“, 9 z 11 bodů; implementováno 2026-10-14, PRD v28) → **Jak otestovat** (obnov stránku, Ctrl+F5):~~
  1. ~~**Clothing:** kategorie „Worn clothing“ se jmenuje „Clothing“ (ve Vaultu, v gearlistech i v rozpadu pod batohem). Starý snapshot zůstane „Worn clothing“.~~
  2. ~~**Poznámka v „Add gear to this gearlist“:** u položek se stejným názvem (dvě trička) je vedle názvu vidět jejich poznámka.~~
  3. ~~**Food:** kategorie „Consumables“ se jmenuje „Food“ (s jablkem). Přidej do gearlistu položku z kategorie „Food“ (tlačítkem i přetažením) → je rovnou označená jako Consumable (příbor zapnutý). Jde ji vypnout.~~
  4. ~~**Pořadí kategorií v gearlistu:** najeď na nadpis kategorie, vlevo se ukáže úchyt → přetáhni ji nad jinou kategorii. Pořadí ve Vaultu se nemění.~~
  5. ~~**Tečka u poznámky:** při najetí na řádek už vedle poznámky není tečka a dlouhý název kategorie se zkrátí na „…“ místo přetečení.~~
  6. ~~**Tooltip „Load demo data“:** s připojeným datovým souborem je tlačítko šedé; najeď myší → vysvětlení je celé vidět pod tlačítkem.~~
  7. ~~**Výběr kategorie u položky ve Vaultu:** klikni na kategorii u položky použité v gearlistu → rozbalovátko nepřekrývá štítek „N lists“.~~
  8. ~~**Poznámka ve Vaultu:** změň poznámku položky, která je v gearlistu → dialog Cancel / Create a copy / Continue s výpisem gearlistů. Continue změní poznámku i v gearlistech (snapshot ne). U položky, která nikde není, dialog není. Poznámku přímo v gearlistu dál změníš bez dialogu.~~
  9. ~~**Nová položka:** ve formuláři je u váhy šedá „0“; když ji nezměníš, uloží se 0 g.
- [x] [BUG] Dvě chyby z druhého testu 2026-10-14 (opraveno 2026-10-14) → **Jak otestovat** (Ctrl+F5):
  1. **Pořadí kategorií v gearlistu (i ve Vaultu):** přetáhni kategorii za úchyt vlevo u nadpisu — a pusť ji **mezi dvě kategorie** (do mezery), na nadpis nebo na řádek jiné kategorie. Mezera pod kategorií = „vlož za ni“; jinak se přetažená kategorie posadí na místo cíle (nahoru před něj, dolů za něj). Příčina předchozích chyb: mezera mezi kategoriemi nebyla cíl pro puštění (kurzor 🚫), a posun o jedno místo dolů nic neudělal.
  2. **Klik do poznámky a pak na kategorii:** poznámka se uloží a rovnou se otevře výběr kategorie (ve Vaultu i v gearlistu). Stejně funguje klik z poznámky na název, váhu nebo množství.

- [x] [BUG] Přesun položky do jiné kategorie (z videa 2026-10-15; opraveno 2026-10-15, PRD v29) → **Jak otestovat** (Ctrl+F5):
  1. **V gearlistu** přetáhni položku (úchyt vlevo) na položku jiné kategorie, na nadpis jiné kategorie nebo do mezery pod ní → položka je v té kategorii, **bez dialogu**. Ve Vaultu a v ostatních gearlistech zůstává původní kategorie.
  2. **V gearlistu** klikni na kategorii u řádku a vyber jinou → totéž, bez dialogu, jen tento gearlist.
  3. **Ve Vaultu** přetáhni položku do jiné kategorie (nebo ji změň výběrem) → použitá jinde = dialog Cancel / Create a copy / Continue; změní výchozí kategorii.
  4. Změň váhu položky ve Vaultu (Continue) → lokálně přesunutá položka v gearlistu zůstane v nové kategorii. Přejmenuj kategorii → přesunuté řádky ji následují.

- [x] [FEATURE] Kontaktní formulář v patičce (2026-10-15, Martin; implementováno 2026-10-15, PRD v30 FR-21) → **Jak otestovat:**
  0. **Nejdřív klíč:** na https://web3forms.com zadej svou pracovní adresu → klíč přijde e-mailem → vlož ho do `app/src/contact.ts` do `CONTACT_FORM_ACCESS_KEY = '…'` (nebo ho pošli Claudovi). Bez klíče dialog jen napíše „The contact form isn't set up yet.“
  1. Dole uprostřed klikni na „Contact“ → otevře se formulář. Odešli prázdný → pod e-mailem, zprávou a captchou se ukáže, co doplnit.
  2. Klik mimo okno ho nezavře, Escape a Cancel ano.
  3. Vyplň, zaškrtni „I am human“, „Send message“ → „Message sent“ a e-mail s předmětem „HikingBuddy: …“ v pracovní schránce. Odpověď v Gmailu jde rovnou odesílateli. **Lokálně (localhost) může hCaptcha nefungovat → odeslání naostro ověř po nasazení (FR-20).**
  4. Odkaz „Contact“ je i na sdílené stránce gearlistu.
  
   ~~Sdílená stránka na telefonu: u ×1 jen jedna váha. → netestovatelné lokálně, sdílené gearlisty nefungují s lokální adresou. Znovu otestovat po nasazení.~~
  ~~Share gearlist feature not working locally. This is ok but will need to retest while deployed online.~~
- [x] [FEATURE] Nasazení na web (PRD FR-20) – nasazeno 2026-10-20 na https://hikingbuddy.mmalinek.workers.dev, repo veřejné, historie vyčištěná od osobních souborů. → **Jak otestovat:** (1) appka se otevře a „Load demo data“ funguje; (2) „Connect data file“ a připojení tvého datového souboru; (3) sdílení gearlistu: odkaz otevři i v telefonu (body 1 a 2 z 🔴 Teď); (4) kontaktní formulář odešle zprávu z veřejné adresy.