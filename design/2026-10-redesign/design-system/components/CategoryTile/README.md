# CategoryTile

Category picker in the "Add item to Gear Vault" dialog: one tile per category with its Lucide icon and colour dot, plus a dashed "Other" tile that creates a new category.

- **Preselection (Martin, 2026-10-14):** "+ Add gear" at the bottom of the Vault opens the dialog with **no category selected**. "Add item" inside a category opens it with that category preselected.
- At most one tile is selected (`aria-pressed`), shown with a 2px accent border on accent-soft. The dashed "+ Other" tile is an action (create a new category), never a selection and never preselected.
- **Validation:** Add with no category shows an error under the tiles ("Choose a category.", `hb-field-error`) and keeps the dialog open; the tile group gets the error border like `is-error` inputs.
- Clicking "+ Other" shows the "New category name" field with a single "Add" button (no separate Cancel). Clicking any other tile closes the field again.
- User-created categories show a small × (`hb-tile-del`) to delete; default-template categories never do.
- The dot uses the category's colour token, the same colour as its backpack layer.
- Category → icon: Backpack `backpack`, Shelter System `tent`, Sleep System `bed-double`, Clothing `shirt`, Cooking `cooking-pot`, Water `droplet`, Electronics `battery-charging`, Hygiene `bath`, Food `apple`, Misc `package`, custom `tag` (same as `CategoryIcon.tsx`).
