Implementuj vzhled novinek z PRD v33 (účty, Connect to AI, Activity, widgety MCP Apps) podle aktualizovaného design systému. Nestavíš nic nového navíc: vzhled patří ke krokům z `PRDRequirements/mcp-integration/claude-code-prompts.md` a staví se spolu s nimi, krok po kroku.

## Podklady (přečti si je celé, než začneš)
- `CLAUDE.md`, `PRDRequirements/PRD-MVP.md` (sekce 3 a 4a, FR-23 až FR-28), `PRDRequirements/build-status.md`
- `PRDRequirements/mcp-integration/claude-code-prompts.md`: pořadí kroků 1 až 6, tohle zadání k nim jen přidává vzhled
- `design/2026-10-mcp/README.md`: co je nové, co se ve widgetech mění oproti webu a proč, Martinova rozhodnutí a otevřené otázky
- `design/2026-10-redesign/design-system/README.md`: hlavní pravidla vzhledu; nové sekce „In-chat widgets“ a „Dark widgets“, na konci „For Claude Code · PRD v33 additions“
- `design-system/tokens.json` a `tokens.css`: verze 2. Nové: `gsi-*`, písmo `chat`, styly `w-*`, rozměry `layout`, téma `dark` (jen pro widgety, zatím se nepoužívá)
- `design-system/components/<Komponenta>/README.md` a `preview.html` pro nové komponenty: AccountMenu, SignInWithGoogle, ImportDialog, ConnectAIDialog, ActivityPanel, UndoDialog, WidgetPackSummary, WidgetGearList, WidgetProposedChanges, WidgetItemCard, WidgetStates, WidgetDark; doplněné Badge, Banner, Dialog
- `design-system/components/bundle.css` (třídy `hb-*` pro web, `hbw-*` pro widgety) a `bundle.js` (nové `HB.miniPack`, `HB.tier`). Předloha, přepiš do React/TS, nekopíruj tak, jak je.
- `design-system/screenshots/`: jak mají nové komponenty vypadat (s náhradním písmem). Makety celých obrazovek jsou v artefaktu Design (odkaz v `design/2026-10-mcp/README.md`).

## Nejdřív plán, pak práce
Než cokoli změníš, napiš mi česky krátký plán: které komponenty postavíš v kterém kroku, jak oddělíš widgety od webové appky (zvláštní malý balík pro MCP Apps), a seznam nejasností nebo rozporů s PRD. Otázky z `design/2026-10-mcp/README.md`, na které ještě nemám odpověď, mi polož znovu. Počkej na moje OK.

## Pevná pravidla
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

## Postup (vzhled ke každému kroku z `claude-code-prompts.md`; po každém kroku commit, `npm run build` musí projít)
1. **S krokem 1 (účty):**
   - Tokeny verze 2 do `index.css` (jen světlé hodnoty + nové `gsi-*`, `font-chat`, `layout`).
   - Hlavička podle AccountMenu: host „Sign in“ (a „Connect to AI“ až v kroku 4), přihlášený avatar + jméno + nabídka (zatím jen Sign out; Connect to AI a Activity přidáš v krocích 4 a 2). Stav ukládání místo stavu datového souboru.
   - Dialog SignInWithGoogle, ImportDialog (obě varianty: prázdný účet / účet s daty; blokující).
   - Bannery „HikingBuddy reached today's free limit.“ a „You are offline.“ (Banner, warning).
2. **S krokem 2 (historie a Undo):** ActivityPanel (boční panel, den, AI sezení, vlastní změny, jednotlivé změny, konflikt, vrácené, smazané), UndoDialog, štítky `--ai`, `--you`, `--deleted`, `--undone`. Položka „Activity“ v nabídce účtu. Pokud ještě není rozhodnuto, co je AI sezení (otázka 1 v README), zeptej se mě.
3. **S krokem 3 (MCP server):** sekce „Connected AI apps“ v Activity s „Revoke access“ a potvrzením. Odvolání přístupu je v Activity, ne v nabídce účtu (upřesnění oproti `claude-code-prompts.md`).
4. **S krokem 4:** ConnectAIDialog (záložky Claude / ChatGPT, 3 kroky, adresa s Copy, OK; varianta pro hosta). Texty kroků drž na jednom místě v kódu a před vydáním je ověř proti aktuálnímu rozhraní Claude a ChatGPT. „Connect to AI“ v hlavičce i v nabídce účtu.
5. **S krokem 5 (widgety):** WidgetPackSummary, WidgetGearList, WidgetProposedChanges (Confirm / Reject, FR-5 jako „Create a copy“ / „Update everywhere“, „Confirm all (N)“ přeskočí FR-5 položky), WidgetItemCard, WidgetStates (kostra místo spinneru, uloženo, prázdné, limit, chyba, ukončený přístup, zastaralý návrh). Tmavý režim nestav.
6. **Ověření (po každém kroku, který mění vzhled):** `npm run build` a `npm run lint`. Playwright screenshoty desktop 1440 px a telefon 390 px: hlavička host/přihlášený s otevřenou nabídkou, Sign in, import, Connect to AI (obě záložky + host), Activity s rozbaleným sezením a konfliktem, potvrzení Undo dne. Widgety vyrenderuj samostatně v šířce 360 a 680 px. Ulož do `design/2026-10-mcp/implemented/` a porovnej se screenshoty v design systému a s maketami. Proklikej, že se chování webu nezměnilo (inline editace včetně Escape, 3-cestný dialog, Worn/Consumable bez dialogu, režim bez účtu).
7. **Záznam:** zápis do `build-status.md`, `BACKLOG.md` (položky do 🧪 Test s „Jak otestovat“), a pokud jsem schválil odpovědi na otázky z README, propiš je do PRD (nová verze + sekce 8 „Rozhodnutí“). Na konci mi česky shrň, co se změnilo, co jsi ověřil, co se nepovedlo a jak si to mám vyzkoušet.
