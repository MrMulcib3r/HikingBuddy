# InlineField

Click-to-edit text or number. At rest it looks like plain text; hover shows a dashed well (`surface-hover` + `line-control`) so the user learns it is editable; editing swaps in `hb-inline-input` with an accent ring.

- Enter or blur saves, Escape cancels. No Edit buttons, no batch editing.
- Numbers (`hb-num`) are right-aligned and tabular.
- Empty optional values show `hb-inline--placeholder` ("Add a note…").
- **Inline category select** (`InlineCategorySelect`, in the row meta line): when editing it is at least **180px wide** (fits the longest category name, never truncated), 32px tall, `ui` type (14px), styled like `hb-inline-input` (accent border + accent-soft ring). At rest the category text in a grouped list is shown only on row hover/focus (always on touch), because the group heading already names it.
- Replaces the styling of `InlineField.tsx` and `InlineCategorySelect.tsx`; their logic stays.
