# Design pro účty, Connect to AI, Activity a widgety v chatu (PRD v33, 2026-10-21)

Podklady pro vzhled novinek z PRD v33 (sekce 4a, FR-23 až FR-28). Zadání bylo `PRDRequirements/mcp-integration/claude-design-prompt.md`.

Stav: **návrh hotový, hlavní otázky rozhodnuté** (2026-10-21). Zbývá pár drobností na konci. Claude Code ho staví spolu s funkcemi po krocích podle jediného zadání `PRDRequirements/mcp-integration/claude-code-prompts.md`; tahle složka říká jen, jak má co vypadat.

## Kde co je

- **Design systém (zdroj pravdy):** artefakt „HikingBuddy“ (typ Design System), https://claude.ai/artifact/B57Xu9jGwHkA76fyoXW3tu. Aktualizovaný na místě (verze 27), nic původního se neodstranilo.
- **Kopie pro Claude Code:** `design/2026-10-redesign/design-system/` (stejná složka jako dosud, aktualizované soubory a nové komponenty, screenshoty nových komponent v `screenshots/`; screenshoty jsou s náhradním písmem).
- **Makety obrazovek:** artefakt Design „HikingBuddy · PRD v33“, https://claude.ai/artifact/QaAWrvG3T3Vco7fnD9i35o: widgety v chatu na telefonu (390 px) a na desktopu (sloupec 680 px), stavy widgetů, webové obrazovky v 1280 px, tmavé widgety zvlášť.

## Rozhodnutí Martina (2026-10-21)

1. Design systém se aktualizuje na místě, ne kopie. Zadání pro Claude Code ve stejné struktuře jako minule.
2. **Widgety v chatu: hybridní vzhled.** Písmo AI aplikace pro text, Barlow Condensed jen pro velké číslo Total a popisky, ember jen pro hlavní akce, barvy kategorií a batoh beze změny.
3. **Tmavý režim widgetů až na úplný konec stavby, pokud vyjdou tokeny.** Teď jen připravené tokeny a návrh.
4. **Změny od AI se v Activity seskupují podle kroku AI, jak říká PRD (FR-25):** všechno, co AI udělá jedním krokem (např. „vytvořil gearlist s 25 položkami“), je jeden řádek s jedním Undo. Několik kroků za sebou jsou samostatné řádky; žádná vyšší úroveň „sezení“ není.
5. **Confirm u jedné navržené změny ve widgetu ji uloží hned** (je to samostatný krok AI a samostatný řádek v Activity). „Confirm all“ uloží zbytek jedním krokem. Když chat v půlce zavřeš, potvrzené změny zůstanou.
6. „Confirm all“ přeskočí položky s volbou podle FR-5 a napíše to.
7. Připojení ChatGPT jen na Plus nebo Pro, na webu (v pop-upu je to napsané).

## Co je nové

**Web**
- Hlavička: host „Connect to AI“ + „Sign in“; přihlášený „Connect to AI“ + avatar a jméno s nabídkou Connect to AI / Activity / Sign out. Místo stavu datového souboru stav ukládání („Saved“, „Offline · changes kept“, „Daily limit reached“).
- Dialog „Sign in“ (co účet přidá) a tlačítko „Sign in with Google“ podle pravidel Google.
- Dialog importu lokálních dat po prvním přihlášení (prázdný účet / účet s daty), s počty.
- Pop-up „Connect to AI“: záložky Claude / ChatGPT, 3 kroky, adresa serveru s Copy, OK. Varianta pro hosta.
- Panel Activity (boční panel zprava): připojené AI aplikace s „Revoke access“, den jako nadpis s „Undo all AI changes from this day“, krok AI jako hlavní jednotka Undo (rozbalitelný na jednotlivé změny), vlastní změny se štítkem „You“, konflikt při Undo, vrácené a smazané položky.
- Potvrzení „Undo AI changes from today?“ s počtem a konflikty, potvrzení „Revoke access“.
- Bannery pro denní limit a offline.

**Widgety v chatu (MCP Apps)**
- Souhrn gearlistu (Total, Base / Consumables / Worn, kategorie, malý batoh s úrovní).
- Seznam vybavení (8 řádků, pak „Show all N items“).
- Návrh změn s Confirm / Reject u každé položky a „Confirm all“. U položky použité jinde (FR-5) volba „Create a copy“ / „Update everywhere“.
- Karta položky.
- Stavy: načítání (kostra), uloženo s odkazem „Open in HikingBuddy“, prázdné, denní limit, chyba, ukončený přístup, zastaralý návrh.

## Co se ve widgetech mění oproti webu a proč

| Na webu | Ve widgetu | Proč |
|---|---|---|
| Písmo Overpass, Barlow pro nadpisy a čísla | Písmo AI aplikace, Barlow jen pro Total a popisky | Widget vypadá jako součást chatu. ChatGPT ve svých pravidlech vlastní písma nechce; Barlow jde vypnout jednou proměnnou. |
| Panely se stínem nad krajinou | Jedna karta `surface` s tenkým okrajem, bez stínu, bez krajiny a bez loga | Pozadím je teď chat. AI aplikace samy ukazují název appky, ChatGPT logo zakazuje. |
| Ikony bez textu s tooltipem | Žádné ikony bez textu, žádné tooltipy; Worn / Consumable jako textové štítky | V mobilní AI aplikaci není najetí myší a tooltipy se v rámečku ořežou. Stejně jako na sdílené stránce na telefonu. |
| Seznam se posouvá v panelu | Uvnitř widgetu se nic neposouvá: 8 řádků + „Show all“ | AI aplikace posouvají celou konverzaci a výšku widgetu omezují. Posuvník uvnitř chatu by se zasekl nebo ořízl. (Zadání říkalo „scrollable“; tohle je způsob, který v chatu funguje.) |
| Tlačítka 38 px (44 px na dotyk) | Všechno 44 px | Stejný widget se zobrazuje i v mobilu. |
| Menu, víc akcí | Nejvýš 2 akce dole, žádná menu | Pravidla Claude i ChatGPT a ořezávání v rámečku. |
| Velký batoh s procenty a popisky | Malý batoh (96–112 px) s úrovní slovy, čísla v seznamu kategorií | V téhle velikosti by procenta nešla přečíst. |
| Dialog Cancel / Create a copy of the item / Continue | Tlačítka v řádku Reject / Create a copy / Update everywhere | Blokující dialog v chatu být nemůže a „Continue“ bez dialogu nedává smysl. Stejné tři výsledky, 1:1 k volbě v MCP (`create_copy` / `update_everywhere`). |

Ostatní (barvy, rozestupy, kategorie, tvar batohu, pořadí vrstev, formát vah, pravidla textů) zůstává.

## Tmavý režim (připraveno, nestaví se)

V `tokens.json` je téma `dark` jen pro widgety: tmavé hodnoty všech barev, které widget používá, s ověřeným kontrastem (text 13,4 : 1, tlumený text 8,4 : 1, ember 5,3 : 1). Barvy kategorií jsou světlejší, aby byly vidět na tmavém pozadí, a drží pořadí světlosti, takže sousední vrstvy batohu se dál liší. V tmavém režimu je pozadí widgetu průhledné. Webová appka zůstává jen světlá.

## Zbývající drobné otázky (Claude Code se na ně zeptá v plánu)

1. **Undo přímo ve widgetu po uložení** nenavrhuji (widget odkazuje na Activity). Chceš ho? Bylo by to nové chování, patří do PRD.
2. **Activity jako boční panel přes appku** (s ztmavením pozadí). OK, nebo radši vlastní stránka?
3. **Tlačítko Google:** doporučuji oficiální tlačítko, které vykreslí Google (splňuje jejich pravidla).
4. **„27 new“ u Activity v nabídce účtu** (počet AI změn od posledního otevření) je drobná novinka navíc. Nechat, nebo vyhodit?
5. **Odvolání přístupu AI je v panelu Activity** (Connected AI apps), ne v nabídce účtu. Krok 3 v `claude-code-prompts.md` je podle toho upravený.

## Opraveno po kontrole (2026-10-21)

- Ikony v kruzích (Connected AI apps, výhody v dialogu Sign in) a iniciály v avataru v nabídce účtu nebyly vycentrované. Příčina: obecné CSS pravidlo pro texty (`span`) se omylem vztahovalo i na ikony. Opraveno v `bundle.css`.

## Pro Claude Code

Zadání a pořadí kroků: jen `PRDRequirements/mcp-integration/claude-code-prompts.md`. Tahle sekce platí pro vzhled ve všech krocích. Když se návrh a PRD rozcházejí, zeptej se Martina.

- **Chování se mění jen tam, kde to říká PRD v33.** Inline editace, blokující 3-cestný dialog (FR-5), Worn/Consumable na řádku, snapshot, šablona, drag & drop, sdílení a režim bez účtu zůstávají přesně jako dnes.
- **Datový model webu se kvůli vzhledu nemění.** Barvy kategorií se dál odvozují (výchozí podle id, vlastní podle pořadí → `cat-custom-1` až `4`).
- **Tokeny:** CSS proměnné z `tokens.json` (verze 2). Web používá jen světlé hodnoty. Blok `[data-theme="dark"]` patří jen do balíku widgetů a zatím se nezapíná: webová appka nikdy nenastavuje `data-theme`.
- **Ikony:** Lucide jako dosud. AI aplikace = `bot` všude (tlačítko, Activity, štítky), Activity `history`, Undo `undo-2`, Sign in / out `log-in` / `log-out`, Saved `cloud`, Offline `cloud-off`, limit `hourglass`. Mapa je v README design systému.
- **Texty v UI anglicky, přesně podle READMEs komponent** (např. „Undo all AI changes from this day“, „HikingBuddy reached today's free limit, try again tomorrow“ ve widgetu jako nadpis + věta). Kdo změnu udělal: „You“ nebo název AI aplikace, jak se zaregistrovala („Claude“, „ChatGPT“).
- **Tlačítko „Sign in with Google“** podle pravidel Googlu (bílé, šedý okraj, oficiální logo „G“), nebo oficiální tlačítko, které vykreslí Google Identity Services. Logo Googlu nekresli sám.
- **Widgety (MCP Apps):**
  - Samostatný malý balík (HTML zdroje `ui://…`), ne webová appka. Žádné Overpass, žádná krajina, žádné logo.
  - Písmo: výchozí `--font-chat` (systémové); když AI aplikace pošle své proměnné stylu, nastav `--hbw-font: var(--font-sans)` hostitele. Pozor: hostitel posílá `--font-sans`, které má na webu jiný význam (Overpass), proto ve widgetu `--font-sans` z našich tokenů nedefinuj.
  - **V1 jen světlé ve vlastní kartě `surface`** bez ohledu na téma AI aplikace (PRD FR-27). `prefersBorder: false`, okraj kreslí karta sama.
  - Šířka od 320 px, výška podle obsahu, uvnitř se nic neposouvá, ovládací prvky 44 px, nejvýš 2 akce dole, žádné tooltipy ani menu.
  - „Open in HikingBuddy“ otevírej přes hostitele (open-link z MCP Apps SDK), ne přes `<a target>`.
  - Malý batoh: port `HB.miniPack` se stejnou geometrií jako `BackpackChart` (`PACK`, `GEAR`, `TIERS`, `layerHeights` sdílej, nekopíruj dvakrát).
  - Ke každému widgetu vrací nástroj i čitelný text (FR-26).
- Repo je veřejné, nic tajného ani osobních dat do gitu.

**Ověření vzhledu** (v každém kroku, který mění vzhled): Playwright screenshoty desktop 1440 px a telefon 390 px nových obrazovek (hlavička host/přihlášený s otevřenou nabídkou, Sign in, import, Connect to AI obě záložky + host, Activity s rozbaleným krokem AI a konfliktem, potvrzení Undo dne); widgety samostatně v šířce 360 a 680 px. Ulož do `design/2026-10-mcp/implemented/` a porovnej se screenshoty v design systému a s maketami. Proklikej, že se chování webu nezměnilo (inline editace včetně Escape, 3-cestný dialog, Worn/Consumable bez dialogu, režim bez účtu).
