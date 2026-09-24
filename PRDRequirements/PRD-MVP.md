# HikingBuddy — MVP PRD (v9)

**Status:** Implementováno, aligned s Martinem 2026-09-24 (v9)
**Nahrazuje:** `gemini-code-1789054094052.txt` (v1, plný rozsah) — ten zůstává jako referenční "vize appky do budoucna", tohle je co skutečně stavíme teď.
**Historie:** v2 = základní MVP (Gear Vault + gearlisty + snapshot). v3 = rozpad váhy, vyhledatelnost kategorií, layout. v4 = Draft/Finalize životní cyklus gearlistu (nahrazuje okamžitý snapshot), přejmenování "Gear closet" → "Gear Vault", detaily formuláře položky. v5 = doplněn "Gearlist Template" jako feature beyond MVP. v6 = doplněna dlouhodobá produktová vize — komunitní sdílení gearlistů (sekce 9). v7 = zásadní přepracování životního cyklu gearlistu (Draft/Finalized zrušen, nahrazen vždy editovatelným gearlistem + snapshotem), Worn/Consumable přesunuto na gearlist item, plně inline editace, drag & drop. **v8 = řešení trvanlivosti dat:** Martin správně upozornil, že appka dosud neměla žádnou ochranu proti tomu, že si uživatel v prohlížeči smaže data stránek — což by nenávratně smazalo úplně všechno. Přidána (a zpětně aplikována) **politika migrace dat** (žádná budoucí změna datového modelu už nesmí tiše smazat existující data — přesně tohle se omylem stalo přechodem na v7) + **Export/Import zálohy do souboru** jako skutečná ochrana nezávislá na prohlížeči + navržený plán skutečné databáze (lokální a budoucí serverová) — viz sekce 6a. **v9 = smazání Gear Vault položky použité v gearlistech má stejný blokující třívolbový dialog jako její editace** (Cancel / Keep in gearlists / Delete everywhere) — dřív se řádky v gearlistech jen tiše odpojily.

---

## 1. Problém, který řešíme (MVP)

1. **Kritické vybavení nesmí chybět v terénu.** Martin jezdí na náročné treky (např. Nordkalottleden). Pokud v arktické tundře, dny od civilizace, zjistí, že mu chybí vybavení, nedá se s tím nic dělat — je pozdě.
2. **Současné řešení (lighterpack.com) tenhle problém způsobuje.** Když Martin upraví/smaže položku ve svém "gear closetu" (databázi vybavení, které vlastní), změna se propíše do *všech* jeho starých gearlistů, aniž by o tom věděl. Starý gearlist tak může vypadat kompletní, ale ve skutečnosti v něm chybí věc, kterou Martin mezitím z databáze odebral — a pokud si ho vezme jako podklad pro nový trek, riziko z bodu 1 se naplní.
3. **Ultralight hikeři sledují konkrétní váhovou metriku — "base weight".** Aby Martin věděl, jestli spadá do kategorie "ultralight", potřebuje vidět rozpad váhy gearlistu, ne jen jedno celkové číslo.
4. **Rozsáhlý Gear Vault je nepřehledný.** S desítkami až stovkami položek vybavení je těžké v jednom dlouhém seznamu něco najít, pokud položky nejdou filtrovat/seskupovat podle kategorie.
5. **Během přípravy na trek chce Martin gearlist průběžně ladit** (opravit špatně zadanou váhu, doplnit položku) — a to i po tom, co ho "sbalí" na cestu. Zároveň ale chce mít možnost si kdykoliv uložit "otisk" toho, co si konkrétně vzal, aby to zůstalo zaznamenané.
6. **Sestavení nového gearlistu od nuly zabírá zbytečně moc času a hrozí opomenutí.** Martin si na trek opakovaně bere stejný okruh základního vybavení (stan, spacák, vařič...). Přesto při zakládání nového gearlistu dnes musí každou takovou položku znovu ručně vyhledat v Gear Vaultu a přidat ji — to je zdlouhavé a hlavně riskantní: pokud na některou opakovaně používanou položku při ručním skládání zapomene, gearlist bude neúplný, aniž by o tom Martin věděl (viz riziko v bodě 1). Tohle je motivace pro Gearlist Template popsaný v sekci 7 — je to ale rozšíření nad rámec MVP, ne požadavek na první verzi appky.
7. **Ruční přeznačování skupiny položek (např. "kterých 10 věcí je dnes na mně, ne v batohu") musí jít rychle**, jednu položku po druhé, jedním kliknutím — appka záměrně nemá hromadné (batch) úpravy více položek najednou (viz sekce 3).
8. **Data nesmí zmizet — ani proto, že appka sama změní datový model, ani proto, že uživatel omylem/úmyslně smaže data prohlížeče.** MVP appka zatím nemá účet ani server (viz sekce 2), takže všechna data žijí jen v jednom prohlížeči na jednom počítači — to appku dělá zranitelnou vůči oběma těmhle rizikům. Řešení viz sekce 6a.

## 2. Co MVP řeší a co ne

**Řeší:**
- Uložení vybavení do osobní databáze (**Gear Vault**).
- Sestavení gearlistu (seznam vybavení pro konkrétní trek) z Gear Vaultu — gearlist je **vždy editovatelný**, nemá žádný "uzamčený" stav.
- Možnost kdykoliv uložit **snapshot** aktuálního obsahu gearlistu jako záznam toho, co si Martin vzal — nezávisle na tom, že gearlist samotný jde dál upravovat.
- Rozpad váhy gearlistu na Base Weight / Worn Weight / Consumables / Total Weight, kde Worn a Consumable jsou vlastnosti konkrétního řádku v gearlistu (ne vlastnost položky v Gear Vaultu).
- Kategorizaci vybavení pro snadnou orientaci ve velkém Gear Vaultu.
- Plně "inline" editaci — Gear Vault i gearlisty se ovládají kliknutím přímo na hodnotu (název, kategorie, váha, množství), podobně jako buňky v Excelu / na lighterpack.com — bez samostatných formulářů/tlačítek "Edit" pro běžné úpravy.
- Ruční přeřazování pořadí (drag & drop) položek, kategorií a gearlistů.
- **Trvanlivost dat napříč změnami appky samotné** (automatická migrace při každé změně datového modelu, viz sekce 6a) **a záloha nezávislá na prohlížeči** (Export/Import do skutečného souboru, viz sekce 6a) — obojí od v8.

**Neřeší (vědomě odloženo na později):**
- Přihlašování / účty — appka je zatím jednouživatelská, data jen v prohlížeči (+ souborová záloha, viz sekce 6a).
- Offline režim — appka v MVP vyžaduje připojení k internetu. (Zdůvodnění: hlavní problém je nekompletnost gearlistu zjištěná *před* odjezdem, ne přístup k datům v terénu bez signálu — když už je Martin v terénu, offline appka mu chybějící vybavení stejně nedoveze.)
- Veřejné sdílení gearlistu přes URL.
- Grafy/vizualizace váhy (číselný rozpad ano, koláčový graf jako na lighterpack.com zatím ne).
- Hromadné (batch) úpravy více položek najednou — záměrně vynecháno, viz sekce 3.
- Víc než jeden uložený snapshot na gearlist (historie snapshotů) — viz sekce 3.
- **Skutečná databáze na serveru** (s automatickou synchronizací mezi zařízeními, bez nutnosti ručního Exportu/Importu) — navrženo v sekci 6a jako budoucí fáze, zatím neimplementováno.
- **Gearlist Template** (předdefinovaná sada výchozího vybavení pro nový gearlist) — viz sekce 7, bod 5.
- **Komunitní sdílení gearlistů** — dlouhodobá vize appky, viz sekce 9.

## 3. Klíčové rozhodnutí: gearlist je vždy editovatelný + snapshot (nahrazuje dřívější Draft/Finalized)

**Tohle je největší architektonická změna oproti v4-v6.** Dřívější model (Draft → Finalize → needitovatelný navždy) se v praxi ukázal jako zbytečně svazující: jakmile byl gearlist jednou finalizovaný, jakákoli, byť drobná oprava (překlep ve váze, doplnění zapomenuté položky) vyžadovala vytvořit celou novou kopii gearlistu. Nový model:

**Gearlist je vždy editovatelný.** Neexistuje "zamčený" stav. Položky v gearlistu, které odkazují na položku v Gear Vaultu ("linked"), zůstávají živě propojené — úprava v Gear Vaultu se do nich může promítnout (viz níže, potvrzovací dialog).

**Snapshot — ruční "otisk" aktuálního stavu.** Kdykoliv (typicky těsně před odjezdem) může Martin kliknout na tlačítko **"Save snapshot"**. Appka tím uloží kopii aktuálního obsahu gearlistu (název, kategorie, váha, množství, Worn/Consumable příznaky u každé položky) jako samostatný záznam, oddělený od živého, dál editovatelného gearlistu. Snapshot lze kdykoliv zobrazit tlačítkem "View snapshot" (needitovatelný náhled). Gearlist má **jeden** snapshot — opakované uložení ten předchozí přepíše (appka na to před přepsáním upozorní potvrzovacím dialogem). Snapshot tedy slouží jako "vzpomínka na to, co jsem si vzal", ne jako ochrana proti budoucím úpravám gearlistu — ty jsou možné vždy.

**Jak appka řeší původní problém č. 2 (retroaktivní rozbití starého gearlistu) bez Finalize:** Přes potvrzovací dialog při každé editaci, ne přes uzamčení stavu. Kdykoliv úprava — ať už přímo v Gear Vaultu, nebo přímo kliknutím na položku uvnitř některého gearlistu — mění "jádrová" pole (název, kategorie, váha) položky, která je použitá i jinde (v jiném gearlistu, nebo víckrát v tomtéž), appka **vždy** zobrazí blokující dialogové okno se třemi možnostmi, nikdy tichou notifikaci ("toast") — protože data se nesmí uživateli změnit pod rukama, aniž by o tom věděl a explicitně se rozhodl:
- **Zrušit (Cancel):** úprava se zahodí, nic se nezmění.
- **Vytvořit kopii položky (Create a copy of the item):** do Gear Vaultu přibyde nová položka s novými hodnotami; všechny existující gearlisty (a případně i ostatní řádky ve stejném gearlistu) zůstávají beze změny napojené na původní, nezměněnou položku — mění se jen ten jeden konkrétní řádek, ze kterého úprava vyšla (přepojí se na novou kopii).
- **Pokračovat (Continue):** úprava se uloží do sdílené položky v Gear Vaultu, a promítne se tedy do všech gearlistů, které ji používají.

Tenhle dialog se **nikdy** nezobrazuje při přepínání příznaků Worn/Consumable nebo úpravě množství/poznámky uvnitř gearlistu — to jsou čistě vlastnosti daného řádku v daném gearlistu (viz FR-9), nemají žádný dopad mimo něj.

**Proč tenhle model místo Draft/Finalize:** Řeší stejné riziko (retroaktivní tichá změna starého gearlistu) přesněji — rozhoduje se na úrovni jednotlivé úpravy, ne na úrovni celého gearlistu, takže Martin může gearlist donekonečna doladit (i po odjezdu, i po vytvoření snapshotu), aniž by musel zakládat nové a nové kopie jen kvůli drobné opravě.

## 4. Funkční požadavky (MVP)

- **FR-1. Gear Vault (CRUD):** Vytvořit, zobrazit, upravit a smazat položku vybavení. Položka má: Název, Kategorii (nepovinná), Poznámku/popis (nepovinné — např. "Snickers s bílou čokoládou"), Váhu, Výchozí množství (Quantity). *(Typ váhy Base/Worn/Consumable od v7 není vlastností Gear Vault položky — viz FR-9.)*
- **FR-2. Kategorie — předdefinovaný template s vlastní úpravou:** Appka nabídne předdefinovaný seznam kategorií (Backpack, Shelter, Sleep System, Clothing, Cooking, Food, Water, Electronics, Hygiene, Misc) jako výchozí "template". Uživatel může kteroukoli kategorii přejmenovat, smazat, přidat vlastní novou, nebo přeřadit jejich pořadí drag & dropem.
- **FR-3. Jednotky:** Přepínání zobrazení mezi metrickými (g/kg) a imperiálními (oz/lb) jednotkami. Interně se váha ukládá v jedné jednotce (gramy), aby nevznikaly zaokrouhlovací chyby.
- **FR-4. Gearlisty — vytvoření a editace:** Vytvořit pojmenovaný gearlist, přidat do něj položky z Gear Vaultu, upravit množství konkrétně pro tento gearlist (nezávisle na výchozím množství v Gear Vaultu). Gearlist je vždy editovatelný (viz sekce 3). Přidání položky z Gear Vaultu, která už v gearlistu je, **navýší množství existujícího řádku**, nevytvoří duplicitní řádek.
- **FR-5. Živé propojení s Gear Vaultem + potvrzovací dialog (Cancel / Create a copy / Continue):** Položky v gearlistu, které odkazují na položku v Gear Vaultu ("linked"), zrcadlí její název/kategorii/váhu. Úprava těchto polí — ať už přímo v Gear Vaultu, nebo přímo kliknutím na položku uvnitř gearlistu — kde je položka použita i jinde, vyžaduje explicitní volbu uživatele mezi Cancel / Create a copy of the item / Continue (viz sekce 3). Vždy blokující dialog, nikdy toast. **Totéž platí pro smazání (v9):** smazání Gear Vault položky, která je použitá v nějakém gearlistu, vždy zobrazí blokující dialog **Cancel / Keep in gearlists / Delete everywhere** — "Keep in gearlists" smaže položku jen z Gear Vaultu a řádky v gearlistech nechá jako odpojené "custom entry" s posledními známými hodnotami (obdoba "Create a copy"); "Delete everywhere" položku odstraní z Gear Vaultu i ze všech gearlistů (obdoba "Continue"). Uložené snapshoty (FR-6) se nemění nikdy. Položka nepoužitá v žádném gearlistu se maže po jednoduchém potvrzení.
- **FR-6. Snapshot:** Tlačítko "Save snapshot" na gearlistu uloží kopii (otisk) aktuálního obsahu — jméno, kategorie, váha, množství, Worn/Consumable, poznámka u každé položky — oddělenou od dál editovatelného gearlistu. Jeden gearlist = jeden snapshot; opakované uložení předchozí přepíše (s potvrzením). Tlačítko "View snapshot" zobrazí needitovatelný náhled uloženého snapshotu včetně data uložení.
- **FR-7. *(zrušeno v7 — nahrazeno FR-5/FR-6, žádný "Finalized" needitovatelný stav už neexistuje.)***
- **FR-8. Automatické doplnění kategorie:** Pokud položka nemá přiřazenou kategorii, zobrazuje se jako "Uncategorized". V Gear Vaultu samotném kategorie povinná není (aby přidání nové položky nebylo zdržováno).
- **FR-9. Worn / Consumable jako vlastnost konkrétního řádku v gearlistu (ne Gear Vault položky):** Každý řádek v gearlistu má dva **nezávislé** příznaky — **Worn** (nošeno na těle, ne v batohu) a **Consumable** (spotřebovává se — jídlo, voda, palivo...). Žádný z nich nastavený = počítá se do **Base Weight** (věci v batohu, které se během treku nespotřebovávají). Přepnutí kteréhokoli příznaku je jedno kliknutí a **nikdy nezobrazuje potvrzovací dialog** — je to čistě vlastnost daného řádku v daném gearlistu, nemá žádný dopad na Gear Vault ani na jiné gearlisty. Typický důvod pro nezávislé, ne vzájemně vylučující příznaky: zimní bunda je na jednom treku Worn (na těle), na jiném je stejná bunda zabalená v batohu (Base) — a tohle nastavení je nutně různé gearlist od gearlistu, i pro tutéž položku z Gear Vaultu.
- **FR-10. Rozpad váhy gearlistu:** Gearlist zobrazuje čtyři čísla: **Base Weight**, **Worn Weight**, **Consumables Weight** a **Total Weight**. Base/Worn/Consumable se počítají z FR-9 příznaků (Consumable má prioritu před Worn, pokud by byly nastavené obě); Total je součet všech položek bez ohledu na příznaky. Číselný přehled, ne graf (graf mimo MVP).
- **FR-11. Vyhledávání/filtrování v Gear Vaultu:** Gear Vault lze filtrovat/seskupovat podle kategorie a fulltextově hledat podle názvu položky, aby bylo možné rychle najít položku i ve velkém seznamu vybavení.
- **FR-12. Plně inline editace (bez tlačítka "Edit"):** Jak v Gear Vaultu, tak v gearlistu se každé pole (název, kategorie, váha, množství, poznámka) edituje přímo kliknutím na jeho aktuální hodnotu — klik změní pole na editovatelný vstup, Enter/kliknutí mimo potvrdí, Escape zruší. Žádný samostatný "Edit" režim/tlačítko pro běžné úpravy — cílem je rychlost srovnatelná s tabulkou v Excelu / lighterpack.com. Výjimkou jsou akce s širším dopadem (přidání položky do Gear Vaultu, smazání, potvrzovací dialogy z FR-5) — ty zůstávají v samostatném okně.
- **FR-13. Drag & drop přeřazování:** Položky uvnitř gearlistu (v rámci kategorie), kategorie (v Gear Vaultu i výběru), položky v Gear Vaultu a gearlisty samotné (v levém postranním seznamu) jdou přetáhnout myší na nové pořadí — appka si pořadí pamatuje.
- **FR-14. Export / Import zálohy (nová, v8):** Tlačítko "Export backup" v hlavičce appky uloží veškerý obsah (Gear Vault, kategorie, gearlisty, snapshoty) jako `.json` soubor na disk uživatele. Tlačítko "Import backup" umožní vybrat dřívě exportovaný soubor a appku jím kompletně nahradit — appka před nahrazením vždy zobrazí potvrzovací dialog s přehledem, kolik položek/gearlistů se aktuálně přepíše a kolik jich přijde ze zálohy. Tohle je jediný mechanismus v MVP, který ochrání data i před tím, že uživatel v prohlížeči smaže data stránek (viz sekce 6a — appka samotná to jinak ovlivnit nemůže).
- **FR-15. Automatická migrace dat při každé změně datového modelu (nová, v8):** Appka si u uložených dat pamatuje číslo verze datového modelu (`schemaVersion`). Při otevření appky s daty starší verze appka automaticky, bez zásahu uživatele, převede data na aktuální tvar (viz sekce 6a — politika migrace). Uživatel o tom nemusí vůbec vědět — prostě uvidí svoje staré gearlisty a vybavení tak, jak je nechal.

### Příklad (pro ověření návrhu): přidání položky "Snickers" do Gear Vaultu
Martin přidá do Gear Vaultu novou položku: Název "Snickers", Kategorie "Food", Váha 60 g, Quantity 5, Poznámka "bílá čokoláda". Tuhle položku pak přidá do libovolného gearlistu a tam u ní zaškrtne Consumable (nepočítá se do Base Weight) — to je vlastnost jen tohoto konkrétního gearlistu. Pokud Martin později v Gear Vaultu upraví váhu na 62 g a položka je použitá i jinde, dostane dialog Cancel / Create a copy / Continue — může se rozhodnout, jestli se to má promítnout všude, nebo jestli vznikne oddělená kopie jen pro tuhle úpravu.

## 5. UX & Layout

Inspirováno rozložením lighterpack.com (ověřeno i přímým průzkumem appky):
- **Rozdělení obrazovky na dva panely:**
  - **Levý panel — Gear Vault:** správa osobní databáze vybavení, seskupená podle kategorie (s možností drag & drop přeřazení), vyhledávací pole a filtr kategorie nahoře. Každý řádek je inline editovatelný (FR-12), s "úchytem" (⠿) pro přetažení.
  - **Pravý panel — Gearlisty:** postranní seznam gearlistů (přetažitelný, FR-13) a detail otevřeného gearlistu — položky seskupené podle kategorie s mezisoučtem váhy, celkový souhrn (Total / Consumable / Worn / Base Weight) nahoře, tlačítka "Save snapshot" / "View snapshot" / "Delete".
  - **Hlavička appky (nová, v8):** vedle přepínače jednotek přibyla tlačítka "Export backup" / "Import backup" (FR-14) — jsou vidět odkudkoliv v appce, protože záloha dat je důležitá dost na to, aby nebyla schovaná v podmenu.
- Koláčový graf rozložení váhy podle kategorie (jak ho má lighterpack.com) je vizuálně hezký, ale zůstává mimo MVP — číselný přehled (FR-10) stačí pro první verzi.

## 6. Technické poznámky (v prostém jazyce)

- **Tech stack:** React + Vite + TypeScript. Vite je nástroj, který appku při vývoji rychle spouští a sestavuje; TypeScript pomáhá odchytit chyby dřív, než se appka spustí.
- **Jak funguje propojení s Gear Vaultem na úrovni dat (v7):** Položka v gearlistu si drží odkaz (ID) na položku v Gear Vaultu, dokud existuje — proto se schválené úpravy Gear Vaultu (FR-5, "Continue") do gearlistu promítají. Když uživatel zvolí "Create a copy", appka vytvoří novou položku v Gear Vaultu a přepojí na ni jen ten jeden konkrétní řádek gearlistu — zbytek zůstává na staré položce. Smazání položky v Gear Vaultu (v9) se řídí volbou v dialogu z FR-5: buď řádky, které na ni odkazovaly, odpojí (zůstanou v gearlistu se svými posledními známými hodnotami jako "custom entry", dál nezávisle editovatelné), nebo je ze všech gearlistů odstraní. Snapshot (FR-6) je čistě "hluboká kopie" aktuálního seznamu položek gearlistu uložená vedle něj, bez jakéhokoli odkazu na Gear Vault.
- **Ukládání dat — podrobně viz sekce 6a**, protože je to teď dost důležité téma na to, aby mělo vlastní sekci, ne jen jednu odrážku.

## 6a. Trvanlivost dat — co appka řeší teď (v8) a co je navržené na později

**Martinův postřeh, který k téhle sekci vedl:** appka do v8 ukládala data výhradně do `localStorage` prohlížeče. To má dvě různé slabiny, které je důležité rozlišovat, protože se řeší úplně jinak:

**Slabina A — appka sama si změní datový model a "zapomene", jak číst starší data.** Tohle se skutečně stalo při přechodu na v7 (2026-09-22): datový model se zásadně změnil (zrušení Draft/Finalized, přesun Worn/Consumable) a appka místo toho, aby stará data převedla, prostě začala číst z jiného úložného klíče — takže vypadalo, jako by Martinova data zmizela, ačkoliv fyzicky pořád ležela v jeho prohlížeči, jen appka je přestala hledat na správném místě.
- **Co appka řeší (implementováno ve v8, viz FR-15):** Zavedena **politika verzované migrace dat**. Appka si u uložených dat pamatuje číslo `schemaVersion`. Kdykoli se datový model příště změní, přidá se migrace, která staré uložené `schemaVersion` automaticky převede na nové — nikdy se znovu nesmí stát to, co u v7 (tiché "zapomenutí" starých dat). Úložný klíč v prohlížeči (`hikingbuddy-state`) se od v8 už nikdy nepřejmenuje — to je přesně to, co se rozbilo minule.
- **Zpětná oprava (retroaktivně, v8):** Appka teď při startu, pokud pod aktuálním klíčem nic nenajde, automaticky zkontroluje i starý klíč z doby před v7 a — pokud tam něco je — převede to na aktuální tvar. To znamená, že Martinovy gearlisty a Gear Vault položky z doby před 22. 9. 2026, které v jeho prohlížeči celou dobu fyzicky ležely (jen appka je "neviděla"), se při příštím otevření appky **automaticky objeví zpátky**, včetně toho, že dřívější "Finalized" gearlisty dostanou svůj obsah uložený jako snapshot (FR-6), aby se nic neztratilo. Netřeba nic ručně spouštět ani importovat — stane se to samo při prvním otevření appky po tomhle update.

**Slabina B — uživatel (nebo cokoliv jiného) smaže data prohlížeče.** Tohle appka nikdy nemůže sama o sobě ovlivnit — je to akce na úrovni prohlížeče/operačního systému, ne appky, a stejně by dopadla jakákoliv jiná technologie postavená čistě na datech uložených v prohlížeči (ať už `localStorage`, nebo "skutečnější" prohlížečová databáze `IndexedDB` — obojí zmizí najednou při smazání "dat prohlížení"/"site data"). Jediný způsob, jak appku ochránit proti tomuhle konkrétnímu riziku, je mít kopii dat **mimo** prohlížeč.
- **Co appka řeší (implementováno ve v8, viz FR-14):** Tlačítka **"Export backup"** a **"Import backup"** v hlavičce appky. Export uloží všechna data appky jako obyčejný `.json` soubor na disk počítače — Martin ho může uložit třeba do svého Google Drive/OneDrive/Documents, kamkoliv chce, appka do toho nijak nezasahuje. Import ten soubor umí zase načíst zpátky (s potvrzovacím dialogem, protože jde o kompletní přepsání appky). Doporučení pro Martina: udělat Export tak po každém větším treku/úpravě Gear Vaultu — je to appce naprosto cizí soubor, takže na to appka sama nemůže "zapomenout" nebo ho ztratit tak, jako se to stalo se Slabinou A.
- **Co appka (zatím) neřeší — návrh skutečné databáze:** Export/Import je bezpečnostní síť, ne pohodlné řešení — vyžaduje, aby si na to Martin sám vzpomněl. Skutečné řešení bez ruční práce je **přesunout data mimo prohlížeč automaticky**, ne jen na vyžádání. Dvě cesty, seřazené od nejbližší k nejdále:
  1. **Lokální soubor spravovaný appkou samotnou** (technicky: "File System Access API" — funkce prohlížeče, která appce s Martinovým svolením dovolí zapisovat přímo do zvoleného souboru/složky na disku, ne přes stahování). Martin by jednou vybral složku (např. `Dokumenty/HikingBuddy`) a appka by do ní automaticky ukládala aktuální stav při každé změně — v podstatě "auto-save Export" bez nutnosti kliknout na tlačítko. Nevyžaduje žádný server, žádné náklady, funguje offline. Nevýhoda: funguje jen v prohlížečích založených na Chromiu (Chrome, Edge — což Martin používá), ne ve Firefoxu/Safari.
  2. **Skutečná databáze na serveru** (např. Postgres nebo podobná), appka by měla účet/přihlášení a ukládala by data přes internet — to je zároveň technický předpoklad pro plány už dřív zapsané v sekci 7 (sync mezi zařízeními, offline PWA) a pro dlouhodobou vizi v sekci 9 (komunitní sdílení gearlistů). Tohle je "opravdová" databáze v tom smyslu, v jakém to Martin pravděpodobně myslel — ale je to zásadně větší krok (vyžaduje backend, hosting, správu uživatelských účtů), ne něco, co dává smysl udělat mimochodem v rámci MVP opravy.
  - **Doporučení:** Pro MVP zůstat u Exportu/Importu (jednoduché, funguje všude, nic nestojí) a zvážit bod 1 (lokální auto-save soubor) jako další krok, pokud se Export/Import v praxi ukáže jako nepohodlný. Bod 2 (serverová databáze) dává smysl řešit ve chvíli, kdy se appka posouvá směrem k bodům 1–2 v sekci 7 (přihlašování, sync) nebo k sekci 9 (komunitní sdílení) — do té doby by to byla investice bez odpovídajícího přínosu pro jednoho uživatele.

**Politika pro budoucí vývoj appky (důležité i pro Claude Code / jakéhokoli agenta, co na appce dál pracuje):** Tahle politika je teď zapsaná přímo v repozitáři appky (`README.md`, sekce "Data storage"), aby ji viděl kdokoli, kdo na kódu pracuje, ne jen v tomhle PRD. V kostce: **žádná budoucí změna tvaru dat (`AppState`, `GearItem`, `GearListItem`, `GearList`, `Category`) nesmí projít bez migrace ze staré verze** — přesně tenhle krok chyběl u v7 a způsobil dojem ztráty dat.

## 7. Co bude následovat po MVP (z původního PRD, nezavrženo, jen odloženo)

1. Offline PWA (instalace na plochu telefonu, přístup bez signálu).
2. Přihlašování a synchronizace mezi zařízeními — **technicky totéž jako "skutečná databáze na serveru" ze sekce 6a, bod 2**; obě sekce popisují stejný budoucí krok z různých úhlů (sekce 6a z pohledu ochrany dat, tahle sekce z pohledu multi-device UX).
3. Veřejné sdílení gearlistu přes URL.
4. Grafy/vizualizace váhy podle kategorie (koláčový graf jako na lighterpack.com).
5. **Gearlist Template (šablona výchozího vybavení).**
   - **Problém, který řeší:** Martin si na drtivou většinu treků bere stejný okruh základního vybavení (stan, spacák, vařič, lékárnička...). Bez šablony musí při založení každého nového gearlistu tyto položky znovu ručně dohledávat a přidávat z Gear Vaultu — to zabírá čas a hlavně hrozí, že na některou opakovaně používanou položku při ručním skládání zapomene (viz problém č. 6 v sekci 1).
   - **Návrh řešení:** Martin si v appce může předdefinovat jednu nebo víc šablon — každá je pojmenovaný seznam položek z Gear Vaultu (podobně jako gearlist, ale bez konkrétního treku). Při vytváření nového gearlistu appka nabídne založit ho buď prázdný, nebo z vybrané šablony — v tom případě se gearlist rovnou vytvoří předvyplněný všemi položkami ze šablony (a jejich výchozím množstvím z Gear Vaultu), které Martin dál jen doladí pro konkrétní trek (přidá/ubere specifické věci, upraví množství).
   - **Proč beyond MVP:** Nejde o řešení nejkritičtějšího rizika (neúplný gearlist kvůli zpětné úpravě Gear Vaultu — to řeší sekce 3), ale o zrychlení a pohodlí při zakládání nového gearlistu.
   - **Otevřené otázky pro budoucí rozpracování:** Může mít uživatel víc šablon najednou (např. "Léto", "Zima", "Vícedenní trek")? Jde šablonu upravovat stejně jako Gear Vault položku (živě, s dopadem na budoucí gearlisty založené z ní), nebo je šablona jen jednorázový "otisk" v momentě založení gearlistu?
6. **Historie víc než jednoho snapshotu na gearlist** (pojmenované/více uložených otisků v čase, ne jen jeden přepisovaný) — zvažováno u v7, ale zatím vynecháno, aby MVP zůstalo jednoduché; Martin explicitně potvrdil, že pro MVP stačí jeden.
7. **Lokální auto-save do souboru na disku** (File System Access API) — viz sekce 6a, bod 1. Krok mezi dnešním ručním Exportem/Importem a plnou serverovou databází.

## 8. Rozhodnutí uzavřená v předchozích kolech (v7)

- **Zrušen Draft/Finalized dvoustavový model** — nahrazen jedním vždy editovatelným gearlistem + ručně ukládaným (a přepisovatelným) snapshotem. Důvod: needitovatelnost byla zbytečně svazující pro drobné opravy po "finalizaci".
- **Ochrana proti retroaktivní tiché změně starého gearlistu** se teď řeší na úrovni jednotlivé úpravy sdílené položky (dialog Cancel / Create a copy of the item / Continue), ne na úrovni stavu celého gearlistu. Dialog je vždy blokující, nikdy jen tichá notifikace (toast) — potvrzeno Martinem jako tvrdý požadavek.
- Stejná logika dialogu platí jak pro úpravu položky přímo v Gear Vaultu, tak pro úpravu "jádrových" polí (název/kategorie/váha) linked položky přímo uvnitř gearlistu — jde datově o stejnou operaci.
- **Worn a Consumable přesunuty z vlastnosti Gear Vault položky na vlastnost konkrétního řádku v gearlistu**, a to jako dva nezávislé příznaky (ne vzájemně vylučující trojstavý výběr Base/Worn/Consumable jako dřív) — odpovídá pozorovanému chování na lighterpack.com. Přepínání nikdy nezobrazuje potvrzovací dialog.
- **Žádné hromadné (batch) úpravy více položek najednou** — potvrzeno jako záměrné omezení MVP; úpravy jdou vždy jedna po druhé, s dialogem tam, kde je relevantní.
- **Zrušeno tlačítko "Edit" jak v Gear Vaultu, tak v gearlistu** — nahrazeno přímou inline editací kliknutím na hodnotu (FR-12), inspirováno lighterpack.com.
- **Opraven bug:** přidání stejné položky z Gear Vaultu do gearlistu podruhé teď navyšuje množství existujícího řádku, nevytváří duplicitní řádek.
- **Přidán drag & drop** pro položky (v rámci kategorie), kategorie a gearlisty (FR-13).
- Rozpad váhy: Base / Worn / Consumable / Total zůstávají čtyři samostatná čísla u každého gearlistu, teď počítaná z per-řádkových příznaků.
- Layout appky beze změny: dva panely vedle sebe (Gear Vault vlevo, Gearlisty vpravo).
- Offline a přihlašování v MVP: záměrně vynecháno beze změny — zdůvodnění viz sekce 2.

## 8a. Rozhodnutí uzavřená v tomto kole (v8)

- **Zavedena politika verzované migrace dat** (`schemaVersion` + registr migračních funkcí v `storage.ts`) — žádná budoucí změna datového modelu už nesmí tiše zahodit existující data. Zapsáno i přímo do repozitáře appky (`README.md`), aby to viděl kdokoli (včetně Claude Code), kdo bude na datovém modelu dál pracovat.
- **Úložný klíč v prohlížeči (`hikingbuddy-state`) se od teď už nikdy nepřejmenuje** — to bylo přímou příčinou zdánlivé ztráty dat u v7. Starší klíče (`hikingbuddy-state-v1`, `hikingbuddy-state-v2`) zůstávají jen jako zdroj pro jednorázovou zpětnou migraci.
- **Zpětně opravena "ztráta" dat z přechodu na v7:** appka teď při startu automaticky najde a migruje data uložená před v7 (pokud pod aktuálním klíčem ještě nic není) — u dřívějších Finalized gearlistů se jejich obsah zachová jako snapshot, ne že by zmizel.
- **Přidán Export/Import zálohy do `.json` souboru** (FR-14) jako jediná ochrana dat nezávislá na tom, že appka běží čistě v prohlížeči — appka sama nemůže zabránit tomu, že si uživatel smaže data prohlížeče, ale může mu dát snadný způsob, jak mít kopii mimo něj.
- **Zvážena, ale zatím neimplementována, "skutečná databáze"** — navrženy dvě cesty (lokální auto-save soubor přes File System Access API; serverová databáze s účty) v sekci 6a, s doporučením zůstat pro MVP u Exportu/Importu a řešit dál až v momentě, kdy appka stejně bude potřebovat přihlašování/sync (sekce 7, body 1–2) nebo komunitní sdílení (sekce 9) — obojí implikuje server přirozeně, není důvod ho stavět dřív jen kvůli záloze.
- **`README.md` appky teď obsahuje explicitní instrukci pro Claude Code** (nebo jiného coding agenta), co dělat při každé změně tvaru dat — bump `CURRENT_SCHEMA_VERSION`, přidat migrační funkci, nikdy nepřejmenovat úložný klíč, otestovat na datech ve starém tvaru před tím, než je změna považovaná za hotovou.

## 8b. Rozhodnutí uzavřená v tomto kole (v9)

- **Smazání Gear Vault položky použité v gearlistech už nikdy neproběhne potichu** — zobrazí se stejný blokující třívolbový dialog jako při editaci: Cancel / Keep in gearlists / Delete everywhere (FR-5). Důvod: Martin smazal položky z Gear Vaultu a v gearlistu mu zůstaly jako nečekané "custom entry"; smazání má stejný dopad na gearlisty jako editace, a tedy vyžaduje stejně explicitní volbu. Snapshoty zůstávají vždy nedotčené.

## 9. Dlouhodobá produktová vize: komunitní sdílení gearlistů

**Martinova vize appky:** HikingBuddy jako komunitní místo, kde hikeři řeší výbavu pro svá outdoorová dobrodružství — appka není jen osobní nástroj na sestavení gearlistu, ale i místo, kde se dá vidět a inspirovat výbavou ostatních.

**Problém, který to řeší:** Hiker, který má před sebou náročný trek, by rád viděl gearlisty ostatních hikerů přímo v appce — pro inspiraci, případně aby si cizí gearlist naimportoval a upravil podle svých potřeb, místo aby sestavoval vše od nuly nebo hledal inspiraci mimo appku.

**Návrh řešení (hrubě, k rozpracování):** Hiker může svůj gearlist (typicky jeho uložený snapshot, viz sekce 3/FR-6 — stabilní "otisk", ne rozpracovaná verze) zveřejnit ostatním uživatelům appky. Ostatní si zveřejněné gearlisty mohou procházet/prohlížet a vybraný gearlist naimportovat do svého Gear Vaultu a gearlistů jako výchozí bod — a dál si ho upravit pro vlastní potřebu.

**Proč je to dlouhodobá vize, ne "beyond MVP" bod jako Gearlist Template:** Na rozdíl od ostatních bodů v sekci 7 tahle feature mění základní předpoklad appky ze single-user (data jen v prohlížeči jednoho člověka, viz sekce 2 a 6/6a) na multi-user — tedy vyžaduje účty/přihlašování a server/databázi, kde jsou gearlisty uložené a přístupné napříč uživateli (obojí je dnes v sekci 2 vědomě mimo MVP, i když sekce 6a už navrhuje, jak by taková databáze mohla vypadat, až na ni dojde řada). Přirozeně navazuje na body 1–2 ze sekce 7 (offline PWA, přihlašování a synchronizace), které jsou jejím technickým předpokladem.

**Monetizační potenciál:** Tahle vize je i potenciální cesta k monetizaci appky — např. placený přístup ke komunitním/kurátorovaným gearlistům, prémiový obsah od zkušených/expertních hikerů, nebo možnost sledovat oblíbené přispěvatele. Zatím jde o směr k prozkoumání, ne o rozhodnutý business model.

**Otevřené otázky pro budoucí rozpracování:**
- **Import:** Naimportuje se gearlist jiného uživatele jako kopie položek do vlastního Gear Vaultu, nebo vznikne rovnou nový vlastní gearlist, který si uživatel dál upraví?
- **Jednotky:** Gearlist zveřejněný v jiných jednotkách (g vs. oz) — appka to technicky umí přepočítat (viz FR-3), takže by neměl být problém při importu zobrazit gearlist ve vlastních preferovaných jednotkách.
- **Identita/profil:** Sdílí se gearlisty anonymně, nebo s autorem/profilem hikera (což by podpořilo i monetizační směr "sledovat" oblíbeného přispěvatele)?
- **Kvalita/moderace:** Jde o čistě otevřenou komunitu, nebo o kurátorovaný výběr (např. od zkušených hikerů/expertů), aby "inspirace" nebyla zahlcená nekvalitními nebo nesmyslnými gearlisty?
- **Co přesně se sdílí:** Sdílí se jen uložený snapshot (stabilní), nebo i živý, dál editovatelný gearlist? Dává smysl navázat na snapshot z FR-6, aby to, co si někdo jiný naimportuje, bylo vždy "hotová", ne rozpracovaná verze.

Tyhle otázky zůstávají zatím otevřené — řešit se budou v okamžiku, kdy na tuhle fázi vývoj appky dozraje.
