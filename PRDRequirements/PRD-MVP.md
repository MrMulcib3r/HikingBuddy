# HikingBuddy — MVP PRD (v5)

**Status:** Draft, aligned s Martinem 2026-09-22
**Nahrazuje:** `gemini-code-1789054094052.txt` (v1, plný rozsah) — ten zůstává jako referenční "vize appky do budoucna", tohle je co skutečně stavíme teď.
**Historie:** v2 = základní MVP (Gear Vault + gearlisty + snapshot). v3 = rozpad váhy, vyhledatelnost kategorií, layout. v4 = Draft/Finalize životní cyklus gearlistu (nahrazuje okamžitý snapshot), přejmenování "Gear closet" → "Gear Vault", detaily formuláře položky. v5 = doplněn "Gearlist Template" jako feature beyond MVP (řeší opakované manuální sestavování gearlistu a riziko opomenutí položky).

---

## 1. Problém, který řešíme (MVP)

1. **Kritické vybavení nesmí chybět v terénu.** Martin jezdí na náročné treky (např. Nordkalottleden). Pokud v arktické tundře, dny od civilizace, zjistí, že mu chybí vybavení, nedá se s tím nic dělat — je pozdě.
2. **Současné řešení (lighterpack.com) tenhle problém způsobuje.** Když Martin upraví/smaže položku ve svém "gear closetu" (databázi vybavení, které vlastní), změna se propíše do *všech* jeho starých gearlistů. Starý gearlist tak může vypadat kompletní, ale ve skutečnosti v něm chybí věc, kterou Martin mezitím z databáze odebral — a pokud si ho vezme jako podklad pro nový trek, riziko z bodu 1 se naplní.
3. **Ultralight hikeři sledují konkrétní váhovou metriku — "base weight".** Aby Martin věděl, jestli spadá do kategorie "ultralight", potřebuje vidět rozpad váhy gearlistu, ne jen jedno celkové číslo.
4. **Rozsáhlý Gear Vault je nepřehledný.** S desítkami až stovkami položek vybavení je těžké v jednom dlouhém seznamu něco najít, pokud položky nejdou filtrovat/seskupovat podle kategorie.
5. **Během přípravy na trek chce Martin gearlist průběžně ladit** (opravit špatně zadanou váhu, doplnit položku) a chce, aby se opravy promítly do rozpracovaného gearlistu — ale jakmile je gearlist hotový a "sbalený", potřebuje mít jistotu, že se už nezmění.
6. **Sestavení nového gearlistu od nuly zabírá zbytečně moc času a hrozí opomenutí.** Martin si na trek opakovaně bere stejný okruh základního vybavení (stan, spacák, vařič...). Přesto při zakládání nového gearlistu dnes musí každou takovou položku znovu ručně vyhledat v Gear Vaultu a přidat ji — to je zdlouhavé a hlavně riskantní: pokud na některou opakovaně používanou položku při ručním skládání zapomene, gearlist bude neúplný, aniž by o tom Martin věděl (viz riziko v bodě 1). Tohle je motivace pro Gearlist Template popsaný v sekci 7 — je to ale rozšíření nad rámec MVP, ne požadavek na první verzi appky.

## 2. Co MVP řeší a co ne

**Řeší:**
- Uložení vybavení do osobní databáze (**Gear Vault**).
- Sestavení gearlistu (seznam vybavení pro konkrétní trek) z Gear Vaultu.
- Gearlist prochází dvěma stavy — **Draft** (živě propojený s Gear Vaultem, dá se ladit) a **Finalized** (nezměnitelný snapshot) — viz sekce 3.
- Rozpad váhy gearlistu na Base Weight / Worn Weight / Consumables / Total Weight.
- Kategorizaci vybavení pro snadnou orientaci ve velkém Gear Vaultu.

**Neřeší (vědomě odloženo na později):**
- Přihlašování / účty — appka je zatím jednouživatelská, data jen v prohlížeči.
- Offline režim — appka v MVP vyžaduje připojení k internetu. (Zdůvodnění: hlavní problém je nekompletnost gearlistu zjištěná *před* odjezdem, ne přístup k datům v terénu bez signálu — když už je Martin v terénu, offline appka mu chybějící vybavení stejně nedoveze.)
- Veřejné sdílení gearlistu přes URL.
- Grafy/vizualizace váhy (číselný rozpad ano, koláčový graf jako na lighterpack.com zatím ne).
- **Gearlist Template** (předdefinovaná sada výchozího vybavení pro nový gearlist) — viz sekce 7, bod 5.

## 3. Klíčové rozhodnutí: životní cyklus gearlistu (Draft → Finalized)

Tohle je jádro appky a přímo řeší problém č. 2 i č. 5. Vysvětlení v jednoduchém jazyce:

**Draft (rozpracovaný gearlist).** Nový gearlist vzniká jako Draft. V tomto stavu je **živě propojený** s Gear Vaultem — pokud upravíš položku v Gear Vaultu (např. opravíš špatně zadanou váhu stanu), změna se projeví ve všech Draft gearlistech, které tu položku obsahují. Protože je to změna, kterou uživatel nemusí čekat, appka při úpravě položky, která je použitá v jednom nebo více Draft gearlistech, zobrazí **potvrzovací dialog**: "Tato úprava ovlivní N rozpracovaných gearlistů: [seznam]. Pokračovat?" Draft je tedy pracovní prostor — flexibilní, ale ne bezpečný proti změnám.

**Finalized (zmrazený gearlist).** Když je gearlist hotový (typicky těsně před odjezdem), uživatel klikne na tlačítko **"Finalize"**. Tím appka vytvoří nezávislou kopii dat všech položek v gearlistu (přesně princip "snapshot" ze sekce 3 předchozích verzí PRD) a od té chvíle je gearlist **needitovatelný a odolný vůči změnám** v Gear Vaultu napořád. Tohle je stav, ve kterém byl gearlist v momentě, kdy Martin balil batoh — a to se už nesmí nikdy retroaktivně změnit. Přesně tady se řeší problém č. 2.

**Co když chci upravit/smazat finalizovaný gearlist?**
- **Úprava položky ve finalizovaném gearlistu:** appka to napřímo nedovolí. Zobrazí dialog nabízející "Vytvořit needitovatelnou kopii jako nový Draft" — vznikne nový gearlist (Draft), který je kopií finalizovaného, na kterém lze dělat úpravy. Původní finalizovaný gearlist zůstává beze změny.
- **Smazání finalizovaného gearlistu:** appka zobrazí potvrzovací dialog upozorňující, že jde o nevratnou akci (žádná nabídka kopie — smazání je smazání).

**Proč tenhle model a ne okamžitý snapshot hned při přidání položky (jak navrhovala v3):** Draft/Finalize dává Martinovi možnost gearlist v klidu sestavovat a opravovat chyby, aniž by musel zakládat nový gearlist pokaždé, když si všimne překlepu ve váze. Teprve výslovná akce "Finalize" zamkne data — takže nezměnitelnost je řízená uživatelem v okamžiku, kdy sám uzná, že je gearlist hotový, ne automaticky při prvním přidání položky.

## 4. Funkční požadavky (MVP)

- **FR-1. Gear Vault (CRUD):** Vytvořit, zobrazit, upravit a smazat položku vybavení. Položka má: Název, Kategorii (nepovinná), Typ váhy (viz FR-7), Poznámku/popis (nepovinné — např. "Snickers s bílou čokoládou"), Váhu, Výchozí množství (Quantity).
- **FR-2. Kategorie — předdefinovaný template s vlastní úpravou:** Appka nabídne předdefinovaný seznam kategorií (např. Shelter, Sleep System, Clothing, Cooking, Food, Water, Electronics, Hygiene, Misc) jako výchozí "template". Uživatel může kteroukoli kategorii přejmenovat, smazat nebo přidat vlastní novou.
- **FR-3. Jednotky:** Přepínání zobrazení mezi metrickými (g/kg) a imperiálními (oz/lb) jednotkami. Interně se váha ukládá v jedné jednotce (gramy), aby nevznikaly zaokrouhlovací chyby.
- **FR-4. Gearlisty — vytvoření a editace v Draft stavu:** Vytvořit pojmenovaný gearlist (vzniká jako Draft), přidat do něj položky z Gear Vaultu, upravit množství konkrétně pro tento gearlist (nezávisle na výchozím množství v Gear Vaultu).
- **FR-5. Živé propojení Draft gearlistu s Gear Vaultem + potvrzovací dialog:** Dokud je gearlist ve stavu Draft, položky v něm odkazují na aktuální data v Gear Vaultu. Úprava položky v Gear Vaultu, která je použitá v jednom nebo více Draft gearlistech, vyžaduje potvrzení uživatele (dialog s výčtem dotčených gearlistů), než se změna provede.
- **FR-6. Finalize akce:** Tlačítko "Finalize" na Draft gearlistu vytvoří nezávislou kopii (snapshot) všech položek v gearlistu — jejich název, váha, kategorie, typ váhy, poznámka, množství. Od tohoto okamžiku je gearlist ve stavu Finalized a změny v Gear Vaultu na něj nemají žádný vliv.
- **FR-7. Ochrana finalizovaného gearlistu:** Pokus o úpravu položky ve Finalized gearlistu nabídne vytvoření editovatelné kopie jako nového Draftu (originál zůstává nezměněn). Pokus o smazání Finalized gearlistu vyžaduje potvrzovací dialog (nevratná akce).
- **FR-8. Automatické doplnění kategorie při finalizaci:** Pokud položka v okamžiku finalizace nemá přiřazenou kategorii, appka jí automaticky přiřadí výchozí kategorii (např. "Uncategorized"). V Gear Vaultu samotném kategorie povinná není (aby přidání nové položky nebylo zdržováno).
- **FR-9. Typ váhy (Base / Worn / Consumable):** Každá položka vybavení má typ váhy — jde o to, jak se počítá do celkové váhy batohu:
  - **Base Weight** — věci nošené v batohu, které se během treku nespotřebovávají (stan, spacák, batoh...).
  - **Worn Weight** — věci, které má hiker na sobě, ne v batohu (boty, oblečení na těle...).
  - **Consumable** — věci, které se spotřebovávají (jídlo, voda, palivo...); typicky se nepočítají do Base Weight.

  Typ váhy je vlastnost položky v Gear Vaultu (výchozí hodnota), ale dá se přepsat i na úrovni konkrétního gearlistu (potvrzeno Martinem — např. bunda je jednou na sobě, jednou v batohu).
- **FR-10. Rozpad váhy gearlistu:** Gearlist zobrazuje čtyři čísla: **Base Weight**, **Worn Weight**, **Consumables Weight** a **Total Weight**. Číselný přehled, ne graf (graf mimo MVP).
- **FR-11. Vyhledávání/filtrování v Gear Vaultu:** Gear Vault lze filtrovat/seskupovat podle kategorie a fulltextově hledat podle názvu položky, aby bylo možné rychle najít položku i ve velkém seznamu vybavení (viz screenshot lighterpack.com — pole "Search gear").

### Příklad (pro ověření návrhu): přidání položky "Snickers" do Gear Vaultu
Martin přidá do Gear Vaultu novou položku: Název "Snickers", Kategorie "Food", Váha 60 g, Quantity 5, Typ váhy "Consumable" (nepočítá se do Base Weight), Poznámka "bílá čokoláda". Tahle položka pak jde přidat do libovolného Draft gearlistu; pokud ji Martin později v Gear Vaultu upraví (např. zjistí, že správná váha je 62 g), dostane potvrzovací dialog o všech Draft gearlistech, které ji obsahují — Finalized gearlisty dotčené nebudou.

## 5. UX & Layout

Inspirováno rozložením lighterpack.com (viz sdílený screenshot):
- **Rozdělení obrazovky na dva panely:**
  - **Levý panel — Gear Vault:** správa osobní databáze vybavení. Vyhledávací pole nahoře, položky pod ním (v pozdější iteraci lze seskupit podle kategorie).
  - **Pravý panel — Gearlisty:** seznam gearlistů (Drafty i Finalized, vizuálně odlišené — např. ikonou zámku u Finalized) a detail otevřeného gearlistu — položky seskupené podle kategorie s mezisoučtem váhy a počtem položek u každé kategorie, celkový souhrn (Total / Consumable / Worn / Base Weight) nahoře.
- Tlačítko "Finalize" a případně "Duplicate as Draft" / "Delete" jsou u detailu gearlistu dobře viditelné, protože jde o klíčové akce životního cyklu.
- Koláčový graf rozložení váhy podle kategorie (jak ho má lighterpack.com) je vizuálně hezký, ale zůstává mimo MVP — číselný přehled (FR-10) stačí pro první verzi.

## 6. Technické poznámky (v prostém jazyce)

- **Tech stack:** React + Vite + TypeScript. Vite je nástroj, který appku při vývoji rychle spouští a sestavuje; TypeScript pomáhá odchytit chyby dřív, než se appka spustí.
- **Ukládání dat:** Zatím v prohlížeči (bez serveru/účtu) — appka data neztratí mezi otevřeními, dokud Martin nesmaže data prohlížeče. Přechod na server/účet je připravený jako budoucí fáze, ne nutnost pro MVP.
- **Jak funguje Draft vs. Finalized na úrovni dat:** Položka v Draft gearlistu si drží odkaz (ID) na položku v Gear Vaultu — proto se úpravy Gear Vaultu do Draftu promítají. Ve chvíli "Finalize" appka tento odkaz nahradí pevnou kopií dat (název, váha, kategorie, typ váhy, poznámka, množství) — od té chvíle gearlist s Gear Vaultem nemá žádnou datovou vazbu, přesně jako "immutable snapshot" v původním PRD.

## 7. Co bude následovat po MVP (z původního PRD, nezavrženo, jen odloženo)

1. Offline PWA (instalace na plochu telefonu, přístup bez signálu).
2. Přihlašování a synchronizace mezi zařízeními.
3. Veřejné sdílení gearlistu přes URL.
4. Grafy/vizualizace váhy podle kategorie (koláčový graf jako na lighterpack.com).
5. **Gearlist Template (šablona výchozího vybavení).**
   - **Problém, který řeší:** Martin si na drtivou většinu treků bere stejný okruh základního vybavení (stan, spacák, vařič, lékárnička...). Bez šablony musí při založení každého nového gearlistu tyto položky znovu ručně dohledávat a přidávat z Gear Vaultu — to zabírá čas a hlavně hrozí, že na některou opakovaně používanou položku při ručním skládání zapomene (viz problém č. 6 v sekci 1).
   - **Návrh řešení:** Martin si v appce může předdefinovat jednu nebo víc šablon — každá je pojmenovaný seznam položek z Gear Vaultu (podobně jako gearlist, ale bez konkrétního treku). Při vytváření nového gearlistu appka nabídne založit ho buď prázdný, nebo z vybrané šablony — v tom případě se gearlist rovnou vytvoří jako Draft předvyplněný všemi položkami ze šablony (a jejich výchozím množstvím z Gear Vaultu), které Martin dál jen doladí pro konkrétní trek (přidá/ubere specifické věci, upraví množství).
   - **Proč beyond MVP:** Nejde o řešení nejkritičtějšího rizika (neúplný gearlist kvůli zpětné úpravě Gear Vaultu — to řeší Draft/Finalize v sekci 3), ale o zrychlení a pohodlí při zakládání nového gearlistu. MVP musí nejdřív ověřit základní tok Gear Vault → Draft → Finalize; šablony na něj přirozeně navazují až v další iteraci.
   - **Otevřené otázky pro budoucí rozpracování:** Může mít uživatel víc šablon najednou (např. "Léto", "Zima", "Vícedenní trek")? Jde šablonu upravovat stejně jako Gear Vault položku (živě, s dopadem na budoucí gearlisty založené z ní), nebo je šablona jen jednorázový "otisk" v momentě založení gearlistu? Tyhle otázky nechávám otevřené do doby, kdy bude tahle feature na řadě.

## 8. Rozhodnutí uzavřená v tomto kole

- **Gear closet → Gear Vault:** přejmenováno, protože Gear Vault obsahuje i jídlo/spotřební materiál — "closet" jako metafora nesedí.
- **Draft/Finalize životní cyklus** nahrazuje dřívější "okamžitý snapshot" (v3): gearlist je Draft (živě propojený, editovatelný, s potvrzovacím dialogem při dotčené úpravě Gear Vaultu) → Finalize (nezávislá, needitovatelná kopie).
- Úprava položky ve Finalized gearlistu → dialog nabízející vytvoření editovatelné Draft kopie.
- Smazání Finalized gearlistu → potvrzovací dialog (nevratné, žádná kopie).
- Typ váhy: vlastnost položky v Gear Vaultu, přepsatelná per gearlist — potvrzeno.
- Položka bez kategorie: povolena v Gear Vaultu, automaticky doplněna při finalizaci.
- Rozpad váhy: Base / Worn / Consumable / Total jako čtyři samostatná čísla u každého gearlistu.
- Layout appky: dva panely vedle sebe (Gear Vault vlevo, Gearlisty vpravo), inspirováno lighterpack.com — vč. seskupení položek podle kategorie s mezisoučty a vyhledávacího pole v Gear Vaultu.
- Sync konfliktů (Last-Write-Wins): irelevantní pro MVP, appka je zatím jednouživatelská bez syncu.
- Offline v MVP: záměrně vynecháno — zdůvodnění viz sekce 2.
- **Gearlist Template** (šablona výchozího vybavení pro nový gearlist) zařazena jako feature beyond MVP — viz sekce 7, bod 5. Řeší časovou náročnost a riziko opomenutí při opakovaném ručním sestavování gearlistu.
