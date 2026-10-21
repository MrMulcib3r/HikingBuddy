# Design pro účty, Connect to AI, Activity a widgety v chatu (PRD v33, 2026-10-21)

Podklady pro vzhled novinek z PRD v33 (sekce 4a, FR-23 až FR-28). Zadání bylo `PRDRequirements/mcp-integration/claude-design-prompt.md`.

Stav: **návrh hotový, čeká na Martinovo schválení** (otázky na konci). Po schválení ho Claude Code staví po krocích podle `claude-code-prompt.md` v této složce.

## Kde co je

- **Design systém (zdroj pravdy):** artefakt „HikingBuddy“ (typ Design System), https://claude.ai/artifact/B57Xu9jGwHkA76fyoXW3tu. Aktualizovaný na místě (verze 26), nic původního se neodstranilo.
- **Kopie pro Claude Code:** `design/2026-10-redesign/design-system/` (stejná složka jako dosud, aktualizované soubory a nové komponenty, screenshoty nových komponent v `screenshots/`; screenshoty jsou s náhradním písmem).
- **Makety obrazovek:** artefakt Design „HikingBuddy · PRD v33“, https://claude.ai/artifact/QaAWrvG3T3Vco7fnD9i35o: widgety v chatu na telefonu (390 px) a na desktopu (sloupec 680 px), stavy widgetů, webové obrazovky v 1280 px, tmavé widgety zvlášť.

## Rozhodnutí Martina (2026-10-21)

1. Design systém se aktualizuje na místě, ne kopie. Zadání pro Claude Code ve stejné struktuře jako minule.
2. **Widgety v chatu: hybridní vzhled.** Písmo AI aplikace pro text, Barlow Condensed jen pro velké číslo Total a popisky, ember jen pro hlavní akce, barvy kategorií a batoh beze změny.
3. Tmavý režim: jen připravit (tokeny + návrh), nestavět.

## Co je nové

**Web**
- Hlavička: host „Connect to AI“ + „Sign in“; přihlášený „Connect to AI“ + avatar a jméno s nabídkou Connect to AI / Activity / Sign out. Místo stavu datového souboru stav ukládání („Saved“, „Offline · changes kept“, „Daily limit reached“).
- Dialog „Sign in“ (co účet přidá) a tlačítko „Sign in with Google“ podle pravidel Google.
- Dialog importu lokálních dat po prvním přihlášení (prázdný účet / účet s daty), s počty.
- Pop-up „Connect to AI“: záložky Claude / ChatGPT, 3 kroky, adresa serveru s Copy, OK. Varianta pro hosta.
- Panel Activity (boční panel zprava): připojené AI aplikace s „Revoke access“, den jako nadpis s „Undo all AI changes from this day“, AI sezení jako hlavní jednotka Undo (rozbalitelné na jednotlivé změny), vlastní změny se štítkem „You“, konflikt při Undo, vrácené a smazané položky.
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

## Otázky pro Martina (před stavbou)

1. **Co je AI sezení?** PRD (FR-25) říká „změny z jednoho kroku AI jsou jedna skupina“. Zadání pro design chce sezení („Claude, 14:02–14:10, 27 changes“). Návrh: sezení = po sobě jdoucí změny od stejné AI aplikace bez pauzy delší než 30 minut; kroky AI uvnitř sezení se nezobrazují zvlášť. Souhlasíš?
2. **Confirm u jedné položky uloží změnu hned** (každá je jedna změna v Activity). Alternativa je nic neukládat až do „Confirm all“. Doporučuji ukládat hned, je to srozumitelnější.
3. **„Confirm all“ přeskočí položky s FR-5 volbou** (Sawyer Squeeze použitý v dalších gearlistech) a řekne to. Nikdy nerozhodne za tebe. OK?
4. **Activity jako boční panel přes appku** (s ztmavením pozadí). OK, nebo radši vlastní stránka?
5. **Undo přímo ve widgetu po uložení** nenavrhuji (widget odkazuje na Activity). Chceš ho? Bylo by to nové chování, patří do PRD.
6. **Tmavé widgety:** Claude ve svých pravidlech píše, že widgety mají podporovat světlý i tmavý režim. V1 je světlá karta, v tmavém Claude bude vypadat jako světlý ostrůvek (čitelný, jen méně „nativní“). Tokeny jsou hotové, takže tmavý režim widgetů je malá práce. Zvážit posun z ⚪ Někdy do kroku 5?
7. **ChatGPT:** vlastní MCP server jde připojit jen na Plus nebo Pro, na webu (v pop-upu to je napsané). Na bezplatném ChatGPT to nepůjde.
8. **Tlačítko Google:** buď oficiální tlačítko, které vykreslí Google (načte jejich skript), nebo vlastní podle jejich pravidel s oficiálním logem „G“. Doporučuji oficiální, je to nejjednodušší a splňuje pravidla Googlu.
9. **„27 new“ u Activity v nabídce účtu** (počet AI změn od posledního otevření) je drobná novinka navíc. Nechat, nebo vyhodit?
10. **Odvolání přístupu AI je v panelu Activity** (sekce Connected AI apps), ne v nabídce účtu. Zadání kroku 3 v `claude-code-prompts.md` zatím říká „v nabídce účtu“; po schválení ho upravit.

## Pro Claude Code

Zadání: `claude-code-prompt.md` v této složce. Když se návrh a PRD rozcházejí, zeptej se Martina.
