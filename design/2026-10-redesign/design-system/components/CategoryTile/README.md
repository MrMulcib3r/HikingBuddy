# CategoryTile

Category picker in the "Add item to Gear Vault" dialog: one tile per category with its Lucide icon and colour dot, plus a dashed "Other" tile that creates a new category.

- Exactly one tile is selected (`aria-pressed`), shown with a 2px accent border on accent-soft.
- User-created categories show a small × (`hb-tile-del`) to delete; default-template categories never do.
- The dot uses the category's colour token, the same colour as its backpack layer.
- Category → icon: Backpack `backpack`, Shelter System `tent`, Sleep System `bed-double`, Clothing `shirt`, Cooking `cooking-pot`, Water `droplet`, Electronics `battery-charging`, Hygiene `bath`, Food `apple`, Misc `package`, custom `tag` (same as `CategoryIcon.tsx`).
