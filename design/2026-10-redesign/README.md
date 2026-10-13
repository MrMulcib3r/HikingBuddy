# Redesign UI — říjen 2026 (FR-19)

Podklady pro nový vzhled HikingBuddy. Cíl podle PRD FR-19: **nový vzhled celé appky bez změny chování** + nová vizualizace váhy „batohem“.

Stav: **krok 1 — inventura současného UI** (2026-10-12). Další kroky: design system → návrhy komponent a obrazovek → předání Claude Code.

---

## 1. Stav současného vzhledu (proč appka působí nejednotně)

Změřeno v `app/src/App.css` a `index.css`:

| Co | Současný stav | Co s tím udělá design system |
|---|---|---|
| Barvy | **60 různých** hodnot barev rozesetých v CSS | ~12–15 pojmenovaných barev (pozadí, text, akcent, úspěch, varování, chyba, barvy kategorií) |
| Velikosti písma | **15 různých** velikostí (0.7rem … 1.5rem) | 5–6 pojmenovaných velikostí (nadpis, podnadpis, text, malý text, číslo váhy) |
| Zaoblení rohů | 6 hodnot (6, 8, 10, 12 px, 50 %, 999 px) | 3 hodnoty (malé, střední, kulaté) |
| Proměnné (tokeny) v CSS | **0** — každá barva je napsaná natvrdo | všechno přes proměnné → změna na jednom místě se propíše všude |
| Téma | jen tmavé | rozhodnout: jen tmavé, jen světlé, nebo obojí |
| Písmo | systémové (Segoe UI) | vybrat jedno písmo pro text + případně jedno pro čísla vah |

---

## 2. Inventura komponent

### A. Základní stavební prvky

| Prvek | Kde se používá | Varianty / stavy, které musí návrh pokrýt |
|---|---|---|
| **Tlačítko** | všude | Primary, Secondary, Ghost, Danger; normální a malé; hover, disabled. Velké tlačítko „+ Add gear“ přes celou šířku dole ve Vaultu |
| **Textové pole** | formuláře, vyhledávání | normální, hledání (s lupou), placeholder, chyba (`form-error`) |
| **Inline editace** (`InlineField`, `InlineCategorySelect`) | názvy, váhy, počty, poznámky, kategorie | **klíčový prvek appky**: klidový stav, hover („klikni pro úpravu“), editace, prázdná hodnota (placeholder „Add a note…“) |
| **Přepínač jednotek** (`UnitToggle`, `segmented`) | hlavička, sdílená stránka | g/kg ↔ oz/lb; vybraná / nevybraná volba |
| **Příznaky Worn / Consumable** (`ItemFlagsToggle`) | řádek gearlistu | dva nezávislé přepínače; zapnuto / vypnuto |
| **Štítek (badge)** | řádek gearlistu, přepínač gearlistů | „unlinked“ položka, stav „Snapshot saved“ |
| **Úchyt pro přetažení** (`drag-handle`) | řádky, kategorie, gearlisty | klidový, hover, během tažení; cílové místo pro puštění (`list-drop-hint`) |
| **Ikony kategorií** (`CategoryIcon`) | dlaždice, nadpisy kategorií | 11 výchozích ikon (Backpack, Shelter System, Sleep System, Clothing, Cooking, Water, Electronics, Hygiene, Food, Misc) + obecná pro vlastní kategorie |
| **Dlaždice kategorie** (`CategoryTilePicker`) | formulář „Add item“ | normální, vybraná, „+ Other“ (čárkovaná), vlastní kategorie s křížkem pro smazání |

### B. Složené komponenty

| Komponenta | Soubor | Co obsahuje |
|---|---|---|
| **Hlavička appky** | `App.tsx` | logo/název, stav datového souboru, Load demo data, Export/Import, přepínač jednotek |
| **Panel** (levý/pravý) | `GearVaultPanel`, `GearListsPanel` | hlavička panelu s akcemi + rolovací obsah |
| **Skupina kategorie ve Vaultu** | `GearVaultPanel` | nadpis kategorie (přejmenovatelný kliknutím, přetahovatelný), řádky položek, „+ Add item“ na konci |
| **Řádek položky ve Vaultu** | `GearVaultPanel` | název, poznámka, váha, výchozí počet, ikona „used elsewhere“, akce |
| **Filtry Vaultu** | `GearVaultPanel` | hledání + výběr kategorie („All categories“) |
| **Přepínač gearlistů** | `GearListsPanel` | rozbalovací menu v názvu gearlistu, řazení přetažením, stav snapshotu |
| **Formulář nového gearlistu** | `GearListsPanel` | název + volba „Blank gearlist / From template“ |
| **Detail gearlistu – hlavička** | `GearListDetail` | název, meta údaje, akce: Save snapshot, View snapshot, Share, Create/Update template, Delete |
| **Skupina kategorie v gearlistu** | `GearListDetail` | nadpis s ikonou a součtem váhy kategorie |
| **Řádek položky v gearlistu** | `GearListItemRow` | úchyt, název, poznámka, váha/ks, počet, mezisoučet, Worn/Consumable, odebrat; **editovatelná** i **jen pro čtení** (snapshot, sdílená stránka); v úzkém okně se zalamuje do dvou řádků |
| **Souhrn vah** | `WeightSummary` | 4 dlaždice: Base Weight, Worn Weight, Consumables, **Total** (zvýrazněná) |
| **Banner** | `DataFileBanner`, šablona v `GearListDetail` | informační, chybový („Can't find your data file“), se zavíracím křížkem |
| **Stav datového souboru** | `DataFileControls` | připojeno / nepřipojeno / varování + Connect / Reconnect / Disconnect |
| **Uvítací karta** | `DemoData` | „Welcome to HikingBuddy“ + Load demo data / Start empty |
| **Řádek s odkazem ke sdílení** | `ShareDialog` | pole s odkazem + Copy + Open preview |
| **Porovnání dat** | `DataFileControls` | „In the app“ vs „In the file“ (při konfliktu) |

### C. Dialogy (všechny sdílí stejný rám: tmavé pozadí + okno + tlačítka dole)

| Dialog | Soubor | Poznámka pro návrh |
|---|---|---|
| Add item to Gear Vault | `GearItemFormDialog` | široký; dlaždice kategorií; nezavírá se kliknutím mimo |
| Add gear to this gearlist | `AddItemToListDialog` | široký; hledání + seznam položek s váhou a počtem |
| **Upravit/smazat použitou položku (3 volby)** | `VaultEditDialog` | **Cancel / Create a copy / Continue** + seznam dotčených gearlistů — musí zůstat výrazný a blokující |
| Potvrzení | `ConfirmDialog` | obecné ano/ne (např. přepsání snapshotu) |
| Sdílení | `ShareDialog` | |
| Správa kategorií | `CategoryManager` | seznam kategorií, přidání, smazání |
| Konflikt datového souboru | `DataFileControls` | 3 tlačítka + porovnání dat |
| Zobrazení snapshotu | `GearListDetail` | gearlist jen pro čtení |

### D. Obrazovky

1. **Hlavní appka** — hlavička + Gear Vault (vlevo) + Gearlists (vpravo).
2. **Prázdná appka** — uvítací karta místo panelů.
3. **Sdílený gearlist** (`#share=…`) — stránka jen pro čtení, štítky Worn/Consumable, odkaz „Open HikingBuddy“.

### E. Nové prvky z FR-19 (zatím neexistují)

- **Vizualizace „batoh“**: silueta batohu vyplněná odspodu barevnými vrstvami (1 vrstva = 1 kategorie, výška = podíl na váze) + legenda (barva, kategorie, váha, %). Najetí myší zvýrazní vrstvu i řádek legendy. Zobrazuje se u gearlistu, v šabloně a na sdílené stránce.
- **Barvy kategorií** — každá kategorie má svou barvu, stejnou všude v appce.

---

## 3. Rozhodnutí Martina (2026-10-12)

1. **Téma:** jen světlé, čisté. Tmavé téma ne.
2. **Nálada:** dálkové treky, hory, lesy, trail. Barvy ve stylu hry Firewatch (vrstvené hory při západu slunce), ale méně syté a světlejší. Inspirace: Firewatch, Backpacker Radio, fotka Kungsleden.
3. **Ikony místo textu** u Worn, Consumable, Save snapshot atd., s jemnou hikerskou tématikou. Popis se ukáže v tooltipu po najetí myší.
4. **Pozadí:** jemná ilustrace hor a cesty (trail), nic výrazného.
5. **Batoh je dominanta stránky:** nahoře v panelu gearlistu, nad seznamem položek (rozložení zůstává dvousloupcové).
6. **Batoh — co v něm je (FR-19):** Base + Consumables. Worn se ukazuje zvlášť vedle batohu (ikona hikera + váha).
7. **Batoh — pořadí vrstev (FR-19):** nejtěžší kategorie dole.

→ Body 6 a 7 uzavírají otevřené otázky FR-19. Claude Code je má propsat do PRD (nová verze + sekce 8 „Rozhodnutí“).

## 3a. Design system (krok 2)

Hotový jako artefakt „HikingBuddy“ (typ Design System): https://claude.ai/artifact/B57Xu9jGwHkA76fyoXW3tu
Obsahuje barvy, písma, rozestupy, ikony, ilustraci pozadí a 15 komponent s živými náhledy, včetně vizualizace batohem.

**Schváleno Martinem 2026-10-12 (v1).** Doplňující rozhodnutí:
- Tvar batohu **A** (jednoduchý, zaoblený vršek, boční kapsy). Retro styl a další varianty zamítnuty.
- Pod batohem rozpad: **Base, Consumables** (obojí v batohu) a **Worn** (mimo batoh).
- Ikona **Consumable = příbor** (Lucide `utensils`). Kategorie **Food zůstává s jablkem**.
- Ikony místo textu i u Create a copy, Delete, Copy link, New gearlist atd. (s tooltipem). V dialozích ikona + text.
- Telefon: appka se nesmí rozbít a nic se nesmí schovávat za hover. Samostatná mobilní verze zůstává mimo scope.
- **Výjimka: sdílený gearlist (FR-18) bude na telefonu vyladěný**, protože se odkazy otevírají hlavně v mobilu (Martin, 2026-10-12).

Kopie design systému pro Claude Code je v `design-system/` (zdrojem pravdy zůstává artefakt). Zadání pro Claude Code je v `claude-code-prompt.md`.

## 4. Co se při redesignu nesmí změnit (z CLAUDE.md / PRD)

- Inline editace (klik → úprava, Enter/blur uloží, Escape zruší), žádná tlačítka „Edit“, žádná hromadná editace.
- 3-cestný blokující dialog u úpravy použité položky — nikdy jen toast.
- Worn/Consumable jsou na řádku gearlistu, ne na položce ve Vaultu.
- Texty v UI anglicky.
- Pokud návrh změní chování, je to produktové rozhodnutí → nejdřív do PRD.

## 5. Design system v2: úpravy po první implementaci (Martin, 2026-10-13)

Martin prošel první implementaci od Claude Code a našel 4 problémy. Design system je upravený (artefakt i kopie v `design-system/`), zadání pro Claude Code je v `claude-code-prompt-2.md`.

1. **Chyběl název panelu s gearlisty.** Pravý panel má teď hlavičku „GEARLISTS“ (stejně jako „GEAR VAULT“) s tlačítkem + pro nový gearlist. Pod ní je název gearlistu s přepínačem a jeho akcemi.
2. **Dlaždice s váhami byly duplicitní.** Odstraněny. Base, Consumables, Worn a nově i **Total** jsou jen v rozpadu pod batohem. Batoh je díky tomu větší a **ukazuje procento každé kategorie**: velké vrstvy uvnitř, tenké vrstvy popiskem vpravo od batohu s odkazovou čárou. Každá vrstva má minimální výšku, takže na ni jde najet myší.
3. **Ikony samotné nebyly srozumitelné.** Pravidlo: jen ikona pouze u akcí, které pozná každý (+, koš, ×, kopírovat). Ostatní mají **ikonu + text**: Snapshot, Share, Template, Export, Import, Connect/Disconnect. Worn/Consumable v řádcích zůstávají ikonami, ale nad seznamem je **hlavička sloupců** (Item, Worn, Cons., Weight, Qty, Total), která je pojmenuje. Štítek „použito jinde“ ve Vaultu ukazuje text „2 lists“.
4. **Eliptická čára v batohu překrývala procenta.** Odstraněna. Procenta se kreslí až nad obrysem kapsy.

## 6. Design system v3: batoh reaguje na váhu (Martin, 2026-10-13)

Martinův nápad: grafika batohu reaguje na **base weight** podle běžných hranic v backpackingu. Obrys batohu, vrstvy ani procenta se nemění. Při překročení hranice se na batoh „připne“ výbava:

| Úroveň | Base weight | Co přibude |
|---|---|---|
| Ultralight | pod 4,5 kg (10 lb) | nic, holý batoh |
| Lightweight | 4,5–6,8 kg (10–15 lb) | karimatka připnutá pod batohem |
| Traditional | nad 6,8 kg (15 lb) | karimatka + cepín vlevo, trekové hůlky svisle vpravo (protiváha cepínu), další boční kapsy, trekové boty z profilu (hladká podrážka) vpravo dole přivázané tkaničkou k hůlkám |

- Pod batohem je štítek s názvem úrovně a nápovědou, kolik zbývá do lehčí úrovně (např. „1.06 kg to Ultralight“). Informace tak není jen v obrázku.
- Nová výbava se animuje jen při změně úrovně, ne při každé úpravě. Respektuje se `prefers-reduced-motion`.
- Proč je to dobré UX: dává okamžitou zpětnou vazbu na úpravy, motivuje k odlehčení batohu (hikerský cíl) a je to zapamatovatelný detail do portfolia. Rizika (rušivost, nejasnost) řeší neměnný obrys, decentní neutrální barvy výbavy a textový štítek.

**Finální podoba úrovně Traditional (Martin, 2026-10-13):** po několika kolech variant (crocsy, žabky, pantofle z profilu, 5 rozložení) vybral Martin rozložení „Symetrie“ (cepín vlevo, hůlky vpravo) a trekové boty varianty A (klasická bota s hladkou podrážkou). Pantofle byly zamítnuté, protože nebyly čitelné, a crocsy kvůli podobnosti se značkou.

## 7. Drobné úpravy po implementaci (Martin, 2026-10-14)

- Hlavičky sloupců gearlistu mají 13 px (styl `label`, chyba v design systému opravena), sloupec Worn/Cons. má pevnou šířku 88 px, legenda je široká max. 420 px a „+ New gearlist“ je tlačítko s textem.
- **„Add item from Gear Vault“ má stejný vzhled jako „+ Add gear“ (plné oranžové), ale zůstává na svém místě**: normální velikost, zarovnané vpravo nad hlavičkou sloupců, protože patří k seznamu pod ním (Martin, 2026-10-14, upřesnění po implementaci). Pruh přes celou šířku dole má jen Gear Vault. Na snapshotu a sdílené stránce tlačítko není.
