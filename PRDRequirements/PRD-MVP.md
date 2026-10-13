# HikingBuddy — MVP PRD (v23)

**Status:** Implementováno do v10 (aligned s Martinem 2026-09-24). v11 (2026-10-07) jen doplňuje specifikaci budoucí feature Gearlist Template — zatím neimplementováno. v12 (2026-10-08) přesouvá "+ Add item" v Gear Vaultu na konec každé kategorie — implementováno. v13 (2026-10-08) upravuje přidávání položek, přejmenování kategorií a dotčené gearlisty v dialogu — implementováno, čeká na Martinův test. v14 (2026-10-08) implementuje Gearlist Template (sekce 7, bod 5), velké tlačítko "+ Add gear" dole ve Vaultu a mazání vlastních kategorií z formuláře — čeká na Martinův test. v15 (2026-10-08): kategorie z výchozí šablony nejdou smazat nikde. **v16 (2026-10-09): finální scope appky** — Martin rozhodl, že HikingBuddy zůstane osobním nástrojem a ukázkou do portfolia, ne produktem k monetizaci. Scope je uzavřený (sekce 0 a 2). Nové požadavky FR-16 až FR-20: automatické ukládání do datového souboru, demo data, sdílení gearlistu přes URL, design + vizualizace váhy batohem, veřejné nasazení na web. Ostatní body ze sekce 7 a vize ze sekce 9 jsou vyřazené. FR-16 až FR-20 jsou zatím jen specifikace, nic z nich není implementováno. **v17 (2026-10-09): FR-16, FR-17 a FR-18 implementovány** — čekají na Martinův test; upřesnění z implementace jsou přímo u jednotlivých FR a v sekci 8j. FR-19 a FR-20 zatím ne. **v18 (2026-10-12): přidání položky do gearlistu přetažením z Gear Vaultu** (FR-4, FR-13) — čeká na Martinův test. **v19 (2026-10-12): název kategorie jde přejmenovat i kliknutím na nadpis skupiny v gearlistu** (FR-2) — čeká na Martinův test. **v20 (2026-10-12): když šablona existuje, tlačítko na gearlistu se jmenuje „Update template“** (sekce 7, bod 5, T-1) — čeká na Martinův test. **v21 (2026-10-12): FR-19 rozhodnut** (design system schválen, otevřené otázky uzavřeny) — implementace probíhá. **v22 (2026-10-13): jen dokumentace** — sekce 9 přepracována na „Veřejná komunitní verze“: uložené nápady pro případ, že by Martin appku vydal veřejně s monetizací (komunitní katalog vybavení jako výchozí Gear Vault, kopírování sdíleného gearlistu). Mimo scope, nic se nestaví. **v23 (2026-10-13): jen dokumentace** — Martinova rozhodnutí k otevřeným otázkám v sekci 9.2 a 9.3; nový nápad „obvyklé teploty v místě a období treku“ (sekce 7, bod 9). Mimo scope.
**Nahrazuje:** `gemini-code-1789054094052.txt` (v1, plný rozsah) — ten zůstává jako referenční "vize appky do budoucna", tohle je co skutečně stavíme teď.
**Historie:** v2 = základní MVP (Gear Vault + gearlisty + snapshot). v3 = rozpad váhy, vyhledatelnost kategorií, layout. v4 = Draft/Finalize životní cyklus gearlistu (nahrazuje okamžitý snapshot), přejmenování "Gear closet" → "Gear Vault", detaily formuláře položky. v5 = doplněn "Gearlist Template" jako feature beyond MVP. v6 = doplněna dlouhodobá produktová vize — komunitní sdílení gearlistů (sekce 9). v7 = zásadní přepracování životního cyklu gearlistu (Draft/Finalized zrušen, nahrazen vždy editovatelným gearlistem + snapshotem), Worn/Consumable přesunuto na gearlist item, plně inline editace, drag & drop. **v8 = řešení trvanlivosti dat:** Martin správně upozornil, že appka dosud neměla žádnou ochranu proti tomu, že si uživatel v prohlížeči smaže data stránek — což by nenávratně smazalo úplně všechno. Přidána (a zpětně aplikována) **politika migrace dat** (žádná budoucí změna datového modelu už nesmí tiše smazat existující data — přesně tohle se omylem stalo přechodem na v7) + **Export/Import zálohy do souboru** jako skutečná ochrana nezávislá na prohlížeči + navržený plán skutečné databáze (lokální a budoucí serverová) — viz sekce 6a. **v9 = smazání Gear Vault položky použité v gearlistech má stejný blokující třívolbový dialog jako její editace** (Cancel / Keep in gearlists / Delete everywhere) — dřív se řádky v gearlistech jen tiše odpojily. Zároveň **zrušen sloupec se seznamem gearlistů** — přepínání gearlistů je teď rozbalovací výběr v jeho názvu, a řádky položek se v úzkém okně zalamují do dvou řádků, aby byl gearlist použitelný i s oknem na půl obrazovky. **v10 = výběr kategorie při přidání položky do Gear Vaultu přes dlaždice s ikonkami** místo rozbalovacího menu. **v11 = Gearlist Template rozpracován do podoby připravené k implementaci** (sekce 7, bod 5, podle Martinových rozhodnutí z 2026-10-07): jedna hlavní šablona, vytvoření přes "Save as template" a nabídku po prvním gearlistu, volba "Blank / From template" při zakládání gearlistu, varování při úpravě a smazání Vault položky, která je v šabloně. Přidán "Duplicate gearlist" jako budoucí feature (sekce 7, bod 8). Obojí zatím mimo MVP, nic se neimplementovalo. **v12 = "+ Add item" v Gear Vaultu přesunuto z hlavičky panelu přímo do seznamu, na konec každé kategorie** (jako na lighterpack.com) — formulář se otevře s danou kategorií předvybranou. **v13 = úpravy po Martinově testu v12:** prázdné kategorie se ve Vaultu nezobrazují; vždy viditelné tlačítko "+ Add gear" v hlavičce Vaultu otevře formulář s předvybranou dlaždicí "Other"; dlaždice kategorií jsou vzájemně výlučné (oprava bugu, kdy šlo mít vybrané "Other" i jinou kategorii); kategorie lze přejmenovat kliknutím na jejich nadpis ve Vaultu; dialog Cancel / Create a copy / Continue (i u mazání) vypisuje názvy dotčených gearlistů; formulář "Add item" se nezavře kliknutím mimo okno; výchozí kategorie "Shelter" přejmenována na "Shelter System" (i v existujících datech, migrací). **v14 = Gearlist Template implementován** (sekce 7, bod 5 — Martin ho přesunul do "Teď"), **"+ Add gear" přesunuto z hlavičky do velkého tlačítka přes celou šířku, připnutého dole v Gear Vaultu** (dominantnější, blíž palci na mobilu), **vlastní kategorie (vytvořené přes "Other") lze smazat křížkem přímo na dlaždici** ve formuláři přidání položky. **v15 = kategorie z výchozí šablony nejdou smazat.** **v16 = uzavření scope:** cíl projektu (sekce 0), finální rozsah (sekce 2), FR-16 až FR-20, rozhodnutí v sekci 8i. **v17 = implementace FR-16 (auto-save do souboru), FR-17 (demo data) a FR-18 (sdílení přes URL)**, upřesnění v sekci 8j. **v18 = drag & drop položky z Gear Vaultu do gearlistu nebo šablony** (FR-4, FR-13, sekce 8k). **v19 = přejmenování kategorie i z gearlistu** (FR-2, sekce 8l). **v20 = „Save as template“ → „Update template“, když šablona existuje** (T-1, sekce 8m). **v21 = FR-19 rozhodnut:** světlé téma, batoh tvaru A nahoře v gearlistu, v batohu Base + Consumables, Worn zvlášť, nejtěžší kategorie dole, ikony místo textu s tooltipy, krajina v pozadí, minimum pro malé obrazovky a dotyk; sdílený odkaz v2 nese i barvu/ikonu kategorie (sekce 8n). **v22 = sekce 9 přepracována** na uložené nápady pro veřejnou komunitní verzi: komunitní katalog vybavení, ochrana proti zneužití, kopírování sdíleného gearlistu (sekce 8o). **v23 = rozhodnutí ke komunitnímu katalogu a kopírování gearlistu** (sekce 9.2, 9.3) **+ nápad na počasí u gearlistu** (sekce 7, bod 9; sekce 8p).

---

## 0. Cíl projektu a finální scope (v16, 2026-10-09)

**Rozhodnutí:** HikingBuddy je **osobní nástroj pro Martina a ukázka práce do portfolia** pro pohovory na PM pozice. Není to produkt určený k monetizaci.

**Proč:**
- Trh nástrojů na gearlisty je plný bezplatných appek: LighterPack, Packstack (financovaný přes Patreon), PackWizard (plánuje vydělávat na affiliate odkazech do obchodů), PackLight. Cílová skupina (ultralight hikeři) je malá a za software neplatí.
- Každý monetizační model (affiliate odkazy, placená verze, komunita podle sekce 9) by nejdřív vyžadoval server, účty a tisíce uživatelů. To je násobek dosavadní práce a výsledek je nejistý.
- Proto appku dotáhneme do stavu, kdy (1) řeší Martinův problém a (2) jde ukázat komukoli přes odkaz. Pak se Martin věnuje jinému projektu, který řeší reálný problém s možností monetizace.

**Co appka musí na konci splnit:**
1. **Pro Martina:** spolehlivě řeší problémy ze sekce 1 a jeho data nezmizí ani při smazání dat prohlížeče (FR-16: automatické ukládání do souboru na disku).
2. **Pro prezentaci:** běží veřejně na webu (FR-20), návštěvník si jedním klikem nahraje ukázková data (FR-17), appka vypadá dobře (FR-19) a gearlist jde poslat odkazem (FR-18).
3. **Bez serveru, účtů a provozních nákladů.** Appka je statická: hosting jen posílá soubory, všechno se počítá a ukládá u uživatele. Každý návštěvník má vlastní oddělenou kopii dat a nikdo nevidí data nikoho jiného.

**Pořadí:** nejdřív dodělat a vyzkoušet lokálně (FR-16 až FR-19), teprve potom nasadit na web (FR-20).

## 1. Problém, který řešíme (MVP)

1. **Kritické vybavení nesmí chybět v terénu.** Martin jezdí na náročné treky (např. Nordkalottleden). Pokud v arktické tundře, dny od civilizace, zjistí, že mu chybí vybavení, nedá se s tím nic dělat — je pozdě.
2. **Současné řešení (lighterpack.com) tenhle problém způsobuje.** Když Martin upraví/smaže položku ve svém "gear closetu" (databázi vybavení, které vlastní), změna se propíše do *všech* jeho starých gearlistů, aniž by o tom věděl. Starý gearlist tak může vypadat kompletní, ale ve skutečnosti v něm chybí věc, kterou Martin mezitím z databáze odebral — a pokud si ho vezme jako podklad pro nový trek, riziko z bodu 1 se naplní.
3. **Ultralight hikeři sledují konkrétní váhovou metriku — "base weight".** Aby Martin věděl, jestli spadá do kategorie "ultralight", potřebuje vidět rozpad váhy gearlistu, ne jen jedno celkové číslo.
4. **Rozsáhlý Gear Vault je nepřehledný.** S desítkami až stovkami položek vybavení je těžké v jednom dlouhém seznamu něco najít, pokud položky nejdou filtrovat/seskupovat podle kategorie.
5. **Během přípravy na trek chce Martin gearlist průběžně ladit** (opravit špatně zadanou váhu, doplnit položku) — a to i po tom, co ho "sbalí" na cestu. Zároveň ale chce mít možnost si kdykoliv uložit "otisk" toho, co si konkrétně vzal, aby to zůstalo zaznamenané.
6. **Sestavení nového gearlistu od nuly zabírá zbytečně moc času a hrozí opomenutí.** Martin si na trek opakovaně bere stejný okruh základního vybavení (stan, spacák, vařič...). Přesto při zakládání nového gearlistu dnes musí každou takovou položku znovu ručně vyhledat v Gear Vaultu a přidat ji — to je zdlouhavé a hlavně riskantní: pokud na některou opakovaně používanou položku při ručním skládání zapomene, gearlist bude neúplný, aniž by o tom Martin věděl (viz riziko v bodě 1). Tohle je motivace pro Gearlist Template popsaný v sekci 7, bod 5 (od v11 plně rozpracovaný) — je to ale rozšíření nad rámec MVP, ne požadavek na první verzi appky.
7. **Ruční přeznačování skupiny položek (např. "kterých 10 věcí je dnes na mně, ne v batohu") musí jít rychle**, jednu položku po druhé, jedním kliknutím — appka záměrně nemá hromadné (batch) úpravy více položek najednou (viz sekce 3).
8. **Data nesmí zmizet — ani proto, že appka sama změní datový model, ani proto, že uživatel omylem/úmyslně smaže data prohlížeče.** MVP appka zatím nemá účet ani server (viz sekce 2), takže všechna data žijí jen v jednom prohlížeči na jednom počítači — to appku dělá zranitelnou vůči oběma těmhle rizikům. Řešení viz sekce 6a a od v16 FR-16 (automatické ukládání do souboru).

## 2. Co appka řeší a co ne (finální scope, v16)

**Řeší:**
- Uložení vybavení do osobní databáze (**Gear Vault**), s kategoriemi pro orientaci ve velkém Vaultu, vyhledáváním a filtrem (FR-1, FR-2, FR-8, FR-11).
- Sestavení gearlistu (seznam vybavení pro konkrétní trek) z Gear Vaultu. Gearlist je **vždy editovatelný**, nemá žádný „uzamčený“ stav (FR-4).
- **Ochranu starých gearlistů před tichou změnou:** blokující dialog Cancel / Create a copy / Continue při úpravě nebo smazání položky použité i jinde (sekce 3, FR-5). Tohle je hlavní důvod, proč appka existuje, a hlavní věc, kterou se liší od LighterPacku.
- Možnost kdykoli uložit **snapshot** aktuálního obsahu gearlistu jako záznam toho, co si Martin vzal, nezávisle na tom, že gearlist jde dál upravovat (FR-6).
- Rozpad váhy gearlistu na Base Weight / Worn Weight / Consumables / Total Weight, kde Worn a Consumable jsou vlastnosti konkrétního řádku v gearlistu, ne položky v Gear Vaultu (FR-9, FR-10).
- Přepínání jednotek g/kg a oz/lb (FR-3).
- Plně „inline“ editaci: Gear Vault i gearlisty se ovládají kliknutím přímo na hodnotu (název, kategorie, váha, množství), jako buňky v Excelu nebo na lighterpack.com, bez tlačítek „Edit“ (FR-12).
- Ruční přeřazování pořadí (drag & drop) položek, kategorií a gearlistů (FR-13).
- **Gearlist Template:** nový gearlist předvyplněný ze šablony. Implementováno ve v14, zůstává (sekce 7, bod 5).
- **Trvanlivost dat napříč změnami appky** (automatická migrace, FR-15) **a záloha nezávislá na prohlížeči** (Export/Import do souboru, FR-14), obojí od v8. Export/Import zůstává i ve v16, i jako způsob, jak poslat data někomu jinému.
- **Nové ve v16:**
  - **Lokální databáze = automatické ukládání do souboru na disku** (FR-16).
  - **Load demo data** a uvítací obrazovka pro prázdnou appku (FR-17).
  - **Veřejné sdílení gearlistu přes URL**, jen pro čtení a bez serveru (FR-18).
  - **UI design podle Martinova design systému** a **vizualizace váhy jako batoh** místo koláčového grafu (FR-19).
  - **Veřejné nasazení na web jako statická appka** kvůli prezentaci na pohovorech (FR-20).

**Neřeší (ve v16 vyřazeno ze scope, už ne jen odloženo):**
- Přihlašování, účty, databázi na serveru a synchronizaci mezi zařízeními. Důvod: pro jednoho uživatele zbytečná složitost a provozní náklady; trvanlivost dat řeší FR-16.
- Offline PWA a optimalizaci pro mobil. Na telefonu se appka zobrazí (panely pod sebou), ale automatické ukládání do souboru funguje jen na počítači (FR-16).
- Komunitní sdílení gearlistů a monetizaci (sekce 0 a 9).
- Víc snapshotů na gearlist, Duplicate gearlist, víc šablon.
- Hromadné (batch) úpravy více položek najednou (záměrně, viz sekce 3).

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
- **FR-2. Kategorie — předdefinovaný template s vlastní úpravou:** Appka nabídne předdefinovaný seznam kategorií (Backpack, Shelter, Sleep System, Clothing, Cooking, Food, Water, Electronics, Hygiene, Misc) jako výchozí "template". Uživatel může kteroukoli kategorii přejmenovat, přidat vlastní novou, nebo přeřadit jejich pořadí drag & dropem. **Smazat lze jen kategorie, které si uživatel vytvořil sám** (v15 — dřív šlo smazat kteroukoli). Kategorie z výchozí šablony smazat nejdou: jejich smazání by zhoršilo UX (ikony, mřížka dlaždic ve formuláři) a smazání všech kategorií by rozbilo UI. Smazání vlastní kategorie vždy s potvrzením; její položky zůstanou ve Vaultu jako "Uncategorized".
  - **Výběr kategorie ve formuláři "Add item to Gear Vault" (v10):** místo rozbalovacího menu mřížka dlaždic s ikonkou a názvem — jedna dlaždice pro každou kategorii uživatele v jeho pořadí (výchozí kategorie mají vlastní ikonku, vlastní kategorie obecnou), vybírá se jedním kliknutím. Druhé kliknutí na vybranou dlaždici výběr zruší (kategorie je nepovinná, FR-8). Poslední dlaždice **"Other"** založí novou kategorii (napíše se název) a rovnou ji vybere. Důvod: ušetří jedno kliknutí a procházení menu. Změna kategorie u existující položky (inline v řádku) zůstává beze změny.
  - **Přejmenování kategorie (v13):** kliknutím na název kategorie v nadpisu skupiny v Gear Vaultu (stejná inline editace jako jinde: Enter/blur uloží, Escape zruší), nebo kliknutím na název v dialogu "Categories", **nebo (v19) kliknutím na nadpis kategorie v gearlistu či šabloně** — jde o totéž přejmenování kategorie ve Vaultu, takže se změna projeví všude. V gearlistu nejde přejmenovat "Uncategorized" a skupina tvořená jen odpojenými "custom entry" řádky. Platí pro všechny kategorie včetně těch z výchozí šablony. Přejmenování se propíše do všech řádků gearlistů napojených na Vault; odpojené "custom entry" řádky a snapshoty se nemění.
  - **Smazání vlastní kategorie z formuláře (v14):** dlaždice kategorií, které si uživatel sám vytvořil (přes "Other" nebo v dialogu "Categories"), mají v rohu křížek ×. Po potvrzení se kategorie smaže; položky, které ji používaly, zůstanou ve Vaultu jako "Uncategorized" (dialog řekne kolik). Kategorie z výchozí šablony křížek nemají. V dialogu "Categories" platí totéž (v15): tlačítko Delete mají jen vlastní kategorie, s potvrzením.
  - **Výchozí šablona (v13):** "Shelter" přejmenován na **"Shelter System"** (sjednocení se "Sleep System"). Existující data se jednorázově převedou migrací (schemaVersion 4) — stejně, jako kdyby uživatel kategorii přejmenoval ručně.
  - **Výběr kategorie ve formuláři (v13):** vždy je aktivní nejvýš jedna dlaždice — výběr kategorie zavře "Other", klik na "Other" zruší vybranou kategorii; druhý klik na "Other" ho zavře. Když je "Other" aktivní a uživatel napíše název nové kategorie, ale potvrdí rovnou celý formulář, kategorie se založí a položka se do ní uloží (nic se tiše neztratí).
- **FR-3. Jednotky:** Přepínání zobrazení mezi metrickými (g/kg) a imperiálními (oz/lb) jednotkami. Interně se váha ukládá v jedné jednotce (gramy), aby nevznikaly zaokrouhlovací chyby.
- **FR-4. Gearlisty — vytvoření a editace:** Vytvořit pojmenovaný gearlist, přidat do něj položky z Gear Vaultu, upravit množství konkrétně pro tento gearlist (nezávisle na výchozím množství v Gear Vaultu). Gearlist je vždy editovatelný (viz sekce 3). Přidání položky z Gear Vaultu, která už v gearlistu je, **navýší množství existujícího řádku**, nevytvoří duplicitní řádek. **Přidání přetažením (v18):** položku z Gear Vaultu lze myší přetáhnout přímo na otevřený gearlist (nebo šablonu) — kamkoli do pravého panelu. Během přetahování se gearlist zvýrazní s popiskem „Drop to add to …“. Přidá se s výchozím množstvím položky, stejně jako přes tlačítko; pokud v gearlistu už je, navýší se množství. Tlačítko „+ Add item from Gear Vault“ zůstává, protože na dotykových displejích (mobil) přetahování nefunguje.
- **FR-5. Živé propojení s Gear Vaultem + potvrzovací dialog (Cancel / Create a copy / Continue):** Položky v gearlistu, které odkazují na položku v Gear Vaultu ("linked"), zrcadlí její název/kategorii/váhu. Úprava těchto polí — ať už přímo v Gear Vaultu, nebo přímo kliknutím na položku uvnitř gearlistu — kde je položka použita i jinde, vyžaduje explicitní volbu uživatele mezi Cancel / Create a copy of the item / Continue (viz sekce 3). Vždy blokující dialog, nikdy toast. **Totéž platí pro smazání (v9):** smazání Gear Vault položky, která je použitá v nějakém gearlistu, vždy zobrazí blokující dialog **Cancel / Keep in gearlists / Delete everywhere** — "Keep in gearlists" smaže položku jen z Gear Vaultu a řádky v gearlistech nechá jako odpojené "custom entry" s posledními známými hodnotami (obdoba "Create a copy"); "Delete everywhere" položku odstraní z Gear Vaultu i ze všech gearlistů (obdoba "Continue"). Uložené snapshoty (FR-6) se nemění nikdy. Položka nepoužitá v žádném gearlistu se maže po jednoduchém potvrzení.
- **FR-6. Snapshot:** Tlačítko "Save snapshot" na gearlistu uloží kopii (otisk) aktuálního obsahu — jméno, kategorie, váha, množství, Worn/Consumable, poznámka u každé položky — oddělenou od dál editovatelného gearlistu. Jeden gearlist = jeden snapshot; opakované uložení předchozí přepíše (s potvrzením). Tlačítko "View snapshot" zobrazí needitovatelný náhled uloženého snapshotu včetně data uložení.
- **FR-7. *(zrušeno v7 — nahrazeno FR-5/FR-6, žádný "Finalized" needitovatelný stav už neexistuje.)***
- **FR-8. Automatické doplnění kategorie:** Pokud položka nemá přiřazenou kategorii, zobrazuje se jako "Uncategorized". V Gear Vaultu samotném kategorie povinná není (aby přidání nové položky nebylo zdržováno).
- **FR-9. Worn / Consumable jako vlastnost konkrétního řádku v gearlistu (ne Gear Vault položky):** Každý řádek v gearlistu má dva **nezávislé** příznaky — **Worn** (nošeno na těle, ne v batohu) a **Consumable** (spotřebovává se — jídlo, voda, palivo...). Žádný z nich nastavený = počítá se do **Base Weight** (věci v batohu, které se během treku nespotřebovávají). Přepnutí kteréhokoli příznaku je jedno kliknutí a **nikdy nezobrazuje potvrzovací dialog** — je to čistě vlastnost daného řádku v daném gearlistu, nemá žádný dopad na Gear Vault ani na jiné gearlisty. Typický důvod pro nezávislé, ne vzájemně vylučující příznaky: zimní bunda je na jednom treku Worn (na těle), na jiném je stejná bunda zabalená v batohu (Base) — a tohle nastavení je nutně různé gearlist od gearlistu, i pro tutéž položku z Gear Vaultu.
- **FR-10. Rozpad váhy gearlistu:** Gearlist zobrazuje čtyři čísla: **Base Weight**, **Worn Weight**, **Consumables Weight** a **Total Weight**. Base/Worn/Consumable se počítají z FR-9 příznaků (Consumable má prioritu před Worn, pokud by byly nastavené obě); Total je součet všech položek bez ohledu na příznaky. Číselný přehled, ne graf (graf mimo MVP).
- **FR-11. Vyhledávání/filtrování v Gear Vaultu:** Gear Vault lze filtrovat/seskupovat podle kategorie a fulltextově hledat podle názvu položky, aby bylo možné rychle najít položku i ve velkém seznamu vybavení.
- **FR-12. Plně inline editace (bez tlačítka "Edit"):** Jak v Gear Vaultu, tak v gearlistu se každé pole (název, kategorie, váha, množství, poznámka) edituje přímo kliknutím na jeho aktuální hodnotu — klik změní pole na editovatelný vstup, Enter/kliknutí mimo potvrdí, Escape zruší. Žádný samostatný "Edit" režim/tlačítko pro běžné úpravy — cílem je rychlost srovnatelná s tabulkou v Excelu / lighterpack.com. Výjimkou jsou akce s širším dopadem (přidání položky do Gear Vaultu, smazání, potvrzovací dialogy z FR-5) — ty zůstávají v samostatném okně.
- **FR-13. Drag & drop přeřazování:** Položky uvnitř gearlistu (v rámci kategorie), kategorie (v Gear Vaultu i výběru), položky v Gear Vaultu a gearlisty samotné (v rozbalovacím výběru gearlistu, od v9) jdou přetáhnout myší na nové pořadí — appka si pořadí pamatuje.
- **FR-14. Export / Import zálohy (nová, v8):** Tlačítko "Export backup" v hlavičce appky uloží veškerý obsah (Gear Vault, kategorie, gearlisty, snapshoty) jako `.json` soubor na disk uživatele. Tlačítko "Import backup" umožní vybrat dřívě exportovaný soubor a appku jím kompletně nahradit — appka před nahrazením vždy zobrazí potvrzovací dialog s přehledem, kolik položek/gearlistů se aktuálně přepíše a kolik jich přijde ze zálohy. Tohle je jediný mechanismus v MVP, který ochrání data i před tím, že uživatel v prohlížeči smaže data stránek (viz sekce 6a — appka samotná to jinak ovlivnit nemůže).
- **FR-15. Automatická migrace dat při každé změně datového modelu (nová, v8):** Appka si u uložených dat pamatuje číslo verze datového modelu (`schemaVersion`). Při otevření appky s daty starší verze appka automaticky, bez zásahu uživatele, převede data na aktuální tvar (viz sekce 6a — politika migrace). Uživatel o tom nemusí vůbec vědět — prostě uvidí svoje staré gearlisty a vybavení tak, jak je nechal.

- **FR-16. Automatické ukládání do datového souboru – „lokální databáze“ (v16):**
  - **Proč:** Data dnes žijí jen v prohlížeči a smazání dat prohlížeče je smaže (Slabina B, sekce 6a). Export/Import chrání, jen když si na něj Martin vzpomene. Tohle chrání automaticky, bez serveru.
  - **Pro uživatele:** V hlavičce je tlačítko **„Connect data file“**. Uživatel jednou vybere soubor (nový, nebo existující `.json`). Od té chvíle appka po každé změně sama uloží aktuální stav do souboru (s krátkým zpožděním kolem 1 s, aby nezapisovala při každém stisku klávesy). V hlavičce je vidět stav, např. „Saved to hikingbuddy-data.json · 16:42“, „Saving…“, nebo srozumitelná chyba.
  - **Připojení souboru, který už obsahuje data:** blokující dialog **Cancel / Load data from file / Overwrite file with current data** s počty položek a gearlistů v appce a v souboru (obdoba Importu, FR-14). Nic se nepřepíše bez explicitní volby.
  - **Po znovuotevření appky:** appka si pamatuje, který soubor byl připojený. Když prohlížeč vyžaduje znovu potvrdit přístup, zobrazí se nápadný pruh **„Reconnect to your data file“** (jedno kliknutí a potvrzení v prohlížeči). Dokud přístup není potvrzený, appka do souboru nic nezapisuje a jasně ukazuje, že se změny zatím ukládají jen v prohlížeči. Po připojení je **zdrojem pravdy soubor**. Pokud se data v prohlížeči od souboru liší (Martin mezitím pracoval bez připojení), zobrazí se stejný dialog jako výše.
  - **„Disconnect“** soubor odpojí. Data zůstanou v prohlížeči i v souboru.
  - **Soubor zmizel nebo se přesunul:** srozumitelná chyba a nabídka připojit jiný soubor. Data v prohlížeči zůstávají.
  - **Kde má soubor ležet (doporučení):** ve složce synchronizované do cloudu (OneDrive nebo Google Drive). Tím je zároveň zálohovaný a dostupný i na jiném počítači. Appka cestu neřeší, vybírá se v dialogu prohlížeče. Pokud by Martin chtěl soubor v repozitáři HikingBuddy, pak jen ve složce `data/`, která je v `.gitignore`. Osobní data nepatří do gitu, zvlášť pokud bude repozitář veřejný (FR-20).
  - **Formát souboru:** stejný jako Export (`{ schemaVersion, state }`). Na data ze souboru se tak uplatní stejné migrace (FR-15) a soubor jde kdykoli použít i jako záloha pro Import.
  - **Kde to funguje:** Chrome a Edge na počítači (File System Access API). Ve Firefoxu, Safari a na mobilu se místo tlačítka zobrazí krátká informace, že tento prohlížeč automatické ukládání neumí. Appka tam funguje jako dnes (data v prohlížeči + Export/Import).
  - **`localStorage` zůstává** jako pracovní kopie a jako úložiště pro návštěvníky bez připojeného souboru.
  - **Upřesnění při implementaci (v17):**
    - „Connect data file“ otevře krátké vysvětlení a dvě volby: **„Create new file“** (dialog Uložit, předvyplněné jméno `hikingbuddy-data.json`) a **„Choose existing file“** (dialog Otevřít).
    - Soubor, který **není** datovým souborem HikingBuddy (jiný JSON apod.), appka odmítne připojit a nic do něj nezapíše. Prázdný soubor se rovnou naplní aktuálními daty.
    - Po znovuotevření: pokud se data v prohlížeči od posledního uložení do souboru **nezměnila**, ale soubor ano (byl upraven na jiném počítači přes OneDrive), appka data ze souboru načte **bez dialogu** (soubor je zdroj pravdy) a krátce to oznámí. Dialog se ukáže, jen když se změnila data v prohlížeči.
    - Appka před každým uložením zkontroluje, že soubor mezitím nezměnil někdo jiný. Pokud ano, místo přepsání ukáže stejný dialog.
    - Cancel v dialogu u znovupřipojení nechá soubor odpojený s pruhem „Reconnect“ (nic se nezapisuje, dokud se uživatel nerozhodne).
  - **Technická poznámka pro Claude Code:** `showSaveFilePicker` / `showOpenFilePicker`; odkaz na soubor (file handle) uložit do IndexedDB, protože do `localStorage` ho uložit nejde; `queryPermission` / `requestPermission` (vyžaduje kliknutí uživatele). Zapisovat jen při změně stavu. Ověřit scénáře: nový soubor, existující soubor s daty, znovuotevření prohlížeče, odepřený přístup, smazaný soubor, data ve starším `schemaVersion`.
- **FR-17. Load demo data (v16):**
  - **Proč:** Prázdná appka na pohovoru nic neukáže.
  - **Uvítací stav:** Když je appka úplně prázdná (žádné položky ve Vaultu ani gearlisty), zobrazí se místo prázdných panelů uvítací karta: jedna dvě věty o tom, co appka řeší, a tlačítka **„Load demo data“** a **„Start empty“**.
  - **„Load demo data“ jde použít i později** (v hlavičce u Export/Import). Pokud appka už obsahuje data, zobrazí se potvrzovací dialog jako u Importu (co se přepíše).
  - **Je-li připojený datový soubor (FR-16), demo data nejdou nahrát.** Tlačítko je neaktivní s vysvětlením „Disconnect your data file first“, aby si Martin omylem nepřepsal skutečná data.
  - **Obsah demo dat:** základem je Martinův LighterPack export „Weekend Hikes“ (31 položek, už převedený v `Claude outputs/Weekend_Hikes-HikingBuddy-import.json`). Doplnit tak, aby demo ukázalo hlavní funkce: aspoň 2 gearlisty sdílející některé položky (kvůli ukázce dialogu Cancel / Create a copy / Continue), jeden gearlist s uloženým snapshotem, šablonu a položky Worn i Consumable. Martin před nasazením zkontroluje, že demo neobsahuje nic osobního.
  - Demo data jsou přímo součástí appky (soubor v kódu), nic se nestahuje odjinud.
  - **Upřesnění při implementaci (v17):** soubor `app/src/demo/demo-data.json` ve formátu Exportu, takže na něj platí migrace (FR-15) i po budoucích změnách datového modelu. Obsah: 46 položek ve Vaultu (31 z „Weekend Hikes“ + 15 doplněných obecných: spací systém, nepromokavé oblečení, trekové hole, lékárnička, jídlo na delší trek…), gearlist **„Weekend Hikes“** se snapshotem, gearlist **„Kungsleden – 7 days“** (sdílí většinu položek, víc jídla), **šablona** a položky Worn (boty, kalhoty, triko, hole) i Consumable (jídlo, voda, palivo). Dva české názvy přeloženy do angličtiny (UI je anglicky): „Tekuty lih“ → „Fuel (alcohol)“ (nově Consumable), „Zvykacky“ → „Chewing gum“. **Čeká na Martinovo schválení obsahu.** „Start empty“ skryje uvítací kartu jen do zavření stránky — dokud je appka prázdná, při dalším otevření se ukáže znovu.
- **FR-18. Sdílení gearlistu přes URL, jen pro čtení, bez serveru (v16):**
  - **Proč:** Poslat gearlist kamarádovi nebo na fórum a ukázat ho na pohovoru.
  - **Jak to funguje bez serveru:** Obsah gearlistu se zkomprimuje a zakóduje přímo do odkazu, do části adresy za `#`. Odkaz tedy data sám nese a nikam se neukládají. Část za `#` prohlížeč neposílá ani na server hostingu.
  - **Pro uživatele:** Tlačítko **„Share“** na gearlistu otevře dialog s odkazem, tlačítkem „Copy link“ a vysvětlením: „This link contains a copy of the gearlist as it is now. Later changes won't appear in it.“
  - **Co se sdílí:** aktuální obsah gearlistu v okamžiku kliknutí: název gearlistu, položky (název, kategorie, váha, množství, poznámka, Worn/Consumable) a pořadí kategorií. Nic jiného z Gear Vaultu, žádné další gearlisty, žádný snapshot.
  - **Kdo odkaz otevře:** uvidí stránku jen pro čtení s názvem, položkami po kategoriích, rozpadem váhy (FR-10), vizualizací batohem (FR-19) a přepínačem jednotek. Jeho vlastní data v appce se nezmění. Na stránce je odkaz „Open HikingBuddy“ do appky.
  - **Vědomá omezení:** Odkaz je dlouhý (u běžného gearlistu řádově tisíce znaků). Nejde později aktualizovat ani zrušit: kdo ho má, vidí obsah. Proto se sdílí jen jeden gearlist. Krátké nebo aktualizovatelné odkazy by vyžadovaly server, který je mimo scope.
  - **Mimo scope:** „Importovat tento gearlist do mé appky“ (případné pozdější rozšíření).
  - **Upřesnění při implementaci (v17):** Share je jen u gearlistů (ne u šablony) a je neaktivní u prázdného gearlistu. Sdílená stránka se otevře v jednotkách, které měl sdílející, a přepínač mění jen zobrazení. Dialog má navíc „Open preview“ (otevře odkaz v nové záložce). Rozbitý nebo useknutý odkaz ukáže srozumitelnou zprávu. Odkaz u gearlistu se ~44 položkami má kolem 1 200 znaků. Vizualizace batohem na sdílené stránce přibude s FR-19.
  - **Technická poznámka pro Claude Code:** komprese např. knihovnou `lz-string`; formát odkazu verzovat (např. `#share=v1:…`), aby staré odkazy fungovaly i po budoucí změně datového modelu.
- **FR-19. UI design a vizualizace váhy batohem (v16):**
  - **Závislost:** Čeká na Martina. Ten si vytvoří design system (v Claude, Artifacts → Design System) a ten se pak aplikuje na appku. Do té doby Claude Code tuto položku nezačíná.
  - **Design system** se aplikuje na celou appku (barvy, typografie, rozestupy, komponenty) bez změny chování.
  - **Vizualizace „batoh“ místo koláčového grafu (ten má LighterPack):** silueta batohu, jejíž objem je odspodu vyplněný barevnými vrstvami. Jedna vrstva za každou kategorii, výška vrstvy odpovídá podílu kategorie na váze. Vedle legenda: barva, kategorie, váha, procento. Najetí myší na vrstvu nebo řádek legendy zvýrazní obojí. Zobrazuje se u gearlistu vedle rozpadu váhy, v šabloně a na sdílené stránce (FR-18).
  - **Rozhodnuto (v21, 2026-10-12, Martin):** design system „HikingBuddy“ (artefakt, kopie v `design/2026-10-redesign/design-system/`) je schválený. Podklady a rozhodnutí: `design/2026-10-redesign/README.md`.
    - **Téma:** jen světlé, teplé barvy „stezka při západu slunce“ (inspirace Firewatch, méně syté). Tmavé téma ne. Písma Barlow Condensed (nadpisy, štítky) a Overpass (text, čísla).
    - **Pozadí:** jemná ilustrace hor, lesa a stezky dole za panely, nikdy pod textem.
    - **Batoh:** tvar A (zaoblený vršek, ucho, boční kapsy), **nahoře v panelu gearlistu** nad seznamem položek, vedle něj legenda (barva, ikona, kategorie, váha, %). Zobrazuje se u gearlistu, šablony i na sdílené stránce.
    - **Co je v batohu:** **Base + Consumables.** Worn se do batohu nepočítá; pod batohem je rozpad Base / Consumables a zvlášť Worn (ikona hikera, „+ váha“).
    - **Pořadí vrstev:** **nejtěžší kategorie dole.** Velmi malé kategorie mají minimální výšku, aby byly vidět. Najetí myší (nebo focus) na vrstvu či řádek legendy zvýrazní obojí.
    - **Barvy kategorií:** každá kategorie má svou barvu všude v appce (vrstva, legenda, tečka u nadpisu, dlaždice). Neukládají se, odvozují se: výchozí kategorie podle svého id, vlastní kategorie podle pořadí mezi vlastními kategoriemi (4 barvy dokola). Přeřazení vlastních kategorií jim tedy může barvy prohodit (Martin vědomě přijal, datový model se nemění).
    - **Ikony místo textu** u častých akcí (snapshot, sdílení, šablona, smazání, odebrání, export/import, datový soubor, nový gearlist…). Každé ikonové tlačítko má tooltip a popis pro čtečky se stejným textem. Worn = vlastní ikona boty, Consumable = příbor, Food zůstává jablko. V dialozích ikona + text; text zůstává i u „Add gear“, „Load demo data“ a „Connect data file“ a na uvítací kartě.
    - **Texty:** beze změny kromě přepínače jednotek („g / kg“, „oz / lb“) a pořadí dlaždic vah (Base, Consumables, Worn, Total). Popisek „Always editable…“ pod názvem gearlistu odpadá; u šablony zůstává krátká věta, že se změny do existujících gearlistů nepropíšou.
    - **Řádky:** kategorie zůstává v řádku jako nenápadné klikací pole (FR-12 se nemění). Akce v řádku se na počítači ukážou při najetí myší nebo focusu, na dotykovém zařízení jsou vidět vždy.
    - **Malé obrazovky a dotyk:** pod 900 px panely pod sebou, pod 560 px se řádky zalamují a dlaždice vah jsou 2×2; na dotyku nic schovaného za najetím myší a cíle aspoň 44 px. Samostatná mobilní verze zůstává mimo scope.
    - **Sdílený odkaz v2:** nese u každé kategorie i její barvu/ikonu, aby sdílená stránka vypadala stejně jako appka i u přejmenovaných a vlastních kategorií. Odkazy v1 dál fungují (kategorie se poznají podle názvu výchozích kategorií).
- **FR-20. Veřejné nasazení na web (v16):**
  - **Proč:** prezentace na pohovorech, tedy odkaz, který kdokoli otevře.
  - Appka se nasadí jako statický web na bezplatný hosting (Cloudflare Pages, Netlify nebo Vercel umí i soukromý repozitář; GitHub Pages je zdarma jen pro veřejný). Po každém pushi do hlavní větve se automaticky nasadí znovu.
  - Žádný server, databáze ani účty. Nulové náklady (volitelně jen vlastní doména).
  - Každý návštěvník má vlastní oddělenou kopii dat v prohlížeči. Sdílené odkazy (FR-18) vedou na veřejnou adresu.
  - Martin může na veřejné adrese používat appku se svým datovým souborem (FR-16): stačí na ní připojit stejný soubor a zvolit „Load data from file“.
  - **Rozhodnout při nasazení:** veřejný, nebo soukromý repozitář na GitHubu. Veřejný znamená, že recruiter uvidí i kód, PRD a BACKLOG (dobrá ukázka procesu); předtím je potřeba zkontrolovat, že v repozitáři není nic osobního.
  - **Až po** dokončení FR-16 až FR-19 a Martinově testu lokálně.

### Příklad (pro ověření návrhu): přidání položky "Snickers" do Gear Vaultu
Martin přidá do Gear Vaultu novou položku: Název "Snickers", Kategorie "Food", Váha 60 g, Quantity 5, Poznámka "bílá čokoláda". Tuhle položku pak přidá do libovolného gearlistu a tam u ní zaškrtne Consumable (nepočítá se do Base Weight) — to je vlastnost jen tohoto konkrétního gearlistu. Pokud Martin později v Gear Vaultu upraví váhu na 62 g a položka je použitá i jinde, dostane dialog Cancel / Create a copy / Continue — může se rozhodnout, jestli se to má promítnout všude, nebo jestli vznikne oddělená kopie jen pro tuhle úpravu.

## 5. UX & Layout

Inspirováno rozložením lighterpack.com (ověřeno i přímým průzkumem appky):
- **Rozdělení obrazovky na dva panely:**
  - **Levý panel — Gear Vault:** správa osobní databáze vybavení, seskupená podle kategorie (s možností drag & drop přeřazení), vyhledávací pole a filtr kategorie nahoře. Každý řádek je inline editovatelný (FR-12), s "úchytem" (⠿) pro přetažení.
    - **Přidání položky (v12, upraveno ve v13):** na konci každé kategorie v seznamu je "+ Add item" (jako na lighterpack.com) — otevře formulář "Add item to Gear Vault" s danou kategorií už vybranou (lze ji změnit). Skupina "Uncategorized" (pokud existuje) má tlačítko také, bez předvybrané kategorie. **Ve Vaultu se zobrazují jen kategorie, které obsahují nějakou položku** (v13 — prázdné kategorie byly jen šum). Pro přidání do kategorie, která ve Vaultu zatím není, nebo do úplně nové, slouží **vždy viditelné velké tlačítko "+ Add gear" přes celou šířku, připnuté dole v panelu Gear Vault** (v14; ve v13 bylo malé v hlavičce — Martin chtěl, aby bylo dominantnější, lépe vidět na desktopu a blíž palci na mobilu; zůstává vidět i při posouvání seznamu) — otevře formulář s **předvybranou dlaždicí "Other"** (pole pro název nové kategorie je otevřené, kurzor ale začíná v poli Name); jinou kategorii lze vybrat jedním klikem.
    - **Formulář "Add item to Gear Vault" se nezavírá kliknutím mimo okno (v13)** — dřív to zahodilo vše napsané. Zavírá se tlačítkem Cancel nebo klávesou Escape.
  - **Pravý panel — Gearlisty (v9):** nahoře název otevřeného gearlistu, který je zároveň rozbalovacím výběrem pro přepnutí na jiný gearlist (seznam v něm je přetažitelný, FR-13), vedle tlačítko "+ New gearlist". Samostatný sloupec se seznamem gearlistů byl ve v9 zrušen, aby celá šířka panelu patřila položkám gearlistu. Pod tím detail otevřeného gearlistu — položky seskupené podle kategorie s mezisoučtem váhy, celkový souhrn (Total / Consumable / Worn / Base Weight) nahoře, tlačítka "Save snapshot" / "View snapshot" / "Delete".
  - **Hlavička appky (nová, v8):** vedle přepínače jednotek přibyla tlačítka "Export backup" / "Import backup" (FR-14) — jsou vidět odkudkoliv v appce, protože záloha dat je důležitá dost na to, aby nebyla schovaná v podmenu.
- **Úzké okno (v9):** appka musí být plně použitelná i s oknem přichyceným na polovinu obrazovky monitoru. Když je panel úzký, řádek položky se zalomí: nahoře úchyt, název a poznámka, celková váha řádku a "Remove"; pod tím kategorie, váha, Worn/Consumable a počet kusů. Totéž platí pro řádky v Gear Vaultu. Dlaždice rozpadu váhy se v úzkém panelu skládají 2×2. Pod šířkou okna 900 px se oba panely skládají pod sebe.
- Koláčový graf rozložení váhy podle kategorie (jak ho má lighterpack.com) appka mít nebude. **Od v16 ho nahrazuje vizualizace batohem** vedle číselného rozpadu váhy (FR-19).
- **Nové prvky ve v16:** stav datového souboru a tlačítka Connect/Reconnect/Disconnect (FR-16), „Load demo data“ a uvítací karta (FR-17), tlačítko „Share“ na gearlistu a stránka sdíleného gearlistu (FR-18). Přesné rozmístění určí design (FR-19).

## 6. Technické poznámky (v prostém jazyce)

- **Tech stack:** React + Vite + TypeScript. Vite je nástroj, který appku při vývoji rychle spouští a sestavuje; TypeScript pomáhá odchytit chyby dřív, než se appka spustí.
- **Jak funguje propojení s Gear Vaultem na úrovni dat (v7):** Položka v gearlistu si drží odkaz (ID) na položku v Gear Vaultu, dokud existuje — proto se schválené úpravy Gear Vaultu (FR-5, "Continue") do gearlistu promítají. Když uživatel zvolí "Create a copy", appka vytvoří novou položku v Gear Vaultu a přepojí na ni jen ten jeden konkrétní řádek gearlistu — zbytek zůstává na staré položce. Smazání položky v Gear Vaultu (v9) se řídí volbou v dialogu z FR-5: buď řádky, které na ni odkazovaly, odpojí (zůstanou v gearlistu se svými posledními známými hodnotami jako "custom entry", dál nezávisle editovatelné), nebo je ze všech gearlistů odstraní. Snapshot (FR-6) je čistě "hluboká kopie" aktuálního seznamu položek gearlistu uložená vedle něj, bez jakéhokoli odkazu na Gear Vault.
- **Hosting (v16):** statický web na bezplatném hostingu, bez serveru (FR-20). „Statický“ znamená, že hosting jen posílá soubory appky; všechno ostatní běží v prohlížeči uživatele.
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

**Rozhodnutí ve v16:** zvolena cesta 1, lokální soubor spravovaný appkou (FR-16). Cesta 2, serverová databáze, je vyřazená ze scope (sekce 0 a 2). Export/Import zůstává jako ruční záloha a způsob, jak poslat data někomu jinému.

**Politika pro budoucí vývoj appky (důležité i pro Claude Code / jakéhokoli agenta, co na appce dál pracuje):** Tahle politika je teď zapsaná přímo v repozitáři appky (`README.md`, sekce "Data storage"), aby ji viděl kdokoli, kdo na kódu pracuje, ne jen v tomhle PRD. V kostce: **žádná budoucí změna tvaru dat (`AppState`, `GearItem`, `GearListItem`, `GearList`, `Category`) nesmí projít bez migrace ze staré verze** — přesně tenhle krok chyběl u v7 a způsobil dojem ztráty dat. Od v16 platí totéž i pro datový soubor (FR-16), který má stejný formát jako Export, a pro sdílené odkazy (FR-18), které mají vlastní číslo verze formátu.

## 7. Rozšíření nad původní MVP — stav po uzavření scope (v16)

*Ve v16 (2026-10-09) Martin o každém bodu rozhodl: buď je součástí finálního scope, nebo je vyřazený (už ne jen odložený). Číslování bodů zůstává kvůli odkazům z jiných sekcí.*


1. **Vyřazeno (v16).** Offline PWA (instalace na plochu telefonu, přístup bez signálu).
2. **Vyřazeno (v16).** Přihlašování a synchronizace mezi zařízeními — **technicky totéž jako "skutečná databáze na serveru" ze sekce 6a, bod 2**; obě sekce popisují stejný budoucí krok z různých úhlů (sekce 6a z pohledu ochrany dat, tahle sekce z pohledu multi-device UX).
3. Veřejné sdílení gearlistu přes URL. **Ve scope (v16), bez serveru, viz FR-18.**
4. Grafy/vizualizace váhy podle kategorie (koláčový graf jako na lighterpack.com). **Ve scope (v16), ale jako batoh místo koláče, viz FR-19.**
5. **Gearlist Template (šablona výchozího vybavení)** — **ve scope (v16).** *rozpracováno ve v11 (2026-10-07), **implementováno ve v14 (2026-10-08)**, čeká na Martinův test. Drobná upřesnění při implementaci: (a) u "+ New gearlist" je při existující šabloně předvybraná volba "From template" (lze přepnout na "Blank gearlist") — potvrzeno Martinem; (b) úprava z řádku samotné šablony vyvolá dialog stejně jako z řádku gearlistu — tedy jen když je položka použitá ještě jinde (gearlist, nebo podruhé v šabloně); pokud je jen v tomto řádku šablony, uloží se rovnou, stejně jako u jediného výskytu v gearlistu; (c) "Save as template" je neaktivní, pokud gearlist obsahuje jen odpojené custom entries.*
   - **Problém, který řeší:** Martin si na drtivou většinu treků bere stejný okruh základního vybavení (stan, spacák, vařič, lékárnička...). Bez šablony musí při založení každého nového gearlistu tyto položky znovu ručně dohledávat a přidávat z Gear Vaultu — to zabírá čas a hlavně hrozí, že na některou opakovaně používanou položku při ručním skládání zapomene (viz problém č. 6 v sekci 1).
   - **Princip:** Uživatel má **jednu hlavní šablonu** ("Template"). Šablona je seznam odkazů na položky z Gear Vaultu; každý řádek si navíc pamatuje **množství** a příznaky **Worn / Consumable**. Šablona slouží **jen k automatickému "vyskládání" položek při založení nového gearlistu**: jakmile gearlist vznikne, je na šabloně úplně nezávislý — pozdější úpravy šablony do něj nijak nezasahují (a naopak).
   - **T-1. Vytvoření šablony — "Save as template":** Na každém gearlistu je tlačítko "Save as template". Uloží aktuální obsah gearlistu jako šablonu (položky, množství, Worn/Consumable). Pokud šablona už existuje, appka se nejdřív potvrzovacím dialogem zeptá, jestli ji přepsat (obdoba opakovaného "Save snapshot"). **Od v20 se tlačítko v tom případě jmenuje "Update template"** (obdoba "Update snapshot") a dialog připomene, že jednotlivé položky jde upravit i přímo v šabloně (📋 Template v rozbalovacím výběru, T-3). Do šablony se dostanou jen řádky propojené s Gear Vaultem — odpojené "custom entry" řádky (položka už ve Vaultu neexistuje) se přeskočí a dialog řekne, kolik jich bylo.
   - **T-2. Nabídka po prvním gearlistu:** Dokud šablona neexistuje, zobrazí se v gearlistu, který obsahuje aspoň jednu položku, nenápadný zavíratelný pruh (banner) "Use this gearlist as your template?" s tlačítkem "Create template" (= totéž co "Save as template") a křížkem. Nic neblokuje. Po zavření křížkem se už nezobrazuje (appka si to pamatuje); tlačítko "Save as template" zůstává dostupné vždy.
   - **T-3. Zobrazení a úprava šablony:** Šablona je v rozbalovacím výběru gearlistů (sekce 5) jako zvláštní položka "Template", připnutá nahoře (nepřetahuje se mezi gearlisty). Po otevření se upravuje stejně jako gearlist: přidání položek z Gear Vaultu (přidání položky, která už v šabloně je, navýší množství — žádné duplicitní řádky), odebrání, změna množství, přepínání Worn/Consumable, drag & drop pořadí, rozpad váhy. Na rozdíl od gearlistu nemá snapshot. Název je pevný ("Template"), dokud existuje jen jedna šablona. Šablonu lze smazat (s potvrzením); gearlistů, které z ní vznikly, se to nijak nedotkne.
   - **T-4. Založení gearlistu ze šablony:** Pokud šablona existuje, tlačítko "+ New gearlist" nabídne dvě volby — **"Blank gearlist"** a **"From template"**. "From template" vytvoří gearlist předvyplněný všemi položkami šablony s jejich množstvím a Worn/Consumable; řádky jsou běžně propojené s Gear Vaultem (stejně jako ručně přidané položky). Martin pak gearlist jen doladí pro konkrétní trek. Pokud šablona neexistuje, "+ New gearlist" funguje jako dnes (rovnou prázdný gearlist).
   - **T-5. Úprava Vault položky, která je v šabloně (rozhodnutí Martina):** Šablona se počítá jako **"použito jinde"**. Úprava názvu / kategorie / váhy takové položky — ať vyjde z Gear Vaultu, z gearlistu, nebo z řádku šablony samotné — vždy zobrazí blokující dialog **Cancel / Create a copy of the item / Continue** (sekce 3, FR-5), i když položka není v žádném gearlistu. Dialog uvádí, že je položka v šabloně (souvisí s CR v BACKLOG Inbox, aby dialog ukazoval, čeho všeho se úprava týká).
     - "Continue" = změna se uloží do Vault položky, a tím se projeví i v šabloně.
     - "Create a copy" = šablona zůstane napojená na původní položku. Pokud úprava vyšla přímo z řádku šablony, přepojí se na novou kopii jen tento řádek (stejně jako u řádku gearlistu).
     - Změna množství nebo Worn/Consumable v řádku šablony je vlastnost jen šablony a dialog nikdy nevyvolá (obdoba FR-9).
   - **T-6. Smazání Vault položky, která je v šabloně:** Šablona smí obsahovat jen položky existující v Gear Vaultu, takže smazání položky z Vaultu ji vždy odebere i ze šablony. Proto vždy varování, nikdy tiché smazání:
     - Položka je jen v šabloně (v žádném gearlistu): blokující dialog "This item is in your template. Deleting it will also remove it from the template." — **Cancel / Delete**.
     - Položka je v šabloně i v gearlistech: stávající dialog **Cancel / Keep in gearlists / Delete everywhere** (FR-5), doplněný o informaci, že se položka v obou případech odebere i ze šablony.
     - Snapshoty se nemění nikdy (beze změny oproti FR-5).
   - **Co šablona zatím neumí:** Víc šablon najednou (např. "Léto", "Zima") — Martin rozhodl, že zatím stačí jedna. Datově se ale připraví tak, aby šlo později přidat další bez přestavby.
   - **Technická poznámka:** Šablona je nová část uložených dat, takže podle politiky v sekci 6a bude potřeba zvýšit `schemaVersion` a přidat migraci (stávající data dostanou "žádná šablona" a nic se neztratí). Export/Import zálohy (FR-14) musí šablonu zahrnovat.
   - **Proč beyond MVP:** Nejde o řešení nejkritičtějšího rizika (neúplný gearlist kvůli zpětné úpravě Gear Vaultu — to řeší sekce 3), ale o zrychlení a pohodlí při zakládání nového gearlistu. Kdy se začne stavět, rozhoduje Martin přesunem v `BACKLOG.md`.
6. **Vyřazeno (v16).** **Historie víc než jednoho snapshotu na gearlist** (pojmenované/více uložených otisků v čase, ne jen jeden přepisovaný) — zvažováno u v7, ale zatím vynecháno, aby MVP zůstalo jednoduché; Martin explicitně potvrdil, že pro MVP stačí jeden.
7. **Lokální auto-save do souboru na disku** (File System Access API) — viz sekce 6a, bod 1. Krok mezi dnešním ručním Exportem/Importem a plnou serverovou databází. **Ve scope (v16), viz FR-16.**
8. **Vyřazeno (v16).** **Duplicate gearlist** (přidáno ve v11) — založit nový gearlist jako kopii existujícího (položky, množství, Worn/Consumable; bez snapshotu). Martin 2026-10-07: dobrý nápad, ale až na později — hlavní cestou k rychlému založení gearlistu je šablona (bod 5). Rozdíl: kopie přenese i věci specifické pro minulý trek, které je pak potřeba ručně odebrat, kdežto šablona je "čistý základ".

9. **Nápad (v23, 2026-10-13), mimo scope — obvyklé teploty v místě a období treku.** *Nice-to-have, Martin. Nic se nestaví, dokud ho Martin nepřesune do „Teď“.*
   - **Problém:** Při balení potřebuju vědět, na jaké teploty se balím, hlavně jak studené budou noci (spacák, oblečení). Dnes to dohledávám jinde a výsledek nemám u gearlistu.
   - **Řešení (Martin):** U gearlistu si volitelně zadám **období treku** (např. celý srpen, nebo konkrétní dny) a **místo** (vyhledání podle názvu, např. Kvikkjokk pro Kungsleden). V gearlistu se zobrazí **obvyklé teploty** v tom místě a období.
   - **Poznámky k rozpracování (Claude):**
     - **Jde to bez serveru,** takže to nenarušuje architekturu statické appky (sekce 0). Appka se může přímo z prohlížeče zeptat bezplatné služby Open-Meteo (bez registrace a API klíče): vyhledání místa podle názvu a historická data o počasí.
     - **„Obvyklé teploty“** = průměr za posledních zhruba 10–30 let pro zvolené dny: průměrné denní maximum, průměrné noční minimum a nejchladnější noc za to období (rozumný „nejhorší případ“). Volitelně i srážky.
     - **Pokud trek začíná do zhruba dvou týdnů,** může appka vedle průměrů ukázat i skutečnou předpověď.
     - **Licence:** Bezplatné použití Open-Meteo je jen nekomerční (do 10 000 dotazů denně). Pro osobní appku a portfolio to stačí; ve veřejné verzi s monetizací (sekce 9) by byl potřeba placený tarif nebo vlastní server. Data jsou pod licencí CC BY 4.0, takže appka musí uvést zdroj.
     - **Nadmořská výška:** Data platí pro jeden bod. Na hřebenech je chladněji (zhruba o 0,6–0,7 °C na každých 100 m výšky), proto zobrazit i nadmořskou výšku místa.
     - **Uložit výsledek do gearlistu:** načtené teploty se uloží spolu s obdobím a místem, aby se nemusely načítat znovu a byly vidět i ve snapshotu a ve sdíleném odkazu. Je to změna datového modelu, takže podle sekce 6a potřebuje migraci (`schemaVersion`).
     - **Jednotky:** °C nebo °F podle přepínače jednotek (FR-3).
     - **Navazující rozšíření s velkou hodnotou:** u spacáku nebo quiltu pole „komfortní teplota“; appka upozorní, když je očekávané noční minimum pod komfortní teplotou spacáku. Přímo to navazuje na hlavní problém appky (sekce 1, bod 1: aby v terénu nic nechybělo).
   - **Otevřené otázky:** Zadávat jen měsíc, nebo i přesná data? (Návrh: obojí.) Jedno místo, nebo víc bodů trasy? (Návrh: začít jedním.)
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
- **Layout: zrušen sloupec se seznamem gearlistů** (návrh Martina, Excalidraw skica 2026-09-24). Důvod: s oknem na půl obrazovky byly položky gearlistu nečitelné. Gearlist se přepíná rozbalovacím výběrem v jeho názvu; řádky položek se v úzkém panelu zalamují do dvou řádků (sekce 5).

## 8c. Rozhodnutí uzavřená v tomto kole (v10)

- **Kategorie při přidání položky do Gear Vaultu se vybírá dlaždicemi s ikonkami, ne rozbalovacím menu** (návrh Martina, Excalidraw skica 2026-09-24) — viz FR-2. Dlaždice "Other" = založit novou kategorii (potvrzeno Martinem); dlaždice mají pod ikonkou i název kategorie, aby se daly rozlišit i podobné ikonky.

## 8d. Rozhodnutí uzavřená v tomto kole (v11)

- **Gearlist Template rozpracován** (sekce 7, bod 5) — Martin rozhodl otevřené otázky z v5:
  - **Zatím jen jedna hlavní šablona.** Při zakládání gearlistu volba "Blank gearlist" / "From template".
  - **Šablona slouží jen k automatickému vyskládání položek** z Gear Vaultu při založení gearlistu. Hotový gearlist na ní dál nezávisí.
  - **Šablona si pamatuje množství a Worn/Consumable** u každé položky (např. bunda může být rovnou Worn).
  - **Vytvoření:** tlačítko "Save as template" na gearlistu + zavíratelný banner s nabídkou "Create template", dokud šablona neexistuje (Martinův nápad: nabídnout šablonu po vytvoření prvního gearlistu). Šablona se pak upravuje stejně jako gearlist, jako zvláštní položka v rozbalovacím výběru gearlistů.
  - **Úprava Vault položky, která je v šabloně, spouští dialog Cancel / Create a copy / Continue** — šablona se počítá jako "použito jinde". Martin zvolil tuto variantu místo tiché aktualizace šablony, v souladu s pravidlem, že se data nemají měnit bez vědomí uživatele.
  - **Smazání Vault položky, která je v šabloně, vždy s varováním** (Martinův požadavek), protože se tím odebere i ze šablony.
- **Duplicate gearlist odložen na později** (sekce 7, bod 8).
- Feature zůstává **mimo MVP scope**, dokud ji Martin nepřesune v `BACKLOG.md` do "Teď".

## 8e. Rozhodnutí uzavřená v tomto kole (v12)

- **"+ Add item" v Gear Vaultu na konci každé kategorie místo v hlavičce panelu** (požadavek Martina, 2026-10-08, podle lighterpack.com). Důvod: tlačítko je co nejblíž místu, kam položka přibude, a kategorie se rovnou předvybere. Optimalizace pro mobil zatím neřešena (Martinovo rozhodnutí). Gearlist panel ("+ Add item from Gear Vault") beze změny.

## 8f. Rozhodnutí uzavřená v tomto kole (v13)

- **Prázdné kategorie se ve Vaultu nezobrazují; místo nich vždy viditelné "+ Add gear" v hlavičce s předvybraným "Other"** (Martin, 2026-10-08, po testu v12). Per-category "+ Add item" zůstává.
- **Kategorie jdou přejmenovat kliknutím na nadpis ve Vaultu** (Martin; zároveň BACKLOG bug z 2026-09-24).
- **Dialog Cancel / Create a copy / Continue (i u mazání) vypisuje názvy dotčených gearlistů** (BACKLOG CR z 2026-09-24). Při editaci z gearlistu se uvádějí ostatní gearlisty, a tentýž gearlist jen pokud v něm položka je víckrát.
- **Formulář přidání položky se nezavírá klikem mimo okno** (BACKLOG bug z 2026-09-24); Cancel nebo Escape.
- **"Shelter" → "Shelter System"** (BACKLOG CR z 2026-09-24) — Claude zvolil velké "S" kvůli shodě se "Sleep System"; Martin může změnit přejmenováním. Existující data převedena migrací (schemaVersion 3 → 4).
- **BACKLOG má nový stav 🧪 Test** — hotové věci čekají na Martinovo ověření, teprve pak jdou do ✅ Hotovo.

## 8g. Rozhodnutí uzavřená v tomto kole (v14)

- **Gearlist Template implementován** podle specifikace v sekci 7, bod 5 (Martin přesunul do "Teď" 2026-10-08). Upřesnění viz tamtéž. Data: nová pole `templates` a `templateBannerDismissed`, `schemaVersion` 4 → 5 s migrací; šablona je součástí Export/Import.
- **"+ Add gear" = velké tlačítko přes celou šířku, připnuté dole v panelu Gear Vault** (Martin). Z hlavičky odstraněno.
- **Vlastní kategorie lze smazat křížkem na dlaždici ve formuláři** (Martin: jen kategorie vytvořené uživatelem). Kategorie ze šablony tam křížek nemají; dialog "Categories" zatím beze změny — otevřená otázka.

## 8h. Rozhodnutí uzavřená v tomto kole (v15)

- **Kategorie z výchozí šablony nejdou smazat — ani v dialogu "Categories", ani ve formuláři** (Martin, 2026-10-08). Smazat jde jen vlastní kategorie. Důvod: dopad na UX a riziko rozbití UI (např. smazání všech kategorií). Přejmenovat a přeřadit lze dál všechny.
- **"From template" jako výchozí volba u "+ New gearlist" potvrzeno** (Martin).
- **Úprava z řádku šablony jen s dialogem, když je položka použitá i jinde, potvrzeno** (Martin) — upřesnění v sekci 7, bod 5 (b) platí.

## 8i. Rozhodnutí uzavřená v tomto kole (v16, 2026-10-09)

- **HikingBuddy je osobní nástroj a ukázka do portfolia, ne produkt k monetizaci** (Martin, po rozboru trhu a monetizačních možností; sekce 0). Scope je tímto uzavřený.
- **Lokální databáze = automatické ukládání do souboru na disku** přes File System Access API (FR-16). Serverová databáze a účty jsou vyřazené. Soubor doporučeně leží v cloud-sync složce; v repozitáři jen v `data/` mimo git (Martin nechal umístění na Claudovi).
- **Export/Import zůstává** jako ruční záloha a způsob, jak poslat data někomu jinému (Martin).
- **Sdílení gearlistu přes URL bez serveru:** data jsou zakódovaná v odkazu, stránka je jen pro čtení a odkaz je „otisk“ okamžiku sdílení (FR-18). Zvolil Claude, protože je to jediná varianta bez serveru; Martin může změnit.
- **Koláčový graf nahrazen vizualizací batohem** (Martinův nápad, FR-19). Design čeká na Martinův design system; otevřené otázky jsou ve FR-19.
- **Load demo data a uvítací karta** (FR-17). Nejde použít, když je připojený datový soubor (Claude, ochrana Martinových dat).
- **Veřejné nasazení jako statický web zdarma** (FR-20), až po dokončení a otestování lokálně (Martin).
- **Gearlist Template zůstává** (už implementováno ve v14).
- **Vyřazeno ze scope:** offline PWA, přihlašování a sync, serverová databáze, víc snapshotů, Duplicate gearlist, víc šablon, komunitní sdílení a monetizace (sekce 9).

## 8j. Rozhodnutí uzavřená v tomto kole (v17, 2026-10-09)

- **FR-16, FR-17, FR-18 implementovány** (Claude, na Martinův pokyn). Detaily, které PRD nechávalo otevřené, rozhodl Claude a jsou popsané u jednotlivých FR jako „Upřesnění při implementaci (v17)“ — Martin je může změnit:
  - Auto-save: automatické načtení novějšího souboru, pokud se prohlížeč od posledního uložení nezměnil; kontrola souboru před každým uložením; odmítnutí cizího souboru.
  - Demo data: obsah (čeká na Martinovo schválení), anglické názvy.
  - Sdílení: jen gearlisty, jednotky podle sdílejícího, „Open preview“.

## 8k. Rozhodnutí uzavřená v tomto kole (v18, 2026-10-12)

- **Položku z Gear Vaultu jde přetáhnout přímo do gearlistu** (Martin). Tlačítko „+ Add item from Gear Vault“ zůstává kvůli mobilu (Martin). Funguje i pro šablonu; přidává se výchozí množství položky a existující řádek se jen navýší (Claude, stejně jako tlačítko).

## 8l. Rozhodnutí uzavřená v tomto kole (v19, 2026-10-12)

- **Kategorii jde přejmenovat i z gearlistu** (Martin nahlásil, že to nejde). Přejmenování z gearlistu je stejná akce jako ve Vaultu: kategorie je jen jedna, změní se ve Vaultu i ve všech gearlistech a šabloně, snapshoty a odpojené řádky ne. Bez potvrzovacího dialogu, stejně jako ve Vaultu (Claude).

## 8m. Rozhodnutí uzavřená v tomto kole (v20, 2026-10-12)

- **Aktualizace šablony má být lépe vidět** (Martin). Obě cesty už existovaly (přímá úprava šablony, T-3; přepsání šablony z gearlistu, T-1); Martin zvolil přejmenovat tlačítko na „Update template“, když šablona existuje. Dialog navíc odkazuje na přímou úpravu šablony.

## 8n. Rozhodnutí uzavřená v tomto kole (v21, 2026-10-12)

- **FR-19 rozhodnut** (Martin): světlé téma, batoh tvaru A nahoře v gearlistu, v batohu Base + Consumables, Worn zvlášť, nejtěžší kategorie dole, ikony místo textu s tooltipy, krajina v pozadí, minimum pro malé obrazovky a dotyk. Podrobnosti ve FR-19.
- Při plánování implementace (Martin, na Claudova doporučení): kategorie zůstává v řádcích jako klikací pole; v řádku Vaultu nepřibude akce „Create a copy“ (byla by to nová funkce); barvy vlastních kategorií podle pořadí; popisek „Always editable…“ odpadá; přepínač jednotek „g / kg“ / „oz / lb“; v hlavičce „Load demo data“ a „Connect data file“ jako text, ostatní jako ikony.
- **Sdílený odkaz v2** nese i barvu/ikonu kategorie (Martin zvolil variantu b). Odkazy v1 zůstávají čitelné.

## 8o. Rozhodnutí uzavřená v tomto kole (v22, 2026-10-13)

- **Nové nápady Martina uloženy, ne naplánovány:** komunitní katalog vybavení jako výchozí Gear Vault (sekce 9.2) a kopírování sdíleného gearlistu (sekce 9.3). Patří do případné veřejné verze s monetizací; finální scope (sekce 0 a 2) se nemění.
- Sekce 9 už není „vyřazená vize“, ale **parkoviště nápadů pro veřejnou verzi**. Původní vize komunitního sdílení gearlistů z v6 je v ní zachovaná (sekce 9.4).

## 8p. Rozhodnutí uzavřená v tomto kole (v23, 2026-10-13)

- **Komunitní katalog (sekce 9.2), Martinova rozhodnutí:** katalog se ukazuje jako výchozí jen novému uživateli s prázdným Vaultem; katalog je samostatná databáze a nahraná položka v ní žije vlastním životem; autor může své nahrané položky opravit nebo smazat; cizí položky opravuje jen autor a moderátor (zpočátku Martin). Uživatelské úrovně a gamifikace zapsány jako možné rozšíření.
- **Kopírování sdíleného gearlistu (sekce 9.3):** bez párování s vlastním Vaultem; položky se vždy přidají jako nové a případné duplicity si uživatel smaže sám (Martin).
- **Nový nápad: obvyklé teploty v místě a období treku** (sekce 7, bod 9). Mimo scope, nice-to-have (Martin).

## 9. Veřejná komunitní verze — nápady pro případný další vývoj (mimo scope)

**Stav (v22, 2026-10-13):** Mimo scope. Nic z této sekce se nestaví, dokud se Martin nerozhodne vydat appku veřejně s možností monetizace (viz sekce 0, proč to zatím nedává smysl). Sekce slouží jako uložený a rozpracovaný záměr, aby se k němu dalo vrátit.

### 9.1 Společný předpoklad: appka pro víc uživatelů

Všechny nápady níže mění appku z osobní (data jen u jednoho člověka) na **víceuživatelskou**. To znamená přesně to, co v16 vyřadil:
- **Server a databázi** (data uložená centrálně, dostupná všem uživatelům).
- **Účty a přihlašování** (kdo co nahrál, komu co patří).
- **Převod dat** stávajících uživatelů z datového souboru (FR-16) do účtu.
- **Právní minimum:** ochrana osobních údajů (GDPR), podmínky užívání, pravidla pro obsah od uživatelů.
- **Provoz:** náklady na hosting, zálohy, bezpečnost a hlavně **čas na moderaci** (průběžná práce, ne jednorázová funkce).

### 9.2 Komunitní katalog vybavení jako výchozí Gear Vault (Martin, 2026-10-13)

**Problém:** Nový uživatel začíná s prázdným Gear Vaultem a každou věc musí ručně vyklikat (název, kategorie, váha). Je to největší bariéra při prvním použití: uživatel odejde dřív, než appka ukáže svou hodnotu. Stejně to brzdí přechod z LighterPacku. Přitom většinu těch věcí už někdo jiný zadal.

**Návrh řešení (Martin):**
- Nový uživatel začíná s předpřipraveným vybavením, které vytvořila a nasdílela komunita.
- Gear Vault má jako výchozí pohled **sdílený (veřejný) vault**, který je součástí appky. Uživatel se může přepnout do svého vlastního Vaultu.
- Uživatel může nahrát své položky do veřejného vaultu.
- Existuje mechanismus, který nahrávání hlídá z pohledu bezpečnosti, kvality dat a hromadného nahrávání (např. pokus nahrát milion položek a zahltit databázi).

**Poznámky k rozpracování (Claude):**
- **Katalog a můj Vault jsou dvě různé věci.** Veřejný „vault“ je ve skutečnosti **katalog produktů** (výrobce, model, varianta/velikost, váha). Můj Vault jsou **věci, které vlastním** (moje změřená váha, poznámka, množství). Doporučení: položka se z katalogu do mého Vaultu **zkopíruje** (s odkazem na původní produkt), nepropojí se živě. Důvod je stejný princip jako v sekci 3: data se uživateli nesmí změnit pod rukama. Když někdo v katalogu opraví váhu, moje gearlisty se tiše nezmění; appka může nanejvýš nabídnout „Katalog má novou váhu, chceš ji převzít?“.
- **Strukturovaná pole místo volného textu** (výrobce, model, varianta, váha, kategorie). Usnadní hledání, odhalení duplicit i kontrolu kvality.
- **Komunitně ověřená váha:** když víc uživatelů nahlásí svou změřenou váhu, katalog ukáže váhu od výrobce i typickou naměřenou váhu (medián). To je hodnota, kterou výrobci ani konkurence běžně nedávají.
- **Vazba na monetizaci:** katalog produktů je datové aktivum. Umožňuje affiliate odkazy do obchodů u produktů (model PackWizardu), nabídku „lehčí alternativy k tvé výbavě“ nebo srovnání produktů. Je to nejsilnější monetizační argument z celé sekce 9.
- **Rozumný start:** kurátorovaný katalog připravený autorem (stovky nejběžnějších produktů) a komunitní nahrávání až ve druhém kroku. Uživatel dostane hodnotu hned a moderace se řeší až s růstem.

**Ochrana proti zneužití** (duplicity, vulgarity, nesmysly, záměrné zahlcení služby). Vrstvy od nejlevnější po nejnáročnější, kombinují se:
1. **Nahrávat smí jen přihlášený uživatel** s ověřeným e-mailem. Žádné anonymní nahrávání.
2. **Limity na serveru:** maximální počet nových položek za den na účet, maximální velikost jedné dávky, omezení počtu požadavků za minutu (rate limiting). Nové účty mají nižší limity. Tohle chrání databázi před zahlcením.
3. **Automatické kontroly při nahrání:** povinná pole, rozumný rozsah hodnot (např. váha 1 g až 20 kg), filtr vulgarit, kontrola duplicit (před založením nové položky appka nabídne „Nemyslíš tuhle existující?“).
4. **Karanténa:** nová položka je nejdřív vidět jen autorovi nebo čeká ve frontě ke schválení. Veřejná je až po schválení, případně po potvrzení dalšími uživateli.
5. **Komunita hlídá komunitu:** tlačítko „Nahlásit“ (duplicita, špatná váha, nevhodný obsah). Položka s několika nahlášeními se automaticky skryje a jde ke kontrole.
6. **Důvěra podle historie:** uživatelé s historií kvalitních příspěvků nahrávají bez fronty (podobně jako Wikipedie, OpenStreetMap nebo Stack Overflow). Cizí položky ale neopravují, jen je nahlásí (rozhodnutí Martina, viz níže).
7. **Nástroje pro moderátora:** fronta ke kontrole, sloučení duplicit, smazání, zablokování účtu. Historie změn (kdo co kdy změnil) s možností změnu vrátit.
8. **Volitelně AI moderace:** automatické posouzení nové položky (nevhodný obsah, nesmysl, pravděpodobná duplicita) ještě před frontou. Ušetří čas moderátora, ale nenahradí ho.

**Rozhodnutí Martina (2026-10-13):**
- **Výchozí pohled:** katalog se jako výchozí ukazuje jen novému uživateli s prázdným Vaultem. Jakmile má uživatel vlastní věci, výchozí je jeho Vault.
- **Katalog je samostatná databáze.** Co uživatel do katalogu nahraje, žije dál vlastním životem: smazání položky z vlastního Vaultu ji z katalogu neodstraní.
- **Autor může své nahrané položky v katalogu opravit nebo smazat,** např. když nahrál něco chybně. Pomáhá to kvalitě katalogu. Kdo si položku už zkopíroval do svého Vaultu, o kopii nepřijde (kopie je nezávislá, viz výše).
- **Cizí položky opravuje jen autor a moderátor** (zpočátku Martin). Ostatní uživatelé chyby jen nahlásí.
- **Možné rozšíření: uživatelské úrovně a gamifikace** (body za kvalitní příspěvky, odznaky, vyšší úroveň = vyšší limity nahrávání a nahrávání bez fronty). Navazuje na vrstvu 6 ochrany proti zneužití.

**Zbývající otevřené otázky:**
- **Startovací sady:** vedle katalogu nabídnout hotové sady („Víkendový trek – typická výbava“) jako sdílené gearlisty (sekce 9.3)?
- **Fotky produktů:** chceme je? Pozor na autorská práva u fotek převzatých od výrobců.

### 9.3 Kopírování sdíleného gearlistu „pod svůj účet“ (Martin, 2026-10-13)

**Problém:** Uživatel vidí cizí gearlist (např. přes sdílený odkaz) a chce ho použít jako základ pro svůj trek. Dnes by ho musel přepsat ručně.

**Návrh řešení (Martin):** Na sdíleném gearlistu je tlačítko, které gearlist zkopíruje do účtu uživatele.

**Poznámky k rozpracování (Claude):**
- **Co s položkami gearlistu — rozhodnutí Martina (2026-10-13):** bez párování. Všechny položky zkopírovaného gearlistu se přidají do Vaultu jako nové a případné duplicity si uživatel smaže sám. *Původní úvaha (pro případ, že by se k párování později vracelo, např. až bude katalog):* položky, které uživatel ve Vaultu už má (stejný produkt z katalogu, sekce 9.2), se napojí na jeho vlastní; ostatní se přidají do jeho Vaultu jako nové. Před potvrzením uvidí přehled, např. „12 položek se přidá do Vaultu, 8 se použije z tvého Vaultu“. Bez katalogu appka nepozná, že jde o stejnou věc (jen podle názvu, a to je nespolehlivé), takže by se buď vždy přidávaly nové položky, nebo by uživatel párování potvrdil sám.
- **Kopie je nezávislá:** pozdější změny u autora se do ní nepropisují (stejný princip jako šablona a snapshot).
- **Malá varianta jde i bez serveru:** sdílený odkaz (FR-18) už dnes nese celý gearlist. Tlačítko „Import to my HikingBuddy“ na sdílené stránce by tedy šlo udělat bez účtů: gearlist a jeho položky by se uložily do prohlížeče, případně datového souboru návštěvníka. Je to malá funkce, ale mimo uzavřený scope. Zapsáno v `BACKLOG.md` → Inbox jako návrh, rozhoduje Martin.

### 9.4 Komunitní sdílení gearlistů (původní vize z v6)


**Martinova vize appky:** HikingBuddy jako komunitní místo, kde hikeři řeší výbavu pro svá outdoorová dobrodružství — appka není jen osobní nástroj na sestavení gearlistu, ale i místo, kde se dá vidět a inspirovat výbavou ostatních.

**Problém, který to řeší:** Hiker, který má před sebou náročný trek, by rád viděl gearlisty ostatních hikerů přímo v appce — pro inspiraci, případně aby si cizí gearlist naimportoval a upravil podle svých potřeb, místo aby sestavoval vše od nuly nebo hledal inspiraci mimo appku.

**Návrh řešení (hrubě, k rozpracování):** Hiker může svůj gearlist (typicky jeho uložený snapshot, viz sekce 3/FR-6 — stabilní "otisk", ne rozpracovaná verze) zveřejnit ostatním uživatelům appky. Ostatní si zveřejněné gearlisty mohou procházet/prohlížet a vybraný gearlist naimportovat do svého Gear Vaultu a gearlistů jako výchozí bod — a dál si ho upravit pro vlastní potřebu.

**Proč je to dlouhodobá vize, ne "beyond MVP" bod jako Gearlist Template (sekce 7, bod 5):** Na rozdíl od ostatních bodů v sekci 7 tahle feature mění základní předpoklad appky ze single-user (data jen v prohlížeči jednoho člověka, viz sekce 2 a 6/6a) na multi-user — tedy vyžaduje účty/přihlašování a server/databázi, kde jsou gearlisty uložené a přístupné napříč uživateli (obojí je dnes v sekci 2 vědomě mimo MVP, i když sekce 6a už navrhuje, jak by taková databáze mohla vypadat, až na ni dojde řada). Přirozeně navazuje na body 1–2 ze sekce 7 (offline PWA, přihlašování a synchronizace), které jsou jejím technickým předpokladem.

**Monetizační potenciál:** Tahle vize je i potenciální cesta k monetizaci appky — např. placený přístup ke komunitním/kurátorovaným gearlistům, prémiový obsah od zkušených/expertních hikerů, nebo možnost sledovat oblíbené přispěvatele. Zatím jde o směr k prozkoumání, ne o rozhodnutý business model.

**Otevřené otázky pro budoucí rozpracování:**
- **Import:** Naimportuje se gearlist jiného uživatele jako kopie položek do vlastního Gear Vaultu, nebo vznikne rovnou nový vlastní gearlist, který si uživatel dál upraví?
- **Jednotky:** Gearlist zveřejněný v jiných jednotkách (g vs. oz) — appka to technicky umí přepočítat (viz FR-3), takže by neměl být problém při importu zobrazit gearlist ve vlastních preferovaných jednotkách.
- **Identita/profil:** Sdílí se gearlisty anonymně, nebo s autorem/profilem hikera (což by podpořilo i monetizační směr "sledovat" oblíbeného přispěvatele)?
- **Kvalita/moderace:** Jde o čistě otevřenou komunitu, nebo o kurátorovaný výběr (např. od zkušených hikerů/expertů), aby "inspirace" nebyla zahlcená nekvalitními nebo nesmyslnými gearlisty?
- **Co přesně se sdílí:** Sdílí se jen uložený snapshot (stabilní), nebo i živý, dál editovatelný gearlist? Dává smysl navázat na snapshot z FR-6, aby to, co si někdo jiný naimportuje, bylo vždy "hotová", ne rozpracovaná verze.

Tyhle otázky zůstávají zatím otevřené — řešit se budou v okamžiku, kdy na tuhle fázi vývoj appky dozraje.
