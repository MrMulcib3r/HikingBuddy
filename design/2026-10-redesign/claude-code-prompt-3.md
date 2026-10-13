Třetí kolo redesignu: úrovně batohu podle base weight (design system v3). Pokud ještě běží nebo nebylo schválené kolo 2 (`claude-code-prompt-2.md`), dokonči nejdřív to.

## Podklady
- `design/2026-10-redesign/README.md`, sekce 6
- `design-system/components/BackpackChart/README.md`, sekce „Pack tiers“
- `design-system/components/bundle.js`: `TIERS`, `GEAR`, `tierOf` a nová část `HB.backpack` (výbava kolem batohu, štítek úrovně, animace jen při změně úrovně)
- `design-system/components/bundle.css`: `.hb-pack-gear*`, `.hb-pack-tier*`
- `design-system/screenshots/BackpackChart.png`: všechny tři úrovně. Interaktivní ukázku se sliderem najdeš v náhledu BackpackChart v artefaktu design systému.

Nejdřív mi napiš krátký plán a počkej na moje OK.

## Co udělat
1. V `BackpackChart.tsx` přidej úrovně podle **base weight** (bez consumables a worn): Ultralight < 4536 g, Lightweight < 6804 g, jinak Traditional. Hranice dej do konstant.
2. Kolem batohu přidej výbavu podle úrovně, přesně podle geometrie `GEAR` (viewBox -30 0 370 306):
   - Lightweight: karimatka,
   - Traditional: karimatka, cepín vlevo, trekové hůlky svisle vpravo, horní boční kapsy a pár trekových bot z profilu vpravo dole, přivázaných tkaničkou k hůlkám.
   - V Traditional drž venkovní popisky procent nad hůlkami (`labelBottom` 112).
   
   Místo pro výbavu je rezervované vždy, takže se layout nesmí posouvat.
3. Pod batoh přidej štítek úrovně (ikona + název) s nápovědou:
   - mimo Ultralight „X kg to <lehčí úroveň>“,
   - v Ultralight „Base weight under 4.5 kg“,
   - v imperial jednotkách 10 lb / 15 lb.
   
   Štítek dostane tooltip s rozsahem úrovně.
4. Animace: nová výbava a štítek se animují jen při změně úrovně oproti předchozímu vykreslení (v Reactu si předchozí úroveň drž v `useRef`). Při `prefers-reduced-motion` žádná animace.
5. Stejné chování platí pro gearlist, šablonu i sdílenou stránku. Na sdílené stránce se animace nespouští (není co měnit).
6. Datový model se nemění.

## Ověření a záznam
- Screenshoty všech tří úrovní s demo daty (desktop + telefon 390 px) do `design/2026-10-redesign/implemented/v3/`.
- Ověř, že přidání nebo odebrání položky přes hranici animuje a úprava uvnitř úrovně ne.
- PRD: FR-19 doplň o úrovně batohu (nová verze, záznam do historie a do sekce 8 „Rozhodnutí“). Pak zápis do `build-status.md` a české shrnutí pro mě.
