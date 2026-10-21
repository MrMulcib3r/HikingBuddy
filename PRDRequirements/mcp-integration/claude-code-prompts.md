# Zadání pro Claude Code: účty, server a MCP server (PRD v33, FR-23 až FR-28)

Martin zadává kroky **po jednom**, v tomto pořadí. Další krok až po Martinově testu předchozího. Každý prompt níže je samostatný, kopíruj ho celý.

| Krok | Co | FR | Čeká na |
| --- | --- | --- | --- |
| 1 | Server, databáze D1, přihlášení přes Google, import lokálních dat | FR-23, FR-24 | nic |
| 2 | Historie změn a Undo | FR-25 | krok 1 |
| 3 | MCP server s OAuth (jen text, bez widgetů) | FR-26 | krok 2 |
| 4 | Pop-up „Connect to AI“ | FR-28 | krok 3 |
| 5 | Widgety MCP Apps | FR-27 | krok 4 |
| 6 | Eval MCP serveru | FR-26 | krok 5 (dá se udělat už po kroku 3 a zopakovat) |

**Design (hotový 2026-10-21):** jak má co vypadat, je v `design/2026-10-mcp/README.md` (co je nové, Martinova rozhodnutí, pravidla vzhledu v sekci „Pro Claude Code“) a v design systému `design/2026-10-redesign/design-system/` (komponenty v `components/<Komponenta>/README.md`, screenshoty v `screenshots/`; zdrojem pravdy je artefakt design systému). Tenhle soubor je jediné zadání: každý krok níže říká, které komponenty se ho týkají. Samostatné zadání pro vzhled neexistuje.

---

## Krok 1: Server, databáze a přihlášení přes Google

```
Pusť se do kroku 1 z PRDRequirements/mcp-integration/claude-code-prompts.md: server, databáze a přihlášení přes Google (PRD v33, sekce 4a, FR-23 a FR-24).

## Podklady (přečti si je celé, než začneš)
- CLAUDE.md (hlavně „Next work“ a „Data storage“), PRDRequirements/PRD-MVP.md sekce 0, 2, 3, 4a, 6a a 8z, PRDRequirements/build-status.md
- Vzhled: design/2026-10-mcp/README.md (sekce „Pro Claude Code“) a v design/2026-10-redesign/design-system/ soubory tokens.json, README.md a komponenty AccountMenu, SignInWithGoogle, ImportDialog, Banner

## Nejdřív plán, pak práce
Než cokoli změníš, napiš mi česky krátký plán po krocích: jak bude vypadat databáze (tabulky v prostých slovech), jaké knihovny použiješ a proč, co musím udělat já ručně (Google Cloud: OAuth klient, Cloudflare: D1 databáze, tajné proměnné) a seznam nejasností nebo rozporů s PRD. Počkej na moje OK.

## Co postavit
1. Stejný Cloudflare Worker, který dnes posílá statické soubory, dostane serverový kód: /api (data), /auth (přihlášení). Statické soubory a sdílené odkazy (FR-18) fungují dál.
2. Databáze Cloudflare D1 s verzovanými migracemi. Datový model odpovídá dnešnímu AppState. Každý dotaz omezený na přihlášeného uživatele.
3. Jedna vrstva operací na serveru (přidat/změnit/smazat položku, kategorii, gearlist, řádek gearlistu, snapshot, šablona), která hlídá pravidla PRD. Později ji bude používat i MCP server (krok 3), tak ji navrhni tak, aby nebyla svázaná s webem. Mazání je měkké (příprava na Undo v kroku 2).
4. Přihlášení jen přes Google („Sign in with Google“; dialog a tlačítko podle SignInWithGoogle), relace v bezpečné cookie. Navrhni řešení, které v kroku 3 půjde použít i pro OAuth MCP serveru (Cloudflare workers-oauth-provider s Google jako přihlášením). OAuth nestav ručně.
5. Režim bez účtu zůstává přesně jako dnes (localStorage, datový soubor FR-16, demo FR-17, Export/Import).
6. Po přihlášení appka čte a ukládá data přes /api. Datový soubor (FR-16) se s účtem nepoužívá. Chyby sítě a překročení limitu D1 srozumitelně oznámit, neuložené změny neztratit (vzhled: stav ukládání v AccountMenu, bannery limit a offline v Banner).
7. První přihlášení s lokálními daty: dialog s počty podle FR-23 (import / prázdný účet; do účtu s daty jen import jako nové; vzhled ImportDialog). Lokální data se nemažou.
8. „Load demo data“ s účtem jen do prázdného účtu.
9. Hlavička podle AccountMenu: host „Sign in“, přihlášený avatar/jméno s nabídkou Sign out (Connect to AI a Activity přidáš v krocích 4 a 2); místo stavu datového souboru stav ukládání. Tokeny design systému verze 2 (jen světlé hodnoty).
10. Rate limiting na /api podle FR-24. Ověř, jestli je Rate Limiting binding dostupný na bezplatném tarifu Workers; když ne, navrhni jinou bezplatnou cestu.

## Pevná pravidla
- Všechno na bezplatných tarifech (Cloudflare, Google). Než přidáš cokoli placeného nebo jinou službu, zeptej se.
- Repo je veřejné: tajné klíče jen přes `wrangler secret put` a lokálně v app/.dev.vars (přidej do .gitignore). Nic tajného do gitu.
- Pravidla z CLAUDE.md platí dál (3-cestný dialog, žádné duplicitní řádky, gramy, migrace dat).
- Nestav nic z dalších kroků (historie změn, MCP, Connect to AI).

## Hotovo, když
- Přihlásím se Googlem lokálně i na veřejné adrese, importuji svůj datový soubor do účtu a vidím stejná data v jiném prohlížeči po přihlášení.
- Bez přihlášení appka funguje jako dřív.
- Ověřeno se dvěma Google účty, že nikdo nevidí data toho druhého.
- npm run build projde, BACKLOG (položka do 🧪 Test s „Jak otestovat“), build-status.md a PRD (upřesnění z implementace) aktualizované.
```

---

## Krok 2: Historie změn a Undo

```
Pusť se do kroku 2 z PRDRequirements/mcp-integration/claude-code-prompts.md: historie změn a Undo (PRD v33, FR-25).

## Podklady
CLAUDE.md, PRD sekce 4a (FR-24, FR-25), build-status.md (záznam z kroku 1). Vzhled: design/2026-10-mcp/README.md a komponenty ActivityPanel, UndoDialog, Badge v design/2026-10-redesign/design-system/components/.

## Nejdřív plán, pak práce
Česky krátký plán: jak se změny zapisují (v prostých slovech), jak funguje Undo skupiny změn a konflikt, co uvidím v panelu Activity. Nejasnosti a rozpory s PRD. Počkej na moje OK.

## Co postavit
1. Každá změna z vrstvy operací (krok 1) se zapíše do historie: kdy, kdo (web / AI a jaký klient, zatím jen „You“), co, stav před a po. Změny z jedné akce jsou jedna skupina.
2. Undo pro jednotlivou změnu i skupinu; Undo je samo záznam v historii. Konflikt (věc se mezitím změnila) podle FR-25: upozornit, nechat rozhodnout.
3. Měkce smazané věci jdou vrátit přes Undo, trvale se odstraní po 30 dnech. Historie se uchovává 30 dní.
4. Panel „Activity“ na webu (boční panel, otevírá se z nabídky účtu) podle ActivityPanel: den jako nadpis s „Undo all AI changes from this day“ (vždy nejdřív potvrzení UndoDialog s počtem a konflikty), jeden krok AI = jeden řádek s jedním Undo, rozbalitelný na jednotlivé změny (žádná vyšší úroveň „sezení“), vlastní změny se štítkem „You“, AI se jménem klienta, konflikt, vrácené a smazané položky.

## Hotovo, když
Na webu udělám několik změn včetně smazání gearlistu, v Activity je vidím a každou jde vrátit. npm run build projde, BACKLOG, build-status.md a PRD aktualizované.
```

---

## Krok 3: MCP server (zatím jen text)

```
Pusť se do kroku 3 z PRDRequirements/mcp-integration/claude-code-prompts.md: vzdálený MCP server s OAuth (PRD v33, FR-26). Zatím bez widgetů (ty jsou krok 5).

## Podklady
CLAUDE.md, PRD sekce 3, 4a (FR-24 až FR-26), build-status.md. Aktuální dokumentace Cloudflare k remote MCP serverům (Agents SDK McpAgent, workers-oauth-provider) a specifikace MCP.

## Nejdřív plán, pak práce
Česky: seznam nástrojů (název, co dělá, vstupy, co vrací), jak se pravidla PRD promítnou do nástrojů (hlavně FR-5 a potvrzení snapshotu/šablony), jak funguje přihlášení AI klienta, co musím nastavit já. Nejasnosti. Počkej na moje OK.

## Co postavit
1. Endpoint /mcp ve stejném Workeru (Streamable HTTP), OAuth 2.1 + PKCE přes workers-oauth-provider, přihlášení stejným Google účtem jako na webu, obrazovka souhlasu s přístupem.
2. Nástroje na všechno, co může uživatel (FR-26), postavené nad vrstvou operací z kroku 1, ne vedle ní. Názvy a popisy anglicky, psané pro model.
3. FR-5 v nástroji: bez výslovné volby create_copy / update_everywhere se změna neprovede a nástroj vrátí dotčené gearlisty. Snapshot a šablona jen s výslovným potvrzením.
4. Každá změna jde do historie jako „AI (název klienta)“, Undo funguje.
5. Každý nástroj vrací čitelný text.
6. Rate limiting na /mcp. Na webu v panelu Activity sekce „Connected AI apps“ s „Revoke access“ a potvrzením (podle ActivityPanel; v nabídce účtu ne).

## Jak ověřit
MCP Inspector (npx @modelcontextprotocol/inspector), pak připojení v Claude (Settings → Connectors → Add custom connector) a v ChatGPT, pokud to jde na bezplatném účtu (pokud ne, napiš mi). Napiš mi 5 vět, které mám do Claude zkusit napsat.

## Hotovo, když
V Claude napíšu „Create a gearlist for 3 days in Jeseníky with rain from my gear“, gearlist se objeví na webu a v Activity je jako změna od AI s Undo. npm run build projde, BACKLOG, build-status.md a PRD aktualizované.
```

---

## Krok 4: Pop-up „Connect to AI“

```
Pusť se do kroku 4 z PRDRequirements/mcp-integration/claude-code-prompts.md: pop-up „Connect to AI“ (PRD v33, FR-28).

Tlačítko „Connect to AI“ v hlavičce a v nabídce účtu. Pop-up: 2–3 kroky pro Claude a pro ChatGPT, adresa MCP serveru s tlačítkem Copy, tlačítko OK, které okno zavře. Host uvidí vysvětlení, že je potřeba se přihlásit, a „Sign in with Google“. Vzhled a texty podle komponenty ConnectAIDialog (záložky Claude / ChatGPT, u ChatGPT poznámka „Needs ChatGPT Plus or Pro, on the web.“). Texty kroků drž na jednom místě v kódu. Ověř, že kroky v návodu odpovídají současnému rozhraní Claude a ChatGPT.

Hotovo, když podle návodu v pop-upu připojím Claude bez další pomoci. npm run build projde, BACKLOG, build-status.md a PRD aktualizované.
```

---

## Krok 5: Widgety MCP Apps

```
Pusť se do kroku 5 z PRDRequirements/mcp-integration/claude-code-prompts.md: interaktivní widgety v AI klientovi (PRD v33, FR-27).

## Podklady
CLAUDE.md, PRD 4a (FR-26, FR-27), design/2026-10-mcp/README.md (hlavně tabulka „Co se ve widgetech mění oproti webu a proč“ a sekce „Pro Claude Code“), komponenty Widget* v design/2026-10-redesign/design-system/components/ a `HB.miniPack` v bundle.js, makety v artefaktu Design (odkaz v README), aktuální specifikace MCP Apps a co z ní umí Claude a ChatGPT.

## Nejdřív plán, pak práce
Česky: které nástroje dostanou který widget, jak funguje návrh změn s Confirm / Reject, co se stane v klientovi bez podpory widgetů. Počkej na moje OK.

## Co postavit
Widgety podle FR-27 a komponent WidgetPackSummary, WidgetGearList, WidgetProposedChanges, WidgetItemCard, WidgetStates (souhrn gearlistu, seznam vybavení, návrh změn s Confirm / Reject / Confirm all, karta položky, potvrzení s odkazem „Open in HikingBuddy“, chybové a prázdné stavy). Větší změny nejdřív jako návrh, data se mění až po potvrzení: Confirm u jedné položky ukládá hned (samostatný krok AI), „Confirm all“ uloží zbytek jedním krokem a přeskočí položky s volbou FR-5 („Create a copy“ / „Update everywhere“). Textová odpověď zůstává. Světlý vzhled ve vlastní kartě; tmavý režim až na úplný konec celé stavby, pokud vyjdou tokeny (Martin, 2026-10-21).

Hotovo, když v Claude vidím widget se souhrnem gearlistu a návrh změn potvrdím přímo v chatu. npm run build projde, BACKLOG, build-status.md a PRD aktualizované.
```

---

## Krok 6: Eval MCP serveru

```
Pusť se do kroku 6 z PRDRequirements/mcp-integration/claude-code-prompts.md: eval MCP serveru (PRD v33, FR-26, „Měření úspěchu“).

Připrav 10 testovacích zadání podle FR-26 (česky i anglicky, léto/zima, jednodenní/vícedenní, mazání, konflikt FR-5) a tabulku: zadání, očekávané nástroje, vymyšlené vybavení (cíl 0), nechtěné změny (cíl 0), zeptal se model u konfliktu FR-5. Zadání projdu v Claude já a výsledky ti pošlu. Pak navrhni úpravy popisů nástrojů, uprav je a připrav druhé kolo. Výsledky obou kol (před/po) zapiš do build-status.md.
```
