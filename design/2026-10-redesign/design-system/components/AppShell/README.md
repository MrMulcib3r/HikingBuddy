# AppShell

The page frame: header (logo mark + "HikingBuddy" in the display face, data-file status, backup buttons, unit toggle), two panels (Gear Vault left, Gearlists right) on the `bg` ground, and the trail-landscape illustration anchored to the bottom of the window behind the panels.

- Panels are `surface` with `radius-lg` and `shadow-panel`; they float over the landscape, so the landscape shows only in the margins and below.
- Gearlist panel order: "GEARLISTS" header with a "+ New gearlist" button → gearlist name with switcher and Snapshot / Share / Template (icon + label) and Delete → BackpackChart (with the weight split and Total) → "+ Add item from Gear Vault" (filled primary, right-aligned above the list) → column header → category groups with rows.
- Header: Export and Import are icon + label ghost buttons.
- Landscape: `assets/Illustrations/trail-landscape.svg`, full width, max 380px tall, `pointer-events: none`, never over text.
- Below 900px the panels stack. Mobile optimisation is out of scope (PRD v16); the layout only must not break.
